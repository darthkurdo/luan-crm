import React, { useState } from 'react'

export default function NewTicketModal({ onClose, onSave }) {
  const [form, setForm] = useState({ client: '', email: '', subject: '', priority: 'medium', desc: '' })

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleSave() {
    if (!form.subject.trim()) return
    const client = form.client.trim() ||
      (form.email.includes('pescatlantic') ? 'Pescatlantic' :
       form.email.includes('vonoil') ? 'Vonoil' : 'Unknown')
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    onSave({ client, email: form.email || '—', subject: form.subject.trim(), priority: form.priority, desc: form.desc.trim() || 'No description.', status: 'open', created: now, comments: [], fromEmail: false, aiSolution: null })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>New ticket</h3>
        <div className="form-row"><label>Client</label><input placeholder="Pescatlantic / Vonoil" value={form.client} onChange={e => set('client', e.target.value)} /></div>
        <div className="form-row"><label>Email</label><input type="email" placeholder="contact@pescatlantic.com" value={form.email} onChange={e => set('email', e.target.value)} /></div>
        <div className="form-row"><label>Subject</label><input placeholder="Brief description" value={form.subject} onChange={e => set('subject', e.target.value)} /></div>
        <div className="form-row">
          <label>Priority</label>
          <select value={form.priority} onChange={e => set('priority', e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div className="form-row"><label>Description</label><textarea placeholder="Detailed description..." value={form.desc} onChange={e => set('desc', e.target.value)} /></div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}><i className="ti ti-plus" /> Create ticket</button>
        </div>
      </div>
    </div>
  )
}
