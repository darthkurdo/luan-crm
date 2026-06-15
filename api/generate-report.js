// api/generate-report.js — Generates activity report using Gemini AI
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Content-Type', 'application/json')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const GEMINI_KEY = process.env.GEMINI_API_KEY
  if (!GEMINI_KEY) return res.status(500).json({ error: 'Missing GEMINI_API_KEY' })

  let body = ''
  await new Promise(resolve => { req.on('data', c => body += c); req.on('end', resolve) })
  const { tickets, from, to } = JSON.parse(body || '{}')

  if (!tickets || !tickets.length) return res.status(400).json({ error: 'No tickets provided' })

  // Build ticket summaries for the prompt
  const ticketSummaries = tickets.map(t => {
    const clientMsgs = (t.messages || []).filter(m => !m.isMine)
    const myMsgs = (t.messages || []).filter(m => m.isMine)
    const firstClient = clientMsgs[0]
    const lastMine = myMsgs[myMsgs.length - 1]
    return `TICKET ${t.id}: "${t.subject}"
From: ${t.email} (${t.client})
Request: ${firstClient?.body?.slice(0, 300) || firstClient?.preview?.slice(0, 300) || 'No description'}
My response: ${lastMine?.body?.slice(0, 300) || lastMine?.preview?.slice(0, 300) || 'No response yet'}
Status: ${t.status}`
  }).join('\n\n---\n\n')

  const fromLabel = new Date(from + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const toLabel = new Date(to + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const monthLabel = new Date(from + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const prompt = `You are Alejandro Alvarado, IT Consultant at Luan Technology Corp. Generate a professional IT activity report for the period ${fromLabel} through ${toLabel}.

Based on these support tickets, write ONLY the "Client Requests and Actions" bullet points section. Each bullet should be:
• [Short issue title] – [Who requested it] reported/requested [brief what they needed]. [What action was taken or response provided].

Keep each bullet to 1-2 sentences max. Be professional and concise. Write in English.

TICKETS:
${ticketSummaries}

Return ONLY the bullet points, one per line, starting with •. No headers, no other text.`

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1500 }
        })
      }
    )

    const geminiData = await geminiRes.json()
    if (!geminiRes.ok) throw new Error(geminiData.error?.message || 'Gemini API error')

    const bullets = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Build full report
    const report = `Subject: Reporte de Actividades - ${monthLabel}

Hello Cesar,

Below is the summary of IT activities performed for Pescatlantic from ${fromLabel} through ${toLabel}. This report includes client requests, actions executed, responses provided, and administrative work carried out during this period.

Client Requests and Actions

${bullets.trim()}

Delivered / Responses

• Responded to IT support requests and provided guidance based on the reported issues.
• Reviewed suspicious emails, password reset notices, external requests, links, or potential phishing indicators as needed.
• Validated mailbox behavior, Microsoft 365 notifications, account access concerns, and user-reported email issues.
• Provided recommendations when a technical change was not required or when a business decision was needed before proceeding.
• Followed up on open items and confirmed status where additional review was necessary.

Administrative and Behind-the-Scenes Activities

• Reviewed Microsoft 365 tenant health, service status, mailbox behavior, and account-related alerts.
• Performed ongoing email security monitoring, including phishing, spam, malware, sender validation, and suspicious message review.
• Monitored Webroot / OpenText security status and reviewed endpoint protection concerns when applicable.
• Reviewed workstation maintenance items, updates, cleanup needs, and general system performance concerns.
• Monitored patching, preventive maintenance, mailbox management, and general IT environment stability.
• Maintained visibility over recurring issues and provided preventive guidance to reduce security and operational risk.

Best regards,
Alejandro`

    return res.status(200).json({ ok: true, report })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
