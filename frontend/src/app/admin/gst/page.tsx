'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { Download, RefreshCw, TrendingUp, FileText, Package } from 'lucide-react'

const FY_OPTIONS = Array.from({ length: 5 }, (_, i) => {
  const y = new Date().getFullYear() - i
  return { value: String(y), label: `FY ${y}-${y + 1}` }
})

const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']

function fmt(n: any) {
  const num = Number(n || 0)
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getMonthLabel(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-IN', { month: 'short', year: 'numeric' })
}

export default function GstPage() {
  const [fy, setFy] = useState(String(new Date().getFullYear()))
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // For GSTR-1 export
  const [exportFrom, setExportFrom] = useState('')
  const [exportTo, setExportTo] = useState('')
  const [exportType, setExportType] = useState<'invoices' | 'hsn'>('invoices')
  const [exporting, setExporting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/admin/gst/dashboard?year=${fy}`)
      setData(res.data)
    } catch {
      toast.error('Failed to load GST data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [fy])

  const handleExport = async () => {
    if (!exportFrom || !exportTo) return toast.error('Select date range')
    setExporting(true)
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/admin/gst/export?from=${exportFrom}&to=${exportTo}&type=${exportType}`
      const token = typeof window !== 'undefined' ? document.cookie.match(/token=([^;]+)/)?.[1] || localStorage.getItem('token') : ''
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `GSTR1_${exportType}_${exportFrom}_${exportTo}.csv`
      link.click()
      toast.success('CSV downloaded')
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  const totals = data?.totals || {}
  const monthly = data?.monthly || []
  const hsn = data?.hsn_summary || []

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GST Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Track tax collected, generate GSTR-1 exports for government filing</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={fy}
            onChange={e => setFy(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            {FY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Taxable Value', value: fmt(totals.taxable_value), color: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
          { label: 'CGST Collected', value: fmt(totals.total_cgst), color: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
          { label: 'SGST Collected', value: fmt(totals.total_sgst), color: 'bg-teal-50 border-teal-200', text: 'text-teal-700' },
          { label: 'IGST Collected', value: fmt(totals.total_igst), color: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
          { label: 'Total Tax', value: fmt(totals.total_tax), color: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
          { label: 'Gross Revenue', value: fmt(totals.gross_total), color: 'bg-gray-50 border-gray-200', text: 'text-gray-700' },
          { label: 'Total Invoices', value: String(totals.invoice_count || 0), color: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700' },
          { label: 'FY', value: data?.fy || '—', color: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700' },
        ].map(card => (
          <div key={card.label} className={`border rounded-xl p-4 ${card.color}`}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{card.label}</p>
            <p className={`text-xl font-bold mt-1 ${card.text}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-600" />
          <h2 className="font-semibold text-gray-900">Monthly Breakdown</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : monthly.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No invoice data for this financial year.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Month</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Invoices</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Taxable Value</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">CGST</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">SGST</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">IGST</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Tax</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Gross</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map((row: any) => (
                  <tr key={row.month} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{getMonthLabel(row.month)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.invoice_count}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmt(row.taxable_value)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-600">{fmt(row.total_cgst)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-teal-600">{fmt(row.total_sgst)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-purple-600">{fmt(row.total_igst)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-orange-600">{fmt(row.total_tax)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold">{fmt(row.gross_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* HSN Summary */}
      {hsn.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center gap-2">
            <Package size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-900">HSN-wise Summary</h2>
            <span className="text-xs text-gray-400">(Required for GSTR-1 Table 12)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">HSN Code</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">GST %</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Qty</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Taxable Value</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">CGST</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">SGST</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">IGST</th>
                </tr>
              </thead>
              <tbody>
                {hsn.map((row: any, i: number) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-medium">{row.hsn_code || '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.gst_percent}%</td>
                    <td className="px-4 py-3 text-right tabular-nums">{Number(row.total_qty).toFixed(0)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmt(row.taxable_value)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-600">{fmt(row.cgst)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-teal-600">{fmt(row.sgst)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-purple-600">{fmt(row.igst)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GSTR-1 Export */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-gray-600" />
          <h2 className="font-semibold text-gray-900">Export GSTR-1</h2>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">For government filing</span>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Export invoice-wise or HSN-wise CSV to upload on the GST portal. File GSTR-1 by the <strong>11th of the following month</strong> (monthly filers) or quarterly.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">From Date</label>
            <input
              type="date" value={exportFrom} onChange={e => setExportFrom(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">To Date</label>
            <input
              type="date" value={exportTo} onChange={e => setExportTo(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Type</label>
            <select
              value={exportType} onChange={e => setExportType(e.target.value as any)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="invoices">Invoice-wise (B2C)</option>
              <option value="hsn">HSN Summary (Table 12)</option>
            </select>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || !exportFrom || !exportTo}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium"
          >
            <Download size={14} />
            {exporting ? 'Exporting…' : 'Download CSV'}
          </button>
        </div>
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          <strong>How to file GSTR-1:</strong> Log in to <strong>gst.gov.in</strong> → Services → Returns → GSTR-1 → Import CSV. Upload this file under "B2C (Others)" for transactions below ₹2.5L or "B2C (Large)" above ₹2.5L. HSN summary goes under Table 12.
        </div>
      </div>
    </div>
  )
}
