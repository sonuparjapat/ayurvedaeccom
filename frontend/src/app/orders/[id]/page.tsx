'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ChevronLeft, Package, Truck, CheckCircle2, Clock, XCircle,
  RotateCcw, AlertCircle, MapPin, Phone, Download, RefreshCw,
} from 'lucide-react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'

/* ── Status meta ── */
const STATUS_MAP: Record<number, { label: string; color: string; icon: any }> = {
  0: { label: 'Pending', color: '#e07a2a', icon: Clock },
  1: { label: 'Confirmed', color: '#4a7c5e', icon: CheckCircle2 },
  2: { label: 'Processing', color: '#3b82f6', icon: RefreshCw },
  3: { label: 'Shipped', color: '#6366f1', icon: Truck },
  4: { label: 'Out for Delivery', color: '#8b5cf6', icon: Truck },
  5: { label: 'Delivered', color: '#16a34a', icon: CheckCircle2 },
  6: { label: 'Cancelled', color: '#e05252', icon: XCircle },
  7: { label: 'Return Requested', color: '#e07a2a', icon: RotateCcw },
  8: { label: 'Returned', color: '#888', icon: RotateCcw },
}

/* ── Timeline steps (all statuses in order for the visual progress bar) ── */
const TIMELINE_STEPS = [0, 1, 2, 3, 4, 5]

export default function OrderDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [returnReason, setReturnReason] = useState('')
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [returning, setReturning] = useState(false)
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      axios.get(`/orders/${id}`),
      axios.get(`/orders/${id}/timeline`),
    ])
      .then(([orderRes, timelineRes]) => {
        setOrder(orderRes.data?.data)
        setTimeline(timelineRes.data?.timeline || [])
      })
      .catch(() => toast.error('Order not found'))
      .finally(() => setLoading(false))
  }, [id])

  const cancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return
    setCancelling(true)
    try {
      await axios.post(`/orders/${id}/cancel`, { reason: 'Customer requested cancellation' })
      toast.success('Order cancelled successfully')
      router.refresh()
      window.location.reload()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  const retryPayment = async () => {
    setRetrying(true)
    try {
      const res = await axios.post(`/orders/${id}/retry-payment`)
      const { razorpayOrderId, amount, orderId } = res.data
      const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY
      const rzp = new (window as any).Razorpay({
        key,
        amount,
        currency: 'INR',
        order_id: razorpayOrderId,
        name: 'AyurVeda',
        description: `Order #${orderId}`,
        handler: async (response: any) => {
          try {
            await axios.post('/orders/verify', {
              orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            toast.success('Payment successful!')
            window.location.reload()
          } catch {
            toast.error('Payment verification failed')
          }
        },
        theme: { color: '#2d5a3d' },
      })
      rzp.open()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to initiate payment')
    } finally {
      setRetrying(false)
    }
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
      toast.error(err?.response?.data?.message || 'Failed to submit return request')
    } finally {
      setReturning(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid #e8f5ee', borderTopColor: '#2d5a3d', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!order) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <AlertCircle size={56} style={{ color: '#e05252' }} />
        <h2 style={{ fontSize: 22, fontWeight: 600, color: '#1a3a2a' }}>Order not found</h2>
        <Link href="/account" style={{ color: '#4a7c5e', textDecoration: 'underline' }}>Back to My Account</Link>
      </div>
    )
  }

  const statusMeta = STATUS_MAP[order.status] || STATUS_MAP[0]
  const StatusIcon = statusMeta.icon
  const isCancellable = [0, 1].includes(order.status)
  const isReturnable = order.status === 5
  const canRetryPayment = order.payment_method === 'online' && order.payment_status === 'unpaid' && order.status !== 6
  const addr = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address

  /* Determine which steps are done */
  const isCancelledOrReturned = [6, 7, 8].includes(order.status)
  const currentStep = isCancelledOrReturned ? -1 : order.status

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px 80px', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      {/* Back */}
      <Link href="/account" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#4a7c5e', textDecoration: 'none', fontSize: 13, marginBottom: 20 }}>
        <ChevronLeft size={15} /> My Orders
      </Link>

      {/* Header */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(26,58,42,0.1)', padding: '20px 24px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Order #{order.invoice_no || order.id}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1a3a2a' }}>₹{Number(order.total_amount).toFixed(2)}</div>
          <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: `${statusMeta.color}18`, border: `1.5px solid ${statusMeta.color}40`, borderRadius: 10, padding: '8px 16px' }}>
          <StatusIcon size={16} style={{ color: statusMeta.color }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: statusMeta.color }}>{statusMeta.label}</span>
        </div>
      </div>

      {/* Progress Timeline Visual (only for active orders) */}
      {!isCancelledOrReturned && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(26,58,42,0.1)', padding: '24px', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a3a2a', marginBottom: 20 }}>Order Progress</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
            {TIMELINE_STEPS.map((step, idx) => {
              const meta = STATUS_MAP[step]
              const done = currentStep >= step
              const Icon = meta.icon
              return (
                <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  {/* connector line */}
                  {idx < TIMELINE_STEPS.length - 1 && (
                    <div style={{ position: 'absolute', top: 20, left: '50%', width: '100%', height: 3, background: done && currentStep > step ? meta.color : '#f0f0f0', transition: 'background 0.4s', zIndex: 0 }} />
                  )}
                  {/* dot */}
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: done ? meta.color : '#f0f0f0', border: `3px solid ${done ? meta.color : '#e0e0e0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, position: 'relative', transition: 'all 0.3s' }}>
                    <Icon size={16} style={{ color: done ? 'white' : '#bbb' }} />
                  </div>
                  <div style={{ marginTop: 8, fontSize: 10, fontWeight: done ? 600 : 400, color: done ? meta.color : '#bbb', textAlign: 'center', lineHeight: 1.3, maxWidth: 70 }}>{meta.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Status History from DB */}
      {timeline.length > 0 && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(26,58,42,0.1)', padding: '24px', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a3a2a', marginBottom: 16 }}>Status History</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {timeline.map((log, idx) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                style={{ display: 'flex', gap: 16, position: 'relative', paddingBottom: idx < timeline.length - 1 ? 20 : 0 }}
              >
                {/* vertical line */}
                {idx < timeline.length - 1 && (
                  <div style={{ position: 'absolute', left: 15, top: 32, width: 2, height: '100%', background: 'rgba(26,58,42,0.08)' }} />
                )}
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: log.status_color ? `${log.status_color}20` : '#e8f5ee', border: `2px solid ${log.status_color || '#4a7c5e'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle2 size={14} style={{ color: log.status_color || '#4a7c5e' }} />
                </div>
                <div style={{ flex: 1, paddingTop: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a3a2a' }}>{log.status_name || 'Status Updated'}</div>
                  {log.note && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{log.note}</div>}
                  <div style={{ fontSize: 11, color: '#bbb', marginTop: 3 }}>
                    {new Date(log.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Items */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(26,58,42,0.1)', padding: '24px', marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a3a2a', marginBottom: 16 }}>Items Ordered</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {order.items?.map((item: any, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <img src={item.image || '/placeholder.png'} alt={item.name} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', background: '#e8f5ee', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#1a3a2a' }}>{item.name}</div>
                {item.variant_label && <div style={{ fontSize: 11, color: '#10b981', marginTop: 2, fontWeight: 600 }}>{item.variant_label}</div>}
                <div style={{ fontSize: 12, color: '#888' }}>Qty: {item.quantity}</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a3a2a' }}>₹{(Number(item.price) * Number(item.quantity)).toFixed(2)}</div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(26,58,42,0.08)', marginTop: 16, paddingTop: 16, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1a3a2a' }}>Total</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1a3a2a' }}>₹{Number(order.total_amount).toFixed(2)}</span>
        </div>
      </div>

      {/* Delivery Address */}
      {addr && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(26,58,42,0.1)', padding: '20px 24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <MapPin size={15} style={{ color: '#4a7c5e' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1a3a2a' }}>Delivery Address</span>
          </div>
          <div style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 500, color: '#1a3a2a' }}>{addr.name}</div>
            <div>{addr.address}</div>
            <div>{addr.city}, {addr.state} – {addr.pincode}</div>
            {addr.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                <Phone size={12} /> {addr.phone}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tracking */}
      {order.tracking_number && (
        <div style={{ background: '#f0f9f4', borderRadius: 12, padding: '14px 20px', marginBottom: 20, border: '1px solid rgba(45,90,61,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Truck size={16} style={{ color: '#2d5a3d' }} />
          <span style={{ fontSize: 13, color: '#2d5a3d' }}>Tracking: <strong>{order.tracking_number}</strong></span>
        </div>
      )}

      {/* Invoice download */}
      {order.pdf_url && (
        <div style={{ marginBottom: 20 }}>
          <a href={order.pdf_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1a3a2a', color: 'white', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
            <Download size={14} /> Download Invoice
          </a>
        </div>
      )}

      {/* Payment Retry Banner */}
      {canRetryPayment && (
        <div style={{ background: '#fff8ed', border: '1.5px solid #f59e0b', borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={20} style={{ color: '#d97706', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#92400e' }}>Payment Pending</div>
              <div style={{ fontSize: 12, color: '#a16207', marginTop: 2 }}>Your order was placed but payment was not completed. Complete payment to confirm your order.</div>
            </div>
          </div>
          <button
            onClick={retryPayment}
            disabled={retrying}
            style={{ padding: '10px 22px', background: '#d97706', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            {retrying ? 'Loading...' : '💳 Complete Payment'}
          </button>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {isCancellable && (
          <button
            onClick={cancelOrder}
            disabled={cancelling}
            style={{ padding: '10px 20px', border: '1.5px solid #e05252', borderRadius: 10, background: 'white', color: '#e05252', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <XCircle size={15} /> {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
        {isReturnable && !showReturnForm && (
          <button
            onClick={() => setShowReturnForm(true)}
            style={{ padding: '10px 20px', border: '1.5px solid #e07a2a', borderRadius: 10, background: 'white', color: '#e07a2a', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RotateCcw size={15} /> Request Return
          </button>
        )}
      </div>

      {/* Return form */}
      {showReturnForm && (
        <div style={{ marginTop: 16, background: 'white', borderRadius: 14, border: '1px solid rgba(224,122,42,0.3)', padding: '20px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a3a2a', marginBottom: 10 }}>Return Reason</div>
          <textarea
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            placeholder="Please describe why you want to return this order..."
            rows={3}
            style={{ width: '100%', border: '1.5px solid rgba(26,58,42,0.2)', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button onClick={submitReturn} disabled={returning} style={{ padding: '9px 20px', background: '#1a3a2a', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {returning ? 'Submitting...' : 'Submit Return'}
            </button>
            <button onClick={() => setShowReturnForm(false)} style={{ padding: '9px 20px', background: 'transparent', border: '1.5px solid rgba(26,58,42,0.2)', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#888' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
