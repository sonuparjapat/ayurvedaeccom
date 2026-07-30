'use client'

import { useEffect, useState, useCallback } from 'react'
import axios from '@/lib/axios'
import { RefreshCw, Search, Filter, Download, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'

const EVENT_META: Record<string, { label: string; color: string; bg: string }> = {
  order_placed:               { label: 'Order Placed (COD)',       color: '#15803d', bg: '#dcfce7' },
  razorpay_order_created:     { label: 'Razorpay Order Created',   color: '#1d4ed8', bg: '#dbeafe' },
  payment_captured:           { label: 'Payment Captured',         color: '#15803d', bg: '#dcfce7' },
  payment_captured_webhook:   { label: 'Payment Captured (Webhook)',color: '#15803d', bg: '#dcfce7' },
  refund_initiated:           { label: 'Refund Initiated',         color: '#b45309', bg: '#fef3c7' },
  refund_initiation_failed:   { label: 'Refund Init Failed',       color: '#dc2626', bg: '#fee2e2' },
  admin_refund_initiated:     { label: 'Admin Refund',             color: '#7c3aed', bg: '#ede9fe' },
  auto_cancel_refund_initiated:{ label: 'Auto-Cancel Refund',      color: '#b45309', bg: '#fef3c7' },
  refund_processed:           { label: 'Refund Processed',         color: '#15803d', bg: '#dcfce7' },
  refund_failed:              { label: 'Refund Failed',            color: '#dc2626', bg: '#fee2e2' },
}

const STATUS_META: Record<string, { color: string; bg: string }> = {
  success:   { color: '#15803d', bg: '#dcfce7' },
  pending:   { color: '#b45309', bg: '#fef3c7' },
  initiated: { color: '#1d4ed8', bg: '#dbeafe' },
  failed:    { color: '#dc2626', bg: '#fee2e2' },
  processed: { color: '#15803d', bg: '#dcfce7' },
}

const INITIATOR_COLOR: Record<string, string> = {
  customer: '#1d4ed8',
  admin:    '#7c3aed',
  system:   '#6b7280',
}

function fmt(dt: string) {
  return new Date(dt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  })
}

function Chip({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ background: bg, color, padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

export default function PaymentLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [meta, setMeta] = useState<{ total: number; pages: number; page: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)

  const [search, setSearch] = useState('')
  const [eventFilter, setEventFilter] = useState('')
  const [initiatedBy, setInitiatedBy] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  const load = useCallback(async (pg = 1) => {
    setLoading(true)
    try {
      const params: any = { page: pg, limit: 50 }
      if (search.trim()) params.order_id = parseInt(search.trim()) || undefined
      if (eventFilter) params.event_type = eventFilter
      if (initiatedBy) params.initiated_by = initiatedBy
      if (statusFilter) params.status = statusFilter
      if (from) params.from = from
      if (to) params.to = to
      const res = await axios.get('/admin/payment-logs', { params })
      setLogs(res.data.data || [])
      setMeta(res.data.meta || null)
      setPage(pg)
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [search, eventFilter, initiatedBy, statusFilter, from, to])

  useEffect(() => { load(1) }, [])

  function exportCsv() {
    const headers = ['ID','Order ID','Invoice','User','Event','Amount','Status','Gateway Payment ID','Gateway Refund ID','Initiated By','Notes','Time']
    const rows = logs.map(l => [
      l.id, l.order_id, l.invoice_no || '', `${l.user_name || ''} <${l.user_email || ''}>`,
      l.event_type, l.amount != null ? `₹${Number(l.amount).toFixed(2)}` : '',
      l.status || '', l.gateway_payment_id || '', l.gateway_refund_id || '',
      l.initiated_by || '', l.notes || '', fmt(l.created_at),
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `payment-logs-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💳 Payment Logs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Every payment event — order placement, capture, refund, webhooks</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 font-medium"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={() => load(page)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats row */}
      {meta && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Events', value: meta.total, color: 'bg-gray-50 border-gray-200' },
            { label: 'Successful', value: logs.filter(l => l.status === 'success' || l.status === 'processed').length, color: 'bg-emerald-50 border-emerald-200' },
            { label: 'Pending', value: logs.filter(l => l.status === 'pending' || l.status === 'initiated').length, color: 'bg-amber-50 border-amber-200' },
            { label: 'Failed', value: logs.filter(l => l.status === 'failed').length, color: 'bg-red-50 border-red-200' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
              <p className="text-2xl font-black text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5 flex flex-wrap gap-3 items-end shadow-sm">
        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1">Order ID</label>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm w-32 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="e.g. 42"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1">Event Type</label>
          <select
            className="border border-gray-200 rounded-xl text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            value={eventFilter}
            onChange={e => setEventFilter(e.target.value)}
          >
            <option value="">All Events</option>
            {Object.entries(EVENT_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1">Initiated By</label>
          <select
            className="border border-gray-200 rounded-xl text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            value={initiatedBy}
            onChange={e => setInitiatedBy(e.target.value)}
          >
            <option value="">All</option>
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
            <option value="system">System</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1">Status</label>
          <select
            className="border border-gray-200 rounded-xl text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="success">Success</option>
            <option value="processed">Processed</option>
            <option value="pending">Pending</option>
            <option value="initiated">Initiated</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1">From</label>
          <input type="date" className="border border-gray-200 rounded-xl text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1">To</label>
          <input type="date" className="border border-gray-200 rounded-xl text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" value={to} onChange={e => setTo(e.target.value)} />
        </div>

        <button
          onClick={() => load(1)}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-700"
        >
          <Filter size={13} /> Apply
        </button>
        <button
          onClick={() => { setSearch(''); setEventFilter(''); setInitiatedBy(''); setStatusFilter(''); setFrom(''); setTo(''); setTimeout(() => load(1), 0) }}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
        >
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Event</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">By</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Gateway IDs</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 animate-pulse">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-gray-400 py-16 text-sm">
                    No payment events found
                  </td>
                </tr>
              ) : logs.map(log => {
                const ev = EVENT_META[log.event_type]
                const st = log.status ? STATUS_META[log.status] : null
                const isExp = expanded === log.id
                return (
                  <>
                    <tr
                      key={log.id}
                      className="border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer transition-colors"
                      onClick={() => setExpanded(isExp ? null : log.id)}
                    >
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmt(log.created_at)}</td>
                      <td className="px-4 py-3 font-mono font-bold text-gray-800 whitespace-nowrap">
                        {log.order_id && (
                          <a
                            href={`/admin/orders?q=${log.order_id}`}
                            className="text-emerald-700 hover:underline"
                            onClick={e => e.stopPropagation()}
                          >
                            #{log.invoice_no || log.order_id}
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {log.user_name && (
                          <div>
                            <p className="font-medium text-gray-800 text-xs">{log.user_name}</p>
                            <p className="text-[10px] text-gray-400">{log.user_email}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {ev
                          ? <Chip label={ev.label} color={ev.color} bg={ev.bg} />
                          : <Chip label={log.event_type} color="#6b7280" bg="#f3f4f6" />
                        }
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800 tabular-nums whitespace-nowrap">
                        {log.amount != null ? `₹${Number(log.amount).toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {log.status && st
                          ? <Chip label={log.status} color={st.color} bg={st.bg} />
                          : log.status ? <Chip label={log.status} color="#6b7280" bg="#f3f4f6" /> : '—'
                        }
                      </td>
                      <td className="px-4 py-3">
                        <span style={{ color: INITIATOR_COLOR[log.initiated_by] || '#6b7280', fontWeight: 600, fontSize: 11 }}>
                          {log.initiated_by || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono max-w-xs">
                        {log.gateway_payment_id
                          ? <span className="truncate block max-w-[140px]" title={log.gateway_payment_id}>{log.gateway_payment_id.slice(0, 16)}…</span>
                          : log.gateway_refund_id
                          ? <span className="truncate block max-w-[140px]" title={log.gateway_refund_id}>{log.gateway_refund_id.slice(0, 16)}…</span>
                          : '—'
                        }
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExp && (
                      <tr key={`${log.id}-exp`} className="bg-gray-50/80">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            {log.gateway_payment_id && (
                              <div>
                                <p className="text-gray-400 font-semibold uppercase tracking-wide mb-1">Payment ID</p>
                                <p className="font-mono text-gray-700 break-all">{log.gateway_payment_id}</p>
                              </div>
                            )}
                            {log.gateway_order_id && (
                              <div>
                                <p className="text-gray-400 font-semibold uppercase tracking-wide mb-1">Razorpay Order ID</p>
                                <p className="font-mono text-gray-700 break-all">{log.gateway_order_id}</p>
                              </div>
                            )}
                            {log.gateway_refund_id && (
                              <div>
                                <p className="text-gray-400 font-semibold uppercase tracking-wide mb-1">Refund ID</p>
                                <p className="font-mono text-gray-700 break-all">{log.gateway_refund_id}</p>
                              </div>
                            )}
                            {log.gateway_event && (
                              <div>
                                <p className="text-gray-400 font-semibold uppercase tracking-wide mb-1">Webhook Event</p>
                                <p className="font-mono text-gray-700">{log.gateway_event}</p>
                              </div>
                            )}
                            {log.notes && (
                              <div className="md:col-span-2">
                                <p className="text-gray-400 font-semibold uppercase tracking-wide mb-1">Notes</p>
                                <p className="text-gray-700">{log.notes}</p>
                              </div>
                            )}
                            {log.metadata && (
                              <div className="md:col-span-2">
                                <p className="text-gray-400 font-semibold uppercase tracking-wide mb-1">Metadata</p>
                                <pre className="text-gray-600 bg-white border border-gray-100 rounded-lg p-2 text-[10px] overflow-x-auto">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {((page - 1) * 50) + 1}–{Math.min(page * 50, meta.total)} of {meta.total} events
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => load(page - 1)}
                disabled={page <= 1}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-sm font-medium px-2">{page} / {meta.pages}</span>
              <button
                onClick={() => load(page + 1)}
                disabled={page >= meta.pages}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
