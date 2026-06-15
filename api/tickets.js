// api/tickets.js — reads tickets from Upstash KV
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
  res.setHeader('Content-Type', 'application/json')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const KV_URL   = process.env.KV_REST_API_URL
  const KV_TOKEN = process.env.KV_REST_API_TOKEN

  if (!KV_URL || !KV_TOKEN) {
    return res.status(500).json({ error: 'Missing KV environment variables' })
  }

  // GET — return all tickets
  if (req.method === 'GET' && !req.url.includes('/api/tickets/')) {
    const kvRes = await fetch(`${KV_URL}/get/luan_crm_db`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    })
    const kvData = await kvRes.json()
    if (!kvData.result) return res.status(200).json({ tickets: [], lastSync: null })
    const db = JSON.parse(kvData.result)
    return res.status(200).json(db)
  }

  // PUT /api/tickets/:id — update a ticket
  if (req.method === 'PUT') {
    const id = req.url.split('/').pop()
    const changes = req.body || {}

    const kvRes = await fetch(`${KV_URL}/get/luan_crm_db`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    })
    const kvData = await kvRes.json()
    if (!kvData.result) return res.status(404).json({ error: 'DB not found' })

    const db = JSON.parse(kvData.result)
    const idx = db.tickets.findIndex(t => t.id === id)
    if (idx < 0) return res.status(404).json({ error: 'Ticket not found' })

    db.tickets[idx] = { ...db.tickets[idx], ...changes, updatedAt: new Date().toISOString() }

    await fetch(`${KV_URL}/set/luan_crm_db`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(JSON.stringify(db)),
    })

    return res.status(200).json({ ok: true, ticket: db.tickets[idx] })
  }

  return res.status(404).json({ error: 'Not found' })
}
