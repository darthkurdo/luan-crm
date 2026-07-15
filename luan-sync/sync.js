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

function ensureDir() { if (!fs.existsSync(CONFIG.DB_DIR)) fs.mkdirSync(CONFIG.DB_DIR, { recursive: true }) }
function loadDb() {
  try { if (fs.existsSync(DB_PATH)) return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) } catch {}
  return { tickets: [], lastSync: null }
}
function saveDb(db) { ensureDir(); db.lastSync = new Date().toISOString(); fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8') }
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
  const res = await fetch(`${CONFIG.KV_URL}/set/luan_crm_db`, { method:'POST', headers:{ Authorization:`Bearer ${CONFIG.KV_TOKEN}`, 'Content-Type':'application/json' }, body: JSON.stringify(value) })
  return res.ok
}
async function getToken() {
  const { default: fetch } = await import('node-fetch')
  const params = new URLSearchParams()
  params.append('grant_type','client_credentials'); params.append('client_id',CONFIG.CLIENT_ID)
  params.append('client_secret',CONFIG.CLIENT_SECRET); params.append('scope','https://graph.microsoft.com/.default')
  const res = await fetch(`https://login.microsoftonline.com/${CONFIG.TENANT_ID}/oauth2/v2.0/token`, { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:params.toString() })
  const data = await res.json()
  if (!data.access_token) throw new Error(data.error_description || 'Token failed')
  return data.access_token
}
async function fetchMsgs(token, folder, since) {
  const { default: fetch } = await import('node-fetch')
  const fields = 'id,subject,from,toRecipients,receivedDateTime,bodyPreview,body,importance,isRead,conversationId'
  const url = `https://graph.microsoft.com/v1.0/users/${CONFIG.MAILBOX}/mailFolders/${folder}/messages?$top=500&$orderby=receivedDateTime desc&$select=${fields}&$filter=receivedDateTime ge ${since.toISOString()}`
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
    const token = await getToken(); log('Token OK')
    const [inbox, sent] = await Promise.all([fetchMsgs(token,'Inbox',since), fetchMsgs(token,'SentItems',since)])
    log(`Inbox: ${inbox.length}, Sent: ${sent.length}`)
    const sentMarked = sent.map(m => ({...m, _sent:true}))
    const all = [...inbox, ...sentMarked]
    const domainConvIds = new Set()
    inbox.forEach(m => { const s = (m.from?.emailAddress?.address||'').toLowerCase(); if (CONFIG.DOMAINS.some(d => s.includes(d)) && m.conversationId) domainConvIds.add(m.conversationId) })
    if (domainConvIds.size === 0) { log('No domain emails found'); saveDb(db); return }
    log(`Found ${domainConvIds.size} threads`)
    const convMap = {}
    all.forEach(m => { if (!m.conversationId || !domainConvIds.has(m.conversationId)) return; if (!convMap[m.conversationId]) convMap[m.conversationId] = []; convMap[m.conversationId].push(m) })
    let newCount = 0, updatedCount = 0
    for (const [convId, msgs] of Object.entries(convMap)) {
      const seen = new Set()
      const unique = msgs.filter(m => { if(seen.has(m.id)) return false; seen.add(m.id); return true })
      unique.sort((a,b) => new Date(a.receivedDateTime) - new Date(b.receivedDateTime))
      const first = unique.find(m => CONFIG.DOMAINS.some(d => (m.from?.emailAddress?.address||'').toLowerCase().includes(d)))
      if (!first) continue
      const senderEmail = first.from?.emailAddress?.address || ''
      const messages = unique.map(m => { const fromAddr=(m.from?.emailAddress?.address||'').toLowerCase(); const isMine=m._sent===true||fromAddr.includes('luantechnology'); return { id:m.id, from:m.from?.emailAddress?.address||'', fromName:m.from?.emailAddress?.name||'', to:(m.toRecipients||[]).map(r=>r.emailAddress?.address).join(', '), date:m.receivedDateTime, preview:m.bodyPreview||'', body:cleanBody(m.body?.content||m.bodyPreview||'',m.body?.contentType==='html'), isHtml:false, isMine } })
      const latest = unique[unique.length-1]
      const existing = db.tickets.findIndex(t => t.conversationId === convId)
      if (existing >= 0) { if (db.tickets[existing].messages.length !== messages.length) { db.tickets[existing]={...db.tickets[existing],messages,latestDate:latest?.receivedDateTime,updatedAt:new Date().toISOString()}; updatedCount++ } }
      else { db.tickets.push({ id:`TKT-${String(db.tickets.length+1).padStart(3,'0')}`, conversationId:convId, client:clientFromEmail(senderEmail), email:senderEmail, subject:unique[0]?.subject||'(no subject)', priority:first.importance==='high'?'high':'medium', status:'open', created:new Date(unique[0]?.receivedDateTime).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}), createdAt:unique[0]?.receivedDateTime, updatedAt:new Date().toISOString(), latestDate:latest?.receivedDateTime, messages, comments:[], fromEmail:true, aiSolution:null }); newCount++ }
    }
    db.tickets.sort((a,b) => new Date(b.latestDate||b.createdAt) - new Date(a.latestDate||a.createdAt))
    saveDb(db); log(`Done. New: ${newCount}, Updated: ${updatedCount}, Total: ${db.tickets.length}`)
    log('Pushing to Upstash KV...')
    const pushed = await kvSet(JSON.stringify({ tickets: db.tickets, lastSync: db.lastSync }))
    log(pushed ? 'KV updated OK' : 'KV push failed')
  } catch(err) { log(`Error: ${err.message}`) }
}

async function buildInvoiceHTML(data) {
  const { invoiceNum, date, dueDate, description, amount, clientName, clientAddress } = data
  const logoPath = 'E:/Desktop/luan-crm/public/logo.jpg'
  const logoBase64 = fs.existsSync(logoPath) ? `data:image/jpeg;base64,${fs.readFileSync(logoPath).toString('base64')}` : ''
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box}body{font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#000;margin:0;padding:24px;background:#fff}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}.header-left{display:flex;flex-direction:column;gap:4px}.logo-row{display:flex;align-items:center;gap:12px}.logo-img{width:52px;height:52px;object-fit:contain}.company-name{font-size:22pt;font-weight:bold;color:#1F3864;line-height:1}.company-contact{font-size:9.5pt;color:#444;margin-top:4px}.invoice-title{font-size:30pt;font-weight:bold;color:#4472C4;text-align:right;line-height:1;margin-bottom:8px}.meta-table{margin-left:auto;border-collapse:collapse}.meta-table td{padding:2px 6px;font-size:10pt}.meta-table .lbl{text-align:right;color:#333}.meta-table .val{background:#BDD7EE;font-weight:bold;min-width:130px;text-align:center;padding:3px 8px}.meta-table .due{background:#C00000;color:white;font-weight:bold}.divider{border:none;border-top:2px solid #4472C4;margin:10px 0}.bill-to-header{background:#1F3864;color:white;font-weight:bold;padding:4px 10px;font-size:10.5pt;display:block;width:320px}.bill-to-content{padding:6px 10px;font-size:10pt;line-height:1.5}.items-table{width:100%;border-collapse:collapse;margin:16px 0}.items-table th{background:#1F3864;color:white;padding:6px 10px;text-align:left;font-size:10pt}.items-table th.r{text-align:right}.items-table td{padding:5px 10px;font-size:10pt;border-bottom:1px solid #DEEAF1}.items-table td.r{text-align:right}.items-table tr:nth-child(even) td{background:#EBF3F9}.totals{float:right;width:260px;margin-top:6px}.totals table{width:100%;border-collapse:collapse}.totals td{padding:3px 8px;font-size:10pt}.totals .total-row td{background:#1F3864;color:white;font-weight:bold;font-size:12pt;padding:5px 8px}.comments{margin-top:70px;clear:both}.comments-header{background:#1F3864;color:white;font-weight:bold;padding:4px 10px;font-size:10pt;display:block;width:320px}.comments-content{border:1px solid #BDD7EE;padding:8px 10px;font-size:10pt;line-height:1.7}.footer{text-align:center;margin-top:24px;font-size:10pt;color:#333;line-height:1.6}.footer em{font-style:italic;font-weight:bold}</style></head><body>
<div class="header"><div class="header-left"><div class="logo-row">${logoBase64?`<img src="${logoBase64}" class="logo-img" alt="Logo"/>`:''}
<div class="company-name">LUAN TECHNOLOGY CORP.</div></div><div class="company-contact">Phone: 954 736-6838 &nbsp;|&nbsp; Website: luantechnology.com</div></div>
<div style="text-align:right"><div class="invoice-title">INVOICE</div><table class="meta-table"><tr><td class="lbl">DATE</td><td class="val">${date}</td></tr><tr><td class="lbl">INVOICE #</td><td class="val">${invoiceNum}</td></tr><tr><td class="lbl">CUSTOMER ID</td><td class="val">25</td></tr><tr><td class="lbl">DUE DATE</td><td class="val due">${dueDate}</td></tr></table></div></div>
<hr class="divider">
<div style="margin:14px 0"><span class="bill-to-header">BILL TO</span><div class="bill-to-content"><strong>${clientName}</strong><br>${clientAddress.replace(/\n/g,'<br>')}</div></div>
<table class="items-table"><thead><tr><th>DESCRIPTION</th><th class="r">TAXED AMOUNT</th><th class="r">AMOUNT</th></tr></thead><tbody>
<tr><td>${description}</td><td class="r"></td><td class="r">${parseFloat(amount).toFixed(2)}</td></tr>
<tr><td>&nbsp;</td><td></td><td></td></tr><tr><td>&nbsp;</td><td></td><td></td></tr><tr><td>&nbsp;</td><td></td><td></td></tr></tbody></table>
<div class="totals"><table><tr><td>Subtotal</td><td style="text-align:right">${parseFloat(amount).toFixed(2)}</td></tr><tr><td>Taxable</td><td style="text-align:right">-</td></tr><tr><td>Tax rate</td><td style="text-align:right">7.000%</td></tr><tr><td>Tax due</td><td style="text-align:right">-</td></tr><tr><td>Other</td><td style="text-align:right"></td></tr><tr class="total-row"><td>TOTAL</td><td style="text-align:right">$ ${parseFloat(amount).toFixed(2)}</td></tr></table></div>
<div class="comments"><span class="comments-header">OTHER COMMENTS</span><div class="comments-content">Then Our bank details:<br>LUAN TECHNOLOGY CORP. - WELLS FARGO BANK<br>ACCOUNT NUMBER: 6335743370<br>ROUTING NUMBER: 121000248<br><br>Also you can send e-checks or checks by mail to:<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1575 N Treasure Dr. #101 North Bay Village, FL 33141</div></div>
<div class="footer">If you have any questions about this invoice, please contact<br>Alejandro Alvarado, alejandro@luantechnology.com, +1 (954) 7366838<br><em>Thank You For Your Business!</em></div>
</body></html>`
}

async function generatePdf(invoiceData) {
  const { default: puppeteer } = await import('puppeteer')
  const html = await buildInvoiceHTML(invoiceData)
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })
  const pdfBuffer = await page.pdf({ format: 'Letter', printBackground: true, margin: { top: '0.4in', bottom: '0.4in', left: '0.4in', right: '0.4in' } })
  await browser.close()
  return pdfBuffer
}

function startServer() {
  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS')
    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return }
    const url = new URL(req.url, `http://localhost:${CONFIG.PORT}`)

    if (req.method === 'GET' && url.pathname === '/api/tickets') {
      res.setHeader('Content-Type','application/json'); const db=loadDb(); res.writeHead(200); res.end(JSON.stringify({tickets:db.tickets,lastSync:db.lastSync})); return
    }
    if (req.method === 'GET' && url.pathname === '/api/sync') {
      res.setHeader('Content-Type','application/json'); sync().catch(e=>log(e.message)); res.writeHead(200); res.end(JSON.stringify({message:'Sync started'})); return
    }
    if (req.method === 'PUT' && url.pathname.startsWith('/api/tickets/')) {
      res.setHeader('Content-Type','application/json')
      const id=url.pathname.split('/').pop(); let body=''
      req.on('data',c=>body+=c); req.on('end',async()=>{
        try { const changes=JSON.parse(body); const db=loadDb(); const idx=db.tickets.findIndex(t=>t.id===id)
          if(idx>=0){db.tickets[idx]={...db.tickets[idx],...changes,updatedAt:new Date().toISOString()};saveDb(db);await kvSet(JSON.stringify({tickets:db.tickets,lastSync:db.lastSync}));res.writeHead(200);res.end(JSON.stringify({ok:true}))}
          else{res.writeHead(404);res.end(JSON.stringify({error:'Not found'}))}
        } catch(e){res.writeHead(400);res.end(JSON.stringify({error:e.message}))}
      }); return
    }

    // POST /api/invoice-pdf
    if (req.method === 'POST' && url.pathname === '/api/invoice-pdf') {
      let body = ''
      req.on('data', c => body += c)
      req.on('end', async () => {
        try {
          const invoiceData = JSON.parse(body)
          log(`Generating PDF for invoice #${invoiceData.invoiceNum}...`)
          const pdfBuffer = await generatePdf(invoiceData)
          res.setHeader('Content-Type', 'application/pdf')
          res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoiceData.invoiceNum}.pdf"`)
          res.writeHead(200); res.end(Buffer.from(pdfBuffer))
          log(`PDF generated OK`)
        } catch(e) { res.setHeader('Content-Type','application/json'); res.writeHead(500); res.end(JSON.stringify({error:e.message})) }
      }); return
    }

    res.setHeader('Content-Type','application/json'); res.writeHead(404); res.end(JSON.stringify({error:'Not found'}))
  })
  server.listen(CONFIG.PORT, () => log(`Local API at http://localhost:${CONFIG.PORT}`))
}

log('=== Luan Technology CRM Sync Agent ===')
log(`Mailbox: ${CONFIG.MAILBOX} | Domains: ${CONFIG.DOMAINS.join(', ')} | Last ${CONFIG.DAYS_BACK} days`)
startServer()
sync().then(() => { log(`Auto-sync every ${CONFIG.SYNC_INTERVAL/60000} min. Ctrl+C to stop.`); setInterval(sync, CONFIG.SYNC_INTERVAL) }).catch(e => log(`Fatal: ${e.message}`))
