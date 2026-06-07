// api/emails.js — Vercel Serverless Function
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const TENANT_ID = process.env.AZURE_TENANT_ID;
  const CLIENT_ID = process.env.AZURE_CLIENT_ID;
  const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
  const MAILBOX = process.env.MAILBOX || 'alejandro@luantechnology.com';

  if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({ error: 'Missing Azure environment variables' });
  }

  try {
    // Step 1: Get access token using URLSearchParams to handle special chars correctly
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('scope', 'https://graph.microsoft.com/.default');

    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      }
    );

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.status(500).json({
        error: 'Failed to get access token',
        detail: tokenData.error_description || tokenData.error || JSON.stringify(tokenData)
      });
    }

    const token = tokenData.access_token;

    // Step 2: Fetch emails
    const graphUrl = `https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages?$top=50&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,bodyPreview,importance,isRead`;

    const mailRes = await fetch(graphUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const mailData = await mailRes.json();

    if (!mailData.value) {
      return res.status(500).json({
        error: 'Failed to fetch emails',
        detail: mailData.error?.message || JSON.stringify(mailData)
      });
    }

    // Step 3: Filter pescatlantic.com and vonoil.com only
    const DOMAINS = ['pescatlantic.com', 'vonoil.com'];
    const filtered = mailData.value.filter((email) => {
      const sender = (email.from?.emailAddress?.address || '').toLowerCase();
      return DOMAINS.some(d => sender.includes(d));
    });

    const emails = filtered.map((email) => ({
      emailId: email.id,
      subject: email.subject || '(no subject)',
      sender: email.from?.emailAddress?.address || '',
      senderName: email.from?.emailAddress?.name || '',
      preview: email.bodyPreview || '',
      receivedAt: email.receivedDateTime,
      importance: email.importance,
      isRead: email.isRead,
    }));

    return res.status(200).json({ emails });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
