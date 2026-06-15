export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS')
  res.setHeader('Content-Type', 'application/json')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const KV_URL   = process.env.KV_REST_API_URL
  const KV_TOKEN = process.env.KV_REST_API_TOKEN

  if (!KV_URL || !KV_TOKEN) {
    return res.status(500).json({ error: 'Missing KV environment variables' })
  }

  const headers = { Authorization: `Bearer ${KV_TOKEN}` }

  async function getDb() {
    const kvRes = await fetch(`${KV_URL}/get/luan_crm_db`, { headers })
    const kvData = await kvRes.json()
    if (!kvData.result) return { tickets: [], lastSync: null }
    const raw = kvData.result
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (typeof parsed === 'string') return JSON.parse(parsed)
      return parsed
    } catch { return { tickets: [], lastSync: null } }
  }

  async function setDb(db) {
    await fetch(`${KV_URL}/set/luan_crm_db`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(JSON.stringify(db)),
    })
  }

  if (req.method === 'GET') {
    const db = await getDb()
    return res.status(200).json(db)
  }

  if (req.method === 'PUT') {
    const id = req.url.split('/').pop()
    let body = ''
    await new Promise(resolve => { req.on('data', c => body += c); req.on('end', resolve) })
    const changes = JSON.parse(body || '{}')
    const db = await getDb()
    const idx = db.tickets.findIndex(t => t.id === id)
    if (idx < 0) return res.status(404).json({ error: 'Ticket not found' })
    db.tickets[idx] = { ...db.tickets[idx], ...changes, updatedAt: new Date().toISOString() }
    await setDb(db)
    return res.status(200).json({ ok: true, ticket: db.tickets[idx] })
  }

  return res.status(404).json({ error: 'Not found' })
}
