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

const STORAGE_KEY = 'luan_crm_tickets'
const COUNTER_KEY = 'luan_crm_counter'
const LOCAL_API   = 'http://localhost:3001'

function getNextId() {
  const n = parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10) + 1
  localStorage.setItem(COUNTER_KEY, String(n))
  return `TKT-${String(n).padStart(3, '0')}`
}

function loadTickets() {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : [] } catch { return [] }
}

function saveTickets(tickets) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets)) } catch {}
}

async function isLocalAgentRunning() {
  try {
    const res = await fetch(`${LOCAL_API}/api/tickets`, { signal: AbortSignal.timeout(2000) })
    return res.ok
  } catch { return false }
}

export default function App() {
  const [view, setView]               = useState('dashboard')
  const [tickets, setTickets]         = useState(() => loadTickets())
  const [selectedId, setSelectedId]   = useState(null)
  const [showModal, setShowModal]     = useState(false)
  const [syncing, setSyncing]         = useState(false)
  const [syncMsg, setSyncMsg]         = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [localMode, setLocalMode]     = useState(false)

  useEffect(() => { saveTickets(tickets) }, [tickets])

  // Check on load if local agent is running
  useEffect(() => {
    isLocalAgentRunning().then(running => {
      setLocalMode(running)
      if (running) syncFromLocal()
    })
  }, [])

  const selectedTicket = tickets.find(t => t.id === selectedId) || null

  // ── Sync from local agent ──────────────────────────────────────────────────
  async function syncFromLocal() {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res  = await fetch(`${LOCAL_API}/api/tickets`)
      const data = await res.json()
      if (!data.tickets) throw new Error('No tickets in response')
      // Merge: local agent is source of truth for fromEmail tickets
      setTickets(prev => {
        const manual = prev.filter(t => !t.fromEmail)
        const merged = [...data.tickets, ...manual]
        // Fix counter to avoid ID collisions
        const maxNum = Math.max(0, ...data.tickets.map(t => parseInt(t.id.replace('TKT-',''),10)||0))
        localStorage.setItem(COUNTER_KEY, String(maxNum))
        return merged
      })
      setSyncMsg({ type: 'success', text: `${data.tickets.length} tickets loaded from local agent.` })
    } catch (err) {
      setSyncMsg({ type: 'error', text: `Local sync failed: ${err.message}` })
    }
    setSyncing(false)
    setTimeout(() => setSyncMsg(null), 5000)
  }

  // ── Sync from Vercel API (M365 direct) ────────────────────────────────────
  async function syncFromVercel() {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res  = await fetch('/api/emails')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const existingConvIds = tickets.map(t => t.conversationId).filter(Boolean)
      const newThreads = (data.threads || []).filter(t => !existingConvIds.includes(t.conversationId))
      if (newThreads.length === 0) {
        setSyncMsg({ type: 'info', text: 'No new emails from your monitored domains.' })
      } else {
        const newTickets = newThreads.map(thread => ({
          id: getNextId(),
          conversationId: thread.conversationId,
          client: thread.client,
          email: thread.senderEmail,
          subject: thread.subject,
          priority: thread.importance === 'high' ? 'high' : 'medium',
          status: 'open',
          created: new Date(thread.latestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          messages: thread.messages,
          comments: [], fromEmail: true, aiSolution: null,
        }))
        setTickets(prev => [...newTickets, ...prev])
        setSyncMsg({ type: 'success', text: `${newTickets.length} new ticket${newTickets.length !== 1 ? 's' : ''} imported.` })
      }
    } catch (err) {
      setSyncMsg({ type: 'error', text: `Sync failed: ${err.message}` })
    }
    setSyncing(false)
    setTimeout(() => setSyncMsg(null), 6000)
  }

  async function handleSync() {
    const running = await isLocalAgentRunning()
    setLocalMode(running)
    if (running) {
      // Ask local agent to re-sync M365 then load
      await fetch(`${LOCAL_API}/api/sync`).catch(() => {})
      await new Promise(r => setTimeout(r, 2000)) // wait 2s for sync to start
      await syncFromLocal()
    } else {
      await syncFromVercel()
    }
  }

  function addTicket(ticket) {
    setTickets(prev => [{ ...ticket, id: getNextId() }, ...prev])
  }

  function updateTicket(id, changes) {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t))
    // If local agent running, persist change there too
    if (localMode) {
      fetch(`${LOCAL_API}/api/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      }).catch(() => {})
    }
  }

  function addComment(ticketId, comment) {
    setTickets(prev => prev.map(t =>
      t.id === ticketId ? { ...t, comments: [...t.comments, comment] } : t
    ))
    if (localMode) {
      const ticket = tickets.find(t => t.id === ticketId)
      if (ticket) {
        const updated = { comments: [...ticket.comments, comment] }
        fetch(`${LOCAL_API}/api/tickets/${ticketId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        }).catch(() => {})
      }
    }
  }

  function deleteTicket(id) {
    setTickets(prev => prev.filter(t => t.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const views = { dashboard: Dashboard, tickets: TicketList, clients: Clients, reports: Reports, settings: Settings }
  const ViewComponent = views[view] || Dashboard

  return (
    <div className="app">
      <Sidebar view={view} setView={setView} tickets={tickets} localMode={localMode} />
      <div className="main">
        <Topbar
          view={view} syncing={syncing} syncMsg={syncMsg}
          onSync={handleSync} onNewTicket={() => setShowModal(true)}
          localMode={localMode}
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
