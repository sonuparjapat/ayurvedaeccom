'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { Bell, Package, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const STATUS_COLOR: Record<number, string> = {
  0: 'bg-yellow-100 text-yellow-700',
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-purple-100 text-purple-700',
  3: 'bg-cyan-100 text-cyan-700',
  4: 'bg-orange-100 text-orange-700',
  5: 'bg-green-100 text-green-700',
  6: 'bg-red-100 text-red-700',
  7: 'bg-amber-100 text-amber-700',
  8: 'bg-purple-100 text-purple-700',
  9: 'bg-emerald-100 text-emerald-700',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/push/notifications')
      setNotifications(res.data.notifications || [])
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const grouped = notifications.reduce((acc: any, n: any) => {
    const date = new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    if (!acc[date]) acc[date] = []
    acc[date].push(n)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 space-y-5">
        {/* Header */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Bell size={18} className="text-emerald-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Notifications</h1>
              <p className="text-xs text-gray-500">{notifications.length} recent updates</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={load} className="gap-1">
            <RefreshCw size={13} />
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Bell size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No notifications yet</p>
            <p className="text-gray-400 text-sm mt-1">Order updates and announcements will appear here</p>
            <Link href="/products">
              <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700">Browse Products</Button>
            </Link>
          </div>
        ) : Object.entries(grouped).map(([date, items]: [string, any]) => (
          <div key={date}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">{date}</p>
            <div className="space-y-2">
              {items.map((n: any, i: number) => (
                <Link key={n.id || i} href={`/orders/${n.order_id}`} className="block">
                  <div className="bg-white rounded-xl p-4 flex items-start gap-3 shadow-xs hover:shadow-sm transition-shadow cursor-pointer">
                    <div className="text-2xl mt-0.5 shrink-0">{n.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm leading-snug">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(n.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[n.new_status] ?? 'bg-gray-100 text-gray-600'}`}>
                        <Package size={10} className="inline mr-1" />Order
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
