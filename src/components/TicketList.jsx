import React from 'react'
import { TicketCard } from './shared'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'pescatlantic', label: 'Pescatlantic' },
  { id: 'vonoil', label: 'Vonoil' },
]

export default function TicketList({ tickets, selectedId, setSelectedId, filterStatus, setFilterStatus }) {
  const filtered = tickets.filter(t => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'pescatlantic') return t.client === 'Pescatlantic'
    if (filterStatus === 'vonoil') return t.client === 'Vonoil'
    return t.status === filterStatus
  })

  return (
    <div>
      <div className="filters">
        {FILTERS.map(f => (
          <button
            key={f.id}
            className={`filter-btn${filterStatus === f.id ? ' active' : ''}`}
            onClick={() => setFilterStatus(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state">
          <i className="ti ti-ticket" />
          No tickets match this filter.
        </div>
      ) : (
        <div className="ticket-list">
          {filtered.map(t => (
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
