'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Package, Truck, CheckCircle, Clock, XCircle, RotateCcw, Leaf } from 'lucide-react'
import axios from '@/lib/axios'

const ORDER_STATUS: Record<number, { label: string; icon: any; color: string }> = {
  0: { label: 'Order Placed', icon: Clock, color: '#6b7280' },
  1: { label: 'Confirmed', icon: CheckCircle, color: '#059669' },
  2: { label: 'Processing', icon: Package, color: '#d97706' },
  3: { label: 'Shipped', icon: Truck, color: '#2563eb' },
  4: { label: 'Out for Delivery', icon: Truck, color: '#7c3aed' },
  5: { label: 'Delivered', icon: CheckCircle, color: '#16a34a' },
  6: { label: 'Cancelled', icon: XCircle, color: '#dc2626' },
  7: { label: 'Return Requested', icon: RotateCcw, color: '#ea580c' },
  8: { label: 'Return Approved', icon: RotateCcw, color: '#16a34a' },
  9: { label: 'Refunded', icon: CheckCircle, color: '#059669' },
}

const STEPS = [0, 1, 2, 3, 4, 5]

export default function PublicTrackingPage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    setLoading(true)
    axios.get(`/tracking/public/${token}`)
      .then(r => setData(r.data?.data))
      .catch(e => setError(e.response?.data?.message || 'Order not found'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading order details…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-sm px-4">
        <XCircle className="text-red-400 mx-auto mb-4" size={48} />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <Link href="/" className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700">
          Go to Homepage
        </Link>
      </div>
    </div>
  )

  const status = data?.status ?? 0
  const statusInfo = ORDER_STATUS[status] || ORDER_STATUS[0]
  const StatusIcon = statusInfo.icon
  const activeStep = Math.min(status, 5)
  const isCancelled = [6, 7, 8, 9].includes(status)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Leaf size={22} className="text-emerald-600" />
            <span className="font-bold text-gray-900 text-lg">Oroganix</span>
          </Link>
          <span className="text-sm text-gray-500">Order Tracking</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Status Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${statusInfo.color}18` }}>
              <StatusIcon size={28} style={{ color: statusInfo.color }} />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-0.5">Invoice #{data?.invoice_no || '—'}</p>
              <h1 className="text-xl font-bold text-gray-900">{statusInfo.label}</h1>
              {data?.expected_delivery_date && status < 5 && (
                <p className="text-sm text-emerald-600 mt-0.5">
                  Expected: {new Date(data.expected_delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
                </p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {!isCancelled && (
            <div className="relative">
              <div className="flex justify-between items-center">
                {STEPS.map((step, i) => {
                  const s = ORDER_STATUS[step]
                  const Icon = s.icon
                  const done = activeStep >= step
                  return (
                    <div key={step} className="flex flex-col items-center relative z-10" style={{ width: '16.66%' }}>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${done ? 'border-emerald-500 bg-emerald-500' : 'border-gray-200 bg-white'}`}
                      >
                        <Icon size={14} color={done ? 'white' : '#9ca3af'} />
                      </div>
                      <span className="text-[10px] text-center mt-1 text-gray-500 leading-tight" style={{ maxWidth: 50 }}>
                        {['Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivery', 'Delivered'][i]}
                      </span>
                    </div>
                  )
                })}
              </div>
              {/* Connector line */}
              <div className="absolute top-4 left-[8.33%] right-[8.33%] h-0.5 bg-gray-200 -z-0">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, (activeStep / 5) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Shipping info */}
        {(data?.tracking_number || data?.courier_name || data?.tracking?.location) && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Truck size={16} className="text-emerald-600" /> Shipping Details
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              {data.courier_name && <p><span className="font-medium">Courier:</span> {data.courier_name}</p>}
              {data.tracking_number && <p><span className="font-medium">AWB / Tracking #:</span> {data.tracking_number}</p>}
              {data.shipped_at && <p><span className="font-medium">Shipped on:</span> {new Date(data.shipped_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
              {data.tracking?.location && <p><span className="font-medium">Last location:</span> {data.tracking.location}</p>}
            </div>
          </div>
        )}

        {/* Items */}
        {data?.items?.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package size={16} className="text-emerald-600" /> Items Ordered
            </h3>
            <div className="space-y-3">
              {data.items.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    {item.variant_label && <p className="text-xs text-gray-500">{item.variant_label}</p>}
                    <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between text-sm">
              <span className="text-gray-500">Total Amount</span>
              <span className="font-bold text-gray-900">₹{Number(data.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}

        {/* Order date */}
        <p className="text-center text-xs text-gray-400">
          Order placed on {data?.created_at ? new Date(data.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
        </p>
      </div>
    </div>
  )
}
