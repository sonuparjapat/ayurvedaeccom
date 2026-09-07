'use client'

import { useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { Download, FileText, Users, ShoppingCart } from 'lucide-react'
import { PageInfoBanner, LabelWithInfo } from '@/components/admin/FieldInfo'

export default function ExportPage() {
  const [ordersFilter, setOrdersFilter] = useState({ from: '', to: '', status: 'all' })
  const [exporting, setExporting] = useState<string | null>(null)

  const downloadOrders = async () => {
    try {
      setExporting('orders')
      const params = new URLSearchParams()
      if (ordersFilter.from) params.set('from', ordersFilter.from)
      if (ordersFilter.to) params.set('to', ordersFilter.to)
      if (ordersFilter.status !== 'all') params.set('status', ordersFilter.status)

      const res = await axios.get(`/admin/export/orders?${params}`, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `orders_${Date.now()}.csv`; a.click()
      toast.success('Orders exported!')
    } catch { toast.error('Export failed') }
    finally { setExporting(null) }
  }

  const downloadUsers = async () => {
    try {
      setExporting('users')
      const res = await axios.get('/admin/export/users', { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `users_${Date.now()}.csv`; a.click()
      toast.success('Users exported!')
    } catch { toast.error('Export failed') }
    finally { setExporting(null) }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Download className="text-emerald-500" size={22} /> Export Data</h1>
        <p className="text-gray-500 text-sm mt-1">Download CSV reports for orders, users, and revenue</p>
        <PageInfoBanner
          title="Export Data"
          description="Download complete CSV reports for orders and customers. Use date range and status filters to narrow the orders export. Files download directly to your browser — no email needed."
          tips={[
            "Leave From Date and To Date blank to export all orders regardless of date.",
            "Filter by Status to export only Delivered orders for accounting, or Cancelled orders for analysis.",
            "Orders CSV includes: Order ID, customer info, items list, total amount, payment method, and tracking.",
            "Users CSV includes: name, email, wallet balance, loyalty points, total orders, and registration date.",
            "Large exports may take a few seconds — do not click Export multiple times.",
            "Use these CSVs for offline accounting, mail-merge campaigns, or importing into analytics tools.",
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ORDERS EXPORT */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2"><ShoppingCart size={18} className="text-blue-500" /> Orders Report</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1">
                  <LabelWithInfo label="From Date" what="The start date for the orders export range" why="Narrows the export to orders placed on or after this date" example="2024-01-01 to export orders from January onwards" />
                </label>
                <input type="date" className="w-full border rounded-xl px-3 py-2 mt-1 text-sm"
                  value={ordersFilter.from} onChange={e => setOrdersFilter(f => ({...f, from: e.target.value}))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1">
                  <LabelWithInfo label="To Date" what="The end date for the orders export range" why="Narrows the export to orders placed on or before this date" example="2024-01-31 to export orders up to end of January" /></label>
                <input type="date" className="w-full border rounded-xl px-3 py-2 mt-1 text-sm"
                  value={ordersFilter.to} onChange={e => setOrdersFilter(f => ({...f, to: e.target.value}))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1">
                <LabelWithInfo label="Status" what="Filter exported orders by their current order status" why="Export only specific stages — e.g. Delivered for accounting, Cancelled for analysis" example="Select 'Delivered' to export only completed orders for the period" /></label>
              <select className="w-full border rounded-xl px-3 py-2 mt-1 text-sm"
                value={ordersFilter.status} onChange={e => setOrdersFilter(f => ({...f, status: e.target.value}))}>
                <option value="all">All Status</option>
                {[{v:0,l:'Pending'},{v:1,l:'Confirmed'},{v:2,l:'Processing'},{v:3,l:'Shipped'},{v:4,l:'Out for Delivery'},{v:5,l:'Delivered'},{v:6,l:'Cancelled'},{v:7,l:'Return Requested'},{v:8,l:'Returned'},{v:9,l:'Refunded'}].map(s => (
                  <option key={s.v} value={s.v}>{s.l}</option>
                ))}
              </select>
            </div>
            <button onClick={downloadOrders} disabled={exporting === 'orders'}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
              <Download size={16} /> {exporting === 'orders' ? 'Exporting...' : 'Download Orders CSV'}
            </button>
          </div>
          <p className="text-xs text-gray-400">Includes: Order ID, customer info, items, amount, status, payment method, courier tracking</p>
        </div>

        {/* USERS EXPORT */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2"><Users size={18} className="text-purple-500" /> Users Report</h2>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm text-gray-600">
            <p className="flex items-center gap-2"><FileText size={14} className="text-purple-400" /> All registered customers</p>
            <p className="flex items-center gap-2"><FileText size={14} className="text-purple-400" /> Wallet balance & loyalty points</p>
            <p className="flex items-center gap-2"><FileText size={14} className="text-purple-400" /> Total orders & lifetime spend</p>
            <p className="flex items-center gap-2"><FileText size={14} className="text-purple-400" /> Registration date</p>
          </div>
          <button onClick={downloadUsers} disabled={exporting === 'users'}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
            <Download size={16} /> {exporting === 'users' ? 'Exporting...' : 'Download Users CSV'}
          </button>
        </div>
      </div>
    </div>
  )
}
