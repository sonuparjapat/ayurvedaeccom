'use client'

import React, { useEffect, useState } from 'react'
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
import { useAuth } from '@/context/auth-context'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

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
  const [returnFiles, setReturnFiles] = useState<{ file: File; preview: string }[]>([])
  const [returnUrlInput, setReturnUrlInput] = useState('')
  const [returnUrlImages, setReturnUrlImages] = useState<string[]>([])
  const [retrying, setRetrying] = useState(false)
  const [reordering, setReordering] = useState(false)

  // Per-item review form
  const [reviewingProductId, setReviewingProductId] = useState<number | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewFileImgs, setReviewFileImgs] = useState<{ file: File; preview: string }[]>([])
  const [reviewExistingImgs, setReviewExistingImgs] = useState<string[]>([])
  const [reviewUrlInput, setReviewUrlInput] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewFetching, setReviewFetching] = useState(false)

  const { loginuserdata } = useAuth()

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
      const form = new FormData()
      form.append('reason', returnReason)
      returnFiles.forEach(f => form.append('images', f.file))
      form.append('imageUrls', JSON.stringify(returnUrlImages))
      await axios.post(`/orders/${id}/return`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Return request submitted')
      setShowReturnForm(false)
      setReturnFiles([])
      setReturnUrlImages([])
      setReturnUrlInput('')
      window.location.reload()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed')
    } finally { setReturning(false) }
  }

  const openReviewForm = async (productId: number) => {
    if (reviewingProductId === productId) {
      setReviewingProductId(null)
      return
    }
    setReviewingProductId(productId)
    setReviewRating(0)
    setReviewComment('')
    setReviewFileImgs([])
    setReviewExistingImgs([])
    setReviewUrlInput('')
    setReviewFetching(true)
    try {
      const { data } = await axios.get(`/shop/reviews/product/${productId}`, { params: { me: 1 } })
      const reviews = data.data || []
      const mine = reviews[0]
      if (mine) {
        setReviewRating(mine.rating || 0)
        setReviewComment(mine.comment || '')
        setReviewExistingImgs(mine.images || [])
      }
    } catch {}
    finally { setReviewFetching(false) }
  }

  const submitProductReview = async (productId: number) => {
    if (!loginuserdata) { toast.error('Please login to submit a review'); return }
    if (!reviewRating) { toast.error('Please select a star rating'); return }
    try {
      setReviewSubmitting(true)
      const form = new FormData()
      form.append('productId', String(productId))
      form.append('rating', String(reviewRating))
      form.append('comment', reviewComment)
      form.append('oldImages', JSON.stringify(reviewExistingImgs))
      reviewFileImgs.forEach(img => form.append('images', img.file))
      await axios.post('/shop/reviews/product', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Review saved!')
      setReviewingProductId(null)
      setReviewFileImgs([])
      setReviewExistingImgs([])
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit review')
    } finally { setReviewSubmitting(false) }
  }

  if (loading) return (
    <>
      <Header />
      <div style={{ minHeight: '80vh', background: 'linear-gradient(160deg,#061812 0%,#0f2d1e 40%,#0d1a08 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(16,185,129,0.2)', borderTopColor: '#10b981', borderRadius: '50%' }} className="animate-spin" />
      </div>
      <Footer />
    </>
  )

  if (!order) return (
    <>
      <Header />
      <div style={{ minHeight: '80vh', background: 'linear-gradient(160deg,#061812 0%,#0f2d1e 40%,#0d1a08 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <AlertCircle size={52} color="#f87171" />
        <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 600, margin: 0 }}>Order not found</h2>
        <Link href="/account?tab=orders" style={{ color: '#34d399', fontSize: 14, textDecoration: 'none' }}>← My Orders</Link>
      </div>
      <Footer />
    </>
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

  /* glass card style shared across sections */
  const gc: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: 20,
    marginBottom: 16,
  }

  return (
    <>
      <Header />
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#061812 0%,#0f2d1e 40%,#0d1a08 100%)', paddingBottom: 80 }}>
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />

        {/* ── Page top accent ── */}
        <div style={{ height: 3, background: 'linear-gradient(90deg,transparent,#059669 30%,#10b981 50%,#059669 70%,transparent)', boxShadow: '0 0 24px rgba(16,185,129,0.5)' }} />

        <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 16px 0' }}>

          <Link href="/account?tab=orders" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 24, textDecoration: 'none', fontWeight: 500 }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#34d399'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'}
          >
            <ChevronLeft size={15} /> My Orders
          </Link>

          {/* ── HERO ORDER CARD ── */}
          <div style={{ ...gc, padding: '24px', marginBottom: 16, background: 'linear-gradient(135deg,rgba(6,95,70,0.3) 0%,rgba(2,30,20,0.7) 100%)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 4, letterSpacing: 1 }}>ORDER #{order.invoice_no || order.id}</p>
                <p style={{ color: '#fff', fontSize: 32, fontWeight: 900, margin: '0 0 4px', letterSpacing: -1 }}>
                  ₹{Number(order.total_amount).toFixed(2)}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Placed on {formatDate(order.created_at)}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: `${statusMeta.color}20`, border: `1.5px solid ${statusMeta.color}50`, borderRadius: 12, padding: '8px 16px' }}>
                <span style={{ fontSize: 18 }}>{statusMeta.emoji}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: statusMeta.color }}>{statusMeta.label}</span>
              </div>
            </div>
          </div>

          {/* ── ETA + Tracking Banner ── */}
          {(courier || eta) && (
            <div style={{ ...gc, padding: 20, background: 'linear-gradient(135deg,rgba(5,150,105,0.25) 0%,rgba(2,30,20,0.7) 100%)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, background: 'rgba(16,185,129,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16,185,129,0.3)' }}>
                    <Truck size={20} color="#34d399" />
                  </div>
                  <div>
                    {courier && <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, margin: 0 }}>{courier}</p>}
                    {trackingNum && <p style={{ color: '#6ee7b7', fontFamily: 'monospace', fontSize: 12, margin: '2px 0 0' }}>{trackingNum}</p>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {eta && (
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>Estimated Delivery</p>
                      <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} /> {formatDate(eta)}
                      </p>
                    </div>
                  )}
                  {carrierUrl && (
                    <a href={carrierUrl} target="_blank" rel="noopener noreferrer" style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: '#059669', color: '#fff', fontSize: 12, fontWeight: 700,
                      padding: '8px 14px', borderRadius: 10, textDecoration: 'none',
                      boxShadow: '0 4px 16px rgba(5,150,105,0.4)'
                    }}>
                      Track Shipment <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Progress Steps ── */}
          {!isCancelledOrReturned && (
            <div style={{ ...gc, padding: '20px 20px 24px' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 20, margin: '0 0 20px' }}>Order Progress</p>
              <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
                {ACTIVE_STEPS.map((step, idx) => {
                  const meta = STATUS_MAP[step]
                  const done = currentStep >= step
                  const active = currentStep === step
                  const Icon = meta.icon
                  return (
                    <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                      {idx < ACTIVE_STEPS.length - 1 && (
                        <div style={{
                          position: 'absolute', top: 20, left: '50%', width: '100%', height: 2,
                          background: done && currentStep > step
                            ? `linear-gradient(90deg,${meta.color},${STATUS_MAP[step + 1]?.color || meta.color})`
                            : 'rgba(255,255,255,0.08)',
                          transition: 'all 0.5s ease'
                        }} />
                      )}
                      <motion.div
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: active ? 1.2 : 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 300, delay: idx * 0.08 }}
                        style={{
                          width: 40, height: 40, borderRadius: '50%', position: 'relative', zIndex: 2,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: done ? meta.color : 'rgba(255,255,255,0.06)',
                          border: `2.5px solid ${done ? meta.color : 'rgba(255,255,255,0.12)'}`,
                          boxShadow: active ? `0 0 0 6px ${meta.color}25, 0 4px 20px ${meta.color}40` : done ? `0 2px 12px ${meta.color}40` : 'none',
                          transition: 'all 0.4s ease'
                        }}
                      >
                        <Icon size={15} color={done ? 'white' : 'rgba(255,255,255,0.25)'} />
                      </motion.div>
                      <p style={{ textAlign: 'center', marginTop: 8, fontSize: 9, fontWeight: done ? 700 : 400, color: done ? meta.color : 'rgba(255,255,255,0.25)', maxWidth: 64, lineHeight: 1.4 }}>
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
            <div style={{ ...gc, padding: 20 }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 20px' }}>Tracking History</p>
              <div>
                {[...timeline].reverse().map((log, idx) => {
                  const st = STATUS_MAP[log.new_status]
                  const Icon = st?.icon ?? CheckCircle2
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      style={{ display: 'flex', gap: 16, position: 'relative', paddingBottom: idx < timeline.length - 1 ? 20 : 0 }}
                    >
                      {idx < timeline.length - 1 && (
                        <div style={{ position: 'absolute', left: 15, top: 32, width: 2, height: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: 2 }} />
                      )}
                      <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, background: st ? `${st.color}20` : 'rgba(16,185,129,0.15)', border: `1.5px solid ${st?.color || '#059669'}` }}>
                        <Icon size={13} color={st?.color || '#34d399'} />
                      </div>
                      <div style={{ paddingTop: 2 }}>
                        <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: 0 }}>{log.new_label || st?.label || 'Status Updated'}</p>
                        {log.note && <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, margin: '3px 0 0' }}>{log.note}</p>}
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '4px 0 0' }}>{formatDateTime(log.created_at)}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Items ── */}
          <div style={{ ...gc, padding: 20 }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 16px' }}>Items Ordered ({order.items?.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {order.items?.map((item: any, i: number) => (
                <div key={i}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <img src={item.image || '/placeholder.png'} alt={item.name} style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover', background: 'rgba(255,255,255,0.05)', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                      {item.variant_label && <p style={{ color: '#34d399', fontSize: 11, fontWeight: 600, margin: '2px 0 0' }}>{item.variant_label}</p>}
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '2px 0 0' }}>Qty: {item.quantity}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <p style={{ color: '#fff', fontSize: 14, fontWeight: 700, margin: 0 }}>₹{(Number(item.price) * Number(item.quantity)).toFixed(2)}</p>
                      {order.status === 5 && (
                        <button onClick={() => openReviewForm(item.product_id)} style={{
                          fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, border: '1px solid',
                          cursor: 'pointer', transition: 'all 0.2s',
                          ...(reviewingProductId === item.product_id
                            ? { color: '#fde68a', background: 'rgba(245,158,11,0.2)', borderColor: 'rgba(245,158,11,0.4)' }
                            : { color: '#fbbf24', background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.25)' })
                        }}>
                          {reviewingProductId === item.product_id ? '✕ Close' : '⭐ Review'}
                        </button>
                      )}
                    </div>
                  </div>

                  {reviewingProductId === item.product_id && (
                    <div style={{ marginTop: 12, padding: 16, borderRadius: 14, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                      {reviewFetching ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fbbf24', fontSize: 13 }}>
                          <div className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(251,191,36,0.3)', borderTopColor: '#fbbf24', borderRadius: '50%' }} />
                          Loading your review...
                        </div>
                      ) : (
                        <>
                          <p style={{ color: '#fde68a', fontSize: 13, fontWeight: 600, margin: '0 0 12px' }}>
                            {reviewRating > 0 ? 'Edit Your Review' : 'Write a Review'}
                            <span style={{ color: 'rgba(253,230,138,0.6)', fontWeight: 400 }}> · {item.name}</span>
                          </p>
                          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} size={24} onClick={() => setReviewRating(s)} fill={s <= reviewRating ? '#f59e0b' : 'none'} color={s <= reviewRating ? '#f59e0b' : 'rgba(255,255,255,0.2)'} style={{ cursor: 'pointer' }} />
                            ))}
                          </div>
                          <textarea
                            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: 12, fontSize: 13, color: '#fff', resize: 'none', outline: 'none', marginBottom: 10, boxSizing: 'border-box' }}
                            placeholder="Share your experience with this product..."
                            rows={3} value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                          />
                          {reviewExistingImgs.length > 0 && (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                              {reviewExistingImgs.map((url, idx) => (
                                <div key={idx} style={{ position: 'relative', width: 60, height: 60, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(245,158,11,0.25)' }}>
                                  <img src={url} alt="review" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  <button onClick={() => setReviewExistingImgs(prev => prev.filter((_, j) => j !== idx))} style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 9, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                                </div>
                              ))}
                            </div>
                          )}
                          {reviewFileImgs.length > 0 && (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                              {reviewFileImgs.map((img, idx) => (
                                <div key={idx} style={{ position: 'relative', width: 60, height: 60, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(245,158,11,0.25)' }}>
                                  <img src={img.preview} alt="new" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  <button onClick={() => setReviewFileImgs(prev => prev.filter((_, j) => j !== idx))} style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 9, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                            <input type="url" value={reviewUrlInput} onChange={e => setReviewUrlInput(e.target.value)} placeholder="Paste image URL (optional)..."
                              style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#fff', outline: 'none' }} />
                            <button onClick={() => { const url = reviewUrlInput.trim(); if (url && reviewExistingImgs.length + reviewFileImgs.length < 5) { setReviewExistingImgs(prev => [...prev, url]); setReviewUrlInput('') } }}
                              disabled={!reviewUrlInput.trim() || reviewExistingImgs.length + reviewFileImgs.length >= 5}
                              style={{ background: '#d97706', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: (!reviewUrlInput.trim() || reviewExistingImgs.length + reviewFileImgs.length >= 5) ? 0.4 : 1 }}>Add</button>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <button onClick={() => submitProductReview(item.product_id)} disabled={reviewSubmitting || !reviewRating}
                              style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: (reviewSubmitting || !reviewRating) ? 0.5 : 1 }}>
                              {reviewSubmitting ? 'Saving...' : 'Submit Review'}
                            </button>
                            {reviewExistingImgs.length + reviewFileImgs.length < 5 && (
                              <label style={{ cursor: 'pointer', fontSize: 12, color: '#fbbf24', fontWeight: 600, border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '8px 14px' }}>
                                + Add Photos
                                <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => {
                                  const files = Array.from(e.target.files || []).filter((f: any) => f.type.startsWith('image/'))
                                  const remaining = 5 - reviewExistingImgs.length - reviewFileImgs.length
                                  const toAdd = files.slice(0, remaining)
                                  setReviewFileImgs(prev => [...prev, ...toAdd.map((f: any) => ({ file: f, preview: URL.createObjectURL(f) }))])
                                  e.target.value = ''
                                }} />
                              </label>
                            )}
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{reviewExistingImgs.length + reviewFileImgs.length}/5 photos</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 16, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {order.coupon_code && Number(order.discount_amount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#34d399' }}>🎁 Coupon ({order.coupon_code})</span>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>−₹{Number(order.discount_amount).toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 600 }}>
                  {order.payment_status === 'paid' ? 'Total Paid' : order.payment_method === 'cod' ? 'Pay on Delivery' : 'Order Total'}
                </span>
                <span style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>₹{Number(order.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* ── Delivery Address ── */}
          {addr && (
            <div style={{ ...gc, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <MapPin size={15} color="#34d399" />
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', margin: 0 }}>Delivery Address</p>
              </div>
              <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>{addr.name}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6, margin: '4px 0 0' }}>
                {addr.address}<br />{addr.city}, {addr.state} – {addr.pincode}
              </p>
              {addr.phone && <p style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: '8px 0 0' }}><Phone size={11} />{addr.phone}</p>}
            </div>
          )}

          {/* ── Payment Pending ── */}
          {canRetryPayment && (
            <div style={{ ...gc, padding: 20, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ color: '#fde68a', fontSize: 14, fontWeight: 700, margin: 0 }}>Payment Pending</p>
                  <p style={{ color: 'rgba(253,230,138,0.6)', fontSize: 12, margin: '3px 0 0' }}>Your order needs payment to be confirmed.</p>
                </div>
              </div>
              <button onClick={retryPayment} disabled={retrying} style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: retrying ? 0.6 : 1 }}>
                {retrying ? 'Loading...' : '💳 Pay Now'}
              </button>
            </div>
          )}

          {/* ── Invoice ── */}
          {order.pdf_url && (
            <div style={{ marginBottom: 16 }}>
              <a href={order.pdf_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                <Download size={14} /> Download Invoice
              </a>
            </div>
          )}

          {/* ── Actions ── */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {isCancellable && (
              <button onClick={cancelOrder} disabled={cancelling} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: cancelling ? 0.5 : 1 }}>
                <XCircle size={15} /> {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}
            {isReturnable && !showReturnForm && (
              <button onClick={() => setShowReturnForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', color: '#fb923c', padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                <RotateCcw size={15} /> Request Return
              </button>
            )}
            {[5, 6].includes(order.status) && (
              <button onClick={reorderItems} disabled={reordering} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#059669,#10b981)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: reordering ? 0.5 : 1, boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
                <RefreshCw size={15} /> {reordering ? 'Adding...' : '🛒 Re-order'}
              </button>
            )}
          </div>

          {/* ── Return Form ── */}
          {showReturnForm && (
            <div style={{ ...gc, padding: 20, marginTop: 16, background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <p style={{ color: '#fb923c', fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>Return Request</p>

              {/* Reason */}
              <textarea value={returnReason} onChange={e => setReturnReason(e.target.value)} placeholder="Please describe why you want to return..." rows={3}
                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 12, padding: 12, fontSize: 13, color: '#fff', resize: 'none', outline: 'none', boxSizing: 'border-box' }} />

              {/* Photo evidence */}
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, margin: '14px 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                📷 Photo Evidence <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional — helps speed up approval)</span>
              </p>

              {/* Uploaded previews */}
              {(returnFiles.length > 0 || returnUrlImages.length > 0) && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {returnFiles.map((f, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={f.preview} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(249,115,22,0.3)' }} />
                      <button onClick={() => setReturnFiles(prev => prev.filter((_, idx) => idx !== i))}
                        style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#dc2626', border: 'none', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  ))}
                  {returnUrlImages.map((url, i) => (
                    <div key={`u${i}`} style={{ position: 'relative' }}>
                      <img src={url} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(249,115,22,0.3)' }} />
                      <button onClick={() => setReturnUrlImages(prev => prev.filter((_, idx) => idx !== i))}
                        style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#dc2626', border: 'none', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* File upload + URL input */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 8, fontSize: 12, color: '#fb923c', cursor: 'pointer', fontWeight: 600 }}>
                  📁 Upload Photos
                  <input type="file" multiple accept="image/*" style={{ display: 'none' }}
                    onChange={e => {
                      const files = Array.from(e.target.files || [])
                      const toAdd = files.slice(0, 5 - returnFiles.length - returnUrlImages.length)
                      setReturnFiles(prev => [...prev, ...toAdd.map(f => ({ file: f, preview: URL.createObjectURL(f) }))])
                      e.target.value = ''
                    }} />
                </label>
                <div style={{ display: 'flex', gap: 6, flex: 1, minWidth: 200 }}>
                  <input
                    value={returnUrlInput}
                    onChange={e => setReturnUrlInput(e.target.value)}
                    placeholder="Or paste image URL..."
                    style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 8, padding: '7px 12px', fontSize: 12, color: '#fff', outline: 'none' }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && returnUrlInput.startsWith('http') && returnFiles.length + returnUrlImages.length < 5) {
                        setReturnUrlImages(prev => [...prev, returnUrlInput])
                        setReturnUrlInput('')
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (returnUrlInput.startsWith('http') && returnFiles.length + returnUrlImages.length < 5) {
                        setReturnUrlImages(prev => [...prev, returnUrlInput])
                        setReturnUrlInput('')
                      }
                    }}
                    style={{ padding: '7px 12px', background: 'rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 8, color: '#fb923c', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                    Add
                  </button>
                </div>
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>Max 5 photos · JPG, PNG, WEBP</p>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={submitReturn} disabled={returning} style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: returning ? 0.5 : 1 }}>
                  {returning ? 'Submitting...' : 'Submit Return'}
                </button>
                <button onClick={() => { setShowReturnForm(false); setReturnFiles([]); setReturnUrlImages([]); setReturnUrlInput('') }}
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 20px', fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </>
  )
}
