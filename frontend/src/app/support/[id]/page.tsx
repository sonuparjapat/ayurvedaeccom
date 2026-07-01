'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Lock, RefreshCw } from 'lucide-react'
import api from '@/lib/axios'
import { useAuth } from '@/context/auth-context'
import { io, Socket } from 'socket.io-client'

type Message = {
  id: number
  sender_type: 'user' | 'admin'
  sender_name: string
  message: string
  created_at: string
}

type Ticket = {
  id: number
  subject: string
  status: string
  priority: string
  category: string
  created_at: string
  user_name: string
}

const statusColor: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { loginuserdata, setOpenauth } = useAuth() as any
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [closing, setClosing] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)

  const load = async () => {
    try {
      const r = await api.get(`/support/tickets/${id}`)
      setTicket(r.data.ticket)
      setMessages(r.data.messages)
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => {
    if (!loginuserdata) { setOpenauth(true); return }
    load()
  }, [id, loginuserdata])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!id) return
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket
    socket.emit('join_ticket', id)
    socket.on('new_message', (msg: Message) => {
      setMessages(prev => [...prev, msg])
    })
    return () => {
      socket.emit('leave_ticket', id)
      socket.disconnect()
    }
  }, [id])

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reply.trim()) return
    setSending(true)
    try {
      await api.post(`/support/tickets/${id}/reply`, { message: reply.trim() })
      setReply('')
    } catch { } finally { setSending(false) }
  }

  const closeTicket = async () => {
    if (!confirm('Close this ticket?')) return
    setClosing(true)
    try {
      await api.put(`/support/tickets/${id}/close`)
      setTicket(p => p ? { ...p, status: 'closed' } : p)
    } catch { } finally { setClosing(false) }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!ticket) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-gray-500">Ticket not found</p>
      <Link href="/support" className="text-green-600 text-sm hover:underline">Back to Support</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-start gap-3">
            <Link href="/support" className="p-2 rounded-full hover:bg-gray-100 mt-0.5">
              <ArrowLeft size={18} />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-gray-800 truncate">{ticket.subject}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[ticket.status]}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
                <span className="text-xs text-gray-400 capitalize">#{ticket.id} · {ticket.category}</span>
              </div>
            </div>
            {ticket.status !== 'closed' && (
              <button
                onClick={closeTicket}
                disabled={closing}
                className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <Lock size={12} />
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 space-y-4 overflow-y-auto">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-sm ${msg.sender_type === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div className={`rounded-2xl px-4 py-3 text-sm ${msg.sender_type === 'user' ? 'bg-green-600 text-white rounded-br-md' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-sm'}`}>
                {msg.message}
              </div>
              <span className="text-xs text-gray-400">
                {msg.sender_type === 'admin' ? (msg.sender_name || 'Support Team') : 'You'} · {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply Input */}
      <div className="bg-white border-t sticky bottom-0">
        <div className="max-w-3xl mx-auto px-4 py-3">
          {ticket.status === 'closed' ? (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-400">
              <Lock size={14} />
              This ticket is closed
            </div>
          ) : (
            <form onSubmit={sendReply} className="flex items-end gap-3">
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Type your reply..."
                rows={2}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(e) } }}
              />
              <button
                type="submit"
                disabled={sending || !reply.trim()}
                className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {sending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
