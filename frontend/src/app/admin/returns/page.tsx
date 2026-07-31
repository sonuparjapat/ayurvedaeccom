'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { notify } from '@/app/utils/notify'
import {
  RotateCcw, CheckCircle, XCircle, DollarSign, Package,
  User, Search, RefreshCw, Eye, Truck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import AppModal from '@/components/modal/AppModal'

const STATUS_LABEL: Record<number, { label: string; color: string; bg: string }> = {
  7: { label: 'Return Requested', color: '#92400e', bg: '#fffbeb' },
  8: { label: 'Refund Initiated', color: '#6d28d9', bg: '#f5f3ff' },
  9: { label: 'Refunded',         color: '#065f46', bg: '#ecfdf5' },
}

export default function AdminReturnsPage() {
  const [list, setList] = useState<any[]>([])
  const [allStats, setAllStats] = useState<any[]>([]) // always all 7/8/9 for accurate stats
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('7,8,9')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<any>({})

  const [selected, setSelected] = useState<any>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectOpen, setRejectOpen] = useState(false)
  const [dispatchOpen, setDispatchOpen] = useState(false)
  const [dispatchTracking, setDispatchTracking] = useState('')
  const [processing, setProcessing] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [filtered, allRes] = await Promise.all([
        axios.get('/admin/returns', { params: { status: filter, page, limit: 20 } }),
        axios.get('/admin/returns', { params: { status: '7,8,9', page: 1, limit: 500 } }),
      ])
      setList(filtered.data.data || [])
      setMeta(filtered.data.meta || {})
      setAllStats(allRes.data.data || [])
    } catch { notify.error('Load failed') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter, page])

  const filtered = list.filter(o =>
    !search || o.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    String(o.id).includes(search) || (o.invoice_no || '').includes(search)
  )

  const approve = async (id: number, refundMethod: 'wallet' | 'razorpay' = 'wallet') => {
    setProcessing(true)
    try {
      const res = await axios.put(`/admin/returns/${id}/approve`, { refund_method: refundMethod })
      notify.success(res.data?.message || 'Return approved')
      setViewOpen(false)
      load()
    } catch (e: any) { notify.error(e?.response?.data?.message || 'Failed') }
    finally { setProcessing(false) }
  }

  const reject = async (id: number) => {
    if (!rejectReason.trim()) return notify.error('Please enter rejection reason')
    setProcessing(true)
    try {
      await axios.put(`/admin/returns/${id}/reject`, { reason: rejectReason })
      notify.success('Return rejected')
      setRejectOpen(false)
      setViewOpen(false)
      setRejectReason('')
      load()
    } catch (e: any) { notify.error(e?.response?.data?.message || 'Failed') }
    finally { setProcessing(false) }
  }

  const completeRefund = async (id: number) => {
    setProcessing(true)
    try {
      await axios.put(`/admin/returns/${id}/complete-refund`)
      notify.success('Refund marked complete')
      setViewOpen(false)
      load()
    } catch (e: any) { notify.error(e?.response?.data?.message || 'Failed') }
    finally { setProcessing(false) }
  }

  const dispatchReplacement = async (id: number) => {
    setProcessing(true)
    try {
      await axios.put(`/admin/returns/${id}/dispatch-replacement`, { tracking_number: dispatchTracking || null })
      notify.success('Replacement dispatched — customer notified')
      setDispatchOpen(false)
      setViewOpen(false)
      setDispatchTracking('')
      load()
    } catch (e: any) { notify.error(e?.response?.data?.message || 'Failed') }
    finally { setProcessing(false) }
  }

  const stats = {
    requested: allStats.filter(o => o.status === 7).length,
    initiated:  allStats.filter(o => o.status === 8).length,
    refunded:   allStats.filter(o => o.status === 9).length,
    totalValue: allStats.filter(o => o.status === 7).reduce((s, o) => s + Number(o.total_amount || 0), 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <RotateCcw className="text-orange-500" size={22} /> Returns Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Review and process customer return requests</p>
        </div>
        <Button variant="outline" onClick={load} className="gap-2">
          <RefreshCw size={15} /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Return Requested', value: stats.requested, color: 'text-orange-600', bg: 'bg-orange-50', icon: <RotateCcw size={18} /> },
          { label: 'Refund Initiated', value: stats.initiated,  color: 'text-purple-600', bg: 'bg-purple-50', icon: <DollarSign size={18} /> },
          { label: 'Refunded',         value: stats.refunded,   color: 'text-green-600',  bg: 'bg-green-50',  icon: <CheckCircle size={18} /> },
          { label: 'Pending Value',    value: `₹${stats.totalValue.toLocaleString()}`, color: 'text-red-600', bg: 'bg-red-50', icon: <Package size={18} /> },
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

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            placeholder="Search order, customer..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {[
            { val: '7', label: 'Requested' },
            { val: '7,8,9', label: 'All Returns' },
            { val: '8', label: 'Refund Initiated' },
            { val: '9', label: 'Refunded' },
          ].map(f => (
            <button
              key={f.val}
              onClick={() => { setFilter(f.val); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f.val
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Order', 'Customer', 'Amount', 'Return Reason', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No returns found</td></tr>
              ) : filtered.map(order => {
                const st = STATUS_LABEL[order.status] ?? STATUS_LABEL[7]
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {order.invoice_no || `#${order.id}`}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
                          <User size={13} className="text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{order.user_name}</p>
                          <p className="text-xs text-gray-400">{order.user_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">₹{Number(order.total_amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-40 truncate">{order.return_reason || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(order.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                        {order.return_type === 'replacement' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">
                            <Truck size={10} /> Replacement
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => { setSelected(order); setViewOpen(true) }}>
                        <Eye size={13} /> View
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {meta.total > 20 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">Showing {filtered.length} of {meta.total}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <Button size="sm" variant="outline" disabled={page * 20 >= meta.total} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* View / Process Modal */}
      {selected && (
        <AppModal open={viewOpen} onClose={() => setViewOpen(false)} title={`Return — ${selected.invoice_no || '#' + selected.id}`}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Customer</p>
                <p className="font-medium">{selected.user_name}</p>
                <p className="text-gray-400 text-xs">{selected.user_email}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Refund Amount</p>
                <p className="font-bold text-lg text-green-600">₹{Number(selected.total_amount).toLocaleString()}</p>
                {selected.refund_status && (
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                    selected.refund_status === 'processed' ? 'bg-purple-100 text-purple-700' :
                    selected.refund_status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    Razorpay: {selected.refund_status.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-orange-600 font-medium">Return Reason</p>
                {selected.return_type === 'replacement' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                    <Truck size={10} /> Customer wants Replacement
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                    <DollarSign size={10} /> Customer wants Refund
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700">{selected.return_reason || 'No reason provided'}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">Items</p>
              <div className="space-y-2">
                {(selected.items || []).map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {item.image && <img src={item.image} alt={item.name} className="w-8 h-8 object-cover rounded" />}
                    <span className="flex-1 text-gray-700">{item.name}</span>
                    <span className="text-gray-400">×{item.qty}</span>
                    <span className="font-medium">₹{item.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {selected.status === 7 && (
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <p className="text-xs text-gray-500 font-medium">Approve as:</p>
                <Button className="w-full bg-green-600 hover:bg-green-700 gap-2" disabled={processing}
                  onClick={() => approve(selected.id, 'wallet')}>
                  <CheckCircle size={16} /> Credit Wallet — ₹{Number(selected.total_amount).toLocaleString()}
                </Button>
                {selected.payment_method === 'online' && (
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2" disabled={processing}
                    onClick={() => approve(selected.id, 'razorpay')}>
                    <CheckCircle size={16} /> Razorpay Bank Refund (5–7 days)
                  </Button>
                )}
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2" disabled={processing}
                  onClick={() => approve(selected.id, 'replacement' as any)}>
                  <Truck size={16} /> Send Replacement
                </Button>
                <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50 gap-2"
                  disabled={processing} onClick={() => setRejectOpen(true)}>
                  <XCircle size={16} /> Reject Return
                </Button>
              </div>
            )}

            {selected.status === 8 && (
              <div className="border-t border-gray-100 pt-4 space-y-2">
                {selected.return_type === 'replacement' ? (
                  <>
                    {selected.replacement_dispatched_at ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                        <Truck size={18} className="text-blue-600 mx-auto mb-1" />
                        <p className="text-blue-700 font-medium text-sm">Replacement Dispatched</p>
                        {selected.replacement_tracking && <p className="text-xs text-blue-500 mt-0.5">Tracking: {selected.replacement_tracking}</p>}
                      </div>
                    ) : (
                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2" disabled={processing}
                        onClick={() => setDispatchOpen(true)}>
                        <Truck size={16} /> Dispatch Replacement
                      </Button>
                    )}
                  </>
                ) : (
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 gap-2" disabled={processing}
                    onClick={() => completeRefund(selected.id)}>
                    <DollarSign size={16} /> Mark Refund Completed
                  </Button>
                )}
              </div>
            )}

            {selected.status === 9 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <CheckCircle size={20} className="text-green-600 mx-auto mb-1" />
                <p className="text-green-700 font-medium text-sm">Refund Completed</p>
              </div>
            )}
          </div>
        </AppModal>
      )}

      {/* Dispatch Replacement Modal */}
      <AppModal open={dispatchOpen} onClose={() => setDispatchOpen(false)} title="Dispatch Replacement">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Optionally enter a tracking number for the replacement shipment. The customer will be notified via email and app notification.</p>
          <input
            className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Tracking number (optional)"
            value={dispatchTracking}
            onChange={e => setDispatchTracking(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDispatchOpen(false)}>Cancel</Button>
            <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2" disabled={processing}
              onClick={() => dispatchReplacement(selected?.id)}>
              <Truck size={15} /> Confirm Dispatch
            </Button>
          </div>
        </div>
      </AppModal>

      {/* Reject Modal */}
      <AppModal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Return Request">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Please provide a reason for rejecting this return request. This will be visible to the customer.</p>
          <textarea
            className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
            rows={3}
            placeholder="e.g. Product shows signs of use beyond normal trial period"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button className="flex-1 bg-red-600 hover:bg-red-700" disabled={processing} onClick={() => reject(selected?.id)}>
              Reject Return
            </Button>
          </div>
        </div>
      </AppModal>
    </div>
  )
}
