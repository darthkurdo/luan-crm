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

  const ticketSummaries = tickets.map(t => {
    const clientMsgs = (t.messages || []).filter(m => !m.isMine)
    const myMsgs = (t.messages || []).filter(m => m.isMine)
    const firstClient = clientMsgs[0]
    const lastMine = myMsgs[myMsgs.length - 1]
    const requesterName = firstClient?.fromName || t.email
    return `TICKET ${t.id}:
Subject: "${t.subject}"
Requester full name: ${requesterName}
Their request: ${firstClient?.body?.slice(0, 400) || firstClient?.preview?.slice(0, 400) || 'No message'}
My response/action: ${lastMine?.body?.slice(0, 400) || lastMine?.preview?.slice(0, 400) || 'No response yet'}
Status: ${t.status}`
  }).join('\n\n---\n\n')

  const fromLabel = new Date(from + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const toLabel = new Date(to + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const monthLabel = new Date(from + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const prompt = `You are Alejandro Alvarado, IT Consultant at Luan Technology Corp. Generate bullet points for an IT activity report.

STRICT RULES:
1. Always use the requester's FULL NAME (first and last name) — never say "Pescatlantic" or "Vonoil"
2. Issue title: 2-4 words max, capitalized
3. Description: 1 short sentence — who reported what, no details
4. Action taken: 1 short sentence — what was specifically done to resolve it, be concrete (e.g. "Mailbox archive policy reviewed and confirmed no quota issue", "Email signature updated in M365 admin center", "Security analysis performed and phishing indicators blocked")
5. Format exactly: • [Issue Title] – [Full Name] reported [brief what]. [Concrete action taken and resolved].
6. Keep each bullet to max 2 lines
7. Write in English

TICKETS:
${ticketSummaries}

Return ONLY the bullet points, one per line, starting with •. No headers, no extra text.`

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 3000 }
        })
      }
    )

    const geminiData = await geminiRes.json()
    if (!geminiRes.ok) throw new Error(geminiData.error?.message || 'Gemini API error')

    const bullets = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

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
