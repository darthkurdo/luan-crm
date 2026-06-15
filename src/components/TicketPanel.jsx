import React, { useState } from 'react'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  })
}

function MessageBubble({ msg }) {
  const [expanded, setExpanded] = useState(false)
  const isMine = msg.isMine
  const text = msg.body || msg.preview || ''
  const preview = text.length > 280 ? text.slice(0, 280) : text
  const hasMore = text.length > 280

  return (
    <div className={`message-wrap ${isMine ? 'mine' : 'theirs'}`}>
      <div className="message-meta">
        <span className="message-sender">{isMine ? 'You' : (msg.fromName || msg.from)}</span>
        <span>{formatDate(msg.date)}</span>
        {!isMine && <span style={{ color: '#A8A29E', fontSize: 10 }}>{msg.from}</span>}
      </div>
      <div className={`message-bubble ${isMine ? 'mine' : 'theirs'}`}>
        <span style={{ whiteSpace: 'pre-wrap' }}>{expanded ? text : preview}</span>
        {hasMore && (
          <button className="show-more-btn" onClick={() => setExpanded(e => !e)}>
            {expanded ? ' ↑ Less' : ' ↓ More'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function TicketPanel({ ticket, onClose, onUpdate, onComment, onDelete }) {
  const [replyText, setReplyText] = useState('')
  const [activeTab, setActiveTab] = useState('thread')
  const [sending, setSending] = useState(false)
  const [sendMsg, setSendMsg] = useState(null)

  const messages = ticket.messages || []
  const comments = ticket.comments || []

  // Get the last message ID to use as replyTo
  const lastMessage = messages[messages.length - 1]
  const lastFromClient = [...messages].reverse().find(m => !m.isMine)

  async function createDraft() {
    if (!replyText.trim()) return
    setSending(true)
    setSendMsg(null)
    try {
      const res = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: ticket.email,
          subject: `Re: ${ticket.subject}`,
          content: replyText.trim(),
          replyToMessageId: lastFromClient?.id || lastMessage?.id || null,
        })
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Failed')
      setSendMsg({ type: 'success', text: '✓ Draft created in Outlook — review and send from there.' })
      // Save as comment too
      const now = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
      onComment({ text: replyText.trim(), private: false, author: 'Alejandro (draft → Outlook)', time: now })
      setReplyText('')
    } catch (err) {
      setSendMsg({ type: 'error', text: `Error: ${err.message}` })
    }
    setSending(false)
    setTimeout(() => setSendMsg(null), 6000)
  }

  function saveNote() {
    if (!replyText.trim()) return
    const now = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
    onComment({ text: replyText.trim(), private: true, author: 'Alejandro (Luan Tech)', time: now })
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
        <div className="panel-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
              {ticket.subject}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: '#A8A29E', fontFamily: 'monospace' }}>{ticket.id}</span>
              <span className={`pill pill-${ticket.status}`} style={{ fontSize: 10 }}>
                {ticket.status === 'in_progress' ? 'In progress' : ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
              </span>
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

        <div className="panel-tabs">
          {tabs.map(tab => (
            <button key={tab.id} className={`panel-tab${activeTab === tab.id ? ' active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              <i className={`ti ${tab.icon}`} style={{ fontSize: 14 }} />
              {tab.label}
              {tab.count !== null && <span className="panel-tab-count">{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* THREAD TAB */}
        {activeTab === 'thread' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px' }}>
              {messages.length === 0 ? (
                <div className="empty-state" style={{ padding: 30 }}>
                  <i className="ti ti-mail-off" />No messages in this thread.
                </div>
              ) : (
                messages.map((msg, i) => <MessageBubble key={msg.id || i} msg={msg} />)
              )}
            </div>
            <div className="reply-section">
              {sendMsg && (
                <div style={{
                  marginBottom: 10, padding: '8px 12px', borderRadius: 8, fontSize: 13,
                  background: sendMsg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                  color: sendMsg.type === 'success' ? '#065F46' : '#991B1B',
                  border: `1px solid ${sendMsg.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
                }}>
                  {sendMsg.text}
                </div>
              )}
              <div className="reply-label">Draft reply</div>
              <div className="reply-box">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={`Reply to ${ticket.email}...`}
                />
                <div className="reply-actions">
                  <button className="btn btn-primary" onClick={createDraft} disabled={sending || !replyText.trim()}>
                    {sending ? <><i className="ti ti-loader spin" /> Creating...</> : <><i className="ti ti-file-text" /> Create draft in Outlook</>}
                  </button>
                  <button className="btn" onClick={saveNote} disabled={!replyText.trim()}>
                    <i className="ti ti-lock" /> Save as note
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === 'notes' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
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
              <div className="panel-section">
                <div className="panel-section-title">Internal notes</div>
                <div className="comment-list">
                  {comments.length === 0 && <div style={{ fontSize: 13, color: '#A8A29E' }}>No notes yet.</div>}
                  {comments.map((c, i) => (
                    <div key={i} className={`comment ${c.private ? 'comment-private' : 'comment-public'}`}>
                      <div className="comment-meta">
                        <span>{c.private ? <><i className="ti ti-lock" style={{ fontSize: 10 }} /> Private</> : <><i className="ti ti-file-text" style={{ fontSize: 10 }} /> Draft sent to Outlook</>}</span>
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
                  <button className="btn" onClick={saveNote}><i className="ti ti-lock" /> Save private note</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DETAILS TAB */}
        {activeTab === 'details' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            <div className="panel-section">
              <div class="panel-section-title">Ticket info</div>
              <div className="detail-grid">
                <span className="detail-label">Client</span><span className="detail-val">{ticket.client}</span>
                <span className="detail-label">Email</span><span className="detail-val" style={{ color: '#1E3A8A' }}>{ticket.email}</span>
                <span className="detail-label">Priority</span>
                <span>
                  <select value={ticket.priority} onChange={e => onUpdate({ priority: e.target.value })}
                    style={{ fontSize: 12, padding: '3px 8px', border: '1px solid #E7E5E4', borderRadius: 6, fontFamily: 'Inter', background: '#fff', outline: 'none' }}>
                    <option value="low">Low</option><option value="medium">Medium</option>
                    <option value="high">High</option><option value="critical">Critical</option>
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
    </>
  )
}
