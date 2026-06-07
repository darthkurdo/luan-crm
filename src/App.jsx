import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Dashboard from './components/Dashboard'
import TicketList from './components/TicketList'
import Clients from './components/Clients'
import Reports from './components/Reports'
import Settings from './components/Settings'
import TicketPanel from './components/TicketPanel'
import NewTicketModal from './components/NewTicketModal'
import './App.css'

let nextId = 1
function genId() { return `TKT-${String(nextId++).padStart(3, '0')}` }

function clientFromEmail(email) {
  if (!email) return 'Unknown'
  if (email.toLowerCase().includes('pescatlantic')) return 'Pescatlantic'
  if (email.toLowerCase().includes('vonoil')) return 'Vonoil'
  return email.split('@')[1] || 'Unknown'
}

function priorityFromImportance(imp) {
  if (imp === 'high') return 'high'
  return 'medium'
}

export default function App() {
  const [view, setView] = useState('dashboard')
  const [tickets, setTickets] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')

  const selectedTicket = tickets.find(t => t.id === selectedId) || null

  async function syncInbox() {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res = await fetch('/api/emails')
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const existingEmailIds = tickets.map(t => t.emailId).filter(Boolean)
      const newEmails = data.emails.filter(e => !existingEmailIds.includes(e.emailId))

      if (newEmails.length === 0) {
        setSyncMsg({ type: 'info', text: 'No new emails from your monitored domains.' })
      } else {
        const newTickets = newEmails.map(e => ({
          id: genId(),
          emailId: e.emailId,
          client: clientFromEmail(e.sender),
          email: e.sender,
          senderName: e.senderName,
          subject: e.subject,
          desc: e.preview,
          priority: priorityFromImportance(e.importance),
          status: 'open',
          created: new Date(e.receivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          comments: [],
          fromEmail: true,
          aiSolution: null,
        }))
        setTickets(prev => [...newTickets, ...prev])
        setSyncMsg({ type: 'success', text: `${newTickets.length} new ticket${newTickets.length !== 1 ? 's' : ''} imported from M365.` })
      }
    } catch (err) {
      setSyncMsg({ type: 'error', text: `Sync failed: ${err.message}` })
    }
    setSyncing(false)
    setTimeout(() => setSyncMsg(null), 5000)
  }

  function addTicket(ticket) {
    setTickets(prev => [{ ...ticket, id: genId() }, ...prev])
  }

  function updateTicket(id, changes) {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t))
  }

  function addComment(ticketId, comment) {
    setTickets(prev => prev.map(t =>
      t.id === ticketId ? { ...t, comments: [...t.comments, comment] } : t
    ))
  }

  const views = { dashboard: Dashboard, tickets: TicketList, clients: Clients, reports: Reports, settings: Settings }
  const ViewComponent = views[view] || Dashboard

  return (
    <div className="app">
      <Sidebar view={view} setView={setView} tickets={tickets} />
      <div className="main">
        <Topbar
          view={view}
          syncing={syncing}
          syncMsg={syncMsg}
          onSync={syncInbox}
          onNewTicket={() => setShowModal(true)}
        />
        <div className="content">
          <ViewComponent
            tickets={tickets}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            updateTicket={updateTicket}
          />
        </div>
      </div>

      {selectedTicket && (
        <TicketPanel
          ticket={selectedTicket}
          onClose={() => setSelectedId(null)}
          onUpdate={(changes) => updateTicket(selectedId, changes)}
          onComment={(comment) => addComment(selectedId, comment)}
        />
      )}

      {showModal && (
        <NewTicketModal
          onClose={() => setShowModal(false)}
          onSave={(t) => { addTicket(t); setShowModal(false) }}
        />
      )}
    </div>
  )
}
