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

export default function Reports({ tickets }) {
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const today = now.toISOString().split('T')[0]

  const [from, setFrom] = useState(firstOfMonth)
  const [to, setTo] = useState(today)
  const [reportText, setReportText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState(null)
  const [generated, setGenerated] = useState(false)

  const filtered = ticketsInRange(tickets, from, to)
  const pesc = filtered.filter(t => t.client === 'Pescatlantic').length
  const von = filtered.filter(t => t.client === 'Vonoil').length

  function showMsg(type, text) {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 6000)
  }

  async function generateReport() {
    if (!filtered.length) return
    setGenerating(true)
    setGenerated(false)
    setMsg(null)
    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickets: filtered, from, to })
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Generation failed')
      setReportText(data.report)
      setGenerated(true)
    } catch (err) {
      showMsg('error', `Error: ${err.message}`)
    }
    setGenerating(false)
  }

  async function createDraft() {
    if (!reportText.trim()) return
    setSending(true)
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
      showMsg('success', '✓ Draft created in Outlook — review and send when ready.')
    } catch (err) {
      showMsg('error', `Error: ${err.message}`)
    }
    setSending(false)
  }

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
      {/* Date range */}
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

      {/* Metrics */}
      <div className="metrics metrics-3" style={{ marginBottom: 16 }}>
        <div className="metric">
          <div className="metric-label">Tickets in range</div>
          <div className="metric-val">{filtered.length}</div>
          <div className="metric-sub">{formatDateShort(from + 'T12:00:00')} – {formatDateShort(to + 'T12:00:00')}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Pescatlantic</div>
          <div className="metric-val">{pesc}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Vonoil</div>
          <div className="metric-val">{von}</div>
        </div>
      </div>

      {/* Ticket list */}
      {filtered.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #E7E5E4', borderRadius: 12, padding: '14px 18px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div className="section-title" style={{ marginBottom: 10 }}>Tickets included ({filtered.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <button className="btn btn-primary" onClick={generateReport} disabled={generating || filtered.length === 0}>
          {generating
            ? <><i className="ti ti-loader spin" /> Generating with AI...</>
            : <><i className="ti ti-sparkles" /> Generate report with AI</>}
        </button>
        {generated && (
          <button className="btn" onClick={createDraft} disabled={sending}>
            {sending
              ? <><i className="ti ti-loader spin" /> Creating draft...</>
              : <><i className="ti ti-mail" /> Create draft in Outlook</>}
          </button>
        )}
        {filtered.length === 0 && (
          <span style={{ fontSize: 13, color: '#A8A29E' }}>No tickets in this date range.</span>
        )}
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

      {/* Report preview - editable */}
      {generated && (
        <div style={{ background: '#fff', border: '1px solid #E7E5E4', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid #E7E5E4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Report preview <span style={{ fontWeight: 400, color: '#78716C' }}>(editable)</span></span>
            <span style={{ fontSize: 11, color: '#A8A29E' }}>Generated by Gemini AI</span>
          </div>
          <textarea
            value={reportText}
            onChange={e => setReportText(e.target.value)}
            style={{
              width: '100%', padding: '16px 20px', border: 'none', outline: 'none',
              fontFamily: 'Inter', fontSize: 13, lineHeight: 1.75,
              color: '#1C1917', background: '#FAFAF9',
              resize: 'vertical', minHeight: 520,
            }}
          />
        </div>
      )}
    </div>
  )
}