import React, { useState } from 'react'
import { statusLabel } from './shared'

export default function TicketPanel({ ticket, onClose, onUpdate, onComment }) {
  const [replyText, setReplyText] = useState('')

  function sendReply(isPrivate) {
    if (!replyText.trim()) return
    const now = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
    onComment({ text: replyText.trim(), private: isPrivate, author: 'Alejandro (Luan Tech)', time: now })
    setReplyText('')
  }

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <div className="panel">
        <div className="panel-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ticket.subject}</div>
            <div style={{ fontSize: 11, color: '#78716C' }}>{ticket.id} · {ticket.client}</div>
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

        <div className="panel-body">
          {/* Details */}
          <div className="panel-section">
            <div className="panel-section-title">Details</div>
            <div className="detail-grid">
              <span className="detail-label">Client</span><span className="detail-val">{ticket.client}</span>
              <span className="detail-label">Email</span><span className="detail-val" style={{ color: '#1E3A8A' }}>{ticket.email}</span>
              <span className="detail-label">Priority</span><span className="detail-val"><span className={`pill pill-${ticket.priority}`}>{ticket.priority}</span></span>
              <span className="detail-label">Received</span><span className="detail-val">{ticket.created}</span>
            </div>
            <div className="desc-box">{ticket.desc}</div>
          </div>

          {/* AI solution placeholder — ready to enable later */}
          <div className="panel-section">
            <div className="panel-section-title"><i className="ti ti-robot" style={{ verticalAlign: -2, marginRight: 4 }} /> AI suggested solution (private)</div>
            {ticket.aiSolution ? (
              <>
                <div className="ai-box">{ticket.aiSolution}</div>
                <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => setReplyText(ticket.aiSolution)}>
                  <i className="ti ti-copy" /> Use as draft
                </button>
              </>
            ) : (
              <div style={{ fontSize: 13, color: '#78716C', padding: '10px 14px', background: '#F5F5F4', borderRadius: 8 }}>
                AI suggestions will be available when the Claude API is configured. You can add a manual note below.
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="panel-section">
            <div className="panel-section-title">Comments & replies</div>
            <div className="comment-list">
              {ticket.comments.length === 0 && (
                <div style={{ fontSize: 13, color: '#78716C' }}>No comments yet.</div>
              )}
              {ticket.comments.map((c, i) => (
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
                placeholder="Write a reply or internal note..."
              />
              <div className="reply-actions">
                <button className="btn btn-primary" onClick={() => sendReply(false)}>
                  <i className="ti ti-send" /> Send to client
                </button>
                <button className="btn" onClick={() => sendReply(true)}>
                  <i className="ti ti-lock" /> Private note
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
