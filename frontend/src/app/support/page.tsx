'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import Link from 'next/link'
import { MessageSquare, Plus, ChevronRight, Clock, CheckCircle, AlertCircle, XCircle, Headphones, Shield, Zap, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/axios'
import { useAuth } from '@/context/auth-context'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

type Ticket = {
  id: number; subject: string; category: string; status: string
  priority: string; created_at: string; updated_at: string; message_count: string
}

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string; border: string; dot: string }> = {
  open:        { label: 'Open',        icon: <AlertCircle size={12} />, bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', dot: '#3b82f6' },
  in_progress: { label: 'In Progress', icon: <Clock size={12} />,        bg: '#fffbeb', text: '#b45309', border: '#fde68a', dot: '#f59e0b' },
  resolved:    { label: 'Resolved',    icon: <CheckCircle size={12} />,  bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0', dot: '#10b981' },
  closed:      { label: 'Closed',      icon: <XCircle size={12} />,      bg: '#f9fafb', text: '#6b7280', border: '#e5e7eb', dot: '#9ca3af' },
}

const PRIORITY_META: Record<string, { bg: string; text: string }> = {
  low:    { bg: '#f9fafb', text: '#6b7280' },
  medium: { bg: '#eff6ff', text: '#1d4ed8' },
  high:   { bg: '#fff7ed', text: '#c2410c' },
  urgent: { bg: '#fef2f2', text: '#b91c1c' },
}

const CATEGORIES = ['general', 'order', 'payment', 'return', 'product', 'other']
const FILTERS = ['', 'open', 'in_progress', 'resolved', 'closed']

export default function SupportPage() {
  const router = useRouter()
  const { loginuserdata, loading: authLoading, setOpenauth } = useAuth() as any
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const socketRef = useRef<Socket | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ subject: '', category: 'general', priority: 'medium', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (filterStatus) params.status = filterStatus
      const r = await api.get('/support/tickets', { params })
      setTickets(r.data.tickets)
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => {
    if (authLoading) return
    if (!loginuserdata) { setOpenauth(true); return }
    load()
  }, [loginuserdata, authLoading, filterStatus])

  // Real-time: update ticket list when admin replies or changes status
  useEffect(() => {
    if (!loginuserdata?.id) return
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket
    socket.emit('join_user', loginuserdata.id)
    socket.on('admin_replied', () => { load() })
    socket.on('ticket_status_updated', (data: any) => {
      setTickets(prev => prev.map(t =>
        t.id === data.ticket_id ? { ...t, status: data.status } : t
      ))
    })
    return () => { socket.disconnect() }
  }, [loginuserdata?.id])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.subject.trim() || !form.message.trim()) return
    setSubmitting(true)
    try {
      const r = await api.post('/support/tickets', form)
      setShowForm(false)
      setForm({ subject: '', category: 'general', priority: 'medium', message: '' })
      router.push(`/support/${r.data.ticket.id}`)
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create ticket. Please try again.'
      alert(msg)
    } finally { setSubmitting(false) }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f7f4eb' }}>
      <Header />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0f2d1e 0%, #1a3a2a 55%, #1d3f2e 100%)', padding: '52px 16px 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 99, padding: '5px 14px', marginBottom: 16 }}>
            <Headphones size={13} color="#c9a84c" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#c9a84c', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Customer Support</span>
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 5vw, 38px)', fontWeight: 800, color: '#fff', margin: '0 0 10px', lineHeight: 1.15 }}>
            How can we <span style={{ color: '#c9a84c' }}>help you?</span>
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 28 }}>Raise a ticket and our team will respond within 24 hours</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
            {[
              { icon: <Zap size={14} />, text: 'Fast Response' },
              { icon: <Shield size={14} />, text: 'Secure & Private' },
              { icon: <CheckCircle size={14} />, text: '24h Resolution' },
            ].map(b => (
              <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
                <span style={{ color: '#10b981' }}>{b.icon}</span>{b.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main style={{ flex: 1, maxWidth: 760, width: '100%', margin: '0 auto', padding: '28px 16px 48px' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FILTERS.map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{
                padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s', border: '1px solid',
                background: filterStatus === s ? 'linear-gradient(135deg, #1a3a2a, #2d5a3d)' : '#fff',
                borderColor: filterStatus === s ? 'transparent' : '#e5e7eb',
                color: filterStatus === s ? '#fff' : '#6b7280',
              }}>
                {s === '' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            ))}
          </div>
          <button onClick={() => setShowForm(v => !v)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 12,
            background: showForm ? '#e5e7eb' : 'linear-gradient(135deg, #1a3a2a, #2d5a3d)',
            color: showForm ? '#374151' : '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
          }}>
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? 'Cancel' : 'New Ticket'}
          </button>
        </div>

        {/* New Ticket Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{ background: '#fff', borderRadius: 20, border: '1px solid #e5e7eb', padding: '24px', marginBottom: 20, boxShadow: '0 4px 24px rgba(26,58,42,0.06)' }}
            >
              <h2 style={{ fontWeight: 700, fontSize: 15, color: '#1a2e1e', marginBottom: 18 }}>Create New Support Ticket</h2>
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Subject</label>
                  <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                    placeholder="Brief description of your issue"
                    style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '9px 13px', fontSize: 13, color: '#1a2e1e', outline: 'none', boxSizing: 'border-box' }}
                    required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Category</label>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '9px 13px', fontSize: 13, color: '#1a2e1e', background: '#fff', outline: 'none' }}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Priority</label>
                    <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                      style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '9px 13px', fontSize: 13, color: '#1a2e1e', background: '#fff', outline: 'none' }}>
                      {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Message</label>
                  <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    placeholder="Describe your issue in detail..." rows={4}
                    style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '9px 13px', fontSize: 13, color: '#1a2e1e', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
                    required />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" disabled={submitting}
                    style={{ background: 'linear-gradient(135deg, #1a3a2a, #2d5a3d)', color: '#fff', padding: '10px 22px', borderRadius: 12, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>
                    {submitting ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    style={{ background: '#f9fafb', color: '#374151', padding: '10px 22px', borderRadius: 12, fontSize: 13, fontWeight: 600, border: '1px solid #e5e7eb', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ticket list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => <div key={i} style={{ height: 88, background: '#fff', borderRadius: 18, animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, #e8f5ee, #d1fae5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MessageSquare size={32} color="#10b981" />
            </div>
            <p style={{ fontWeight: 600, fontSize: 15, color: '#374151', marginBottom: 6 }}>No tickets yet</p>
            <p style={{ fontSize: 13 }}>Need help? Click <strong>New Ticket</strong> to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tickets.map((t, i) => {
              const sm = STATUS_META[t.status] || STATUS_META.closed
              const pm = PRIORITY_META[t.priority] || PRIORITY_META.medium
              return (
                <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link href={`/support/${t.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: '#fff', borderRadius: 18, border: '1px solid #f3f4f6', padding: '16px 18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
                      transition: 'box-shadow 0.2s, border-color 0.2s', cursor: 'pointer',
                      borderLeft: `4px solid ${sm.dot}`,
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(26,58,42,0.09)'; (e.currentTarget as HTMLElement).style.borderColor = '#d9eedf' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.borderColor = '#f3f4f6' }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: sm.bg, color: sm.text, border: `1px solid ${sm.border}` }}>
                            {sm.icon} {sm.label}
                          </span>
                          <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: pm.bg, color: pm.text }}>
                            {t.priority}
                          </span>
                          <span style={{ fontSize: 11, color: '#9ca3af', textTransform: 'capitalize' }}>{t.category}</span>
                        </div>
                        <p style={{ fontWeight: 600, fontSize: 14, color: '#1a2e1e', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</p>
                        <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
                          {Number(t.message_count)} message{Number(t.message_count) !== 1 ? 's' : ''} · Updated {new Date(t.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                      <ChevronRight size={18} color="#9ca3af" style={{ flexShrink: 0 }} />
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
