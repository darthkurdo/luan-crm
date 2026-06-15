import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Dashboard from './components/Dashboard'
import TicketList from './components/TicketList'
import Clients from './components/Clients'
import Reports from './components/Reports'
import Invoice from './components/Invoice'
import Settings from './components/Settings'
import TicketPanel from './components/TicketPanel'
import NewTicketModal from './components/NewTicketModal'
import './App.css'

export default function App() {
  const [view, setView]             = useState('dashboard')
  const [tickets, setTickets]       = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [showModal, setShowModal]   = useState(false)
  const [syncing, setSyncing]       = useState(false)
  const [syncMsg, setSyncMsg]       = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [lastSync, setLastSync]     = useState(null)

  const selectedTicket = tickets.find(t => t.id === selectedId) || null

  useEffect(() => { loadTickets() }, [])

  async function loadTickets() {
    try {
      const res  = await fetch('/api/tickets')
      const data = await res.json()
      if (data.tickets) { setTickets(data.tickets); setLastSync(data.lastSync) }
    } catch (err) { console.error('Failed to load tickets:', err) }
  }

  async function handleSync() {
    setSyncing(true)
    setSyncMsg(null)
    try {
      try { await fetch('http://localhost:3001/api/sync', { signal: AbortSignal.timeout(2000) }); await new Promise(r => setTimeout(r, 3000)) } catch {}
      await loadTickets()
      setSyncMsg({ type: 'success', text: 'Tickets loaded from database.' })
    } catch (err) { setSyncMsg({ type: 'error', text: `Failed: ${err.message}` }) }
    setSyncing(false)
    setTimeout(() => setSyncMsg(null), 5000)
  }

  async function updateTicket(id, changes) {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t))
    try {
      await fetch(`/api/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      })
    } catch (err) { console.error('Update failed:', err) }
  }

  function addComment(ticketId, comment) {
    const ticket = tickets.find(t => t.id === ticketId)
    if (!ticket) return
    const updated = { comments: [...ticket.comments, comment] }
    updateTicket(ticketId, updated)
  }

  function addTicket(ticket) {
    const id = `TKT-${String(tickets.length + 1).padStart(3, '0')}`
    setTickets(prev => [{ ...ticket, id, comments: [], fromEmail: false, aiSolution: null }, ...prev])
  }

  function deleteTicket(id) {
    setTickets(prev => prev.filter(t => t.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const VIEWS = { dashboard: Dashboard, tickets: TicketList, clients: Clients, reports: Reports, invoice: Invoice, settings: Settings }
  const ViewComponent = VIEWS[view] || Dashboard

  return (
    <div className="app">
      <Sidebar view={view} setView={setView} tickets={tickets} />
      <div className="main">
        <Topbar view={view} syncing={syncing} syncMsg={syncMsg} lastSync={lastSync} onSync={handleSync} onNewTicket={() => setShowModal(true)} />
        <div className="content">
          <ViewComponent
            tickets={tickets} selectedId={selectedId} setSelectedId={setSelectedId}
            filterStatus={filterStatus} setFilterStatus={setFilterStatus}
            updateTicket={updateTicket} deleteTicket={deleteTicket}
          />
        </div>
      </div>
      {selectedTicket && (
        <TicketPanel
          ticket={selectedTicket}
          onClose={() => setSelectedId(null)}
          onUpdate={(changes) => updateTicket(selectedId, changes)}
          onComment={(comment) => addComment(selectedId, comment)}
          onDelete={() => deleteTicket(selectedId)}
        />
      )}
      {showModal && (
        <NewTicketModal onClose={() => setShowModal(false)} onSave={(t) => { addTicket(t); setShowModal(false) }} />
      )}
    </div>
  )
}