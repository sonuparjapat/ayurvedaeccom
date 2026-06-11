'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { notify } from '@/app/utils/notify'
import { ShoppingCart, RefreshCw, Mail } from 'lucide-react'

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const r = await axios.get('/admin/abandoned-carts')
      setCarts(r.data.carts || [])
    } catch { notify.error('Load failed') } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const totalValue = carts.reduce((s, c) => s + Number(c.cart_value || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="text-orange-500" size={22} /> Abandoned Carts
          </h1>
          <p className="text-gray-500 text-sm mt-1">Carts with items, inactive for 1–48 hours (no order placed)</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-medium hover:bg-gray-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
          <p className="text-3xl font-black text-orange-500">{carts.length}</p>
          <p className="text-sm text-gray-500 mt-1">Abandoned Carts</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
          <p className="text-3xl font-black text-emerald-600">₹{totalValue.toLocaleString('en-IN')}</p>
          <p className="text-sm text-gray-500 mt-1">Potential Revenue</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
          <p className="text-3xl font-black text-blue-500">Auto</p>
          <p className="text-sm text-gray-500 mt-1">Recovery emails sent every 30 min</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Customer</th>
                <th className="text-center px-5 py-3 text-xs font-bold text-gray-500 uppercase">Items</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase">Cart Value</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {carts.map((c, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1"><Mail size={10} />{c.email}</p>
                  </td>
                  <td className="px-5 py-3 text-center text-sm text-gray-700">{c.item_count}</td>
                  <td className="px-5 py-3 text-right font-bold text-gray-900">₹{Number(c.cart_value).toLocaleString('en-IN')}</td>
                  <td className="px-5 py-3 text-right text-xs text-gray-400">{new Date(c.last_updated).toLocaleString('en-IN')}</td>
                </tr>
              ))}
              {!carts.length && (
                <tr><td colSpan={4} className="px-5 py-16 text-center text-gray-400">No abandoned carts found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
