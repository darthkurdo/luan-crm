import React, { useState } from 'react'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  })
}

function cleanEmailBody(raw, isHtml) {
  let text = raw || ''
  if (isHtml) {
    // Remove reply/forward block patterns before stripping HTML
    text = text
      .replace(/<div[^>]*class="[^"]*gmail_quote[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/<blockquote[\s\S]*?<\/blockquote>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
    // Strip HTML tags
    text = text.replace(/<br\s*\/?>/gi, '\n')
    text = text.replace(/<\/p>/gi, '\n')
    text = text.replace(/<\/div>/gi, '\n')
    text = text.replace(/<[^>]+>/g, '')
    // Decode HTML entities
    text = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
  }
  // Remove Outlook-style quoted reply (From: ... Sent: ... To: ...)
  text = text
    .replace(/_{3,}[\s\S]*/g, '')          // ___ separator
    .replace(/[-]{3,}[\s\S]*/g, '')         // --- separator
    .replace(/From:.*\n(Sent|Date):[\s\S]*/gi, '')
    .replace(/On .+wrote:[\s\S]*/gi, '')
  // Clean up whitespace
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  text = text.replace(/\n{3,}/g, '\n\n').trim()
  return text
}

function MessageBubble({ msg }) {
  const [expanded, setExpanded] = useState(false)
  const isMine = msg.isMine
  const clean = cleanEmailBody(msg.body, msg.isHtml)
  const preview = clean.length > 280 ? clean.slice(0, 280) : clean
  const hasMore = clean.length > 280

  return (
    <div className={`message-wrap ${isMine ? 'mine' : 'theirs'}`}>
      <div className="message-meta">
        {!isMine && <span className="message-sender">{msg.fromName || msg.from}</span>}
        {isMine && <span className="message-sender" style={{ color: '#1C1917' }}>You</span>}
        <span>{formatDate(msg.date)}</span>
      </div>
      <div className={`message-bubble ${isMine ? 'mine' : 'theirs'}`}>
        <span style={{ whiteSpace: 'pre-wrap' }}>{expanded ? clean : preview}</span>
        {hasMore && (
          <button className="show-more-btn" onClick={() => setExpanded(e => !e)}>
            {expanded ? ' ↑ Show less' : ' ↓ Show more'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function TicketPanel({ ticket, onClose, onUpdate, onComment }) {
  const [replyText, setReplyText] = useState('')
  const [activeTab, setActiveTab] = useState('thread')
  const messages = ticket.messages || []
  const comments = ticket.comments || []

  function sendReply(isPrivate) {
    if (!replyText.trim()) return
    const now = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
    onComment({ text: replyText.trim(), private: isPrivate, author: 'Alejandro (Luan Tech)', time: now })
    setReplyText('')
  }

  const tabs = [
    { id: 'thread', label: 'Thread', icon: 'ti-mail', count: messages.length },
    { id: 'notes', label: 'Notes', icon: 'ti-lock', count: comments.length },
    { id: 'details', label: 'Details', icon: 'ti-info-circle', count: null },
  ]

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <div className="panel">
        {/* Header */}
        <div className="panel-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
              {ticket.subject}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: '#A8A29E', fontFamily: 'monospace' }}>{ticket.id}</span>
              <span className={`pill pill-${ticket.status}`} style={{ fontSize: 10 }}>{ticket.status === 'in_progress' ? 'In progress' : ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}</span>
              <span className={`pill pill-${ticket.priority}`} style={{ fontSize: 10 }}>{ticket.priority}</span>
              <span style={{ fontSize: 11, color: '#78716C' }}>{ticket.client}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <select
              value={ticket.status}
              onChange={e => onUpdate({ status: e.target.value })}
              style={{ fontSize: 12, padding: '5px 8px', border: '1px solid #E7E5E4', borderRadius: 7, fontFamily: 'Inter', background: '#fff', cursor: 'pointer', outline: 'none' }}
            >
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '5px 8px' }}>
              <i className="ti ti-x" style={{ fontSize: 16 }} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="panel-tabs">
          {tabs.map(tab => (
            <button key={tab.id} className={`panel-tab${activeTab === tab.id ? ' active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              <i className={`ti ${tab.icon}`} style={{ fontSize: 14 }} />
              {tab.label}
              {tab.count !== null && <span className="panel-tab-count">{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* Thread tab */}
        {activeTab === 'thread' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px' }}>
              {messages.length === 0 ? (
                <div className="empty-state" style={{ padding: 30 }}>
                  <i className="ti ti-mail-off" />
                  No messages in this thread.
                </div>
              ) : (
                messages.map((msg, i) => <MessageBubble key={msg.id || i} msg={msg} />)
              )}
            </div>
            <div className="reply-section">
              <div className="reply-label">Draft reply</div>
              <div className="reply-box">
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder={`Reply to ${ticket.email}...`} />
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

        {/* Notes tab */}
        {activeTab === 'notes' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              {/* AI */}
              <div className="panel-section">
                <div className="panel-section-title"><i className="ti ti-sparkles" style={{ marginRight: 5, verticalAlign: -2 }} />AI Suggestion</div>
                {ticket.aiSolution ? (
                  <>
                    <div className="ai-box">{ticket.aiSolution}</div>
                    <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => { setReplyText(ticket.aiSolution); setActiveTab('thread') }}>
                      <i className="ti ti-copy" /> Use as draft
                    </button>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: '#A8A29E', padding: '10px 14px', background: '#F8F7F5', borderRadius: 8, border: '1px dashed #E7E5E4' }}>
                    Configure Anthropic API key to enable AI suggestions.
                  </div>
                )}
              </div>
              {/* Comments */}
              <div className="panel-section">
                <div className="panel-section-title">Internal notes</div>
                <div className="comment-list">
                  {comments.length === 0 && <div style={{ fontSize: 13, color: '#A8A29E' }}>No notes yet.</div>}
                  {comments.map((c, i) => (
                    <div key={i} className={`comment ${c.private ? 'comment-private' : 'comment-public'}`}>
                      <div className="comment-meta">
                        <span>{c.private ? <><i className="ti ti-lock" style={{ fontSize: 10 }} /> Private</> : <><i className="ti ti-send" style={{ fontSize: 10 }} /> Sent</>}</span>
                        <span>{c.author}</span><span>{c.time}</span>
                      </div>
                      {c.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="reply-section">
              <div className="reply-label">Add note</div>
              <div className="reply-box">
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Internal note..." />
                <div className="reply-actions">
                  <button className="btn" onClick={() => sendReply(true)}><i className="ti ti-lock" /> Save private note</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Details tab */}
        {activeTab === 'details' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            <div className="panel-section">
              <div className="panel-section-title">Ticket info</div>
              <div className="detail-grid">
                <span className="detail-label">Client</span><span className="detail-val">{ticket.client}</span>
                <span className="detail-label">Email</span><span className="detail-val" style={{ color: '#1E3A8A' }}>{ticket.email}</span>
                <span className="detail-label">Priority</span>
                <span><select value={ticket.priority} onChange={e => onUpdate({ priority: e.target.value })} style={{ fontSize: 12, padding: '3px 8px', border: '1px solid #E7E5E4', borderRadius: 6, fontFamily: 'Inter', background: '#fff', outline: 'none' }}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                </select></span>
                <span className="detail-label">Created</span><span className="detail-val">{ticket.created}</span>
                <span className="detail-label">Messages</span><span className="detail-val">{messages.length}</span>
                <span className="detail-label">Source</span><span className="detail-val">{ticket.fromEmail ? 'M365 email' : 'Manual'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
