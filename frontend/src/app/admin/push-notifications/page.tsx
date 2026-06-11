'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { notify } from '@/app/utils/notify'
import { Bell, Send, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PushNotificationsPage() {
  const [stats, setStats] = useState<any>({})
  const [form, setForm] = useState({ title: '', body: '' })
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    axios.get('/push/admin/stats').then(r => setStats(r.data)).catch(() => {})
  }, [])

  const send = async () => {
    if (!form.title || !form.body) return notify.error('Title and body required')
    try {
      setSending(true)
      const r = await axios.post('/push/admin/broadcast', form)
      notify.success(`Sent to ${r.data.sent || 0} devices!`)
      setHistory(h => [{ ...form, sent: r.data.sent, time: new Date().toLocaleString() }, ...h])
      setForm({ title: '', body: '' })
    } catch (e: any) { notify.error(e?.response?.data?.message || 'Send failed') }
    finally { setSending(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Bell className="text-blue-500" size={22} /> Push Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">Broadcast notifications to all app users</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* STATS */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2"><Users size={18} className="text-blue-500" />Audience</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-black text-blue-600">{stats.total_tokens || 0}</p>
              <p className="text-xs text-blue-400 font-medium mt-1">Total Devices</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-black text-emerald-600">{stats.total_users || 0}</p>
              <p className="text-xs text-emerald-400 font-medium mt-1">Users with App</p>
            </div>
          </div>

          {/* COMPOSE */}
          <div className="space-y-3 pt-2">
            <h3 className="font-semibold text-gray-800">Compose Notification</h3>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase">Title *</label>
              <input className="w-full border rounded-xl px-3 py-2.5 mt-1 text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                placeholder="e.g. 🔥 Flash Sale is LIVE!" maxLength={60} />
              <p className="text-right text-xs text-gray-400 mt-0.5">{form.title.length}/60</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase">Message *</label>
              <textarea className="w-full border rounded-xl px-3 py-2.5 mt-1 text-sm focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                rows={3} value={form.body} onChange={e => setForm({...form, body: e.target.value})}
                placeholder="e.g. Up to 40% off on all herbal products. Shop now!" maxLength={200} />
              <p className="text-right text-xs text-gray-400 mt-0.5">{form.body.length}/200</p>
            </div>

            {/* PREVIEW */}
            {(form.title || form.body) && (
              <div className="bg-gray-900 rounded-2xl p-4 text-white">
                <p className="text-xs text-gray-400 mb-2">Preview</p>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="font-bold text-sm">{form.title || 'Title'}</p>
                  <p className="text-xs text-gray-300 mt-0.5">{form.body || 'Message'}</p>
                </div>
              </div>
            )}

            <Button onClick={send} disabled={sending} className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
              <Send size={15} /> {sending ? 'Sending...' : `Send to ${stats.total_users || 0} users`}
            </Button>
          </div>
        </div>

        {/* HISTORY */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Recent Sends (this session)</h2>
          {!history.length ? (
            <div className="text-center py-12 text-gray-400">
              <Bell size={40} className="mx-auto mb-3 opacity-30" />
              <p>No notifications sent yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((h, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{h.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{h.body}</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">{h.sent} sent</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{h.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
