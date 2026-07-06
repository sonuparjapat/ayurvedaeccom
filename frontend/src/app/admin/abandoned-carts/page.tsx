'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { notify } from '@/app/utils/notify'
import { ShoppingCart, RefreshCw, Mail, IndianRupee, Users, Clock, AlertCircle } from 'lucide-react'

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
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <ShoppingCart className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Abandoned Carts</h1>
              <p className="text-orange-100 text-sm mt-0.5">Carts with items, inactive for 1-48 hours (no order placed)</p>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-orange-700 rounded-xl text-sm font-semibold hover:bg-orange-50 transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <ShoppingCart className="text-orange-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{carts.length}</p>
              <p className="text-xs text-gray-500 font-medium">Abandoned Carts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <IndianRupee className="text-emerald-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{'₹'}{totalValue.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-500 font-medium">Potential Revenue</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 col-span-2 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Mail className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">Auto</p>
              <p className="text-xs text-gray-500 font-medium">Recovery emails every 30 min</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {carts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <ShoppingCart size={40} className="mb-3 text-gray-300" />
              <p className="text-base font-medium text-gray-500">No abandoned carts found</p>
              <p className="text-sm mt-1">All carts have been converted or expired</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-slate-50">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cart Value</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {carts.map((c, i) => (
                      <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-orange-50 rounded-full flex items-center justify-center shrink-0">
                              <Users className="text-orange-600" size={16} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                              <p className="text-xs text-gray-400 flex items-center gap-1"><Mail size={10} />{c.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="inline-flex items-center bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                            {c.item_count} {Number(c.item_count) === 1 ? 'item' : 'items'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-gray-900 text-sm">{'₹'}{Number(c.cart_value).toLocaleString('en-IN')}</td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <Clock size={12} />
                            {new Date(c.last_updated).toLocaleString('en-IN')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {carts.map((c, i) => (
                  <div key={i} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-orange-50 rounded-full flex items-center justify-center">
                          <Users className="text-orange-600" size={16} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                          <p className="text-xs text-gray-400">{c.email}</p>
                        </div>
                      </div>
                      <span className="font-bold text-gray-900 text-sm">{'₹'}{Number(c.cart_value).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">{c.item_count} items</span>
                      <span className="flex items-center gap-1"><Clock size={11} />{new Date(c.last_updated).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
