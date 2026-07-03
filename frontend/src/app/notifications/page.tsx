'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import axios from '@/lib/axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Package, MessageSquare, Megaphone, CheckCheck, ArrowLeft, Ticket } from 'lucide-react'
import { useAuth } from '@/context/auth-context'

const TYPE_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  order_update:  { icon: <Package size={16} />,     color: 'bg-blue-100 text-blue-600',    label: 'Order' },
  support_reply: { icon: <MessageSquare size={16} />, color: 'bg-purple-100 text-purple-600', label: 'Support' },
  ticket_status: { icon: <Ticket size={16} />,      color: 'bg-amber-100 text-amber-600',  label: 'Ticket' },
  broadcast:     { icon: <Megaphone size={16} />,   color: 'bg-green-100 text-green-600',  label: 'Announcement' },
}

function fmtDate(d: string) {
  const date = new Date(d)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

function NotifCard({ n, onRead }: { n: any; onRead?: (id: number) => void }) {
  const meta = TYPE_META[n.type] || TYPE_META.broadcast
  const href = n.data?.order_id ? `/orders/${n.data.order_id}` : n.data?.ticket_id ? `/support/${n.data.ticket_id}` : null

  const handleClick = () => {
    if (!n.is_read && n.id) onRead?.(n.id)
  }

  const inner = (
    <div
      onClick={handleClick}
      className={`flex gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${n.is_read === false ? 'bg-blue-50/60 border-blue-100 hover:bg-blue-50' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
    >
      <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${meta.color}`}>
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 leading-snug">{n.title}</p>
          {n.is_read === false && <span className="shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" />}
        </div>
        {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
        <p className="text-xs text-gray-400 mt-1">{fmtDate(n.created_at)}</p>
      </div>
    </div>
  )

  return href ? <Link href={href}>{inner}</Link> : inner
}

export default function NotificationsPage() {
  const { loginuserdata } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const [broadcasts, setBroadcasts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'announcements'>('all')
  const [markingAll, setMarkingAll] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  const loadData = async () => {
    try {
      const r = await axios.get('/notifications')
      setNotifications(r.data.notifications || [])
      setBroadcasts(r.data.broadcasts || [])
    } catch { }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (!loginuserdata?.id) { router.push('/'); return }
    loadData()
  }, [loginuserdata?.id])

  // WebSocket — receive new personal notifications and admin broadcasts in real-time
  useEffect(() => {
    if (!loginuserdata?.id) return
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket
    socket.on('connect', () => socket.emit('join_user', loginuserdata.id))
    socket.on('new_notification', (notif: any) => {
      setNotifications(prev => [notif, ...prev])
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
    } catch { }
    finally { setMarkingAll(false) }
  }

  const markOneRead = async (id: number) => {
    try {
      await axios.put(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch { }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  const allItems = [
    ...notifications.map(n => ({ ...n, _kind: 'personal' })),
    ...broadcasts.map(b => ({ ...b, type: 'broadcast', is_read: true, _kind: 'broadcast' })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <ArrowLeft size={16} className="text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Bell size={20} className="text-blue-500" /> Notifications
              {unreadCount > 0 && (
                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">{unreadCount} new</span>
              )}
            </h1>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              <CheckCheck size={14} />
              {markingAll ? 'Marking…' : 'Mark all read'}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 mb-4">
          {(['all', 'announcements'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === t ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t === 'all' ? `All Activity${unreadCount > 0 ? ` (${unreadCount})` : ''}` : 'Announcements'}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : tab === 'all' ? (
          allItems.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Bell size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-semibold text-gray-500">No notifications yet</p>
              <p className="text-sm mt-1">Order updates, support replies and announcements will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allItems.map((n, i) => (
                <NotifCard key={`${n._kind}-${n.id || i}`} n={n} onRead={n._kind === 'personal' ? markOneRead : undefined} />
              ))}
            </div>
          )
        ) : (
          broadcasts.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Megaphone size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-semibold text-gray-500">No announcements yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {broadcasts.map((b, i) => (
                <NotifCard key={i} n={{ ...b, type: 'broadcast', is_read: true }} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
