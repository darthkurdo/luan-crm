import React from 'react'

export default function Settings() {
  return (
    <div>
      <div className="section-title">Configuration</div>

      <div className="client-card" style={{ marginBottom: 12 }}>
        <div className="client-card-name" style={{ marginBottom: 8 }}>Microsoft 365 — connected</div>
        <div style={{ fontSize: 13, color: '#57534E', marginBottom: 6 }}>Mailbox: alejandro@luantechnology.com</div>
        <div style={{ fontSize: 12, color: '#78716C', marginBottom: 6 }}>Monitored domains:</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span className="domain-tag"><i className="ti ti-mail" /> pescatlantic.com</span>
          <span className="domain-tag"><i className="ti ti-mail" /> vonoil.com</span>
        </div>
      </div>

      <div className="client-card" style={{ marginBottom: 12 }}>
        <div className="client-card-name" style={{ marginBottom: 6 }}>Send policy</div>
        <div style={{ fontSize: 13, color: '#57534E', display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ti ti-shield-check" style={{ color: '#065F46' }} />
          No emails are ever sent automatically. Every reply requires your explicit "Send to client" action.
        </div>
      </div>

      <div className="client-card" style={{ marginBottom: 12 }}>
        <div className="client-card-name" style={{ marginBottom: 6 }}>AI suggestions (Claude API)</div>
        <div style={{ fontSize: 13, color: '#57534E', marginBottom: 10 }}>
          Add your Anthropic API key as <code style={{ background: '#F5F5F4', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>ANTHROPIC_API_KEY</code> in Vercel environment variables to enable AI-powered solution suggestions on each ticket.
        </div>
        <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 500 }}>
          Pending configuration
        </span>
      </div>

      <div className="client-card">
        <div className="client-card-name" style={{ marginBottom: 8 }}>Company</div>
        <div className="form-row"><label>Name</label><input defaultValue="Luan Technology Corp." /></div>
        <div className="form-row"><label>Admin email</label><input defaultValue="alejandro@luantechnology.com" /></div>
      </div>
    </div>
  )
}
