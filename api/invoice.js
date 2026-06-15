// api/invoice.js — Generates invoice and creates Outlook draft
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Content-Type', 'application/json')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const TENANT_ID     = process.env.AZURE_TENANT_ID
  const CLIENT_ID     = process.env.AZURE_CLIENT_ID
  const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET
  const MAILBOX       = process.env.MAILBOX || 'alejandro@luantechnology.com'
  const KV_URL        = process.env.KV_REST_API_URL
  const KV_TOKEN      = process.env.KV_REST_API_TOKEN

  if (req.method === 'GET') {
    try {
      const r = await fetch(`${KV_URL}/get/luan_invoice_counter`, { headers: { Authorization: `Bearer ${KV_TOKEN}` } })
      const d = await r.json()
      const counter = d.result ? parseInt(d.result) : 1113820
      return res.status(200).json({ counter })
    } catch {
      return res.status(200).json({ counter: 1113820 })
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let body = ''
  await new Promise(resolve => { req.on('data', c => body += c); req.on('end', resolve) })
  const { invoiceNum, date, dueDate, description, amount, clientName, clientAddress, sendDraft, clientEmail, clientCC } = JSON.parse(body || '{}')

  const invoiceHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; }
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #000; margin: 0; padding: 24px; background: #fff; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
  .header-left { display: flex; flex-direction: column; gap: 4px; }
  .logo-row { display: flex; align-items: center; gap: 12px; }
  .logo-img { width: 52px; height: 52px; object-fit: contain; }
  .company-name { font-size: 22pt; font-weight: bold; color: #1F3864; line-height: 1; }
  .company-contact { font-size: 9.5pt; color: #444; margin-top: 4px; }
  .invoice-title { font-size: 30pt; font-weight: bold; color: #4472C4; text-align: right; line-height: 1; margin-bottom: 8px; }
  .meta-table { margin-left: auto; border-collapse: collapse; }
  .meta-table td { padding: 2px 6px; font-size: 10pt; }
  .meta-table .lbl { text-align: right; color: #333; }
  .meta-table .val { background: #BDD7EE; font-weight: bold; min-width: 130px; text-align: center; padding: 3px 8px; }
  .meta-table .due { background: #C00000; color: white; font-weight: bold; }
  .divider { border: none; border-top: 2px solid #4472C4; margin: 10px 0; }
  .bill-to-header { background: #1F3864; color: white; font-weight: bold; padding: 4px 10px; font-size: 10.5pt; display: block; width: 320px; }
  .bill-to-content { padding: 6px 10px; font-size: 10pt; line-height: 1.5; }
  .items-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  .items-table th { background: #1F3864; color: white; padding: 6px 10px; text-align: left; font-size: 10pt; }
  .items-table th.r { text-align: right; }
  .items-table td { padding: 5px 10px; font-size: 10pt; border-bottom: 1px solid #DEEAF1; }
  .items-table td.r { text-align: right; }
  .items-table tr:nth-child(even) td { background: #EBF3F9; }
  .totals { float: right; width: 260px; margin-top: 6px; }
  .totals table { width: 100%; border-collapse: collapse; }
  .totals td { padding: 3px 8px; font-size: 10pt; }
  .totals .total-row td { background: #1F3864; color: white; font-weight: bold; font-size: 12pt; padding: 5px 8px; }
  .comments { margin-top: 70px; clear: both; }
  .comments-header { background: #1F3864; color: white; font-weight: bold; padding: 4px 10px; font-size: 10pt; display: block; width: 320px; }
  .comments-content { border: 1px solid #BDD7EE; padding: 8px 10px; font-size: 10pt; line-height: 1.7; }
  .footer { text-align: center; margin-top: 24px; font-size: 10pt; color: #333; line-height: 1.6; }
  .footer em { font-style: italic; font-weight: bold; }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <div class="logo-row">
      <img src="https://luan-crm.vercel.app/logo.jpg" class="logo-img" alt="Luan Technology Logo" />
      <div class="company-name">LUAN TECHNOLOGY CORP.</div>
    </div>
    <div class="company-contact">
      Phone: 954 736-6838 &nbsp;|&nbsp; Website: luantechnology.com
    </div>
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

<div style="margin: 14px 0;">
  <span class="bill-to-header">BILL TO</span>
  <div class="bill-to-content">
    <strong>${clientName}</strong><br>
    ${clientAddress.replace(/\n/g, '<br>')}
  </div>
</div>

<table class="items-table">
  <thead>
    <tr>
      <th>DESCRIPTION</th>
      <th class="r">TAXED AMOUNT</th>
      <th class="r">AMOUNT</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>${description}</td>
      <td class="r"></td>
      <td class="r">${parseFloat(amount).toFixed(2)}</td>
    </tr>
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

</body>
</html>`

  if (!sendDraft) {
    return res.status(200).json({ ok: true, html: invoiceHTML })
  }

  try {
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

    const recipients = [{ emailAddress: { address: clientEmail } }]
    const cc = clientCC ? [{ emailAddress: { address: clientCC } }] : []

    const draftRes = await fetch(
      `https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          subject: `Invoice #${invoiceNum} - Luan Technology Corp.`,
          body: { contentType: 'HTML', content: invoiceHTML },
          toRecipients: recipients,
          ccRecipients: cc,
        })
      }
    )
    const draft = await draftRes.json()
    if (!draftRes.ok) throw new Error(draft.error?.message || 'Failed to create draft')

    // Update counter
    const nextNum = parseInt(invoiceNum) + 1
    await fetch(`${KV_URL}/set/luan_invoice_counter`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(String(nextNum)),
    })

    return res.status(200).json({ ok: true, draftId: draft.id, nextInvoiceNum: nextNum })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}