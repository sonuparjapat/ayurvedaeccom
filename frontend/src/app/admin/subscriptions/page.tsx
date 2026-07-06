'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { notify } from '@/app/utils/notify'
import {
  RotateCcw, Users, Package, Clock, CheckCircle, XCircle,
  Pause, RefreshCw, Search,
} from 'lucide-react'

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
  active: { label: 'Active', color: 'text-green-700', bg: 'bg-green-50', Icon: CheckCircle },
  paused: { label: 'Paused', color: 'text-amber-700', bg: 'bg-amber-50', Icon: Pause },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50', Icon: XCircle },
}

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  const load = async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: 20 }
      if (filter) params.status = filter
      const res = await axios.get('/subscriptions/admin', { params })
      setSubs(res.data.data || [])
      setTotal(res.data.total || 0)
    } catch { notify.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page, filter])

  const stats = {
    active: subs.filter(s => s.status === 'active').length,
    paused: subs.filter(s => s.status === 'paused').length,
    cancelled: subs.filter(s => s.status === 'cancelled').length,
    total: subs.length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <RotateCcw size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Subscription Management</h1>
              <p className="text-white/70 text-sm">Auto-reorder subscriptions from customers</p>
            </div>
          </div>
          <button onClick={load} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: <Package size={18} />, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active', value: stats.active, icon: <CheckCircle size={18} />, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Paused', value: stats.paused, icon: <Pause size={18} />, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Cancelled', value: stats.cancelled, icon: <XCircle size={18} />, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-xl p-4 flex items-center gap-3`}>
            <div className={`${s.color} opacity-70`}>{s.icon}</div>
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { val: '', label: 'All' },
          { val: 'active', label: 'Active' },
          { val: 'paused', label: 'Paused' },
          { val: 'cancelled', label: 'Cancelled' },
        ].map(f => (
          <button key={f.val} onClick={() => { setFilter(f.val); setPage(1) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f.val ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}>{f.label}</button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              {['Customer', 'Product', 'Qty', 'Every', 'Next Order', 'Orders', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : subs.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                <RotateCcw size={32} className="mx-auto mb-2 text-gray-300" />
                No subscriptions found
              </td></tr>
            ) : subs.map(s => {
              const st = STATUS_BADGE[s.status] || STATUS_BADGE.active
              return (
                <tr key={s.id} className="hover:bg-gray-50/80 transition">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{s.user_name}</p>
                    <p className="text-xs text-gray-400">{s.user_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {s.images?.[0] && <img src={s.images[0]} className="w-8 h-8 rounded object-cover" />}
                      <span className="text-gray-700">{s.product_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.quantity}</td>
                  <td className="px-4 py-3 text-gray-600">{s.frequency_days}d</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {s.next_order_date ? new Date(s.next_order_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.total_orders}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${st.bg} ${st.color}`}>
                      <st.Icon size={11} /> {st.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {total > 20 && (
          <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
            <span>Page {page}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded-lg border hover:bg-gray-50 disabled:opacity-40">Prev</button>
              <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-lg border hover:bg-gray-50 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
