import React, { useState } from 'react'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
}

function MessageBubble({ msg }) {
  const [showFull, setShowFull] = useState(false)
  const isMine = msg.isMine

  // Strip HTML tags for preview
  const plainText = msg.isHtml
    ? msg.body.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
    : msg.body

  const preview = plainText.length > 300 ? plainText.slice(0, 300) + '...' : plainText

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isMine ? 'flex-end' : 'flex-start',
      marginBottom: 14,
    }}>
      <div style={{ fontSize: 11, color: '#78716C', marginBottom: 4, display: 'flex', gap: 8 }}>
        <span style={{ fontWeight: 600, color: isMine ? '#1E3A8A' : '#1C1917' }}>
          {isMine ? 'You' : msg.fromName || msg.from}
        </span>
        <span>{formatDate(msg.date)}</span>
        {!isMine && <span style={{ color: '#A8A29E' }}>{msg.from}</span>}
      </div>
      <div style={{
        maxWidth: '90%',
        background: isMine ? '#EFF6FF' : '#F5F5F4',
        border: `1px solid ${isMine ? '#BFDBFE' : '#E7E5E4'}`,
        borderRadius: isMine ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
        padding: '10px 14px',
        fontSize: 13,
        lineHeight: 1.6,
        color: '#1C1917',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {showFull ? plainText : preview}
        {plainText.length > 300 && (
          <span
            onClick={() => setShowFull(f => !f)}
            style={{ color: '#1E3A8A', cursor: 'pointer', marginLeft: 4, fontSize: 12 }}
          >
            {showFull ? ' Show less' : ' Show more'}
          </span>
        )}
      </div>
    </div>
  )
}

export default function TicketPanel({ ticket, onClose, onUpdate, onComment }) {
  const [replyText, setReplyText] = useState('')
  const [activeTab, setActiveTab] = useState('thread')

  function sendReply(isPrivate) {
    if (!replyText.trim()) return
    const now = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
    onComment({ text: replyText.trim(), private: isPrivate, author: 'Alejandro (Luan Tech)', time: now })
    setReplyText('')
  }

  const messages = ticket.messages || []
  const comments = ticket.comments || []

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <div className="panel">
        {/* Header */}
        <div className="panel-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.subject}</div>
            <div style={{ fontSize: 11, color: '#78716C', display: 'flex', gap: 8 }}>
              <span>{ticket.id}</span>
              <span>·</span>
              <span>{ticket.client}</span>
              <span>·</span>
              <span>{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <select
              value={ticket.status}
              onChange={e => onUpdate({ status: e.target.value })}
              style={{ fontSize: 12, padding: '4px 8px', border: '1px solid #D6D3D1', borderRadius: 6, fontFamily: 'Inter', background: '#fff', cursor: 'pointer' }}
            >
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <button className="btn btn-sm" onClick={onClose}><i className="ti ti-x" /></button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E7E5E4', padding: '0 20px', background: '#fff' }}>
          {[
            { id: 'thread', label: `Email thread (${messages.length})`, icon: 'ti-mail' },
            { id: 'notes', label: `Notes (${comments.length})`, icon: 'ti-lock' },
            { id: 'details', label: 'Details', icon: 'ti-info-circle' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 14px',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #1E3A8A' : '2px solid transparent',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 13,
                color: activeTab === tab.id ? '#1E3A8A' : '#78716C',
                fontWeight: activeTab === tab.id ? 600 : 400,
                fontFamily: 'Inter',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <i className={`ti ${tab.icon}`} style={{ fontSize: 14 }} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="panel-body">

          {/* EMAIL THREAD TAB */}
          {activeTab === 'thread' && (
            <div>
              {messages.length === 0 ? (
                <div style={{ fontSize: 13, color: '#78716C', textAlign: 'center', padding: 20 }}>
                  No email thread available.
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  {messages.map((msg, i) => (
                    <MessageBubble key={msg.id || i} msg={msg} />
                  ))}
                </div>
              )}
              {/* Reply box */}
              <div style={{ borderTop: '1px solid #E7E5E4', paddingTop: 14, marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#78716C', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Draft reply
                </div>
                <div className="reply-box">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder={`Reply to ${ticket.email}...`}
                  />
                  <div className="reply-actions">
                    <button className="btn btn-primary" onClick={() => sendReply(false)}>
                      <i className="ti ti-send" /> Send to client
                    </button>
                    <button className="btn" onClick={() => sendReply(true)}>
                      <i className="ti ti-lock" /> Save as note
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTES TAB */}
          {activeTab === 'notes' && (
            <div>
              <div style={{ fontSize: 12, color: '#78716C', marginBottom: 12, padding: '8px 12px', background: '#FEF3C7', borderRadius: 8 }}>
                <i className="ti ti-info-circle" style={{ marginRight: 6 }} />
                Private notes are only visible to you. Use these for internal reminders or AI suggestions.
              </div>

              {/* AI solution */}
              <div className="panel-section">
                <div className="panel-section-title"><i className="ti ti-robot" style={{ verticalAlign: -2, marginRight: 4 }} /> AI suggested solution</div>
                {ticket.aiSolution ? (
                  <>
                    <div className="ai-box">{ticket.aiSolution}</div>
                    <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => { setReplyText(ticket.aiSolution); setActiveTab('thread') }}>
                      <i className="ti ti-copy" /> Use as reply draft
                    </button>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: '#78716C', padding: '10px 14px', background: '#F5F5F4', borderRadius: 8 }}>
                    AI suggestions will be available when the Claude API is configured.
                  </div>
                )}
              </div>

              {/* Comments */}
              <div className="panel-section">
                <div className="panel-section-title">Internal notes</div>
                <div className="comment-list">
                  {comments.length === 0 && <div style={{ fontSize: 13, color: '#78716C' }}>No notes yet.</div>}
                  {comments.map((c, i) => (
                    <div key={i} className={`comment ${c.private ? 'comment-private' : 'comment-public'}`}>
                      <div className="comment-meta">
                        <span>{c.private ? <><i className="ti ti-lock" style={{ fontSize: 11 }} /> Private</> : <><i className="ti ti-send" style={{ fontSize: 11 }} /> Sent to client</>}</span>
                        <span>{c.author}</span>
                        <span>{c.time}</span>
                      </div>
                      {c.text}
                    </div>
                  ))}
                </div>
                <div className="reply-box">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Add an internal note..."
                  />
                  <div className="reply-actions">
                    <button className="btn" onClick={() => sendReply(true)}>
                      <i className="ti ti-lock" /> Save private note
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DETAILS TAB */}
          {activeTab === 'details' && (
            <div>
              <div className="panel-section">
                <div className="panel-section-title">Ticket details</div>
                <div className="detail-grid">
                  <span className="detail-label">Client</span><span className="detail-val">{ticket.client}</span>
                  <span className="detail-label">Email</span><span className="detail-val" style={{ color: '#1E3A8A' }}>{ticket.email}</span>
                  <span className="detail-label">Priority</span>
                  <span className="detail-val">
                    <select
                      value={ticket.priority}
                      onChange={e => onUpdate({ priority: e.target.value })}
                      style={{ fontSize: 12, padding: '3px 8px', border: '1px solid #D6D3D1', borderRadius: 6, fontFamily: 'Inter', background: '#fff' }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </span>
                  <span className="detail-label">Created</span><span className="detail-val">{ticket.created}</span>
                  <span className="detail-label">Messages</span><span className="detail-val">{messages.length}</span>
                  <span className="detail-label">Source</span><span className="detail-val">{ticket.fromEmail ? 'M365 email' : 'Manual'}</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
