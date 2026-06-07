import React from 'react'

const TITLES = { dashboard: 'Dashboard', tickets: 'Tickets', clients: 'Clients', reports: 'Reports', settings: 'Settings' }

export default function Topbar({ view, syncing, syncMsg, onSync, onNewTicket }) {
  return (
    <div className="topbar">
      <span className="topbar-title">{TITLES[view] || 'Dashboard'}</span>
      <div className="topbar-right">
        {syncMsg && (
          <div className={`sync-banner ${syncMsg.type}`}>
            <i className={`ti ${syncMsg.type === 'success' ? 'ti-circle-check' : syncMsg.type === 'error' ? 'ti-alert-circle' : 'ti-info-circle'}`} />
            {syncMsg.text}
          </div>
        )}
        <button className="btn" onClick={onSync} disabled={syncing}>
          <i className={`ti ti-refresh${syncing ? ' spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync inbox'}
        </button>
        <button className="btn btn-primary" onClick={onNewTicket}>
          <i className="ti ti-plus" /> New ticket
        </button>
      </div>
    </div>
  )
}
