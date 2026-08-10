'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { Bell, Send, Users, Wifi, WifiOff, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PushNotificationsPage() {
  const [stats, setStats] = useState<{ total_tokens: number; total_users: number }>({ total_tokens: 0, total_users: 0 })
  const [form, setForm] = useState({ title: '', body: '' })
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  // Initial data load
  useEffect(() => {
    axios.get('/push/admin/stats').then(r => setStats(r.data)).catch(() => {})
    axios.get('/push/admin/history').then(r => setHistory(r.data.history || [])).catch(() => {})
  }, [])

  // WebSocket — join admin room for real-time stats and broadcast completion
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('join_admin')
    })
    socket.on('disconnect', () => setConnected(false))

    // When a new device registers its push token, the backend emits updated counts
    socket.on('push_stats_updated', (data: { total_tokens: string; total_users: string }) => {
      setStats({ total_tokens: Number(data.total_tokens), total_users: Number(data.total_users) })
    })

    // When a broadcast completes, add it to the top of the history list
    socket.on('push_broadcast_complete', (data: { title: string; body: string; sent: number; time: string }) => {
      setHistory(h => [{ title: data.title, body: data.body, sent_to: data.sent, created_at: data.time }, ...h])
    })

    return () => { socket.disconnect() }
  }, [])

  const send = async () => {
    if (!form.title || !form.body) return toast.error('Title and body required')
    try {
      setSending(true)
      const r = await axios.post('/push/admin/broadcast', form)
      toast.success(`Sent to ${r.data.sent || 0} devices!`)
      setForm({ title: '', body: '' })
      // History and stats update via WebSocket event automatically
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Send failed') }
    finally { setSending(false) }
  }

  const fmtDate = (d: string) => {
    try {
      return new Date(d).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    } catch { return d }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="text-blue-500" size={22} /> Push Notifications
          </h1>
          <p className="text-gray-500 text-sm mt-1">Broadcast notifications to all app users</p>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${connected ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
          {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
          {connected ? 'Live' : 'Connecting…'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* STATS + COMPOSE */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Users size={18} className="text-blue-500" /> Audience
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-black text-blue-600">{Number(stats.total_tokens) || 0}</p>
              <p className="text-xs text-blue-400 font-medium mt-1">Total Devices</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-black text-emerald-600">{Number(stats.total_users) || 0}</p>
              <p className="text-xs text-emerald-400 font-medium mt-1">Users with App</p>
            </div>
          </div>

          {Number(stats.total_tokens) === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              <strong>No devices registered yet.</strong> Push tokens are registered when users log in on the mobile app. Note: tokens are not available in Expo Go — requires a production or preview build.
            </div>
          )}

          {/* COMPOSE */}
          <div className="space-y-3 pt-2">
            <h3 className="font-semibold text-gray-800">Compose Notification</h3>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase">Title *</label>
              <input
                className="w-full border rounded-xl px-3 py-2.5 mt-1 text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. 🔥 Flash Sale is LIVE!" maxLength={60}
              />
              <p className="text-right text-xs text-gray-400 mt-0.5">{form.title.length}/60</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase">Message *</label>
              <textarea
                className="w-full border rounded-xl px-3 py-2.5 mt-1 text-sm focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                rows={3} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })}
                placeholder="e.g. Up to 40% off on all herbal products. Shop now!" maxLength={200}
              />
              <p className="text-right text-xs text-gray-400 mt-0.5">{form.body.length}/200</p>
            </div>

            {(form.title || form.body) && (
              <div className="bg-gray-900 rounded-2xl p-4 text-white">
                <p className="text-xs text-gray-400 mb-2">Preview</p>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="font-bold text-sm">{form.title || 'Title'}</p>
                  <p className="text-xs text-gray-300 mt-0.5">{form.body || 'Message'}</p>
                </div>
              </div>
            )}

            <Button
              onClick={send}
              disabled={sending || Number(stats.total_users) === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Send size={15} />
              {sending ? 'Sending…' : `Send to ${Number(stats.total_users) || 0} users`}
            </Button>
          </div>
        </div>

        {/* HISTORY */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-gray-400" /> Broadcast History
            {connected && <span className="text-xs font-normal text-emerald-500 ml-auto">updates live</span>}
          </h2>
          {!history.length ? (
            <div className="text-center py-12 text-gray-400">
              <Bell size={40} className="mx-auto mb-3 opacity-30" />
              <p>No notifications sent yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-130 overflow-y-auto pr-1">
              {history.map((h, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{h.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{h.body}</p>
                    </div>
                    <span className="shrink-0 flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                      <CheckCircle size={11} /> {h.sent_to}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{fmtDate(h.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
