import React from 'react'

export default function Reports({ tickets }) {
  const now = new Date()
  const month = now.toLocaleString('en-US', { month: 'long', year: 'numeric' })
  const res = tickets.filter(t => t.status === 'resolved').length
  const pesc = tickets.filter(t => t.client === 'Pescatlantic').length
  const von = tickets.filter(t => t.client === 'Vonoil').length
  const critical = tickets.filter(t => t.priority === 'critical').length
  const high = tickets.filter(t => t.priority === 'high').length
  const medium = tickets.filter(t => t.priority === 'medium').length
  const low = tickets.filter(t => t.priority === 'low').length
  const maxP = Math.max(critical, high, medium, low, 1)
  const maxC = Math.max(pesc, von, 1)

  return (
    <div>
      <div className="section-title">Report — {month}</div>
      <div className="metrics metrics-3" style={{ marginBottom: 24 }}>
        <div className="metric"><div className="metric-label">Total tickets</div><div className="metric-val">{tickets.length}</div></div>
        <div className="metric"><div className="metric-label">Resolved</div><div className="metric-val">{res}</div></div>
        <div className="metric"><div className="metric-label">Open / In progress</div><div className="metric-val">{tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length}</div></div>
      </div>

      <div className="section-title">By client</div>
      <div className="chart-bar" style={{ marginBottom: 24 }}>
        {[{ label: 'Pescatlantic', val: pesc, color: '#1E3A8A' }, { label: 'Vonoil', val: von, color: '#5B21B6' }].map(r => (
          <div className="bar-row" key={r.label}>
            <span className="bar-label">{r.label}</span>
            <div className="bar-fill" style={{ width: Math.round(r.val / maxC * 200), background: r.color }} />
            <span className="bar-val">{r.val}</span>
          </div>
        ))}
      </div>

      <div className="section-title">By priority</div>
      <div className="chart-bar">
        {[
          { label: 'Critical', val: critical, color: '#991B1B' },
          { label: 'High', val: high, color: '#B45309' },
          { label: 'Medium', val: medium, color: '#92400E' },
          { label: 'Low', val: low, color: '#065F46' },
        ].map(r => (
          <div className="bar-row" key={r.label}>
            <span className="bar-label">{r.label}</span>
            <div className="bar-fill" style={{ width: Math.round(r.val / maxP * 200), background: r.color }} />
            <span className="bar-val">{r.val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
