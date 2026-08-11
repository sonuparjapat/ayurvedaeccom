'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { Bell, Search, Package, Mail, CheckCircle, Clock, RefreshCw, AlertTriangle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminStockNotificationsPage() {

  const [list, setList] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [lowStock, setLowStock] = useState<any[]>([])
  const [outOfStock, setOutOfStock] = useState<any[]>([])
  const [alertsLoading, setAlertsLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/admin/stock-notifications')
      setList(res.data.notifications || [])
    } catch {
      toast.error('Failed to load stock notifications')
    } finally {
      setLoading(false)
    }
  }

  const loadAlerts = async () => {
    setAlertsLoading(true)
    try {
      const res = await axios.get('/admin/low-stock-alerts')
      setLowStock(res.data.data?.lowStock || [])
      setOutOfStock(res.data.data?.outOfStock || [])
    } catch {
      // silently fail if endpoint not available yet
    } finally {
      setAlertsLoading(false)
    }
  }

  useEffect(() => { load(); loadAlerts() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    if (!q) { setFiltered(list); return }
    setFiltered(list.filter(n =>
      n.product_name?.toLowerCase().includes(q) ||
      n.email?.toLowerCase().includes(q) ||
      n.variant_label?.toLowerCase().includes(q)
    ))
  }, [search, list])

  const total = list.length
  const pending = list.filter(n => !n.is_notified || n.notified).length
  const notified = list.filter(n => n.is_notified || n.notified).length

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-purple-50 to-pink-50">
      <div className="w-full p-6 space-y-6">

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Bell className="text-purple-600" size={30} />
                Stock Notifications
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                Customers waiting to be notified when products are back in stock
              </p>
            </div>
            <button
              onClick={() => { load(); loadAlerts() }}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium text-sm transition disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* LOW STOCK & OUT OF STOCK ALERTS */}
        {(lowStock.length > 0 || outOfStock.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* OUT OF STOCK */}
            {outOfStock.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-5">
                <h3 className="text-lg font-bold text-red-700 flex items-center gap-2 mb-3">
                  <XCircle size={20} className="text-red-500" />
                  Out of Stock ({outOfStock.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {outOfStock.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                        {p.sku && <p className="text-xs text-gray-400">SKU: {p.sku}</p>}
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-200 text-red-800">0 left</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LOW STOCK */}
            {lowStock.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-5">
                <h3 className="text-lg font-bold text-amber-700 flex items-center gap-2 mb-3">
                  <AlertTriangle size={20} className="text-amber-500" />
                  Low Stock ({lowStock.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {lowStock.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                        {p.sku && <p className="text-xs text-gray-400">SKU: {p.sku}</p>}
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-200 text-amber-800">
                          {p.inventory} left
                        </span>
                        <p className="text-xs text-gray-400 mt-1">Threshold: {p.threshold}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Requests', value: total, color: 'text-gray-900', bg: 'bg-white' },
            { label: 'Pending', value: pending, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Notified', value: notified, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} rounded-2xl shadow-sm border border-gray-100 p-5 text-center`}>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* SEARCH */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by product, email, or variant..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Bell size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No stock notification requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Requested On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((n: any, i: number) => (
                    <tr key={n.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4 text-gray-400 font-mono text-xs">{i + 1}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2">
                          <Package size={16} className="text-purple-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-semibold text-gray-900">{n.product_name}</p>
                            {n.variant_label && (
                              <p className="text-xs text-gray-400 mt-0.5">Variant: {n.variant_label}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Mail size={14} className="text-gray-400" />
                          {n.email}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {n.is_notified || n.notified ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            <CheckCircle size={12} /> Notified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                            <Clock size={12} /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs">
                        {new Date(n.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
