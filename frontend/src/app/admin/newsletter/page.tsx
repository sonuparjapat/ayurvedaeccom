'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { notify } from '@/app/utils/notify'
import {
  Mail, Users, Trash2, Download, RefreshCw, CheckCircle, XCircle, Search,
} from 'lucide-react'

export default function AdminNewsletterPage() {
  const [subs, setSubs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [activeCount, setActiveCount] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/newsletter/admin', { params: { page, limit: 30, status: filter } })
      setSubs(res.data.data || [])
      setTotal(res.data.total || 0)
      setActiveCount(res.data.activeCount || 0)
    } catch { notify.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page, filter])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this subscriber?')) return
    try {
      await axios.delete(`/newsletter/admin/${id}`)
      notify.success('Deleted')
      load()
    } catch { notify.error('Delete failed') }
  }

  const handleExport = () => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL || ''}/newsletter/admin/export`, '_blank')
  }

  const filtered = subs.filter(s =>
    !search || s.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Mail size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Newsletter Subscribers</h1>
              <p className="text-white/70 text-sm">{activeCount} active subscribers</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport} className="bg-white/20 hover:bg-white/30 text-white font-medium text-sm px-4 py-2 rounded-xl transition flex items-center gap-2">
              <Download size={14} /> Export CSV
            </button>
            <button onClick={load} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: total, icon: <Users size={18} />, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active', value: activeCount, icon: <CheckCircle size={18} />, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Unsubscribed', value: total - activeCount, icon: <XCircle size={18} />, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-xl p-4 flex items-center gap-3`}>
            <div className={s.color}>{s.icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            placeholder="Search by email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['all', 'active', 'inactive'].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${filter === f ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
            {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Unsubscribed'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              {['#', 'Email', 'Status', 'Subscribed', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">
                <Mail size={32} className="mx-auto mb-2 text-gray-300" />
                No subscribers found
              </td></tr>
            ) : filtered.map((s, i) => (
              <tr key={s.id} className="hover:bg-gray-50/80 transition">
                <td className="px-4 py-3 text-gray-400">{(page - 1) * 30 + i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{s.email}</td>
                <td className="px-4 py-3">
                  {s.is_active ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                      <CheckCircle size={11} /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                      <XCircle size={11} /> Unsubscribed
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(s.subscribed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {total > 30 && (
          <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
            <span>Page {page} of {Math.ceil(total / 30)}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded-lg border hover:bg-gray-50 disabled:opacity-40">Prev</button>
              <button disabled={page * 30 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-lg border hover:bg-gray-50 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
