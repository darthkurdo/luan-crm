import React from 'react'
import { TicketCard } from './shared'

export default function Dashboard({ tickets, selectedId, setSelectedId }) {
  const open = tickets.filter(t => t.status === 'open').length
  const prog = tickets.filter(t => t.status === 'in_progress').length
  const res = tickets.filter(t => t.status === 'resolved').length
  const fromEmail = tickets.filter(t => t.fromEmail).length

  return (
    <div>
      <div className="metrics">
        <div className="metric">
          <div className="metric-label">Open tickets</div>
          <div className="metric-val">{open}</div>
          <div className="metric-sub">needs attention</div>
        </div>
        <div className="metric">
          <div className="metric-label">In progress</div>
          <div className="metric-val">{prog}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Resolved</div>
          <div className="metric-val">{res}</div>
        </div>
        <div className="metric">
          <div className="metric-label">From M365</div>
          <div className="metric-val">{fromEmail}</div>
          <div className="metric-sub">auto-imported</div>
        </div>
      </div>
      <div className="section-title">Recent tickets</div>
      {tickets.length === 0 ? (
        <div className="empty-state">
          <i className="ti ti-inbox" />
          No tickets yet — click "Sync inbox" to import emails from your monitored domains.
        </div>
      ) : (
        <div className="ticket-list">
          {tickets.slice(0, 5).map(t => (
            <TicketCard
              key={t.id}
              ticket={t}
              selected={selectedId === t.id}
              onClick={() => setSelectedId(t.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
