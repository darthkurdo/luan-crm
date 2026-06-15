import React from 'react'

const TITLES = { dashboard: 'Dashboard', tickets: 'Tickets', clients: 'Clients', reports: 'Reports', settings: 'Settings' }

export default function Topbar({ view, syncing, syncMsg, onSync, onNewTicket, localMode }) {
  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="topbar-title">{TITLES[view] || 'Dashboard'}</span>
        {localMode && (
          <span style={{ fontSize: 11, background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: 20, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            Local agent
          </span>
        )}
      </div>
      <div className="topbar-right">
        {syncMsg && (
          <div className={`sync-banner ${syncMsg.type}`}>
            <i className={`ti ${syncMsg.type === 'success' ? 'ti-circle-check' : syncMsg.type === 'error' ? 'ti-alert-circle' : 'ti-info-circle'}`} />
            {syncMsg.text}
          </div>
        )}
        <button className="btn" onClick={onSync} disabled={syncing}>
          <i className={`ti ti-refresh${syncing ? ' spin' : ''}`} />
          {syncing ? 'Syncing...' : localMode ? 'Sync (local)' : 'Sync inbox'}
        </button>
        <button className="btn btn-primary" onClick={onNewTicket}>
          <i className="ti ti-plus" /> New ticket
        </button>
      </div>
    </div>
  )
}
