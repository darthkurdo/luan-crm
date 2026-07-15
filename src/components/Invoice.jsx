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
  const amt = parseFloat(amount).toFixed(2)
  const hdrStyle = 'background-color:#1F3864;color:#ffffff;font-weight:bold;font-size:10pt;padding:5px 8px;'
  const valStyle = 'background-color:#BDD7EE;font-weight:bold;font-size:10pt;text-align:center;padding:3px 10px;min-width:130px;'
  const dueStyle = 'background-color:#C00000;color:#ffffff;font-weight:bold;font-size:10pt;text-align:center;padding:3px 10px;'
  const evenRow = 'background-color:#EBF3F9;'
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
body { font-family: Arial, sans-serif; font-size: 11pt; color: #000; margin: 0; padding: 20px; background: #fff; }
table { border-collapse: collapse; }
</style></head><body>

<!-- HEADER -->
<table style="width:100%; margin-bottom:10px;">
<tr>
  <td style="vertical-align:top; width:55%">
    <table>
      <tr>
        <td style="vertical-align:middle; padding-right:10px">
          ${logoDataUrl ? `<img src="${logoDataUrl}" style="width:52px;height:52px;object-fit:contain" alt="Logo"/>` : ''}
        </td>
        <td style="vertical-align:middle">
          <div style="font-size:18pt;font-weight:bold;color:#1F3864;line-height:1.1">LUAN TECHNOLOGY CORP.</div>
          <div style="font-size:9pt;color:#444;margin-top:5px">Phone: 954 736-6838 &nbsp;|&nbsp; Website: luantechnology.com</div>
        </td>
      </tr>
    </table>
  </td>
  <td style="vertical-align:top; text-align:right; width:45%">
    <div style="font-size:26pt;font-weight:bold;color:#4472C4;margin-bottom:6px">INVOICE</div>
    <table style="margin-left:auto; border-collapse:collapse">
      <tr><td style="text-align:right;font-size:10pt;padding:2px 6px">DATE</td><td style="${valStyle}">${date}</td></tr>
      <tr><td style="text-align:right;font-size:10pt;padding:2px 6px">INVOICE #</td><td style="${valStyle}">${invoiceNum}</td></tr>
      <tr><td style="text-align:right;font-size:10pt;padding:2px 6px">CUSTOMER ID</td><td style="${valStyle}">25</td></tr>
      <tr><td style="text-align:right;font-size:10pt;padding:2px 6px">DUE DATE</td><td style="${dueStyle}">${dueDate}</td></tr>
    </table>
  </td>
</tr>
</table>

<hr style="border:none;border-top:2px solid #4472C4;margin:8px 0"/>

<!-- BILL TO -->
<table style="margin:10px 0;border-collapse:collapse">
  <tr><td style="${hdrStyle} width:300px">BILL TO</td></tr>
  <tr><td style="padding:6px 8px;font-size:10pt;line-height:1.6">
    <strong>${clientName}</strong><br/>
    ${clientAddress.replace(/\n/g,'<br/>')}
  </td></tr>
</table>

<!-- ITEMS TABLE -->
<table style="width:100%;margin:14px 0;border-collapse:collapse">
  <thead>
    <tr>
      <th style="${hdrStyle} text-align:left;width:68%">DESCRIPTION</th>
      <th style="${hdrStyle} text-align:right;width:16%">TAXED AMOUNT</th>
      <th style="${hdrStyle} text-align:right;width:16%">AMOUNT</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="padding:5px 8px;font-size:10pt;border-bottom:1px solid #DEEAF1">${description}</td><td style="padding:5px 8px;text-align:right;border-bottom:1px solid #DEEAF1"></td><td style="padding:5px 8px;text-align:right;border-bottom:1px solid #DEEAF1">${amt}</td></tr>
    <tr><td style="padding:5px 8px;${evenRow}border-bottom:1px solid #DEEAF1">&nbsp;</td><td style="${evenRow}border-bottom:1px solid #DEEAF1"></td><td style="${evenRow}border-bottom:1px solid #DEEAF1"></td></tr>
    <tr><td style="padding:5px 8px;border-bottom:1px solid #DEEAF1">&nbsp;</td><td style="border-bottom:1px solid #DEEAF1"></td><td style="border-bottom:1px solid #DEEAF1"></td></tr>
    <tr><td style="padding:5px 8px;${evenRow}border-bottom:1px solid #DEEAF1">&nbsp;</td><td style="${evenRow}border-bottom:1px solid #DEEAF1"></td><td style="${evenRow}border-bottom:1px solid #DEEAF1"></td></tr>
  </tbody>
</table>

<!-- TOTALS -->
<table style="margin-left:auto;min-width:270px;border-collapse:collapse;margin-bottom:10px">
  <tr><td style="font-size:10pt;padding:3px 8px;text-align:right">Subtotal</td><td style="font-size:10pt;padding:3px 8px;text-align:right">${amt}</td></tr>
  <tr><td style="font-size:10pt;padding:3px 8px;text-align:right">Taxable</td><td style="font-size:10pt;padding:3px 8px;text-align:right">-</td></tr>
  <tr><td style="font-size:10pt;padding:3px 8px;text-align:right">Tax rate</td><td style="font-size:10pt;padding:3px 8px;text-align:right">7.000%</td></tr>
  <tr><td style="font-size:10pt;padding:3px 8px;text-align:right">Tax due</td><td style="font-size:10pt;padding:3px 8px;text-align:right">-</td></tr>
  <tr><td style="font-size:10pt;padding:3px 8px;text-align:right">Other</td><td style="font-size:10pt;padding:3px 8px;text-align:right"></td></tr>
  <tr><td style="background-color:#1F3864;color:#ffffff;font-weight:bold;font-size:11pt;padding:5px 8px;text-align:right">TOTAL</td><td style="background-color:#1F3864;color:#ffffff;font-weight:bold;font-size:11pt;padding:5px 8px;text-align:right">$ ${amt}</td></tr>
</table>

<!-- COMMENTS -->
<table style="margin-top:30px;width:60%;border-collapse:collapse">
  <tr><td style="${hdrStyle}">OTHER COMMENTS</td></tr>
  <tr><td style="border:1px solid #BDD7EE;padding:8px;font-size:10pt;line-height:1.8">
    Then Our bank details:<br/>
    LUAN TECHNOLOGY CORP. - WELLS FARGO BANK<br/>
    ACCOUNT NUMBER: 6335743370<br/>
    ROUTING NUMBER: 121000248<br/><br/>
    Also you can send e-checks or checks by mail to:<br/>
    &nbsp;&nbsp;&nbsp;&nbsp;1575 N Treasure Dr. #101 North Bay Village, FL 33141
  </td></tr>
</table>

<div style="text-align:center;font-size:10pt;color:#333;margin-top:24px;line-height:1.7">
  If you have any questions about this invoice, please contact<br/>
  Alejandro Alvarado, alejandro@luantechnology.com, +1 (954) 7366838<br/>
  <em><strong>Thank You For Your Business!</strong></em>
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
    fetch('/logo.jpg').then(r=>r.blob()).then(blob => {
      const reader = new FileReader()
      reader.onload = () => setLogoDataUrl(reader.result)
      reader.readAsDataURL(blob)
    }).catch(()=>{})
  }, [])

  function showMsg(type,text){setMsg({type,text});setTimeout(()=>setMsg(null),7000)}
  function getPayload(sendDraft){ const cl=CLIENTS[client]; return {invoiceNum,date,dueDate,description,amount,clientName:cl.name,clientAddress:cl.address,clientEmail:cl.email,clientCC:cl.cc,sendDraft} }

  async function previewInvoice(){
    const cl=CLIENTS[client]
    const html=buildInvoiceHTML({invoiceNum,date,dueDate,description,amount,clientName:cl.name,clientAddress:cl.address},logoDataUrl)
    setPreview(html); setShowPreview(true)
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
      if (!window.html2pdf) {
        await new Promise((resolve, reject) => {
          const s=document.createElement('script')
          s.src='https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
          s.onload=resolve; s.onerror=reject
          document.head.appendChild(s)
        })
      }
      const cl=CLIENTS[client]
      const html=buildInvoiceHTML({invoiceNum,date,dueDate,description,amount,clientName:cl.name,clientAddress:cl.address},logoDataUrl)
      // Open invoice in a new window and print to PDF
      const win = window.open('', '_blank')
      win.document.write(html)
      win.document.close()
      // Wait for content to load then trigger print
      await new Promise(resolve => setTimeout(resolve, 800))
      win.focus()
      win.print()
      await new Promise(resolve => setTimeout(resolve, 500))
      win.close()
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
          {downloading?<><i className="ti ti-loader spin" /> Generating...</>:<><i className="ti ti-file-type-pdf" /> Download PDF</>}
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
