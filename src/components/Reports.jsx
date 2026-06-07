import React from 'react'

export default function Reports({ tickets }) {
  const month = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })
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
      <div className="metrics metrics-3" style={{ marginBottom: 28 }}>
        <div className="metric"><div className="metric-label">Total tickets</div><div className="metric-val">{tickets.length}</div></div>
        <div className="metric"><div className="metric-label">Resolved</div><div className="metric-val" style={{ color: '#065F46' }}>{res}</div></div>
        <div className="metric"><div className="metric-label">Pending</div><div className="metric-val" style={{ color: '#DC2626' }}>{tickets.length - res}</div></div>
      </div>

      <div className="section-title">By client</div>
      <div style={{ background: '#fff', border: '1px solid #E7E5E4', borderRadius: 12, padding: '16px 20px', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="chart-bar">
          {[{ label: 'Pescatlantic', val: pesc, color: '#1C1917' }, { label: 'Vonoil', val: von, color: '#5B21B6' }].map(r => (
            <div className="bar-row" key={r.label}>
              <span className="bar-label">{r.label}</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round(r.val / maxC * 100)}%`, background: r.color }} /></div>
              <span className="bar-val">{r.val}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section-title">By priority</div>
      <div style={{ background: '#fff', border: '1px solid #E7E5E4', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="chart-bar">
          {[
            { label: 'Critical', val: critical, color: '#DC2626' },
            { label: 'High', val: high, color: '#EA580C' },
            { label: 'Medium', val: medium, color: '#D97706' },
            { label: 'Low', val: low, color: '#16A34A' },
          ].map(r => (
            <div className="bar-row" key={r.label}>
              <span className="bar-label">{r.label}</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round(r.val / maxP * 100)}%`, background: r.color }} /></div>
              <span className="bar-val">{r.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
