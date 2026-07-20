'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Lock, RefreshCw, MessageSquare } from 'lucide-react'
import api from '@/lib/axios'
import { useAuth } from '@/context/auth-context'
import { io, Socket } from 'socket.io-client'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { LeafLoader } from '@/components/ui/leaf-loader'

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

const STATUS_META: Record<string, { bg: string; text: string; border: string }> = {
  open:        { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  in_progress: { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  resolved:    { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
  closed:      { bg: '#f9fafb', text: '#6b7280', border: '#e5e7eb' },
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { loginuserdata, loading: authLoading, setOpenauth } = useAuth() as any
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
    if (authLoading) return
    if (!loginuserdata) { setOpenauth(true); return }
    load()
  }, [id, loginuserdata, authLoading])

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
    <div className="min-h-screen flex flex-col" style={{ background: '#f7f4eb' }}>
      <Header />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LeafLoader size={52} text="Loading ticket…" />
      </div>
      <Footer />
    </div>
  )

  if (!ticket) return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f7f4eb' }}>
      <Header />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #e8f5ee, #d1fae5)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
          <MessageSquare size={28} color="#10b981" />
        </div>
        <p style={{ color: '#374151', fontWeight: 600 }}>Ticket not found</p>
        <Link href="/support" style={{ color: '#10b981', fontSize: 13, fontWeight: 600 }}>← Back to Support</Link>
      </div>
      <Footer />
    </div>
  )

  const sm = STATUS_META[ticket.status] || STATUS_META.closed

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f7f4eb' }}>
      <Header />

      {/* Ticket sub-header */}
      <div style={{ background: 'linear-gradient(135deg, #0f2d1e 0%, #1a3a2a 100%)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 16px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/support" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.1)', color: '#fff', flexShrink: 0 }}>
            <ArrowLeft size={16} />
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontWeight: 700, fontSize: 14, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.subject}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: sm.bg, color: sm.text, border: `1px solid ${sm.border}` }}>
                {ticket.status.replace('_', ' ')}
              </span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'capitalize' }}>#{ticket.id} · {ticket.category}</span>
            </div>
          </div>
          {ticket.status !== 'closed' && (
            <button onClick={closeTicket} disabled={closing} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              opacity: closing ? 0.6 : 1,
            }}>
              <Lock size={11} />
              Close
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, maxWidth: 720, width: '100%', margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender_type === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: msg.sender_type === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                borderRadius: msg.sender_type === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                padding: '10px 14px', fontSize: 13, lineHeight: 1.55,
                background: msg.sender_type === 'user' ? 'linear-gradient(135deg, #1a3a2a, #2d5a3d)' : '#fff',
                color: msg.sender_type === 'user' ? '#fff' : '#1a2e1e',
                border: msg.sender_type === 'admin' ? '1px solid #e8f5ee' : 'none',
                boxShadow: '0 1px 8px rgba(26,58,42,0.07)',
              }}>
                {msg.message}
              </div>
              <span style={{ fontSize: 10, color: '#9ca3af' }}>
                {msg.sender_type === 'admin' ? (msg.sender_name || 'Support Team') : 'You'} · {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
            <MessageSquare size={32} style={{ margin: '0 auto 10px', display: 'block', color: '#d1fae5' }} />
            <p style={{ fontSize: 13 }}>No messages yet. Send a message to start the conversation.</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply box */}
      <div style={{ background: '#fff', borderTop: '1px solid #e8f5ee', padding: '12px 16px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {ticket.status === 'closed' ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 0', fontSize: 13, color: '#9ca3af' }}>
              <Lock size={13} />
              This ticket is closed
            </div>
          ) : (
            <form onSubmit={sendReply} style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Type your reply…" rows={2}
                style={{ flex: 1, border: '1.5px solid #e8f5ee', borderRadius: 14, padding: '9px 13px', fontSize: 13, color: '#1a2e1e', resize: 'none', outline: 'none', fontFamily: 'inherit', background: '#f9fffe' }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(e as any) } }}
              />
              <button type="submit" disabled={sending || !reply.trim()} style={{
                width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #1a3a2a, #2d5a3d)', border: 'none', cursor: 'pointer', flexShrink: 0,
                opacity: (sending || !reply.trim()) ? 0.5 : 1, color: '#fff',
              }}>
                {sending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
