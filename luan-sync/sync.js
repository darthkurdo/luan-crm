import fs from 'fs'
import path from 'path'
import http from 'http'

const CONFIG = {
  TENANT_ID:     '63df5237-373a-4acf-91fd-c6fa81b3169d',
  CLIENT_ID:     '151bc444-dc3b-4b81-a8bc-1914c119ac16',
  CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET || '',
  MAILBOX:       'alejandro@luantechnology.com',
  DOMAINS:       ['pescatlantic.com', 'vonoil.com'],
  DB_DIR:        'C:\\temp\\luan-crm',
  KV_URL:        'https://fitting-grouper-148726.upstash.io',
  KV_TOKEN:      'gQAAAAAAAkT2AAIgcDExYmNlYTA3Nzc0MDA0YjRmOGQxZmFhNTMxNTUzMjU2NA',
  PORT:          3001,
  SYNC_INTERVAL: 5 * 60 * 1000,
  DAYS_BACK:     90,
}

const DB_PATH = path.join(CONFIG.DB_DIR, 'db.json')
const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`)

function ensureDir() {
  if (!fs.existsSync(CONFIG.DB_DIR)) fs.mkdirSync(CONFIG.DB_DIR, { recursive: true })
}
function loadDb() {
  try { if (fs.existsSync(DB_PATH)) return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) } catch {}
  return { tickets: [], lastSync: null }
}
function saveDb(db) {
  ensureDir()
  db.lastSync = new Date().toISOString()
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8')
}
function cleanBody(raw, isHtml) {
  let t = raw || ''
  if (isHtml) {
    t = t.replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<blockquote[\s\S]*?<\/blockquote>/gi,'')
    t = t.replace(/<br\s*\/?>/gi,'\n').replace(/<\/p>/gi,'\n').replace(/<\/div>/gi,'\n').replace(/<[^>]+>/g,'')
    t = t.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').replace(/&quot;/g,'"')
  }
  t = t.replace(/_{3,}[\s\S]*/g,'').replace(/From:.*\n(Sent|Date):[\s\S]*/gi,'').replace(/On .+wrote:[\s\S]*/gi,'')
  return t.replace(/\r\n/g,'\n').replace(/\r/g,'\n').replace(/\n{3,}/g,'\n\n').trim()
}
function clientFromEmail(email) {
  const e = (email||'').toLowerCase()
  if (e.includes('pescatlantic')) return 'Pescatlantic'
  if (e.includes('vonoil')) return 'Vonoil'
  return email.split('@')[1] || 'Unknown'
}

async function kvSet(value) {
  const { default: fetch } = await import('node-fetch')
  const res = await fetch(`${CONFIG.KV_URL}/set/luan_crm_db`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${CONFIG.KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  })
  return res.ok
}

async function getToken() {
  const { default: fetch } = await import('node-fetch')
  const params = new URLSearchParams()
  params.append('grant_type','client_credentials')
  params.append('client_id',CONFIG.CLIENT_ID)
  params.append('client_secret',CONFIG.CLIENT_SECRET)
  params.append('scope','https://graph.microsoft.com/.default')
  const res = await fetch(`https://login.microsoftonline.com/${CONFIG.TENANT_ID}/oauth2/v2.0/token`,
    { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:params.toString() })
  const data = await res.json()
  if (!data.access_token) throw new Error(data.error_description || 'Token failed')
  return data.access_token
}

async function fetchMsgs(token, folder, since) {
  const { default: fetch } = await import('node-fetch')
  const fields = 'id,subject,from,toRecipients,receivedDateTime,bodyPreview,body,importance,isRead,conversationId'
  const url = `https://graph.microsoft.com/v1.0/users/${CONFIG.MAILBOX}/mailFolders/${folder}/messages`
    + `?$top=500&$orderby=receivedDateTime desc&$select=${fields}`
    + `&$filter=receivedDateTime ge ${since.toISOString()}`
  const res = await fetch(url, { headers:{ Authorization:`Bearer ${token}` } })
  const data = await res.json()
  if (!data.value) { log(`Warning ${folder}: ${data.error?.message}`); return [] }
  return data.value
}

async function sync() {
  log('Syncing with M365...')
  if (!CONFIG.CLIENT_SECRET) { log('ERROR: Set AZURE_CLIENT_SECRET env var'); return }
  const db = loadDb()
  const since = new Date(); since.setDate(since.getDate() - CONFIG.DAYS_BACK)
  try {
    const token = await getToken()
    log('Token OK')
    const [inbox, sent] = await Promise.all([fetchMsgs(token,'Inbox',since), fetchMsgs(token,'SentItems',since)])
    log(`Inbox: ${inbox.length}, Sent: ${sent.length}`)
    const sentMarked = sent.map(m => ({...m, _sent:true}))
    const all = [...inbox, ...sentMarked]
    const domainConvIds = new Set()
    inbox.forEach(m => {
      const s = (m.from?.emailAddress?.address||'').toLowerCase()
      if (CONFIG.DOMAINS.some(d => s.includes(d)) && m.conversationId) domainConvIds.add(m.conversationId)
    })
    if (domainConvIds.size === 0) { log('No domain emails found'); saveDb(db); return }
    log(`Found ${domainConvIds.size} threads`)
    const convMap = {}
    all.forEach(m => {
      if (!m.conversationId || !domainConvIds.has(m.conversationId)) return
      if (!convMap[m.conversationId]) convMap[m.conversationId] = []
      convMap[m.conversationId].push(m)
    })
    let newCount = 0, updatedCount = 0
    for (const [convId, msgs] of Object.entries(convMap)) {
      const seen = new Set()
      const unique = msgs.filter(m => { if(seen.has(m.id)) return false; seen.add(m.id); return true })
      unique.sort((a,b) => new Date(a.receivedDateTime) - new Date(b.receivedDateTime))
      const first = unique.find(m => CONFIG.DOMAINS.some(d => (m.from?.emailAddress?.address||'').toLowerCase().includes(d)))
      if (!first) continue
      const senderEmail = first.from?.emailAddress?.address || ''
      const messages = unique.map(m => {
        const fromAddr = (m.from?.emailAddress?.address||'').toLowerCase()
        const isMine = m._sent === true || fromAddr.includes('luantechnology')
        return {
          id: m.id, from: m.from?.emailAddress?.address||'', fromName: m.from?.emailAddress?.name||'',
          to: (m.toRecipients||[]).map(r => r.emailAddress?.address).join(', '),
          date: m.receivedDateTime, preview: m.bodyPreview||'',
          body: cleanBody(m.body?.content||m.bodyPreview||'', m.body?.contentType==='html'),
          isHtml: false, isMine,
        }
      })
      const latest = unique[unique.length-1]
      const existing = db.tickets.findIndex(t => t.conversationId === convId)
      if (existing >= 0) {
        if (db.tickets[existing].messages.length !== messages.length) {
          db.tickets[existing] = {...db.tickets[existing], messages, latestDate: latest?.receivedDateTime, updatedAt: new Date().toISOString()}
          updatedCount++
        }
      } else {
        db.tickets.push({
          id: `TKT-${String(db.tickets.length+1).padStart(3,'0')}`,
          conversationId: convId, client: clientFromEmail(senderEmail), email: senderEmail,
          subject: unique[0]?.subject||'(no subject)',
          priority: first.importance==='high'?'high':'medium', status: 'open',
          created: new Date(unique[0]?.receivedDateTime).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),
          createdAt: unique[0]?.receivedDateTime, updatedAt: new Date().toISOString(),
          latestDate: latest?.receivedDateTime, messages, comments:[], fromEmail:true, aiSolution:null,
        })
        newCount++
      }
    }
    db.tickets.sort((a,b) => new Date(b.latestDate||b.createdAt) - new Date(a.latestDate||a.createdAt))
    saveDb(db)
    log(`Done. New: ${newCount}, Updated: ${updatedCount}, Total: ${db.tickets.length}`)
    log('Pushing to Upstash KV...')
    const pushed = await kvSet(JSON.stringify({ tickets: db.tickets, lastSync: db.lastSync }))
    log(pushed ? 'KV updated OK' : 'KV push failed')
  } catch(err) { log(`Error: ${err.message}`) }
}

function startServer() {
  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin','*')
    res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,OPTIONS')
    res.setHeader('Content-Type','application/json')
    if (req.method==='OPTIONS') { res.writeHead(200); res.end(); return }
    const url = new URL(req.url, `http://localhost:${CONFIG.PORT}`)
    if (req.method==='GET' && url.pathname==='/api/tickets') {
      const db = loadDb()
      res.writeHead(200); res.end(JSON.stringify({ tickets: db.tickets, lastSync: db.lastSync })); return
    }
    if (req.method==='GET' && url.pathname==='/api/sync') {
      sync().catch(e => log(e.message))
      res.writeHead(200); res.end(JSON.stringify({ message:'Sync started' })); return
    }
    if (req.method==='PUT' && url.pathname.startsWith('/api/tickets/')) {
      const id = url.pathname.split('/').pop()
      let body = ''
      req.on('data', c => body+=c)
      req.on('end', async () => {
        try {
          const changes = JSON.parse(body)
          const db = loadDb()
          const idx = db.tickets.findIndex(t => t.id===id)
          if (idx>=0) {
            db.tickets[idx]={...db.tickets[idx],...changes,updatedAt:new Date().toISOString()}
            saveDb(db)
            await kvSet(JSON.stringify({ tickets: db.tickets, lastSync: db.lastSync }))
            res.writeHead(200); res.end(JSON.stringify({ok:true}))
          } else { res.writeHead(404); res.end(JSON.stringify({error:'Not found'})) }
        } catch(e) { res.writeHead(400); res.end(JSON.stringify({error:e.message})) }
      }); return
    }
    res.writeHead(404); res.end(JSON.stringify({error:'Not found'}))
  })
  server.listen(CONFIG.PORT, () => log(`Local API at http://localhost:${CONFIG.PORT}`))
}

log('=== Luan Technology CRM Sync Agent ===')
log(`Mailbox: ${CONFIG.MAILBOX} | Domains: ${CONFIG.DOMAINS.join(', ')} | Last ${CONFIG.DAYS_BACK} days`)
startServer()
sync().then(() => {
  log(`Auto-sync every ${CONFIG.SYNC_INTERVAL/60000} min. Ctrl+C to stop.`)
  setInterval(sync, CONFIG.SYNC_INTERVAL)
}).catch(e => log(`Fatal: ${e.message}`))
