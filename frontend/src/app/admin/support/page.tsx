'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { MessageSquare, Send, RefreshCw, ChevronDown, Search, Filter, Bell } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/axios'

type Ticket = {
  id: number
  subject: string
  category: string
  status: string
  priority: string
  user_name: string
  user_email: string
  created_at: string
  updated_at: string
  message_count: string
  assigned_name?: string
}

type Message = {
  id: number
  sender_type: 'user' | 'admin'
  sender_name: string
  message: string
  created_at: string
}

const statusOptions = ['open', 'in_progress', 'resolved', 'closed']
const priorityOptions = ['low', 'medium', 'high', 'urgent']
const categoryOptions = ['general', 'order', 'payment', 'return', 'product', 'other']

const statusColor: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
}

const priorityColor: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [ticketStatus, setTicketStatus] = useState('')
  const [ticketPriority, setTicketPriority] = useState('')
  const [notifCount, setNotifCount] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)

  const loadTickets = async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: 25 }
      if (filterStatus) params.status = filterStatus
      if (filterPriority) params.priority = filterPriority
      if (filterCategory) params.category = filterCategory
      if (search) params.search = search
      const r = await api.get('/support/admin/tickets', { params })
      setTickets(r.data.tickets)
      setTotal(r.data.total)
    } catch { } finally { setLoading(false) }
  }

  const loadTicketDetail = async (t: Ticket) => {
    setSelected(t)
    setTicketStatus(t.status)
    setTicketPriority(t.priority)
    try {
      const r = await api.get(`/support/admin/tickets/${t.id}`)
      setMessages(r.data.messages)
    } catch { }
  }

  useEffect(() => { loadTickets() }, [page, filterStatus, filterPriority, filterCategory])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Socket: admin room + selected ticket room
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket
    socket.emit('join_admin')
    socket.on('new_ticket', (data: any) => {
      toast.success(`New ticket from ${data.user_name}: "${data.subject}"`)
      setNotifCount(n => n + 1)
      loadTickets()
    })
    socket.on('ticket_reply', (data: any) => {
      setNotifCount(n => n + 1)
      loadTickets()
    })
    return () => { socket.disconnect() }
  }, [])

  // Join/leave ticket room when selected changes
  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return
    if (selected) {
      socket.emit('join_ticket', selected.id)
      socket.on('new_message', (msg: Message) => {
        setMessages(prev => [...prev, msg])
      })
    }
    return () => {
      if (selected) {
        socket.emit('leave_ticket', selected.id)
        socket.off('new_message')
      }
    }
  }, [selected?.id])

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reply.trim() || !selected) return
    setSending(true)
    try {
      const r = await api.post(`/support/admin/tickets/${selected.id}/reply`, { message: reply.trim() })
      setReply('')
      setMessages(prev => [...prev, r.data.message])
    } catch { toast.error('Failed to send') } finally { setSending(false) }
  }

  const updateTicket = async () => {
    if (!selected) return
    try {
      await api.put(`/support/admin/tickets/${selected.id}`, {
        status: ticketStatus,
        priority: ticketPriority,
      })
      toast.success('Ticket updated')
      setSelected(p => p ? { ...p, status: ticketStatus, priority: ticketPriority } : p)
      loadTickets()
    } catch { toast.error('Failed to update') }
  }

  return (
    <div className="flex h-[calc(100vh-64px)] gap-0 -m-6">
      {/* Ticket List Panel */}
      <div className="w-80 flex-shrink-0 bg-white border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <MessageSquare size={18} className="text-green-600" />
              Support Tickets
              {notifCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{notifCount}</span>
              )}
            </h2>
            <button onClick={loadTickets} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <RefreshCw size={14} className="text-gray-500" />
            </button>
          </div>
          {/* Search */}
          <div className="relative mb-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') loadTickets() }}
              placeholder="Search tickets..."
              className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          {/* Filters */}
          <div className="flex gap-1.5">
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
              className="flex-1 border border-gray-200 rounded-lg text-xs px-2 py-1.5 focus:outline-none"
            >
              <option value="">All Status</option>
              {statusOptions.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <select
              value={filterPriority}
              onChange={e => { setFilterPriority(e.target.value); setPage(1) }}
              className="flex-1 border border-gray-200 rounded-lg text-xs px-2 py-1.5 focus:outline-none"
            >
              <option value="">All Priority</option>
              {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Ticket List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <MessageSquare size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No tickets</p>
            </div>
          ) : (
            tickets.map(t => (
              <button
                key={t.id}
                onClick={() => loadTicketDetail(t)}
                className={`w-full text-left p-3 border-b hover:bg-gray-50 transition-colors ${selected?.id === t.id ? 'bg-green-50 border-l-4 border-l-green-600' : ''}`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColor[t.status]}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${priorityColor[t.priority]}`}>
                    {t.priority}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-800 truncate">{t.subject}</p>
                <p className="text-xs text-gray-500 truncate">{t.user_name} · {new Date(t.updated_at).toLocaleDateString()}</p>
              </button>
            ))
          )}
        </div>
        <div className="p-3 border-t text-xs text-gray-500 text-center">{total} total tickets</div>
      </div>

      {/* Detail / Chat Panel */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
            <MessageSquare size={48} className="opacity-20" />
            <p className="text-sm">Select a ticket to view and reply</p>
          </div>
        ) : (
          <>
            {/* Ticket Info Header */}
            <div className="bg-white border-b p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-800">{selected.subject}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    From: <strong>{selected.user_name}</strong> ({selected.user_email}) · #{selected.id}
                  </p>
                </div>
                {/* Quick Update */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={ticketStatus}
                    onChange={e => setTicketStatus(e.target.value)}
                    className="border border-gray-200 rounded-lg text-sm px-2 py-1.5 focus:outline-none"
                  >
                    {statusOptions.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                  <select
                    value={ticketPriority}
                    onChange={e => setTicketPriority(e.target.value)}
                    className="border border-gray-200 rounded-lg text-sm px-2 py-1.5 focus:outline-none"
                  >
                    {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <button
                    onClick={updateTicket}
                    className="bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-green-700"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-md ${msg.sender_type === 'admin' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div className={`rounded-2xl px-4 py-3 text-sm ${msg.sender_type === 'admin' ? 'bg-green-600 text-white rounded-br-md' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-sm'}`}>
                      {msg.message}
                    </div>
                    <span className="text-xs text-gray-400">
                      {msg.sender_type === 'user' ? msg.sender_name || 'User' : 'Support Team'} · {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Reply */}
            <div className="bg-white border-t p-4">
              {selected.status === 'closed' ? (
                <p className="text-sm text-gray-400 text-center py-1">This ticket is closed</p>
              ) : (
                <form onSubmit={sendReply} className="flex items-end gap-3">
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder="Type your response to the customer..."
                    rows={2}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(e) } }}
                  />
                  <button
                    type="submit"
                    disabled={sending || !reply.trim()}
                    className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50"
                  >
                    {sending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
