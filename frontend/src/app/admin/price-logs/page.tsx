'use client'

import { useEffect, useState, useCallback } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import {
  Receipt, Search, Filter, TrendingDown, Zap, Tag,
  Wallet, Star, ChevronLeft, ChevronRight, Eye, X,
  Users, ShoppingBag, Calendar, AlertCircle,
} from 'lucide-react'

/* ─── types ─── */
interface PriceLog {
  id: number
  order_id: number
  user_id: number
  user_name: string | null
  user_email: string | null
  user_phone: string | null
  product_id: number | null
  product_name: string | null
  original_price: number | null
  paid_price: number | null
  quantity: number
  savings_per_item: number
  total_savings: number
  reason_type: 'flash_sale' | 'coupon' | 'wallet' | 'loyalty_points'
  reason_detail: string | null
  flash_sale_title: string | null
  flash_sale_id: number | null
  coupon_code: string | null
  created_at: string
}

interface Stat { reason_type: string; count: string; total_savings: string }
interface Summary { grand_total_savings: string; affected_orders: string; affected_users: string }

/* ─── constants ─── */
const REASON_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  flash_sale:     { label: 'Flash Sale',     color: 'text-red-700',    bg: 'bg-red-50 border-red-200',    icon: <Zap size={12} /> },
  coupon:         { label: 'Coupon',          color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: <Tag size={12} /> },
  wallet:         { label: 'Wallet',          color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',  icon: <Wallet size={12} /> },
  loyalty_points: { label: 'Loyalty Points', color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200', icon: <Star size={12} /> },
}

function ReasonBadge({ type }: { type: string }) {
  const m = REASON_META[type] || { label: type, color: 'text-gray-700', bg: 'bg-gray-100 border-gray-200', icon: null }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${m.color} ${m.bg}`}>
      {m.icon}{m.label}
    </span>
  )
}

function fmt(n: number | string | null | undefined) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/* ─── Detail modal ─── */
function LogDetailModal({ log, onClose }: { log: PriceLog; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-base">Price Log #{log.id}</p>
            <p className="text-slate-300 text-xs mt-0.5">{new Date(log.created_at).toLocaleString('en-IN')}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
            <X size={15} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Reason */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">Reason</span>
            <ReasonBadge type={log.reason_type} />
          </div>

          {/* User */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Customer</p>
            <p className="text-sm font-bold text-gray-900">{log.user_name || '—'}</p>
            <p className="text-xs text-gray-500">{log.user_email || '—'}</p>
            <p className="text-xs text-gray-500">{log.user_phone || '—'}</p>
            <p className="text-xs text-gray-400 mt-1">User ID: {log.user_id} · Order #{log.order_id}</p>
          </div>

          {/* Product — only for flash_sale */}
          {log.product_id && (
            <div className="bg-red-50 rounded-xl p-3 space-y-1 border border-red-100">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">Product Discount</p>
              <p className="text-sm font-bold text-gray-900">{log.product_name || `Product #${log.product_id}`}</p>
              <div className="flex items-center gap-4 mt-2">
                <div>
                  <p className="text-xs text-gray-500">Original Price</p>
                  <p className="text-base font-bold text-gray-700">{fmt(log.original_price)}</p>
                </div>
                <div className="text-gray-300 font-bold text-lg">→</div>
                <div>
                  <p className="text-xs text-gray-500">Paid Price</p>
                  <p className="text-base font-bold text-red-600">{fmt(log.paid_price)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Qty</p>
                  <p className="text-base font-bold text-gray-800">×{log.quantity}</p>
                </div>
              </div>
              {log.flash_sale_title && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <Zap size={10} /> {log.flash_sale_title}
                </p>
              )}
            </div>
          )}

          {/* Savings */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-emerald-800">Total Savings</p>
            <p className="text-xl font-extrabold text-emerald-700">{fmt(log.total_savings)}</p>
          </div>

          {/* Detail */}
          {log.reason_detail && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Details</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{log.reason_detail}</p>
            </div>
          )}
          {log.coupon_code && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Coupon Code</span>
              <code className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-bold border border-purple-200">{log.coupon_code}</code>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Main page ─── */
export default function PriceLogsPage() {
  const [logs, setLogs]           = useState<PriceLog[]>([])
  const [loading, setLoading]     = useState(false)
  const [total, setTotal]         = useState(0)
  const [stats, setStats]         = useState<Stat[]>([])
  const [summary, setSummary]     = useState<Summary | null>(null)
  const [selected, setSelected]   = useState<PriceLog | null>(null)

  const [page, setPage]           = useState(1)
  const [search, setSearch]       = useState('')
  const [reasonFilter, setReason] = useState('')
  const [dateFrom, setDateFrom]   = useState('')
  const [dateTo, setDateTo]       = useState('')
  const limit = 25

  const load = useCallback(async (pg = page) => {
    setLoading(true)
    try {
      const r = await axios.get('/admin/price-logs', {
        params: { page: pg, limit, search, reason_type: reasonFilter, date_from: dateFrom, date_to: dateTo }
      })
      setLogs(r.data.logs || [])
      setTotal(r.data.total || 0)
      setStats(r.data.stats || [])
      setSummary(r.data.summary || null)
    } catch {
      toast.error('Failed to load price logs')
    } finally {
      setLoading(false)
    }
  }, [page, search, reasonFilter, dateFrom, dateTo])

  useEffect(() => { load(1); setPage(1) }, [search, reasonFilter, dateFrom, dateTo])
  useEffect(() => { load(page) }, [page])

  const totalPages = Math.ceil(total / limit)

  /* stat helper */
  const getStat = (type: string) => stats.find(s => s.reason_type === type)

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
              <Receipt className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Price Audit Logs</h1>
              <p className="text-slate-300 text-sm mt-0.5">Full trail of every discount — flash sales, coupons, wallet & loyalty</p>
            </div>
          </div>
          {summary && (
            <div className="bg-white/10 rounded-xl px-4 py-3 text-right">
              <p className="text-white/70 text-xs font-medium">Total Savings Given</p>
              <p className="text-2xl font-extrabold text-emerald-300">{fmt(summary.grand_total_savings)}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { type: 'flash_sale',     icon: <Zap size={18} />,    iconBg: 'bg-red-50',    iconColor: 'text-red-500',    label: 'Flash Sale' },
          { type: 'coupon',         icon: <Tag size={18} />,    iconBg: 'bg-purple-50', iconColor: 'text-purple-500', label: 'Coupon' },
          { type: 'wallet',         icon: <Wallet size={18} />, iconBg: 'bg-blue-50',   iconColor: 'text-blue-500',   label: 'Wallet' },
          { type: 'loyalty_points', icon: <Star size={18} />,   iconBg: 'bg-amber-50',  iconColor: 'text-amber-500',  label: 'Loyalty' },
        ].map(({ type, icon, iconBg, iconColor, label }) => {
          const s = getStat(type)
          return (
            <button
              key={type}
              onClick={() => setReason(reasonFilter === type ? '' : type)}
              className={`bg-white rounded-xl p-4 shadow-sm border text-left transition hover:shadow-md ${reasonFilter === type ? 'border-slate-400 ring-2 ring-slate-300' : 'border-gray-100'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center ${iconColor}`}>{icon}</div>
                <p className="text-xs font-semibold text-gray-500">{label}</p>
              </div>
              <p className="text-xl font-bold text-gray-900">{fmt(s?.total_savings)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s?.count || 0} entries</p>
            </button>
          )
        })}
      </div>

      {/* ── Extra stats row ── */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center"><TrendingDown className="text-emerald-600" size={18} /></div>
            <div>
              <p className="text-lg font-bold text-gray-900">{fmt(summary.grand_total_savings)}</p>
              <p className="text-xs text-gray-500">Total savings given</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center"><ShoppingBag className="text-indigo-600" size={18} /></div>
            <div>
              <p className="text-lg font-bold text-gray-900">{summary.affected_orders}</p>
              <p className="text-xs text-gray-500">Orders with discounts</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 col-span-2 md:col-span-1">
            <div className="w-9 h-9 bg-pink-50 rounded-lg flex items-center justify-center"><Users className="text-pink-600" size={18} /></div>
            <div>
              <p className="text-lg font-bold text-gray-900">{summary.affected_users}</p>
              <p className="text-xs text-gray-500">Unique customers</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search user, email, product, order ID, coupon..."
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none transition"
            />
          </div>

          {/* Reason type filter */}
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-gray-400" />
            <select
              value={reasonFilter}
              onChange={e => setReason(e.target.value)}
              className="border border-gray-200 rounded-xl text-sm px-3 py-2.5 focus:ring-2 focus:ring-slate-400 outline-none bg-white"
            >
              <option value="">All Reasons</option>
              <option value="flash_sale">Flash Sale</option>
              <option value="coupon">Coupon</option>
              <option value="wallet">Wallet</option>
              <option value="loyalty_points">Loyalty Points</option>
            </select>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400 shrink-0" />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-xl text-sm px-3 py-2.5 focus:ring-2 focus:ring-slate-400 outline-none" />
            <span className="text-gray-400 text-xs">to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-xl text-sm px-3 py-2.5 focus:ring-2 focus:ring-slate-400 outline-none" />
          </div>

          {/* Clear */}
          {(search || reasonFilter || dateFrom || dateTo) && (
            <button
              onClick={() => { setSearch(''); setReason(''); setDateFrom(''); setDateTo('') }}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 transition"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Active filter indicator ── */}
      {reasonFilter && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Filtered by:</span>
          <ReasonBadge type={reasonFilter} />
          <button onClick={() => setReason('')} className="text-xs text-gray-400 hover:text-gray-600 underline">remove</button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin h-10 w-10 border-4 border-slate-500 border-t-transparent rounded-full" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <AlertCircle size={40} className="mb-3 text-gray-300" />
            <p className="text-base font-medium">No price logs found</p>
            <p className="text-sm mt-1">Discounts will appear here once orders are placed</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100">
                  {['Date & Order', 'Customer', 'Product / Scope', 'Original', 'Paid', 'Saved', 'Reason', ''].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">

                    {/* Date & Order */}
                    <td className="px-4 py-3.5">
                      <p className="font-mono font-semibold text-slate-700 text-xs">#{log.order_id}</p>
                      <p className="text-xs text-gray-400 mt-0.5 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-gray-800 text-sm">{log.user_name || <span className="text-gray-400 italic">Unknown</span>}</p>
                      <p className="text-xs text-gray-500">{log.user_email || '—'}</p>
                      <p className="text-xs text-gray-400">{log.user_phone || '—'}</p>
                    </td>

                    {/* Product / Scope */}
                    <td className="px-4 py-3.5 max-w-[180px]">
                      {log.product_name ? (
                        <>
                          <p className="text-sm font-medium text-gray-800 line-clamp-2">{log.product_name}</p>
                          {log.flash_sale_title && (
                            <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                              <Zap size={9} className="shrink-0" />{log.flash_sale_title}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">Qty: {log.quantity}</p>
                        </>
                      ) : log.coupon_code ? (
                        <p className="text-sm font-semibold text-purple-700">
                          <Tag size={11} className="inline mr-1" />{log.coupon_code}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Order-level discount</p>
                      )}
                    </td>

                    {/* Original */}
                    <td className="px-4 py-3.5">
                      {log.original_price != null ? (
                        <span className="text-sm text-gray-500 line-through">{fmt(log.original_price)}</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>

                    {/* Paid */}
                    <td className="px-4 py-3.5">
                      {log.paid_price != null ? (
                        <span className="text-sm font-bold text-gray-900">{fmt(log.paid_price)}</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>

                    {/* Saved */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-xs font-bold">
                        -{fmt(log.total_savings)}
                      </span>
                    </td>

                    {/* Reason */}
                    <td className="px-4 py-3.5">
                      <ReasonBadge type={log.reason_type} />
                    </td>

                    {/* View */}
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => setSelected(log)}
                        className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-slate-50 text-gray-400 hover:text-slate-600 flex items-center justify-center transition"
                        title="View details"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft size={15} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .slice(Math.max(0, page - 3), page + 2)
            .map(pg => (
              <button
                key={pg}
                onClick={() => setPage(pg)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition ${pg === page ? 'bg-slate-700 text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {pg}
              </button>
            ))}
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronRight size={15} />
          </button>
          <span className="text-sm text-gray-400 ml-2">{total} total</span>
        </div>
      )}

      {/* ── Detail modal ── */}
      {selected && <LogDetailModal log={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
