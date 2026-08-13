'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import axios from '@/lib/axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell, Package, MessageSquare, Megaphone, CheckCheck,
  Ticket, Filter, ChevronDown, ChevronLeft, ChevronRight, X, Circle, CircleCheck,
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { LeafLoader } from '@/components/ui/leaf-loader'

const TYPE_META: Record<string, { icon: React.ReactNode; bg: string; text: string; label: string; dot: string }> = {
  order_update:  { icon: <Package size={15} />,      bg: '#ecfdf5', text: '#065f46', label: 'Order',        dot: '#10b981' },
  support_reply: { icon: <MessageSquare size={15} />, bg: '#f5f3ff', text: '#5b21b6', label: 'Support',      dot: '#7c3aed' },
  ticket_status: { icon: <Ticket size={15} />,       bg: '#fffbeb', text: '#92400e', label: 'Ticket',       dot: '#f59e0b' },
  broadcast:     { icon: <Megaphone size={15} />,    bg: '#fef9ec', text: '#92400e', label: 'Announcement',  dot: '#c9a84c' },
}

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'order_update', label: 'Orders' },
  { value: 'support_reply', label: 'Support' },
  { value: 'ticket_status', label: 'Tickets' },
  { value: 'broadcast', label: 'Announcements' },
]

const READ_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'false', label: 'Unread only' },
  { value: 'true', label: 'Read only' },
]

function fmtDate(d: string) {
  const date = new Date(d)
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  if (diffH < 48) return 'Yesterday'
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtGroupDate(d: string) {
  const date = new Date(d)
  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
}

function NotifCard({ n, onRead }: { n: any; onRead?: (id: number) => void }) {
  const meta = TYPE_META[n.type] || TYPE_META.broadcast
  const href = n.data?.order_id ? `/orders/${n.data.order_id}` : n.data?.ticket_id ? `/support/${n.data.ticket_id}` : null
  const isUnread = n.is_read === false

  const handleClick = () => { if (isUnread && n.id) onRead?.(n.id) }

  const inner = (
    <div onClick={handleClick} style={{
      display: 'flex', gap: 14, padding: '14px 18px', borderRadius: 18,
      background: isUnread ? 'rgba(16,185,129,0.04)' : '#fff',
      border: isUnread ? '1px solid rgba(16,185,129,0.18)' : '1px solid #f0f0e8',
      borderLeft: `4px solid ${isUnread ? meta.dot : '#e5e7eb'}`,
      boxShadow: isUnread ? '0 2px 12px rgba(16,185,129,0.06)' : '0 1px 6px rgba(26,58,42,0.04)',
      cursor: 'pointer', transition: 'all 0.18s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(26,58,42,0.09)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = isUnread ? '0 2px 12px rgba(16,185,129,0.06)' : '0 1px 6px rgba(26,58,42,0.04)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
    >
      {/* Icon */}
      <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: meta.bg, color: meta.text }}>
        {meta.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 13, fontWeight: isUnread ? 700 : 600, color: isUnread ? '#0f2d1e' : '#374151', margin: 0, lineHeight: 1.3 }}>{n.title}</p>
            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', background: meta.bg, color: meta.text }}>
              {meta.label}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {isUnread && <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.dot, flexShrink: 0 }} />}
            <span style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>{fmtDate(n.created_at)}</span>
          </div>
        </div>
        {n.body && <p style={{ fontSize: 12, color: isUnread ? '#6b7280' : '#9ca3af', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.body}</p>}
      </div>
    </div>
  )

  return href ? <Link href={href} style={{ display: 'block', textDecoration: 'none' }}>{inner}</Link> : inner
}

function FilterBar({ typeFilter, setTypeFilter, readFilter, setReadFilter, dateFrom, setDateFrom, dateTo, setDateTo, onClear, activeCount }: {
  typeFilter: string; setTypeFilter: (v: string) => void
  readFilter: string; setReadFilter: (v: string) => void
  dateFrom: string; setDateFrom: (v: string) => void
  dateTo: string; setDateTo: (v: string) => void
  onClear: () => void; activeCount: number
}) {
  const [open, setOpen] = useState(false)

  const selectStyle = { width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '8px 12px', fontSize: 12, outline: 'none', background: '#fafafa', color: '#374151' } as const

  return (
    <div style={{ background: '#fff', border: '1px solid #e8f5ee', borderRadius: 18, boxShadow: '0 1px 8px rgba(26,58,42,0.04)' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={14} color="#9ca3af" />
          Filters
          {activeCount > 0 && (
            <span style={{ background: '#10b981', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99 }}>{activeCount} active</span>
          )}
        </span>
        <ChevronDown size={14} color="#9ca3af" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div style={{ borderTop: '1px solid #f0f0e8', padding: '16px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Type</label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={selectStyle}>
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Status</label>
            <select value={readFilter} onChange={e => setReadFilter(e.target.value)} style={selectStyle}>
              {READ_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} max={dateTo || undefined} style={selectStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} min={dateFrom || undefined} style={selectStyle} />
          </div>
          {activeCount > 0 && (
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={onClear} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={12} /> Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function NotificationsPage() {
  const { loginuserdata } = useAuth()
  const router = useRouter()

  const [notifications, setNotifications] = useState<any[]>([])
  const [broadcasts, setBroadcasts] = useState<any[]>([])
  const [pagination, setPagination] = useState<any>({ page: 1, total: 0, total_pages: 1, has_next: false, has_prev: false })
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)
  const [tab, setTab] = useState<'all' | 'announcements'>('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [readFilter, setReadFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const socketRef = useRef<Socket | null>(null)

  const activeFilterCount = [typeFilter !== 'all', readFilter !== 'all', !!dateFrom, !!dateTo].filter(Boolean).length
  const clearFilters = () => { setTypeFilter('all'); setReadFilter('all'); setDateFrom(''); setDateTo(''); setPage(1) }

  const loadData = useCallback(async (p = page) => {
    setLoading(true)
    try {
      if (tab === 'announcements') {
        const r = await axios.get('/notifications', { params: { page: 1, limit: 20 } })
        setBroadcasts(r.data.broadcasts || [])
        setUnreadCount(r.data.unread_count || 0)
        setLoading(false)
        return
      }
      const params: any = { page: p, limit: 20 }
      if (typeFilter !== 'all') params.type = typeFilter
      if (readFilter !== 'all') params.is_read = readFilter
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      const r = await axios.get('/notifications', { params })
      setNotifications(r.data.notifications || [])
      setBroadcasts(r.data.broadcasts || [])
      setPagination(r.data.pagination || { page: 1, total: 0, total_pages: 1, has_next: false, has_prev: false })
      setUnreadCount(r.data.unread_count || 0)
    } catch { }
    finally { setLoading(false) }
  }, [page, tab, typeFilter, readFilter, dateFrom, dateTo])

  useEffect(() => {
    if (!loginuserdata?.id) { router.push('/auth?redirect=/notifications'); return }
    loadData(page)
  }, [loginuserdata?.id, page, tab, typeFilter, readFilter, dateFrom, dateTo])

  useEffect(() => { setPage(1) }, [tab, typeFilter, readFilter, dateFrom, dateTo])

  useEffect(() => {
    if (!loginuserdata?.id) return
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', { transports: ['websocket', 'polling'] })
    socketRef.current = socket
    socket.on('connect', () => socket.emit('join_user', loginuserdata.id))
    socket.on('new_notification', (notif: any) => { setNotifications(prev => [notif, ...prev]); setUnreadCount(c => c + 1) })
    socket.on('new_broadcast', (b: any) => { setBroadcasts(prev => [b, ...prev]) })
    return () => { socket.disconnect() }
  }, [loginuserdata?.id])

  const markAllRead = async () => {
    try {
      setMarkingAll(true)
      await axios.put('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch { }
    finally { setMarkingAll(false) }
  }

  const markOneRead = async (id: number) => {
    try {
      await axios.put(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(c => Math.max(0, c - 1))
    } catch { }
  }

  const displayItems = tab === 'announcements'
    ? broadcasts.map(b => ({ ...b, type: 'broadcast', is_read: true, _kind: 'broadcast' }))
    : notifications.map(n => ({ ...n, _kind: 'personal' }))

  const grouped = displayItems.reduce((acc: Record<string, any[]>, n) => {
    const key = fmtGroupDate(n.created_at)
    if (!acc[key]) acc[key] = []
    acc[key].push(n)
    return acc
  }, {})

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f7f4eb' }}>
      <Header />

      {/* Hero bar */}
      <div style={{ background: 'linear-gradient(135deg, #0f2d1e 0%, #1a3a2a 55%, #1d3f2e 100%)', padding: '36px 16px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <Bell size={20} color="#10b981" />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: -6, right: -6, background: '#c9a84c', color: '#fff', fontSize: 9, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0f2d1e', padding: '0 4px' }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>Notifications</h1>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>Order updates, support replies & announcements</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} disabled={markingAll} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 12,
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: markingAll ? 0.7 : 1,
            }}>
              <CheckCheck size={14} />
              {markingAll ? 'Marking…' : 'Mark all read'}
            </button>
          )}
        </div>
      </div>

      <main style={{ flex: 1, maxWidth: 720, width: '100%', margin: '0 auto', padding: '24px 16px 48px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#fff', border: '1px solid #e8f5ee', borderRadius: 16, padding: 4, marginBottom: 16, boxShadow: '0 1px 6px rgba(26,58,42,0.05)' }}>
          {[
            { key: 'all', label: `Activity${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
            { key: 'announcements', label: 'Announcements' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)} style={{
              flex: 1, padding: '10px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.18s',
              background: tab === t.key ? 'linear-gradient(135deg, #1a3a2a, #2d5a3d)' : 'transparent',
              color: tab === t.key ? '#fff' : '#9ca3af',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        {tab === 'all' && (
          <div style={{ marginBottom: 14 }}>
            <FilterBar
              typeFilter={typeFilter} setTypeFilter={setTypeFilter}
              readFilter={readFilter} setReadFilter={setReadFilter}
              dateFrom={dateFrom} setDateFrom={setDateFrom}
              dateTo={dateTo} setDateTo={setDateTo}
              onClear={clearFilters} activeCount={activeFilterCount}
            />
          </div>
        )}

        {/* Quick chips */}
        {tab === 'all' && !loading && notifications.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { v: 'all', label: 'All', icon: null },
              { v: 'false', label: 'Unread', icon: <Circle size={10} /> },
              { v: 'true', label: 'Read', icon: <CircleCheck size={10} /> },
            ].map(c => (
              <button key={c.v} onClick={() => { setReadFilter(c.v); setPage(1) }} style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, border: '1.5px solid', cursor: 'pointer',
                background: readFilter === c.v ? 'linear-gradient(135deg, #1a3a2a, #2d5a3d)' : '#fff',
                borderColor: readFilter === c.v ? 'transparent' : '#e5e7eb',
                color: readFilter === c.v ? '#fff' : '#6b7280',
              }}>
                {c.icon} {c.label}
              </button>
            ))}
            <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>{pagination.total} notification{pagination.total !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <LeafLoader size={48} text="Loading notifications…" />
          </div>
        ) : displayItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', background: '#fff', borderRadius: 24, border: '1px solid #f0f0e8', boxShadow: '0 2px 12px rgba(26,58,42,0.04)' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, #e8f5ee, #d1fae5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              {tab === 'announcements' ? <Megaphone size={30} color="#10b981" /> : <Bell size={30} color="#10b981" />}
            </div>
            <p style={{ fontWeight: 700, fontSize: 15, color: '#1a2e1e', marginBottom: 6 }}>No notifications</p>
            <p style={{ fontSize: 13, color: '#9ca3af', maxWidth: 280, margin: '0 auto 16px' }}>
              {activeFilterCount > 0 ? 'Try clearing filters to see more' : tab === 'announcements' ? 'Admin announcements will appear here' : 'Order updates and replies will appear here'}
            </p>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} style={{ fontSize: 12, fontWeight: 700, color: '#10b981', background: 'none', border: 'none', cursor: 'pointer' }}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {Object.entries(grouped).map(([dateLabel, items]) => (
              <div key={dateLabel}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{dateLabel}</span>
                  <div style={{ flex: 1, height: 1, background: '#e8f5ee' }} />
                  <span style={{ fontSize: 10, color: '#c3d9c7' }}>{items.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map((n: any, i: number) => (
                    <NotifCard key={n._kind === 'personal' ? n.id : `bcast-${i}`} n={n} onRead={n._kind === 'personal' ? markOneRead : undefined} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {tab === 'all' && !loading && pagination.total_pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!pagination.has_prev} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 12,
              background: '#fff', border: '1px solid #e5e7eb', fontSize: 12, fontWeight: 700,
              color: pagination.has_prev ? '#374151' : '#d1d5db', cursor: pagination.has_prev ? 'pointer' : 'not-allowed',
            }}>
              <ChevronLeft size={14} /> Previous
            </button>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                const p = pagination.total_pages <= 5 ? i + 1
                  : pagination.page <= 3 ? i + 1
                  : pagination.page >= pagination.total_pages - 2 ? pagination.total_pages - 4 + i
                  : pagination.page - 2 + i
                return (
                  <button key={p} onClick={() => setPage(p)} style={{
                    width: 36, height: 36, borderRadius: 10, fontSize: 13, fontWeight: 700, border: '1px solid', cursor: 'pointer',
                    background: p === pagination.page ? 'linear-gradient(135deg, #1a3a2a, #2d5a3d)' : '#fff',
                    borderColor: p === pagination.page ? 'transparent' : '#e5e7eb',
                    color: p === pagination.page ? '#fff' : '#6b7280',
                  }}>{p}</button>
                )
              })}
            </div>
            <button onClick={() => setPage(p => p + 1)} disabled={!pagination.has_next} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 12,
              background: '#fff', border: '1px solid #e5e7eb', fontSize: 12, fontWeight: 700,
              color: pagination.has_next ? '#374151' : '#d1d5db', cursor: pagination.has_next ? 'pointer' : 'not-allowed',
            }}>
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}

        {tab === 'all' && !loading && pagination.total > 0 && (
          <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 14 }}>
            Page {pagination.page} of {pagination.total_pages} · {pagination.total} total
          </p>
        )}
      </main>

      <Footer />
    </div>
  )
}
