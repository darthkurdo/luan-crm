import React from 'react'

const VIEWS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'ti-layout-dashboard' },
  { id: 'tickets',   label: 'Tickets',   icon: 'ti-ticket', badge: true },
  { id: 'clients',   label: 'Clients',   icon: 'ti-building' },
  { id: 'reports',   label: 'Reports',   icon: 'ti-chart-bar' },
  { id: 'invoice',   label: 'Invoice',   icon: 'ti-file-invoice' },
  { id: 'settings',  label: 'Settings',  icon: 'ti-settings' },
]

export default function Sidebar({ view, setView, tickets }) {
  const open = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-name">Luan Technology</div>
        <div className="sidebar-logo-sub">MSP CRM</div>
      </div>
      <nav className="sidebar-nav">
        {VIEWS.map(v => (
          <div key={v.id} className={`nav-item${view === v.id ? ' active' : ''}`} onClick={() => setView(v.id)}>
            <i className={`ti ${v.icon}`} />
            {v.label}
            {v.badge && open > 0 && <span className="nav-badge">{open}</span>}
          </div>
        ))}
      </nav>
      <div className="sidebar-domains">
        <div className="sidebar-domains-label">Monitored</div>
        <div><span className="domain-tag"><i className="ti ti-mail" /> pescatlantic.com</span></div>
        <div><span className="domain-tag"><i className="ti ti-mail" /> vonoil.com</span></div>
      </div>
    </div>
  )
}