'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ChevronLeft, Package, Truck, CheckCircle2, Clock, XCircle,
  RotateCcw, AlertCircle, MapPin, Phone, Download, RefreshCw,
  ExternalLink, Calendar, Star,
} from 'lucide-react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'

/* ── Status meta ── */
const STATUS_MAP: Record<number, { label: string; color: string; bg: string; icon: any; emoji: string }> = {
  0: { label: 'Order Placed',      color: '#d97706', bg: '#fffbeb', icon: Clock,        emoji: '🕐' },
  1: { label: 'Confirmed',         color: '#2563eb', bg: '#eff6ff', icon: CheckCircle2, emoji: '✅' },
  2: { label: 'Processing',        color: '#7c3aed', bg: '#f5f3ff', icon: RefreshCw,    emoji: '⚙️' },
  3: { label: 'Shipped',           color: '#0891b2', bg: '#ecfeff', icon: Truck,        emoji: '📦' },
  4: { label: 'Out for Delivery',  color: '#ea580c', bg: '#fff7ed', icon: Truck,        emoji: '🚚' },
  5: { label: 'Delivered',         color: '#16a34a', bg: '#f0fdf4', icon: CheckCircle2, emoji: '🎉' },
  6: { label: 'Cancelled',         color: '#dc2626', bg: '#fef2f2', icon: XCircle,      emoji: '❌' },
  7: { label: 'Return Requested',  color: '#d97706', bg: '#fffbeb', icon: RotateCcw,    emoji: '↩️' },
  8: { label: 'Returned',          color: '#6b7280', bg: '#f9fafb', icon: RotateCcw,    emoji: '💰' },
  9: { label: 'Refunded',          color: '#16a34a', bg: '#f0fdf4', icon: CheckCircle2, emoji: '✔️' },
}

const ACTIVE_STEPS = [0, 1, 2, 3, 4, 5]

/* ── Carrier tracking URLs ── */
const CARRIER_URLS: Record<string, (n: string) => string> = {
  'delhivery':   n => `https://www.delhivery.com/track/package/${n}`,
  'bluedart':    n => `https://www.bluedart.com/tracking`,
  'blue dart':   n => `https://www.bluedart.com/tracking`,
  'ekart':       n => `https://ekartlogistics.com/track/${n}`,
  'xpressbees':  n => `https://www.xpressbees.com/shipment/tracking/?awb=${n}`,
  'xpressbee':   n => `https://www.xpressbees.com/shipment/tracking/?awb=${n}`,
  'dtdc':        n => `https://www.dtdc.in/tracking/tracking_results.asp?track_type=consignment&strCnno=${n}`,
  'shadowfax':   n => `https://www.shadowfax.in/`,
  'ecom express':n => `https://ecomexpress.in/tracking/?awb_field=${n}`,
  'india post':  n => `https://www.indiapost.gov.in/vas/pages/AnonymousTracking.aspx`,
  'speed post':  n => `https://www.indiapost.gov.in/vas/pages/AnonymousTracking.aspx`,
  'amazon':      n => `https://track.amazon.in/tracking/${n}`,
  'fedex':       n => `https://www.fedex.com/en-in/tracking.html?trknbr=${n}`,
  'dhl':         n => `https://www.dhl.com/in-en/home/tracking.html?tracking-id=${n}`,
}

function getCarrierUrl(courier: string, tracking: string): string | null {
  const key = courier.toLowerCase().trim()
  for (const [name, fn] of Object.entries(CARRIER_URLS)) {
    if (key.includes(name)) return fn(tracking)
  }
  return null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [trackingInfo, setTrackingInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [returnReason, setReturnReason] = useState('')
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [returning, setReturning] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [reordering, setReordering] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      axios.get(`/orders/${id}`),
      axios.get(`/orders/${id}/timeline`),
    ])
      .then(([orderRes, timelineRes]) => {
        setOrder(orderRes.data?.data)
        setTimeline(timelineRes.data?.timeline || [])
        setTrackingInfo(timelineRes.data?.tracking || null)
      })
      .catch(() => toast.error('Order not found'))
      .finally(() => setLoading(false))
  }, [id])

  const cancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return
    setCancelling(true)
    try {
      await axios.post(`/orders/${id}/cancel`, { reason: 'Customer requested cancellation' })
      toast.success('Order cancelled')
      window.location.reload()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel order')
    } finally { setCancelling(false) }
  }

  const retryPayment = async () => {
    setRetrying(true)
    try {
      const res = await axios.post(`/orders/${id}/retry-payment`)
      const { razorpayOrderId, amount, orderId } = res.data
      const rzp = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
        amount, currency: 'INR', order_id: razorpayOrderId,
        name: 'AyurVeda', description: `Order #${orderId}`,
        handler: async (response: any) => {
          try {
            await axios.post('/orders/verify', { orderId, ...response })
            toast.success('Payment successful!')
            window.location.reload()
          } catch { toast.error('Payment verification failed') }
        },
        theme: { color: '#2d5a3d' },
      })
      rzp.open()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed')
    } finally { setRetrying(false) }
  }

  const reorderItems = async () => {
    if (!order?.items?.length) return
    setReordering(true)
    try {
      for (const item of order.items) {
        await axios.post('/cart', { productId: item.product_id, quantity: item.quantity, variantId: item.variant_id || undefined })
      }
      toast.success('Items added to cart!')
      router.push('/cart')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add items to cart')
    } finally { setReordering(false) }
  }

  const submitReturn = async () => {
    if (!returnReason.trim()) { toast.error('Please provide a return reason'); return }
    setReturning(true)
    try {
      await axios.post(`/orders/${id}/return`, { reason: returnReason })
      toast.success('Return request submitted')
      setShowReturnForm(false)
      window.location.reload()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed')
    } finally { setReturning(false) }
  }

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
    </div>
  )

  if (!order) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <AlertCircle size={52} className="text-red-400" />
      <h2 className="text-xl font-semibold text-gray-700">Order not found</h2>
      <Link href="/account" className="text-green-600 hover:underline text-sm">← My Orders</Link>
    </div>
  )

  const statusMeta = STATUS_MAP[order.status] ?? STATUS_MAP[0]
  const StatusIcon = statusMeta.icon
  const isCancellable = [0, 1].includes(order.status)
  const isReturnable = order.status === 5
  const canRetryPayment = order.payment_method === 'online' && order.payment_status === 'unpaid' && order.status !== 6
  const addr = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address
  const isCancelledOrReturned = [6, 7, 8, 9].includes(order.status)
  const currentStep = isCancelledOrReturned ? -1 : Math.min(order.status, 5)

  const courier = trackingInfo?.courier_name || order.courier_name
  const trackingNum = trackingInfo?.tracking_number || order.tracking_number
  const carrierUrl = courier && trackingNum ? getCarrierUrl(courier, trackingNum) : null
  const eta = trackingInfo?.estimated_delivery

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-20">
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      <Link href="/account" className="inline-flex items-center gap-1.5 text-green-700 text-sm mb-6 hover:text-green-800">
        <ChevronLeft size={15} /> My Orders
      </Link>

      {/* ── Header Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 flex flex-wrap justify-between items-start gap-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">Order #{order.invoice_no || order.id}</p>
          <p className="text-2xl font-bold text-gray-900">₹{Number(order.total_amount).toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">Placed on {formatDate(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border-2" style={{ background: statusMeta.bg, borderColor: `${statusMeta.color}40` }}>
          <span className="text-base">{statusMeta.emoji}</span>
          <span className="text-sm font-semibold" style={{ color: statusMeta.color }}>{statusMeta.label}</span>
        </div>
      </div>

      {/* ── ETA + Tracking Banner ── */}
      {(courier || eta) && (
        <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-2xl p-4 mb-4 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Truck size={20} />
              </div>
              <div>
                {courier && <p className="font-semibold text-sm">{courier}</p>}
                {trackingNum && <p className="text-xs text-green-200 font-mono mt-0.5">{trackingNum}</p>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {eta && (
                <div className="text-right">
                  <p className="text-xs text-green-200">Estimated Delivery</p>
                  <p className="font-bold text-sm flex items-center gap-1">
                    <Calendar size={12} /> {formatDate(eta)}
                  </p>
                </div>
              )}
              {carrierUrl && (
                <a
                  href={carrierUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-white text-green-700 text-xs font-bold px-3 py-2 rounded-lg hover:bg-green-50 transition-colors"
                >
                  Track Shipment <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Progress Steps ── */}
      {!isCancelledOrReturned && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-5">Order Progress</p>
          <div className="relative flex items-start">
            {ACTIVE_STEPS.map((step, idx) => {
              const meta = STATUS_MAP[step]
              const done = currentStep >= step
              const active = currentStep === step
              const Icon = meta.icon
              return (
                <div key={step} className="flex-1 flex flex-col items-center relative">
                  {idx < ACTIVE_STEPS.length - 1 && (
                    <div className="absolute top-5 left-1/2 w-full h-0.5 transition-all duration-500"
                      style={{ background: done && currentStep > step ? meta.color : '#e5e7eb' }} />
                  )}
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: active ? 1.15 : 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="w-10 h-10 rounded-full flex items-center justify-center z-10 relative transition-all duration-300"
                    style={{
                      background: done ? meta.color : '#f3f4f6',
                      border: `3px solid ${done ? meta.color : '#e5e7eb'}`,
                      boxShadow: active ? `0 0 0 4px ${meta.color}25` : undefined,
                    }}
                  >
                    <Icon size={15} color={done ? 'white' : '#9ca3af'} />
                  </motion.div>
                  <p className="text-center mt-2 leading-tight" style={{ fontSize: 10, fontWeight: done ? 600 : 400, color: done ? meta.color : '#9ca3af', maxWidth: 64 }}>
                    {meta.label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Status Timeline ── */}
      {timeline.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-4">Tracking History</p>
          <div className="space-y-0">
            {[...timeline].reverse().map((log, idx) => {
              const st = STATUS_MAP[log.new_status]
              const Icon = st?.icon ?? CheckCircle2
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex gap-4 relative pb-5 last:pb-0"
                >
                  {idx < timeline.length - 1 && (
                    <div className="absolute left-[15px] top-8 w-0.5 h-full bg-gray-100" />
                  )}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                    style={{ background: st ? `${st.color}18` : '#e8f5ee', border: `2px solid ${st?.color || '#4a7c5e'}` }}>
                    <Icon size={13} style={{ color: st?.color || '#4a7c5e' }} />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-sm font-semibold text-gray-800">{log.new_label || st?.label || 'Status Updated'}</p>
                    {log.note && <p className="text-xs text-gray-500 mt-0.5">{log.note}</p>}
                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(log.created_at)}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Items ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-4">Items Ordered ({order.items?.length})</p>
        <div className="space-y-3">
          {order.items?.map((item: any, i: number) => (
            <div key={i} className="flex gap-3 items-center">
              <img src={item.image || '/placeholder.png'} alt={item.name}
                className="w-14 h-14 rounded-xl object-cover bg-green-50 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                {item.variant_label && <p className="text-xs text-green-600 font-medium mt-0.5">{item.variant_label}</p>}
                <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-bold text-gray-800 flex-shrink-0">₹{(Number(item.price) * Number(item.quantity)).toFixed(2)}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between">
          <span className="text-sm font-semibold text-gray-700">Total Paid</span>
          <span className="text-lg font-bold text-gray-900">₹{Number(order.total_amount).toFixed(2)}</span>
        </div>
        {/* Write Review CTA for delivered orders */}
        {order.status === 5 && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3 bg-amber-50 rounded-xl p-3">
            <Star size={18} className="text-amber-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">How was your experience?</p>
              <p className="text-xs text-gray-500">Share your thoughts on the products</p>
            </div>
            <Link href={`/account?tab=orders`}
              className="text-xs font-semibold text-amber-600 bg-amber-100 px-3 py-1.5 rounded-lg hover:bg-amber-200 flex-shrink-0">
              Write Review
            </Link>
          </div>
        )}
      </div>

      {/* ── Delivery Address ── */}
      {addr && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={15} className="text-green-600" />
            <p className="text-sm font-semibold text-gray-700">Delivery Address</p>
          </div>
          <p className="text-sm font-medium text-gray-800">{addr.name}</p>
          <p className="text-sm text-gray-500 leading-relaxed mt-1">
            {addr.address}<br />
            {addr.city}, {addr.state} – {addr.pincode}
          </p>
          {addr.phone && (
            <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-2"><Phone size={11} />{addr.phone}</p>
          )}
        </div>
      )}

      {/* ── Payment Status ── */}
      {canRetryPayment && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Payment Pending</p>
              <p className="text-xs text-amber-700 mt-0.5">Your order needs payment to be confirmed.</p>
            </div>
          </div>
          <button onClick={retryPayment} disabled={retrying}
            className="bg-amber-500 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-amber-600 disabled:opacity-50">
            {retrying ? 'Loading...' : '💳 Pay Now'}
          </button>
        </div>
      )}

      {/* ── Invoice ── */}
      {order.pdf_url && (
        <div className="mb-4">
          <a href={order.pdf_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700">
            <Download size={14} /> Download Invoice
          </a>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex flex-wrap gap-3">
        {isCancellable && (
          <button onClick={cancelOrder} disabled={cancelling}
            className="flex items-center gap-2 border-2 border-red-200 text-red-600 bg-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 disabled:opacity-50">
            <XCircle size={15} /> {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
        {isReturnable && !showReturnForm && (
          <button onClick={() => setShowReturnForm(true)}
            className="flex items-center gap-2 border-2 border-orange-200 text-orange-600 bg-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-50">
            <RotateCcw size={15} /> Request Return
          </button>
        )}
        {[5, 6].includes(order.status) && (
          <button onClick={reorderItems} disabled={reordering}
            className="flex items-center gap-2 bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-800 disabled:opacity-50">
            <RefreshCw size={15} /> {reordering ? 'Adding...' : '🛒 Re-order'}
          </button>
        )}
      </div>

      {/* ── Return Form ── */}
      {showReturnForm && (
        <div className="mt-4 bg-white rounded-2xl border-2 border-orange-100 p-5">
          <p className="text-sm font-semibold text-gray-800 mb-3">Return Reason</p>
          <textarea value={returnReason} onChange={e => setReturnReason(e.target.value)}
            placeholder="Please describe why you want to return..." rows={3}
            className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400" />
          <div className="flex gap-3 mt-3">
            <button onClick={submitReturn} disabled={returning}
              className="bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 disabled:opacity-50">
              {returning ? 'Submitting...' : 'Submit Return'}
            </button>
            <button onClick={() => setShowReturnForm(false)}
              className="border border-gray-200 text-gray-500 px-5 py-2.5 rounded-xl text-sm hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
