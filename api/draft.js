// api/draft.js — Creates a draft reply in Outlook via Microsoft Graph
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Content-Type', 'application/json')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const TENANT_ID    = process.env.AZURE_TENANT_ID
  const CLIENT_ID    = process.env.AZURE_CLIENT_ID
  const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET
  const MAILBOX      = process.env.MAILBOX || 'alejandro@luantechnology.com'

  let body = ''
  await new Promise(resolve => { req.on('data', c => body += c); req.on('end', resolve) })
  const { to, subject, content, conversationId, replyToMessageId } = JSON.parse(body || '{}')

  if (!to || !content) return res.status(400).json({ error: 'Missing to or content' })

  try {
    // Get token
    const params = new URLSearchParams()
    params.append('grant_type', 'client_credentials')
    params.append('client_id', CLIENT_ID)
    params.append('client_secret', CLIENT_SECRET)
    params.append('scope', 'https://graph.microsoft.com/.default')

    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() }
    )
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) throw new Error(tokenData.error_description || 'Token failed')
    const token = tokenData.access_token
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

    let draftRes

    if (replyToMessageId) {
      // Create a reply draft to the original message thread
      draftRes = await fetch(
        `https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages/${replyToMessageId}/createReply`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: {
              body: { contentType: 'Text', content },
            }
          })
        }
      )
    } else {
      // Create a new draft message
      draftRes = await fetch(
        `https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            subject: subject || 'Re: Support',
            body: { contentType: 'Text', content },
            toRecipients: [{ emailAddress: { address: to } }],
          })
        }
      )
    }

    const draft = await draftRes.json()
    if (!draftRes.ok) throw new Error(draft.error?.message || 'Failed to create draft')

    return res.status(200).json({ ok: true, draftId: draft.id, message: 'Draft created in Outlook' })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
