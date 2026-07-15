import React, { useState, useEffect } from 'react'

const CLIENTS = {
  pescatlantic: { name:'PESCATLANTIC GROUP, LLC', address:'801 Brickell Ave 8th Floor\nMiami, FL 33131', email:'ava.smith@pescatlantic.com', cc:'Cesar@pescatlantic.com' },
  vonoil: { name:'VONOIL', address:'OMC Chambers, Wickhams, CAY 1\nRoad Town, Tortola, British Virgin Islands', email:'operations@vonoil.com', cc:'cesar@vonoil.com' }
}

function nextMonthStr() { const d=new Date(); d.setMonth(d.getMonth()+1); return d.toLocaleDateString('en-US',{month:'long',year:'numeric'}) }
function todayStr() { return new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}) }
function dueDateStr() { const d=new Date(); d.setDate(d.getDate()+5); return d.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}) }

function buildInvoiceHTML(data, logoDataUrl) {
  const { invoiceNum, date, dueDate, description, amount, clientName, clientAddress } = data
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{box-sizing:border-box}body{font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#000;margin:0;padding:24px;background:#fff}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}
.header-left{display:flex;flex-direction:column;gap:4px}
.logo-row{display:flex;align-items:center;gap:12px}
.logo-img{width:52px;height:52px;object-fit:contain}
.company-name{font-size:22pt;font-weight:bold;color:#1F3864;line-height:1}
.company-contact{font-size:9.5pt;color:#444;margin-top:4px}
.invoice-title{font-size:30pt;font-weight:bold;color:#4472C4;text-align:right;line-height:1;margin-bottom:8px}
.meta-table{margin-left:auto;border-collapse:collapse}
.meta-table td{padding:2px 6px;font-size:10pt}
.meta-table .lbl{text-align:right;color:#333}
.meta-table .val{background:#BDD7EE;font-weight:bold;min-width:130px;text-align:center;padding:3px 8px}
.meta-table .due{background:#C00000;color:white;font-weight:bold}
.divider{border:none;border-top:2px solid #4472C4;margin:10px 0}
.bill-to-header{background:#1F3864;color:white;font-weight:bold;padding:4px 10px;font-size:10.5pt;display:block;width:320px}
.bill-to-content{padding:6px 10px;font-size:10pt;line-height:1.5}
.items-table{width:100%;border-collapse:collapse;margin:16px 0}
.items-table th{background:#1F3864;color:white;padding:6px 10px;text-align:left;font-size:10pt}
.items-table th.r{text-align:right}
.items-table td{padding:5px 10px;font-size:10pt;border-bottom:1px solid #DEEAF1}
.items-table td.r{text-align:right}
.items-table tr:nth-child(even) td{background:#EBF3F9}
.totals{float:right;width:260px;margin-top:6px}
.totals table{width:100%;border-collapse:collapse}
.totals td{padding:3px 8px;font-size:10pt}
.totals .total-row td{background:#1F3864;color:white;font-weight:bold;font-size:12pt;padding:5px 8px}
.comments{margin-top:70px;clear:both}
.comments-header{background:#1F3864;color:white;font-weight:bold;padding:4px 10px;font-size:10pt;display:block;width:320px}
.comments-content{border:1px solid #BDD7EE;padding:8px 10px;font-size:10pt;line-height:1.7}
.footer{text-align:center;margin-top:24px;font-size:10pt;color:#333;line-height:1.6}
.footer em{font-style:italic;font-weight:bold}
</style></head><body>
<div class="header">
  <div class="header-left">
    <div class="logo-row">
      ${logoDataUrl ? `<img src="${logoDataUrl}" class="logo-img" alt="Logo"/>` : ''}
      <div class="company-name">LUAN TECHNOLOGY CORP.</div>
    </div>
    <div class="company-contact">Phone: 954 736-6838 &nbsp;|&nbsp; Website: luantechnology.com</div>
  </div>
  <div style="text-align:right">
    <div class="invoice-title">INVOICE</div>
    <table class="meta-table">
      <tr><td class="lbl">DATE</td><td class="val">${date}</td></tr>
      <tr><td class="lbl">INVOICE #</td><td class="val">${invoiceNum}</td></tr>
      <tr><td class="lbl">CUSTOMER ID</td><td class="val">25</td></tr>
      <tr><td class="lbl">DUE DATE</td><td class="val due">${dueDate}</td></tr>
    </table>
  </div>
</div>
<hr class="divider">
<div style="margin:14px 0">
  <span class="bill-to-header">BILL TO</span>
  <div class="bill-to-content"><strong>${clientName}</strong><br>${clientAddress.replace(/\n/g,'<br>')}</div>
</div>
<table class="items-table">
  <thead><tr><th>DESCRIPTION</th><th class="r">TAXED AMOUNT</th><th class="r">AMOUNT</th></tr></thead>
  <tbody>
    <tr><td>${description}</td><td class="r"></td><td class="r">${parseFloat(amount).toFixed(2)}</td></tr>
    <tr><td>&nbsp;</td><td></td><td></td></tr>
    <tr><td>&nbsp;</td><td></td><td></td></tr>
    <tr><td>&nbsp;</td><td></td><td></td></tr>
  </tbody>
</table>
<div class="totals">
  <table>
    <tr><td>Subtotal</td><td style="text-align:right">${parseFloat(amount).toFixed(2)}</td></tr>
    <tr><td>Taxable</td><td style="text-align:right">-</td></tr>
    <tr><td>Tax rate</td><td style="text-align:right">7.000%</td></tr>
    <tr><td>Tax due</td><td style="text-align:right">-</td></tr>
    <tr><td>Other</td><td style="text-align:right"></td></tr>
    <tr class="total-row"><td>TOTAL</td><td style="text-align:right">$ ${parseFloat(amount).toFixed(2)}</td></tr>
  </table>
</div>
<div class="comments">
  <span class="comments-header">OTHER COMMENTS</span>
  <div class="comments-content">
    Then Our bank details:<br>
    LUAN TECHNOLOGY CORP. - WELLS FARGO BANK<br>
    ACCOUNT NUMBER: 6335743370<br>
    ROUTING NUMBER: 121000248<br><br>
    Also you can send e-checks or checks by mail to:<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1575 N Treasure Dr. #101 North Bay Village, FL 33141
  </div>
</div>
<div class="footer">
  If you have any questions about this invoice, please contact<br>
  Alejandro Alvarado, alejandro@luantechnology.com, +1 (954) 7366838<br>
  <em>Thank You For Your Business!</em>
</div>
</body></html>`
}

export default function Invoice() {
  const [invoiceNum, setInvoiceNum] = useState('')
  const [date, setDate] = useState(todayStr())
  const [dueDate, setDueDate] = useState(dueDateStr())
  const [client, setClient] = useState('pescatlantic')
  const [description, setDescription] = useState(`IT Managed Services Monthly Fee for ${nextMonthStr()}`)
  const [amount, setAmount] = useState('440.00')
  const [sending, setSending] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [preview, setPreview] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [logoDataUrl, setLogoDataUrl] = useState('')

  useEffect(() => {
    fetch('/api/invoice').then(r=>r.json()).then(d=>setInvoiceNum(String(d.counter+1))).catch(()=>setInvoiceNum('1113821'))
    // Load logo as base64 from public folder
    fetch('/logo.jpg').then(r=>r.blob()).then(blob => {
      const reader = new FileReader()
      reader.onload = () => setLogoDataUrl(reader.result)
      reader.readAsDataURL(blob)
    }).catch(()=>{})
  }, [])

  function showMsg(type,text){setMsg({type,text});setTimeout(()=>setMsg(null),7000)}
  function getPayload(sendDraft){ const cl=CLIENTS[client]; return {invoiceNum,date,dueDate,description,amount,clientName:cl.name,clientAddress:cl.address,clientEmail:cl.email,clientCC:cl.cc,sendDraft} }

  async function previewInvoice(){
    const res=await fetch('/api/invoice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(getPayload(false))})
    const data=await res.json()
    if(data.html){setPreview(data.html);setShowPreview(true)}
  }

  async function createDraft(){
    setSending(true);setMsg(null)
    try {
      const res=await fetch('/api/invoice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(getPayload(true))})
      const data=await res.json()
      if(!data.ok) throw new Error(data.error||'Failed')
      showMsg('success',`✓ Draft created in Outlook. Next invoice will be #${data.nextInvoiceNum}.`)
      setInvoiceNum(String(data.nextInvoiceNum))
    } catch(err){showMsg('error',`Error: ${err.message}`)}
    setSending(false)
  }

  async function downloadPdf(){
    setDownloading(true);setMsg(null)
    try {
      // Dynamically load html2pdf from CDN
      if (!window.html2pdf) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }
      const cl = CLIENTS[client]
      const html = buildInvoiceHTML({invoiceNum,date,dueDate,description,amount,clientName:cl.name,clientAddress:cl.address}, logoDataUrl)
      const el = document.createElement('div')
      // Extract just the body content from the full HTML
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
      el.innerHTML = bodyMatch ? bodyMatch[1] : html
      el.style.width = '816px'
      el.style.padding = '0'
      el.style.background = '#fff'
      document.body.appendChild(el)
      await window.html2pdf().set({
        margin: [0.4, 0.4, 0.4, 0.4],
        filename: `Invoice-${invoiceNum}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      }).from(el).save()
      document.body.removeChild(el)
      showMsg('success','✓ PDF downloaded.')
    } catch(err){showMsg('error',`PDF error: ${err.message}`)}
    setDownloading(false)
  }

  return (
    <div>
      <div style={{background:'#fff',border:'1px solid #E7E5E4',borderRadius:12,padding:'20px',marginBottom:16,boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
        <div className="section-title" style={{marginBottom:16}}>Invoice details</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <div className="form-row"><label>Invoice #</label><input value={invoiceNum} onChange={e=>setInvoiceNum(e.target.value)} /></div>
          <div className="form-row"><label>Client</label><select value={client} onChange={e=>setClient(e.target.value)}><option value="pescatlantic">Pescatlantic Group, LLC</option><option value="vonoil">Vonoil</option></select></div>
          <div className="form-row"><label>Date</label><input value={date} onChange={e=>setDate(e.target.value)} /></div>
          <div className="form-row"><label>Due date</label><input value={dueDate} onChange={e=>setDueDate(e.target.value)} /></div>
          <div className="form-row" style={{gridColumn:'1 / -1'}}><label>Description</label><input value={description} onChange={e=>setDescription(e.target.value)} /></div>
          <div className="form-row"><label>Amount ($)</label><input value={amount} onChange={e=>setAmount(e.target.value)} /></div>
        </div>
        <div style={{marginTop:10,fontSize:12,color:'#78716C'}}>
          <i className="ti ti-send" style={{marginRight:4}} />
          To: <strong>{CLIENTS[client].email}</strong> · CC: <strong>{CLIENTS[client].cc}</strong>
        </div>
      </div>

      <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
        <button className="btn" onClick={previewInvoice}><i className="ti ti-eye" /> Preview</button>
        <button className="btn btn-primary" onClick={createDraft} disabled={sending||!invoiceNum}>
          {sending?<><i className="ti ti-loader spin" /> Creating...</>:<><i className="ti ti-mail" /> Create draft in Outlook</>}
        </button>
        <button className="btn" onClick={downloadPdf} disabled={downloading||!invoiceNum} style={{borderColor:'#1E3A8A',color:'#1E3A8A'}}>
          {downloading?<><i className="ti ti-loader spin" /> Generating PDF...</>:<><i className="ti ti-file-type-pdf" /> Download PDF</>}
        </button>
      </div>

      {msg&&(
        <div style={{marginBottom:14,padding:'10px 14px',borderRadius:8,fontSize:13,background:msg.type==='success'?'#ECFDF5':'#FEF2F2',color:msg.type==='success'?'#065F46':'#991B1B',border:`1px solid ${msg.type==='success'?'#A7F3D0':'#FECACA'}`,display:'flex',alignItems:'center',gap:8}}>
          <i className={`ti ${msg.type==='success'?'ti-circle-check':'ti-alert-circle'}`} />{msg.text}
        </div>
      )}

      {showPreview&&preview&&(
        <div style={{background:'#fff',border:'1px solid #E7E5E4',borderRadius:12,overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
          <div style={{padding:'12px 18px',borderBottom:'1px solid #E7E5E4',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:13,fontWeight:600}}>Invoice preview</span>
            <button className="btn btn-ghost btn-sm" onClick={()=>setShowPreview(false)}><i className="ti ti-x" /></button>
          </div>
          <iframe srcDoc={preview} style={{width:'100%',height:750,border:'none'}} title="Invoice preview" />
        </div>
      )}
    </div>
  )
}
