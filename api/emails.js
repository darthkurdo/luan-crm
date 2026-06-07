// api/emails.js — Vercel Serverless Function
// Fetches emails from M365, groups by conversationId into threads

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

    // Step 2: Fetch last 100 inbox messages
    const inboxRes = await fetch(
      `https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages?$top=100&$orderby=receivedDateTime desc&$select=id,subject,from,toRecipients,receivedDateTime,bodyPreview,body,importance,isRead,conversationId`,
      { headers }
    );
    const inboxData = await inboxRes.json();
    if (!inboxData.value) {
      return res.status(500).json({ error: 'Failed to fetch inbox', detail: inboxData.error?.message });
    }

    // Step 3: Fetch last 100 sent messages
    const sentRes = await fetch(
      `https://graph.microsoft.com/v1.0/users/${MAILBOX}/mailFolders/SentItems/messages?$top=100&$orderby=receivedDateTime desc&$select=id,subject,from,toRecipients,receivedDateTime,bodyPreview,body,importance,isRead,conversationId`,
      { headers }
    );
    const sentData = await sentRes.json();
    const sentMessages = (sentData.value || []).map(m => ({ ...m, _sent: true }));

    // Step 4: Combine all messages
    const allMessages = [...inboxData.value, ...sentMessages];

    // Step 5: Find conversation IDs that have at least one message from monitored domains
    const domainConvIds = new Set();
    inboxData.value.forEach(m => {
      const sender = (m.from?.emailAddress?.address || '').toLowerCase();
      if (DOMAINS.some(d => sender.includes(d)) && m.conversationId) {
        domainConvIds.add(m.conversationId);
      }
    });

    if (domainConvIds.size === 0) {
      return res.status(200).json({ threads: [] });
    }

    // Step 6: Group all messages by conversationId, only for monitored convos
    const convMap = {};
    allMessages.forEach(m => {
      if (!m.conversationId || !domainConvIds.has(m.conversationId)) return;
      if (!convMap[m.conversationId]) convMap[m.conversationId] = [];
      convMap[m.conversationId].push(m);
    });

    // Step 7: Build threads
    const threads = Object.entries(convMap).map(([convId, msgs]) => {
      // Remove duplicate IDs
      const seen = new Set();
      const unique = msgs.filter(m => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });

      // Sort by date ascending
      unique.sort((a, b) => new Date(a.receivedDateTime) - new Date(b.receivedDateTime));

      // Find the first message from a monitored domain to identify client
      const firstFromDomain = unique.find(m => {
        const sender = (m.from?.emailAddress?.address || '').toLowerCase();
        return DOMAINS.some(d => sender.includes(d));
      });

      const senderEmail = firstFromDomain?.from?.emailAddress?.address || '';
      const client = senderEmail.toLowerCase().includes('pescatlantic') ? 'Pescatlantic' :
                     senderEmail.toLowerCase().includes('vonoil') ? 'Vonoil' :
                     senderEmail.split('@')[1] || 'Unknown';

      const latestMsg = unique[unique.length - 1];

      return {
        conversationId: convId,
        subject: unique[0]?.subject || '(no subject)',
        client,
        senderEmail,
        importance: firstFromDomain?.importance || 'normal',
        latestDate: latestMsg?.receivedDateTime,
        messageCount: unique.length,
        messages: unique.map(m => {
          const fromAddr = (m.from?.emailAddress?.address || '').toLowerCase();
          const isMine = m._sent === true || fromAddr.includes('luantechnology');
          // Strip HTML for display
          const rawBody = m.body?.content || m.bodyPreview || '';
          const isHtml = m.body?.contentType === 'html';
          return {
            id: m.id,
            from: m.from?.emailAddress?.address || '',
            fromName: m.from?.emailAddress?.name || '',
            to: (m.toRecipients || []).map(r => r.emailAddress?.address).join(', '),
            date: m.receivedDateTime,
            preview: m.bodyPreview || '',
            body: rawBody,
            isHtml,
            isMine,
          };
        }),
      };
    });

    // Sort threads by latest message date descending
    threads.sort((a, b) => new Date(b.latestDate) - new Date(a.latestDate));

    return res.status(200).json({ threads });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
