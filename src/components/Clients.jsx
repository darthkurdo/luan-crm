import React from 'react'

export default function Clients({ tickets }) {
  const pesc = tickets.filter(t => t.client === 'Pescatlantic')
  const von = tickets.filter(t => t.client === 'Vonoil')

  return (
    <div>
      <div className="metrics metrics-2" style={{ marginBottom: 20 }}>
        <div className="metric">
          <div className="metric-label">Pescatlantic</div>
          <div className="metric-val">{pesc.length}</div>
          <div className="metric-sub">total tickets</div>
        </div>
        <div className="metric">
          <div className="metric-label">Vonoil</div>
          <div className="metric-val">{von.length}</div>
          <div className="metric-sub">total tickets</div>
        </div>
      </div>

      <div className="section-title">Pescatlantic — Contacts</div>
      {[
        { name: 'Cesar J. Calvo', email: 'Cesar@pescatlantic.com', role: 'CEO' },
        { name: 'Ava Smith', email: 'ava.smith@pescatlantic.com', role: 'Corporate Team' },
        { name: 'Carlos Bustos', email: 'cbl@pescatlantic.com', role: '' },
        { name: 'Shipments / Operations', email: 'shipments@pescatlantic.com', role: 'Operations' },
      ].map(c => (
        <div key={c.email} className="client-card">
          <div className="client-card-name">{c.name}</div>
          <div className="client-card-meta">
            <span><i className="ti ti-mail" /> {c.email}</span>
            {c.role && <span><i className="ti ti-badge" /> {c.role}</span>}
          </div>
        </div>
      ))}

      <div className="section-title" style={{ marginTop: 20 }}>Vonoil — Contacts</div>
      {[
        { name: 'Cesar J. Calvo', email: 'cesar@vonoil.com', role: 'Trader', phone: '284.494.5267' },
        { name: 'Operations', email: 'operations@vonoil.com', role: 'Marketing & Operation' },
      ].map(c => (
        <div key={c.email} className="client-card">
          <div className="client-card-name">{c.name}</div>
          <div className="client-card-meta">
            <span><i className="ti ti-mail" /> {c.email}</span>
            {c.role && <span><i className="ti ti-badge" /> {c.role}</span>}
            {c.phone && <span><i className="ti ti-phone" /> {c.phone}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
