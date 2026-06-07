// api/emails.js — Vercel Serverless Function
// Reads emails from M365 using Microsoft Graph API (app-only auth)
// Only returns emails from pescatlantic.com and vonoil.com

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, MAILBOX } = process.env;

  if (!AZURE_TENANT_ID || !AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET) {
    return res.status(500).json({ error: 'Missing Azure environment variables' });
  }

  try {
    // Step 1: Get access token
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: AZURE_CLIENT_ID,
          client_secret: AZURE_CLIENT_SECRET,
          scope: 'https://graph.microsoft.com/.default',
        }),
      }
    );
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(500).json({ error: 'Failed to get access token', detail: tokenData });
    }
    const token = tokenData.access_token;

    // Step 2: Fetch emails from mailbox
    const mailbox = MAILBOX || 'alejandro@luantechnology.com';
    const graphUrl = `https://graph.microsoft.com/v1.0/users/${mailbox}/messages?$top=50&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,bodyPreview,importance,isRead`;

    const mailRes = await fetch(graphUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const mailData = await mailRes.json();

    if (!mailData.value) {
      return res.status(500).json({ error: 'Failed to fetch emails', detail: mailData });
    }

    // Step 3: Filter only pescatlantic.com and vonoil.com
    const DOMAINS = ['pescatlantic.com', 'vonoil.com'];
    const filtered = mailData.value.filter((email) => {
      const senderEmail = email.from?.emailAddress?.address || '';
      return DOMAINS.some((d) => senderEmail.toLowerCase().includes(d));
    });

    // Step 4: Map to ticket-friendly format
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
