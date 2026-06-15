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

  // Load tickets from KV on mount
  useEffect(() => { loadTickets() }, [])

  async function loadTickets() {
    try {
      const res  = await fetch('/api/tickets')
      const data = await res.json()
      if (data.tickets) {
        setTickets(data.tickets)
        setLastSync(data.lastSync)
      }
    } catch (err) {
      console.error('Failed to load tickets:', err)
    }
  }

  async function handleSync() {
    setSyncing(true)
    setSyncMsg(null)
    try {
      // Trigger sync on local agent if running, otherwise just reload from KV
      try {
        await fetch('http://localhost:3001/api/sync', { signal: AbortSignal.timeout(2000) })
        await new Promise(r => setTimeout(r, 3000))
      } catch { /* agent not running, just reload KV */ }

      await loadTickets()
      setSyncMsg({ type: 'success', text: 'Tickets loaded from database.' })
    } catch (err) {
      setSyncMsg({ type: 'error', text: `Failed: ${err.message}` })
    }
    setSyncing(false)
    setTimeout(() => setSyncMsg(null), 5000)
  }

  async function updateTicket(id, changes) {
    // Optimistic update
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
    const newTicket = { ...ticket, id, comments: [], fromEmail: false, aiSolution: null }
    setTickets(prev => [newTicket, ...prev])
    // Save to KV
    fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTicket),
    }).catch(() => {})
  }

  function deleteTicket(id) {
    setTickets(prev => prev.filter(t => t.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const views = { dashboard: Dashboard, tickets: TicketList, clients: Clients, reports: Reports, settings: Settings }
  const ViewComponent = views[view] || Dashboard

  return (
    <div className="app">
      <Sidebar view={view} setView={setView} tickets={tickets} />
      <div className="main">
        <Topbar
          view={view} syncing={syncing} syncMsg={syncMsg} lastSync={lastSync}
          onSync={handleSync} onNewTicket={() => setShowModal(true)}
        />
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
        <NewTicketModal
          onClose={() => setShowModal(false)}
          onSave={(t) => { addTicket(t); setShowModal(false) }}
        />
      )}
    </div>
  )
}
