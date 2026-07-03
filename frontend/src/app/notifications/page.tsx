'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import axios from '@/lib/axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell, Package, MessageSquare, Megaphone, CheckCheck,
  Ticket, Filter, ChevronDown, ChevronLeft, ChevronRight,
  Search, X, Circle, CircleCheck,
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

/* ─── Type metadata ─── */
const TYPE_META: Record<string, { icon: React.ReactNode; pill: string; label: string; dot: string }> = {
  order_update:  { icon: <Package size={15} />,      pill: 'bg-blue-100 text-blue-700',    label: 'Order',        dot: 'bg-blue-500' },
  support_reply: { icon: <MessageSquare size={15} />, pill: 'bg-violet-100 text-violet-700', label: 'Support',      dot: 'bg-violet-500' },
  ticket_status: { icon: <Ticket size={15} />,       pill: 'bg-amber-100 text-amber-700',  label: 'Ticket',       dot: 'bg-amber-500' },
  broadcast:     { icon: <Megaphone size={15} />,    pill: 'bg-emerald-100 text-emerald-700', label: 'Announcement', dot: 'bg-emerald-500' },
}

const TYPE_OPTIONS = [
  { value: 'all',          label: 'All Types' },
  { value: 'order_update', label: 'Orders' },
  { value: 'support_reply',label: 'Support' },
  { value: 'ticket_status',label: 'Tickets' },
  { value: 'broadcast',    label: 'Announcements' },
]

const READ_OPTIONS = [
  { value: 'all',   label: 'All' },
  { value: 'false', label: 'Unread only' },
  { value: 'true',  label: 'Read only' },
]

function fmtDate(d: string) {
  const date = new Date(d)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
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

/* ─── Notification card ─── */
function NotifCard({ n, onRead }: { n: any; onRead?: (id: number) => void }) {
  const meta = TYPE_META[n.type] || TYPE_META.broadcast
  const href = n.data?.order_id ? `/orders/${n.data.order_id}` : n.data?.ticket_id ? `/support/${n.data.ticket_id}` : null
  const isUnread = n.is_read === false

  const handleClick = () => {
    if (isUnread && n.id) onRead?.(n.id)
  }

  const inner = (
    <div
      onClick={handleClick}
      className={`group flex gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer
        ${isUnread
          ? 'bg-blue-50/70 border-blue-100 hover:bg-blue-50 border-l-4 border-l-blue-400'
          : 'bg-white border-gray-100 hover:bg-gray-50/80'
        }`}
    >
      {/* Icon */}
      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${meta.pill}`}>
        {meta.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-semibold leading-snug ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
              {n.title}
            </p>
            <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${meta.pill}`}>
              {meta.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            {isUnread && <span className={`w-2 h-2 rounded-full ${meta.dot}`} />}
            <span className="text-[11px] text-gray-400 whitespace-nowrap">{fmtDate(n.created_at)}</span>
          </div>
        </div>
        {n.body && (
          <p className={`text-xs mt-1 line-clamp-2 ${isUnread ? 'text-gray-600' : 'text-gray-400'}`}>{n.body}</p>
        )}
      </div>
    </div>
  )

  return href ? <Link href={href} className="block">{inner}</Link> : inner
}

/* ─── Filter bar ─── */
function FilterBar({
  typeFilter, setTypeFilter,
  readFilter, setReadFilter,
  dateFrom, setDateFrom,
  dateTo, setDateTo,
  onClear,
  activeCount,
}: {
  typeFilter: string; setTypeFilter: (v: string) => void
  readFilter: string; setReadFilter: (v: string) => void
  dateFrom: string; setDateFrom: (v: string) => void
  dateTo: string; setDateTo: (v: string) => void
  onClear: () => void
  activeCount: number
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
      {/* Toggle row */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700"
      >
        <span className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          Filters
          {activeCount > 0 && (
            <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {activeCount} active
            </span>
          )}
        </span>
        <ChevronDown size={15} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Type */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Type</label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
            >
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Read status */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
            <select
              value={readFilter}
              onChange={e => setReadFilter(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
            >
              {READ_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* From date */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">From date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              max={dateTo || undefined}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
            />
          </div>

          {/* To date */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">To date</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              min={dateFrom || undefined}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
            />
          </div>

          {activeCount > 0 && (
            <div className="col-span-2 md:col-span-4 flex justify-end">
              <button
                onClick={onClear}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 transition"
              >
                <X size={13} /> Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Main Page ─── */
export default function NotificationsPage() {
  const { loginuserdata } = useAuth()
  const router = useRouter()

  // Data
  const [notifications, setNotifications] = useState<any[]>([])
  const [broadcasts, setBroadcasts] = useState<any[]>([])
  const [pagination, setPagination] = useState<any>({ page: 1, total: 0, total_pages: 1, has_next: false, has_prev: false })
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  // Tabs & filters
  const [tab, setTab] = useState<'all' | 'announcements'>('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [readFilter, setReadFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  const socketRef = useRef<Socket | null>(null)

  const activeFilterCount = [
    typeFilter !== 'all' ? 1 : 0,
    readFilter !== 'all' ? 1 : 0,
    dateFrom ? 1 : 0,
    dateTo ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  const clearFilters = () => {
    setTypeFilter('all'); setReadFilter('all'); setDateFrom(''); setDateTo(''); setPage(1)
  }

  const loadData = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const params: any = { page: p, limit: 20 }
      if (tab === 'announcements') {
        // Announcements tab always shows broadcasts only
        setBroadcasts([])
        setNotifications([])
        setPagination({ page: 1, total: 0, total_pages: 1, has_next: false, has_prev: false })
        setLoading(false)
        return
      }
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

  // Load broadcasts separately for the announcements tab
  const loadBroadcasts = useCallback(async () => {
    try {
      const r = await axios.get('/notifications', { params: { page: 1, limit: 20 } })
      setBroadcasts(r.data.broadcasts || [])
      setUnreadCount(r.data.unread_count || 0)
    } catch { }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (!loginuserdata?.id) { router.push('/'); return }
    if (tab === 'announcements') {
      setLoading(true)
      loadBroadcasts()
    } else {
      loadData(page)
    }
  }, [loginuserdata?.id, page, tab, typeFilter, readFilter, dateFrom, dateTo])

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [tab, typeFilter, readFilter, dateFrom, dateTo])

  // WebSocket — real-time new notifications
  useEffect(() => {
    if (!loginuserdata?.id) return
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket
    socket.on('connect', () => socket.emit('join_user', loginuserdata.id))
    socket.on('new_notification', (notif: any) => {
      setNotifications(prev => [notif, ...prev])
      setUnreadCount(c => c + 1)
    })
    socket.on('new_broadcast', (b: any) => {
      setBroadcasts(prev => [b, ...prev])
    })
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

  // Group by date for the list view
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
    <div className="min-h-screen flex flex-col bg-[#f5f6fb]">
      <Header />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bell size={22} className="text-blue-500" />
              Notifications
              {unreadCount > 0 && (
                <span className="text-xs bg-blue-500 text-white px-2.5 py-0.5 rounded-full font-bold">{unreadCount} new</span>
              )}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">Order updates, support replies and store announcements</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 transition bg-white border border-blue-100 px-4 py-2 rounded-xl shadow-sm"
            >
              <CheckCheck size={15} />
              {markingAll ? 'Marking…' : 'Mark all read'}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1 mb-4 shadow-sm">
          {[
            { key: 'all',           label: `Activity${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
            { key: 'announcements', label: 'Announcements' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                tab === t.key ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filter bar — only on "all" tab */}
        {tab === 'all' && (
          <div className="mb-4">
            <FilterBar
              typeFilter={typeFilter} setTypeFilter={setTypeFilter}
              readFilter={readFilter} setReadFilter={setReadFilter}
              dateFrom={dateFrom} setDateFrom={setDateFrom}
              dateTo={dateTo} setDateTo={setDateTo}
              onClear={clearFilters}
              activeCount={activeFilterCount}
            />
          </div>
        )}

        {/* Quick read-status chips */}
        {tab === 'all' && !loading && notifications.length > 0 && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {[
              { v: 'all', label: 'All' },
              { v: 'false', label: 'Unread', icon: <Circle size={11} /> },
              { v: 'true', label: 'Read', icon: <CircleCheck size={11} /> },
            ].map(c => (
              <button
                key={c.v}
                onClick={() => { setReadFilter(c.v); setPage(1) }}
                className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                  readFilter === c.v
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}
              >
                {c.icon} {c.label}
              </button>
            ))}
            <span className="text-xs text-gray-400 ml-auto">
              {pagination.total} notification{pagination.total !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-18 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              {tab === 'announcements' ? <Megaphone size={28} className="text-gray-300" /> : <Bell size={28} className="text-gray-300" />}
            </div>
            <p className="font-semibold text-gray-600">No notifications found</p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
              {activeFilterCount > 0
                ? 'Try clearing the filters to see more results'
                : tab === 'announcements'
                  ? 'Admin announcements will appear here'
                  : 'Order updates, support replies and announcements will appear here'}
            </p>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="mt-4 text-xs font-semibold text-blue-500 hover:text-blue-600 transition">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([dateLabel, items]) => (
              <div key={dateLabel}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{dateLabel}</span>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[11px] text-gray-300">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((n: any, i: number) => (
                    <NotifCard
                      key={n._kind === 'personal' ? n.id : `bcast-${i}`}
                      n={n}
                      onRead={n._kind === 'personal' ? markOneRead : undefined}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination — only for "all" tab */}
        {tab === 'all' && !loading && pagination.total_pages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!pagination.has_prev}
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 disabled:opacity-30 bg-white border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition disabled:cursor-not-allowed"
            >
              <ChevronLeft size={15} /> Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                const p = pagination.total_pages <= 5
                  ? i + 1
                  : pagination.page <= 3
                    ? i + 1
                    : pagination.page >= pagination.total_pages - 2
                      ? pagination.total_pages - 4 + i
                      : pagination.page - 2 + i
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                      p === pagination.page
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!pagination.has_next}
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 disabled:opacity-30 bg-white border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        )}

        {tab === 'all' && !loading && pagination.total > 0 && (
          <p className="text-center text-xs text-gray-400 mt-4">
            Page {pagination.page} of {pagination.total_pages} · {pagination.total} total
          </p>
        )}

      </main>

      <Footer />
    </div>
  )
}
