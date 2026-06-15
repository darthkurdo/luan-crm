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

  // GET — return current invoice counter
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
  const { invoiceNum, date, dueDate, description, amount, clientName, clientAddress, sendDraft } = JSON.parse(body || '{}')

  // Build invoice HTML matching the original format
  const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #000; margin: 0; padding: 20px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .company-name { font-size: 24pt; font-weight: bold; color: #1F3864; }
  .invoice-title { font-size: 28pt; font-weight: bold; color: #4472C4; text-align: right; }
  .company-info { font-size: 10pt; color: #333; }
  .invoice-meta { text-align: right; font-size: 10pt; }
  .invoice-meta table { margin-left: auto; border-collapse: collapse; }
  .invoice-meta td { padding: 2px 8px; }
  .invoice-meta .label { text-align: right; }
  .invoice-meta .value { background: #BDD7EE; font-weight: bold; min-width: 120px; text-align: center; padding: 3px 8px; }
  .invoice-meta .due { background: #FF0000; color: white; font-weight: bold; }
  .bill-to { margin: 20px 0; }
  .bill-to-header { background: #1F3864; color: white; font-weight: bold; padding: 4px 8px; font-size: 11pt; display: inline-block; min-width: 300px; }
  .bill-to-content { padding: 6px 8px; font-size: 10pt; }
  .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .items-table th { background: #1F3864; color: white; padding: 6px 8px; text-align: left; font-size: 10pt; }
  .items-table th.right { text-align: right; }
  .items-table td { padding: 5px 8px; border-bottom: 1px solid #BDD7EE; font-size: 10pt; }
  .items-table td.right { text-align: right; }
  .items-table tr:nth-child(even) { background: #DEEAF1; }
  .totals { float: right; width: 280px; margin-top: 10px; }
  .totals table { width: 100%; border-collapse: collapse; }
  .totals td { padding: 3px 8px; font-size: 10pt; }
  .totals .total-row { background: #1F3864; color: white; font-weight: bold; font-size: 12pt; }
  .totals .total-row td { padding: 5px 8px; }
  .comments { margin-top: 80px; clear: both; }
  .comments-header { background: #1F3864; color: white; font-weight: bold; padding: 4px 8px; font-size: 10pt; display: inline-block; min-width: 300px; }
  .comments-content { border: 1px solid #BDD7EE; padding: 8px; font-size: 10pt; line-height: 1.6; }
  .footer { text-align: center; margin-top: 30px; font-size: 10pt; color: #333; }
  .footer strong { font-style: italic; }
  .logo-area { display: flex; align-items: center; gap: 12px; }
  .logo-box { width: 50px; height: 50px; background: linear-gradient(135deg, #4472C4 50%, #ED7D31 50%); display: inline-block; }
  .divider { border: none; border-top: 2px solid #4472C4; margin: 10px 0; }
</style>
</head>
<body>

<div class="header">
  <div class="logo-area">
    <div class="logo-box"></div>
    <div>
      <div class="company-name">LUAN TECHNOLOGY CORP.</div>
      <div class="company-info">Phone: 954 736-6838</div>
      <div class="company-info">Website: luantechnology.com</div>
    </div>
  </div>
  <div>
    <div class="invoice-title">INVOICE</div>
    <div class="invoice-meta">
      <table>
        <tr><td class="label">DATE</td><td class="value">${date}</td></tr>
        <tr><td class="label">INVOICE #</td><td class="value">${invoiceNum}</td></tr>
        <tr><td class="label">CUSTOMER ID</td><td class="value">25</td></tr>
        <tr><td class="label">DUE DATE</td><td class="value due">${dueDate}</td></tr>
      </table>
    </div>
  </div>
</div>

<hr class="divider">

<div class="bill-to">
  <div class="bill-to-header">BILL TO</div>
  <div class="bill-to-content">
    <strong>${clientName}</strong><br>
    ${clientAddress.replace(/\n/g, '<br>')}
  </div>
</div>

<table class="items-table">
  <thead>
    <tr>
      <th>DESCRIPTION</th>
      <th class="right">TAXED AMOUNT</th>
      <th class="right">AMOUNT</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>${description}</td>
      <td class="right"></td>
      <td class="right">${parseFloat(amount).toFixed(2)}</td>
    </tr>
    ${Array(10).fill('<tr><td>&nbsp;</td><td></td><td></td></tr>').join('\n')}
  </tbody>
</table>

<div class="totals">
  <table>
    <tr><td>Subtotal</td><td style="text-align:right">${parseFloat(amount).toFixed(2)}</td></tr>
    <tr><td>Taxable</td><td style="text-align:right">-</td></tr>
    <tr><td>Tax rate</td><td style="text-align:right">7.000%</td></tr>
    <tr><td>Tax due</td><td style="text-align:right">-</td></tr>
    <tr><td>Other</td><td style="text-align:right"></td></tr>
    <tr class="total-row"><td><strong>TOTAL</strong></td><td style="text-align:right"><strong>$ ${parseFloat(amount).toFixed(2)}</strong></td></tr>
  </table>
</div>

<div class="comments">
  <div class="comments-header">OTHER COMMENTS</div>
  <div class="comments-content">
    Then Our bank details:<br>
    LUAN TECHNOLOGY CORP. - WELLS FARGO BANK<br>
    ACCOUNT NUMBER: 6335743370<br>
    ROUTING NUMBER: 121000248<br><br>
    Also you can send e-checks or checks by mail to:<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1575 N Treasure Dr. #101 North Bay Village, FL 33141
  </div>
</div>

<div class="footer">
  If you have any questions about this invoice, please contact<br>
  Alejandro Alvarado, alejandro@luantechnology.com, +1 (954) 7366838<br>
  <strong>Thank You For Your Business!</strong>
</div>

</body>
</html>`

  if (!sendDraft) {
    return res.status(200).json({ ok: true, html: invoiceHTML })
  }

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

    // Create draft in Outlook
    const draftRes = await fetch(
      `https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          subject: `Invoice #${invoiceNum} - Luan Technology Corp.`,
          body: { contentType: 'HTML', content: invoiceHTML },
          toRecipients: [{ emailAddress: { address: 'ava.smith@pescatlantic.com' } }],
          ccRecipients: [{ emailAddress: { address: 'Cesar@pescatlantic.com' } }],
        })
      }
    )
    const draft = await draftRes.json()
    if (!draftRes.ok) throw new Error(draft.error?.message || 'Failed to create draft')

    // Update invoice counter in KV
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