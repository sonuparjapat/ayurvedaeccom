'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { BarChart2, TrendingUp, MapPin, Tag, Package, Award } from 'lucide-react'

const fmt = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
const pct = (n: number) => `${Number(n || 0).toFixed(1)}%`

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
        <Icon size={16} className="text-emerald-600" />
        <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Table({ cols, rows, loading }: { cols: string[]; rows: any[][]; loading: boolean }) {
  if (loading) return <div className="p-6 text-center text-sm text-gray-400">Loading…</div>
  if (!rows.length) return <div className="p-6 text-center text-sm text-gray-400">No data</div>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left">
            {cols.map(c => <th key={c} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{c}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              {row.map((cell, j) => <td key={j} className="px-4 py-3 text-gray-700 whitespace-nowrap">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AdminReportsPage() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [categoryRev, setCategoryRev] = useState<any[]>([])
  const [stateRev, setStateRev] = useState<any[]>([])
  const [margins, setMargins] = useState<any[]>([])
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([])
  const [couponUsage, setCouponUsage] = useState<any[]>([])

  const q = (from && to) ? `?from=${from}&to=${to}` : ''

  async function load(key: string, url: string, setter: (d: any[]) => void) {
    setLoading(p => ({ ...p, [key]: true }))
    try {
      const r = await axios.get(url + q)
      setter(r.data?.data || [])
    } catch { toast.error('Failed to load ' + key) }
    finally { setLoading(p => ({ ...p, [key]: false })) }
  }

  useEffect(() => { loadAll() }, [q])

  function loadAll() {
    load('topProducts', '/admin/reports/top-products', setTopProducts)
    load('categoryRev', '/admin/reports/category-revenue', setCategoryRev)
    load('stateRev', '/admin/reports/state-revenue', setStateRev)
    load('margins', '/admin/reports/profit-margins', setMargins)
    load('monthlyTrend', '/admin/reports/monthly-trend', setMonthlyTrend)
    load('couponUsage', '/admin/reports/coupon-usage', setCouponUsage)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Revenue, performance, and profit analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
          <span className="text-gray-400">—</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
          <button onClick={loadAll}
            className="bg-emerald-600 text-white text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-emerald-700">
            Apply
          </button>
          {(from || to) && (
            <button onClick={() => { setFrom(''); setTo('') }}
              className="text-sm text-gray-500 hover:text-gray-700 px-2">Clear</button>
          )}
        </div>
      </div>

      {/* Monthly Revenue Trend */}
      <Section title="Monthly Revenue Trend" icon={TrendingUp}>
        <div className="p-5">
          {loading.monthlyTrend ? (
            <div className="text-center text-sm text-gray-400 py-8">Loading…</div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex items-end gap-2 min-w-[600px] h-40 pb-6">
                {monthlyTrend.map((d, i) => {
                  const max = Math.max(...monthlyTrend.map(x => Number(x.revenue)), 1)
                  const h = (Number(d.revenue) / max) * 100
                  return (
                    <div key={i} className="flex flex-col items-center flex-1 gap-1">
                      <span className="text-[9px] text-gray-400 rotate-0 text-center" style={{ fontSize: 9 }}>
                        {fmt(d.revenue)}
                      </span>
                      <div className="w-full bg-emerald-500 rounded-t-lg transition-all duration-500 hover:bg-emerald-600 cursor-default"
                        style={{ height: `${h}%`, minHeight: 4 }}
                        title={`${d.month}: ${fmt(d.revenue)} (${d.order_count} orders)`}
                      />
                      <span className="text-[10px] text-gray-500">{d.month?.slice(5)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Top Products */}
      <Section title="Top Products by Revenue" icon={Award}>
        <Table
          loading={!!loading.topProducts}
          cols={['#', 'Product', 'Category', 'Units Sold', 'Revenue', 'Orders']}
          rows={topProducts.map((p, i) => [
            <span key={i} className="text-gray-400 font-mono">{i + 1}</span>,
            <div key="n" className="flex items-center gap-2">
              {p.image && <img src={p.image} alt="" className="w-7 h-7 rounded-md object-cover" />}
              <span className="font-medium text-gray-900 max-w-[200px] truncate">{p.name}</span>
            </div>,
            p.category_name || '—',
            Number(p.total_units_sold || 0).toLocaleString(),
            fmt(p.total_revenue),
            Number(p.order_count || 0).toLocaleString(),
          ])}
        />
      </Section>

      {/* Category Revenue */}
      <Section title="Category-wise Revenue" icon={BarChart2}>
        <Table
          loading={!!loading.categoryRev}
          cols={['Category', 'Orders', 'Units Sold', 'Revenue']}
          rows={categoryRev.map(c => [
            <span key="n" className="font-medium text-gray-900">{c.category_name}</span>,
            Number(c.order_count || 0).toLocaleString(),
            Number(c.total_units_sold || 0).toLocaleString(),
            fmt(c.total_revenue),
          ])}
        />
      </Section>

      {/* State Revenue */}
      <Section title="State-wise Revenue" icon={MapPin}>
        <Table
          loading={!!loading.stateRev}
          cols={['State', 'Orders', 'Revenue', 'Avg Order']}
          rows={stateRev.map(s => [
            s.state || 'Unknown',
            Number(s.order_count || 0).toLocaleString(),
            fmt(s.total_revenue),
            fmt(s.avg_order_value),
          ])}
        />
      </Section>

      {/* Profit Margins */}
      <Section title="Product Profit Margins" icon={Package}>
        <Table
          loading={!!loading.margins}
          cols={['Product', 'Cost', 'Selling Price', 'Margin %', 'Units', 'Total Profit']}
          rows={margins.map(m => [
            <span key="n" className="font-medium text-gray-900 max-w-[200px] truncate block">{m.name}</span>,
            fmt(m.cost_price),
            fmt(m.selling_price),
            <span key="p" className={`font-semibold ${Number(m.margin_pct) >= 20 ? 'text-emerald-600' : Number(m.margin_pct) >= 10 ? 'text-amber-600' : 'text-red-500'}`}>
              {pct(m.margin_pct)}
            </span>,
            Number(m.units_sold || 0).toLocaleString(),
            fmt(m.total_profit),
          ])}
        />
      </Section>

      {/* Coupon Usage */}
      <Section title="Coupon Usage" icon={Tag}>
        <Table
          loading={!!loading.couponUsage}
          cols={['Code', 'Type', 'Value', 'Used', 'Total Discount Given', 'Valid Until']}
          rows={couponUsage.map(c => [
            <span key="c" className="font-mono text-emerald-700 font-bold">{c.code}</span>,
            c.type,
            c.type === 'percent' ? `${c.value}%` : fmt(c.value),
            Number(c.times_used || 0).toLocaleString(),
            fmt(c.total_discount_given),
            c.valid_to ? new Date(c.valid_to).toLocaleDateString('en-IN') : 'No expiry',
          ])}
        />
      </Section>
    </div>
  )
}
