import React, { useState } from 'react'

function formatDateLocal(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatDateShort(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getMonthLabel(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function ticketsInRange(tickets, from, to) {
  const f = new Date(from + 'T00:00:00')
  const t = new Date(to + 'T23:59:59')
  return tickets.filter(tk => {
    const d = new Date(tk.createdAt || tk.created)
    return d >= f && d <= t
  })
}

function buildReportText(tickets, from, to) {
  const fromLabel = formatDateLocal(from + 'T12:00:00')
  const toLabel = formatDateLocal(to + 'T12:00:00')
  const monthLabel = getMonthLabel(from + 'T12:00:00')

  const clientTickets = tickets.filter(t => t.fromEmail && t.messages && t.messages.length > 0)

  // Build client requests section
  const requestLines = clientTickets.map(t => {
    const firstClientMsg = t.messages.find(m => !m.isMine)
    const myReplies = t.messages.filter(m => m.isMine)
    const preview = firstClientMsg?.preview || firstClientMsg?.body || ''
    const shortPreview = preview.slice(0, 80).replace(/\n/g, ' ').trim()
    const requester = t.messages.find(m => !m.isMine)?.fromName || t.email
    const action = myReplies.length > 0
      ? `Reviewed and responded with guidance.`
      : `Reviewed and pending response.`
    return `• ${t.subject} – ${requester} reported/requested: "${shortPreview}${preview.length > 80 ? '...' : ''}". ${action}`
  })

  const report = `Subject: Reporte de Actividades - ${monthLabel}

Hello Cesar,

Below is the summary of IT activities performed for Pescatlantic from ${fromLabel} through ${toLabel}. This report includes client requests, actions executed, responses provided, and administrative work carried out during this period.

Client Requests and Actions

${requestLines.length > 0 ? requestLines.join('\n') : '• No client requests recorded during this period.'}

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

  return report
}

export default function Reports({ tickets }) {
  // Default: current month
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const today = now.toISOString().split('T')[0]

  const [from, setFrom] = useState(firstOfMonth)
  const [to, setTo] = useState(today)
  const [reportText, setReportText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendMsg, setSendMsg] = useState(null)
  const [generated, setGenerated] = useState(false)

  const filtered = ticketsInRange(tickets, from, to)
  const pesc = filtered.filter(t => t.client === 'Pescatlantic').length
  const von = filtered.filter(t => t.client === 'Vonoil').length
  const res = filtered.filter(t => t.status === 'resolved').length

  function generateReport() {
    const text = buildReportText(filtered, from, to)
    setReportText(text)
    setGenerated(true)
    setSendMsg(null)
  }

  async function createDraftInOutlook() {
    if (!reportText.trim()) return
    setSending(true)
    setSendMsg(null)
    try {
      const res = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'Cesar@pescatlantic.com',
          subject: `Reporte de Actividades - ${getMonthLabel(from + 'T12:00:00')}`,
          content: reportText,
        })
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Failed')
      setSendMsg({ type: 'success', text: '✓ Draft created in Outlook — review and send when ready.' })
    } catch (err) {
      setSendMsg({ type: 'error', text: `Error: ${err.message}` })
    }
    setSending(false)
  }

  // Quick range presets
  function setPreset(months) {
    const end = new Date()
    const start = new Date()
    start.setMonth(start.getMonth() - months)
    setFrom(start.toISOString().split('T')[0])
    setTo(end.toISOString().split('T')[0])
    setGenerated(false)
  }

  function setPrevMonth() {
    const d = new Date()
    const start = new Date(d.getFullYear(), d.getMonth() - 1, 1)
    const end = new Date(d.getFullYear(), d.getMonth(), 0)
    setFrom(start.toISOString().split('T')[0])
    setTo(end.toISOString().split('T')[0])
    setGenerated(false)
  }

  return (
    <div>
      {/* Date range selector */}
      <div style={{ background: '#fff', border: '1px solid #E7E5E4', borderRadius: 12, padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="section-title" style={{ marginBottom: 12 }}>Report date range</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <label style={{ color: '#57534E', fontWeight: 500 }}>From</label>
            <input type="date" value={from} onChange={e => { setFrom(e.target.value); setGenerated(false) }}
              style={{ padding: '6px 10px', border: '1px solid #E7E5E4', borderRadius: 8, fontSize: 13, fontFamily: 'Inter', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <label style={{ color: '#57534E', fontWeight: 500 }}>To</label>
            <input type="date" value={to} onChange={e => { setTo(e.target.value); setGenerated(false) }}
              style={{ padding: '6px 10px', border: '1px solid #E7E5E4', borderRadius: 8, fontSize: 13, fontFamily: 'Inter', outline: 'none' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="filter-btn" onClick={setPrevMonth}>Previous month</button>
          <button className="filter-btn" onClick={() => { setFrom(firstOfMonth); setTo(today); setGenerated(false) }}>This month</button>
          <button className="filter-btn" onClick={() => setPreset(2)}>Last 2 months</button>
          <button className="filter-btn" onClick={() => setPreset(3)}>Last 3 months</button>
        </div>
      </div>

      {/* Summary metrics */}
      <div className="metrics metrics-3" style={{ marginBottom: 16 }}>
        <div className="metric">
          <div className="metric-label">Tickets in range</div>
          <div className="metric-val">{filtered.length}</div>
          <div className="metric-sub">{formatDateShort(from + 'T12:00:00')} – {formatDateShort(to + 'T12:00:00')}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Pescatlantic</div>
          <div className="metric-val">{pesc}</div>
          <div className="metric-sub">tickets</div>
        </div>
        <div className="metric">
          <div className="metric-label">Vonoil</div>
          <div className="metric-val">{von}</div>
          <div className="metric-sub">tickets</div>
        </div>
      </div>

      {/* Tickets list in range */}
      {filtered.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #E7E5E4', borderRadius: 12, padding: '14px 18px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div className="section-title" style={{ marginBottom: 10 }}>Tickets included ({filtered.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, padding: '6px 0', borderBottom: '0.5px solid #F5F5F4' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#A8A29E', minWidth: 60 }}>{t.id}</span>
                <span className={`pill pill-${t.client === 'Pescatlantic' ? 'open' : 'email'}`} style={{ fontSize: 10 }}>{t.client}</span>
                <span style={{ flex: 1, color: '#1C1917', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</span>
                <span style={{ color: '#A8A29E', fontSize: 11, flexShrink: 0 }}>{formatDateShort(t.createdAt || t.created)}</span>
                <span className={`pill pill-${t.status}`} style={{ fontSize: 10, flexShrink: 0 }}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate button */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={generateReport} disabled={filtered.length === 0}>
          <i className="ti ti-file-text" /> Generate report
        </button>
        {generated && (
          <button className="btn" onClick={createDraftInOutlook} disabled={sending}>
            {sending
              ? <><i className="ti ti-loader spin" /> Creating draft...</>
              : <><i className="ti ti-mail" /> Create draft in Outlook</>}
          </button>
        )}
      </div>

      {sendMsg && (
        <div style={{
          marginBottom: 14, padding: '10px 14px', borderRadius: 8, fontSize: 13,
          background: sendMsg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          color: sendMsg.type === 'success' ? '#065F46' : '#991B1B',
          border: `1px solid ${sendMsg.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className={`ti ${sendMsg.type === 'success' ? 'ti-circle-check' : 'ti-alert-circle'}`} />
          {sendMsg.text}
        </div>
      )}

      {/* Report preview */}
      {generated && (
        <div style={{ background: '#fff', border: '1px solid #E7E5E4', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid #E7E5E4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1C1917' }}>Report preview</span>
            <span style={{ fontSize: 11, color: '#A8A29E' }}>{filtered.length} ticket{filtered.length !== 1 ? 's' : ''} included</span>
          </div>
          <textarea
            value={reportText}
            onChange={e => setReportText(e.target.value)}
            style={{
              width: '100%', padding: '16px 20px',
              border: 'none', outline: 'none',
              fontFamily: 'Inter', fontSize: 13, lineHeight: 1.7,
              color: '#1C1917', background: '#FAFAF9',
              resize: 'vertical', minHeight: 500,
            }}
          />
        </div>
      )}
    </div>
  )
}
