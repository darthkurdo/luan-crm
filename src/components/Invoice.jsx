import React, { useState, useEffect } from 'react'

const CLIENTS = {
  pescatlantic: {
    name: 'PESCATLANTIC GROUP, LLC',
    address: '801 Brickell Ave 8th Floor\nMiami, FL 33131',
    to: 'ava.smith@pescatlantic.com',
    cc: 'Cesar@pescatlantic.com',
  },
  vonoil: {
    name: 'VONOIL',
    address: 'OMC Chambers, Wickhams, CAY 1\nRoad Town, Tortola, British Virgin Islands',
    to: 'operations@vonoil.com',
    cc: 'cesar@vonoil.com',
  }
}

function todayStr() {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
function dueDateStr() {
  const d = new Date()
  d.setDate(d.getDate() + 5)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
function monthStr() {
  const d = new Date()
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function Invoice() {
  const [invoiceNum, setInvoiceNum] = useState('')
  const [date, setDate] = useState(todayStr())
  const [dueDate, setDueDate] = useState(dueDateStr())
  const [client, setClient] = useState('pescatlantic')
  const [description, setDescription] = useState(`IT Managed Services Monthly Fee for ${monthStr()}`)
  const [amount, setAmount] = useState('440.00')
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState(null)
  const [preview, setPreview] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetch('/api/invoice')
      .then(r => r.json())
      .then(d => setInvoiceNum(String(d.counter + 1)))
      .catch(() => setInvoiceNum('1113821'))
  }, [])

  function showMsg(type, text) {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 7000)
  }

  async function previewInvoice() {
    const cl = CLIENTS[client]
    const res = await fetch('/api/invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoiceNum, date, dueDate, description, amount,
        clientName: cl.name, clientAddress: cl.address,
        sendDraft: false,
      })
    })
    const data = await res.json()
    if (data.html) { setPreview(data.html); setShowPreview(true) }
  }

  async function createDraft() {
    setSending(true)
    setMsg(null)
    const cl = CLIENTS[client]
    try {
      const res = await fetch('/api/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNum, date, dueDate, description, amount,
          clientName: cl.name, clientAddress: cl.address,
          sendDraft: true,
        })
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Failed')
      showMsg('success', `✓ Invoice draft created in Outlook. Next invoice will be #${data.nextInvoiceNum}.`)
      setInvoiceNum(String(data.nextInvoiceNum))
    } catch (err) {
      showMsg('error', `Error: ${err.message}`)
    }
    setSending(false)
  }

  return (
    <div>
      <div style={{ background: '#fff', border: '1px solid #E7E5E4', borderRadius: 12, padding: '20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="section-title" style={{ marginBottom: 16 }}>Invoice details</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="form-row">
            <label>Invoice #</label>
            <input value={invoiceNum} onChange={e => setInvoiceNum(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Client</label>
            <select value={client} onChange={e => setClient(e.target.value)}>
              <option value="pescatlantic">Pescatlantic Group, LLC</option>
              <option value="vonoil">Vonoil</option>
            </select>
          </div>
          <div className="form-row">
            <label>Date</label>
            <input value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Due date</label>
            <input value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          <div className="form-row" style={{ gridColumn: '1 / -1' }}>
            <label>Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Amount ($)</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
        </div>

        <div style={{ marginTop: 8, fontSize: 12, color: '#78716C' }}>
          <i className="ti ti-send" style={{ marginRight: 4 }} />
          Draft will be sent to: <strong>{CLIENTS[client].to}</strong> · CC: <strong>{CLIENTS[client].cc}</strong>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <button className="btn" onClick={previewInvoice}>
          <i className="ti ti-eye" /> Preview
        </button>
        <button className="btn btn-primary" onClick={createDraft} disabled={sending || !invoiceNum}>
          {sending
            ? <><i className="ti ti-loader spin" /> Creating draft...</>
            : <><i className="ti ti-mail" /> Create draft in Outlook</>}
        </button>
      </div>

      {msg && (
        <div style={{
          marginBottom: 14, padding: '10px 14px', borderRadius: 8, fontSize: 13,
          background: msg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          color: msg.type === 'success' ? '#065F46' : '#991B1B',
          border: `1px solid ${msg.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className={`ti ${msg.type === 'success' ? 'ti-circle-check' : 'ti-alert-circle'}`} />
          {msg.text}
        </div>
      )}

      {showPreview && preview && (
        <div style={{ background: '#fff', border: '1px solid #E7E5E4', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid #E7E5E4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Invoice preview</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowPreview(false)}>
              <i className="ti ti-x" />
            </button>
          </div>
          <iframe
            srcDoc={preview}
            style={{ width: '100%', height: 700, border: 'none' }}
            title="Invoice preview"
          />
        </div>
      )}
    </div>
  )
}