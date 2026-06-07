export function statusLabel(s) {
  return s === 'in_progress' ? 'In progress' : s.charAt(0).toUpperCase() + s.slice(1)
}

export function TicketCard({ ticket, selected, onClick }) {
  return (
    <div className={`ticket-card${selected ? ' selected' : ''}`} onClick={onClick}>
      <div className="ticket-header">
        <span className="ticket-id">{ticket.id}</span>
        <span className={`pill pill-${ticket.status}`}>{statusLabel(ticket.status)}</span>
        <span className={`pill pill-${ticket.priority}`}>{ticket.priority}</span>
        {ticket.fromEmail && <span className="pill pill-email"><i className="ti ti-mail" /> M365</span>}
      </div>
      <div className="ticket-title">{ticket.subject}</div>
      <div className="ticket-meta">
        <span><i className="ti ti-building" /> {ticket.client}</span>
        <span><i className="ti ti-mail" /> {ticket.email}</span>
        <span><i className="ti ti-calendar" /> {ticket.created}</span>
        <span><i className="ti ti-message" /> {ticket.comments.length} comment{ticket.comments.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}
