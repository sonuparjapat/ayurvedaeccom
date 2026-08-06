'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { Trophy, Search, Filter } from 'lucide-react'

type RewardLog = {
  id: number; user_id: number; user_name: string; user_email: string
  reward_type: string; reward_value: number; source_type: string; source_id: number
  description: string; reward_ref: string | null; created_at: string
}

const SOURCE_COLORS: Record<string, string> = {
  quiz: '#7c3aed', scratch_card: '#f97316', spin_wheel: '#10b981',
  gift_card: '#3b82f6', manual: '#6b7280'
}
const SOURCE_LABELS: Record<string, string> = {
  quiz: 'Quiz', scratch_card: 'Scratch Card', spin_wheel: 'Spin Wheel',
  gift_card: 'Gift Card', manual: 'Manual'
}
const REWARD_LABELS: Record<string, string> = { wallet: '💳 Wallet', points: '⭐ Points', coupon: '🎟 Coupon', none: '—' }

export default function RewardLogsPage() {
  const [logs, setLogs] = useState<RewardLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const limit = 25

  const load = async () => {
    setLoading(true)
    try {
      const params: any = { page, limit }
      if (filter) params.source_type = filter
      const r = await axios.get('/quiz/admin/reward-logs/all', { params })
      setLogs(r.data?.data || [])
      setTotal(r.data?.total || 0)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page, filter])

  const displayed = search
    ? logs.filter(l => l.user_name?.toLowerCase().includes(search.toLowerCase()) || l.user_email?.toLowerCase().includes(search.toLowerCase()) || l.description?.toLowerCase().includes(search.toLowerCase()))
    : logs

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy size={22} className="text-amber-500" /> Reward Audit Logs
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Complete history of all rewards distributed — quiz, games, gift cards, manual</p>
        </div>
        <div className="text-sm text-gray-400 font-medium">{total.toLocaleString()} total records</div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user, email, or description…"
            className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
            <option value="">All Sources</option>
            {Object.entries(SOURCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['User', 'Source', 'Reward', 'Value', 'Ref / Code', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Loading…</td></tr>
              ) : displayed.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No reward logs found.</td></tr>
              ) : displayed.map(log => (
                <tr key={log.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">{log.user_name || '—'}</p>
                    <p className="text-xs text-gray-400">{log.user_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: `${SOURCE_COLORS[log.source_type] || '#6b7280'}18`,
                      color: SOURCE_COLORS[log.source_type] || '#6b7280'
                    }}>
                      {SOURCE_LABELS[log.source_type] || log.source_type}
                    </span>
                    {log.description && <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{log.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm">{REWARD_LABELS[log.reward_type] || log.reward_type}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-gray-900">
                      {log.reward_type === 'none' ? '—' : log.reward_type === 'coupon' ? 'Code' : `₹${log.reward_value}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {log.reward_ref ? (
                      <span className="text-xs font-mono bg-violet-50 text-violet-700 px-2 py-0.5 rounded-lg">{log.reward_ref}</span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
