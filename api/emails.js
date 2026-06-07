// api/emails.js — Vercel Serverless Function
// Fetches full conversation threads from M365 for pescatlantic.com and vonoil.com

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const TENANT_ID = process.env.AZURE_TENANT_ID;
  const CLIENT_ID = process.env.AZURE_CLIENT_ID;
  const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
  const MAILBOX = process.env.MAILBOX || 'alejandro@luantechnology.com';
  const DOMAINS = ['pescatlantic.com', 'vonoil.com'];

  if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({ error: 'Missing Azure environment variables' });
  }

  try {
    // Step 1: Get access token
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('scope', 'https://graph.microsoft.com/.default');

    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() }
    );
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(500).json({ error: 'Failed to get access token', detail: tokenData.error_description || tokenData.error });
    }
    const token = tokenData.access_token;
    const headers = { Authorization: `Bearer ${token}` };

    // Step 2: Fetch inbox emails from monitored domains
    const inboxRes = await fetch(
      `https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages?$top=50&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,bodyPreview,body,importance,isRead,conversationId,toRecipients`,
      { headers }
    );
    const inboxData = await inboxRes.json();
    if (!inboxData.value) {
      return res.status(500).json({ error: 'Failed to fetch inbox', detail: inboxData.error?.message });
    }

    // Step 3: Filter only emails from monitored domains
    const fromDomains = inboxData.value.filter(email => {
      const sender = (email.from?.emailAddress?.address || '').toLowerCase();
      return DOMAINS.some(d => sender.includes(d));
    });

    if (fromDomains.length === 0) {
      return res.status(200).json({ threads: [] });
    }

    // Step 4: Get unique conversation IDs
    const conversationIds = [...new Set(fromDomains.map(e => e.conversationId).filter(Boolean))];

    // Step 5: For each conversation, fetch ALL messages in that thread (inbox + sent)
    const threads = await Promise.all(conversationIds.map(async (convId) => {
      // Get all messages in this conversation from inbox
      const convRes = await fetch(
        `https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages?$filter=conversationId eq '${convId}'&$orderby=receivedDateTime asc&$select=id,subject,from,toRecipients,receivedDateTime,bodyPreview,body,importance,isRead,conversationId`,
        { headers }
      );
      const convData = await convRes.json();
      const inboxMessages = convData.value || [];

      // Get sent messages in this conversation
      const sentRes = await fetch(
        `https://graph.microsoft.com/v1.0/users/${MAILBOX}/mailFolders/SentItems/messages?$filter=conversationId eq '${convId}'&$orderby=receivedDateTime asc&$select=id,subject,from,toRecipients,receivedDateTime,bodyPreview,body,importance,isRead,conversationId`,
        { headers }
      );
      const sentData = await sentRes.json();
      const sentMessages = (sentData.value || []).map(m => ({ ...m, _sent: true }));

      // Merge and sort all messages by date
      const allMessages = [...inboxMessages, ...sentMessages]
        .sort((a, b) => new Date(a.receivedDateTime) - new Date(b.receivedDateTime));

      // Remove duplicates by id
      const seen = new Set();
      const unique = allMessages.filter(m => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });

      const firstFromDomain = fromDomains.find(e => e.conversationId === convId);
      const senderEmail = firstFromDomain?.from?.emailAddress?.address || '';
      const client = DOMAINS[0] && senderEmail.includes('pescatlantic') ? 'Pescatlantic' :
                     senderEmail.includes('vonoil') ? 'Vonoil' : senderEmail.split('@')[1] || 'Unknown';

      return {
        conversationId: convId,
        subject: firstFromDomain?.subject || '(no subject)',
        client,
        senderEmail,
        importance: firstFromDomain?.importance || 'normal',
        latestDate: unique[unique.length - 1]?.receivedDateTime || firstFromDomain?.receivedDateTime,
        messageCount: unique.length,
        messages: unique.map(m => {
          const isMine = m._sent || (m.from?.emailAddress?.address || '').toLowerCase().includes('luantechnology');
          return {
            id: m.id,
            from: m.from?.emailAddress?.address || '',
            fromName: m.from?.emailAddress?.name || '',
            to: (m.toRecipients || []).map(r => r.emailAddress?.address).join(', '),
            date: m.receivedDateTime,
            preview: m.bodyPreview || '',
            body: m.body?.content || m.bodyPreview || '',
            isHtml: m.body?.contentType === 'html',
            isMine,
          };
        }),
      };
    }));

    // Sort threads by latest message date descending
    threads.sort((a, b) => new Date(b.latestDate) - new Date(a.latestDate));

    return res.status(200).json({ threads });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
