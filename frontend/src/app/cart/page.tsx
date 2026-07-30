'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, Trash2, Plus, Minus, Tag, ArrowRight, Package,
  ChevronLeft, Sparkles, AlertCircle, CheckCircle2, X
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { Bookmark } from 'lucide-react'

interface CartItem {
  cart_item_id: number
  product_id: number
  slug?: string
  variant_id: number | null
  variant_label: string | null
  variant_attributes: Record<string, string> | null
  name: string
  price: number
  compareprice: number | null
  images: string[]
  inventory: number
  gst_percent: number
  category_name: string
  quantity: number
  unit?: string
  min_order_qty?: number
  max_order_qty?: number
  is_returnable?: boolean
}

interface CouponResult {
  code: string
  discount: number
  type: string
  value: number
}

export default function CartPage() {
  const router = useRouter()
  const { cartdata, fetchCart, loginuserdata, settings, getwishlist, wishlistdata } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [savingId, setSavingId] = useState<number | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState<CouponResult | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([])
  const [showCoupons, setShowCoupons] = useState(false)

  useEffect(() => {
    if (cartdata?.items) setItems(cartdata.items)
  }, [cartdata])

  useEffect(() => {
    fetchCart()
    axios.get('/coupons/public').then((r) => setAvailableCoupons(r.data?.coupons || [])).catch(() => {})
  }, [])

  const chargesMap = useMemo(() => {
    return (settings || []).reduce((acc: any, item: any) => {
      let value: any = item.value
      if (item.type === 'number') value = Number(value)
      if (item.type === 'boolean') value = value === 'true'
      acc[item.key] = value
      return acc
    }, {})
  }, [settings])

  const freeLimit = Number(chargesMap.free_delivery_limit ?? 500)
  const deliveryCharge = Number(chargesMap.delivery_charge ?? 0)

  const subtotal = items.reduce((a, b) => a + b.price * b.quantity, 0)
  const gstTotal = items.reduce((a, b) => {
    const gstRate = b.gst_percent ? Number(b.gst_percent) / 100 : 0
    return a + b.price * b.quantity * gstRate
  }, 0)
  const discount = coupon?.discount || 0
  const freeShipping = subtotal >= freeLimit
  const shippingCharge = freeShipping ? 0 : deliveryCharge
  const total = subtotal + gstTotal - discount + shippingCharge

  const updateQty = async (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta
    const minQty = item.min_order_qty || 1
    const maxQty = item.max_order_qty || 100
    if (newQty < minQty) { toast.error(`Minimum order quantity: ${minQty}`); return }
    if (newQty > maxQty) { toast.error(`Maximum order quantity: ${maxQty}`); return }
    if (newQty < 1) return
    if (newQty > item.inventory) { toast.error('Maximum stock reached'); return }
    setUpdatingId(item.cart_item_id)
    try {
      await axios.put('/cart', {
        productId: item.product_id,
        variantId: item.variant_id,
        quantity: newQty,
      })
      setItems((prev) => prev.map((i) => i.cart_item_id === item.cart_item_id ? { ...i, quantity: newQty } : i))
      fetchCart()
    } catch {
      toast.error('Failed to update quantity')
    } finally {
      setUpdatingId(null)
    }
  }

  const removeItem = async (item: CartItem) => {
    setUpdatingId(item.cart_item_id)
    try {
      const params: any = {}
      if (item.variant_id) params.variantId = item.variant_id
      await axios.delete(`/cart/${item.product_id}`, { params })
      setItems((prev) => prev.filter((i) => i.cart_item_id !== item.cart_item_id))
      fetchCart()
      toast.success('Item removed')
    } catch {
      toast.error('Failed to remove item')
    } finally {
      setUpdatingId(null)
    }
  }

  const saveForLater = async (item: CartItem) => {
    if (!loginuserdata?.id) { toast.error('Please login to save items'); return }
    setSavingId(item.product_id)
    try {
      // Add to wishlist (idempotent — backend upserts)
      await axios.post('/shop/wishlist', { productId: item.product_id })
      // Remove from cart
      const params: any = {}
      if (item.variant_id) params.variantId = item.variant_id
      await axios.delete(`/cart/${item.product_id}`, { params })
      setItems((prev) => prev.filter((i) => i.cart_item_id !== item.cart_item_id))
      fetchCart()
      getwishlist()
      toast.success('Saved for later!')
    } catch {
      toast.error('Failed to save for later')
    } finally {
      setSavingId(null)
    }
  }

  const moveToCart = async (productId: number) => {
    try {
      await axios.post('/cart', { productId, quantity: 1 })
      await axios.delete(`/shop/wishlist/${productId}`)
      fetchCart()
      getwishlist()
      toast.success('Moved to cart!')
    } catch {
      toast.error('Failed to move to cart')
    }
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await axios.post('/coupons/apply', { code: couponCode.trim(), cartTotal: subtotal })
      setCoupon({ code: couponCode.trim().toUpperCase(), discount: res.data.discount, type: res.data.coupon?.type, value: res.data.coupon?.value })
      toast.success(`Coupon applied! You save ₹${res.data.discount}`)
    } catch (err: any) {
      setCouponError(err?.response?.data?.message || 'Invalid coupon code')
      setCoupon(null)
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    setCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  const proceedToCheckout = () => {
    if (!loginuserdata?.id) {
      toast.error('Please login to place an order')
      return
    }
    router.push('/checkout')
  }

  if (!items.length) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 24 }}>
        <ShoppingCart size={72} style={{ color: '#c5d9cb', strokeWidth: 1.2 }} />
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1a3a2a', marginBottom: 8 }}>Your cart is empty</h2>
          <p style={{ color: '#5a7a63', fontSize: 15 }}>Add some amazing Ayurvedic products to get started</p>
        </div>
        <Link href="/products" style={{ background: '#1a3a2a', color: 'white', padding: '12px 28px', borderRadius: 100, textDecoration: 'none', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={16} /> Shop Now
        </Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px 80px', fontFamily: 'DM Sans, sans-serif' }}>

      {/* Back link */}
      <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#4a7c5e', textDecoration: 'none', fontSize: 13, marginBottom: 20 }}>
        <ChevronLeft size={15} /> Continue Shopping
      </Link>

      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a3a2a', marginBottom: 28, letterSpacing: '-0.02em' }}>
        Shopping Cart <span style={{ fontSize: 16, fontWeight: 400, color: '#6b8f74', marginLeft: 8 }}>({items.length} item{items.length !== 1 ? 's' : ''})</span>
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="cart-grid">

        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.cart_item_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(26,58,42,0.1)', padding: '16px', display: 'flex', gap: 16, alignItems: 'flex-start' }}
              >
                {/* Image */}
                <Link href={`/product/${item.slug || item.product_id}`}>
                  <img
                    src={item.images?.[0] || '/placeholder.png'}
                    alt={item.name}
                    style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: 12, flexShrink: 0, background: '#e8f5ee' }}
                  />
                </Link>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/product/${item.slug || item.product_id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1a3a2a', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}{item.unit && <span style={{ fontSize: 12, fontWeight: 400, color: '#6b8f74', marginLeft: 4 }}>({item.unit})</span>}</div>
                  </Link>
                  {item.variant_label && (
                    <span style={{ display: 'inline-block', background: '#e8f5ee', color: '#2d5a3d', fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6, marginBottom: 6 }}>
                      {item.variant_label}
                    </span>
                  )}
                  <div style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>{item.category_name}</div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    {/* Price */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 17, fontWeight: 700, color: '#1a3a2a' }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                      {(item as any).original_price && (item as any).original_price > item.price && (
                        <span style={{ fontSize: 12, color: '#999', textDecoration: 'line-through' }}>₹{((item as any).original_price * item.quantity).toFixed(2)}</span>
                      )}
                      {!((item as any).original_price && (item as any).original_price > item.price) && item.compareprice && item.compareprice > item.price && (
                        <span style={{ fontSize: 12, color: '#999', textDecoration: 'line-through' }}>₹{(item.compareprice * item.quantity).toFixed(2)}</span>
                      )}
                      <span style={{ fontSize: 11, color: '#888' }}>₹{item.price}/ea</span>
                      {(item as any).is_flash_sale && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '2px 8px', borderRadius: 6 }}>⚡ Flash Sale</span>
                      )}
                    </div>

                    {/* Qty controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        onClick={() => updateQty(item, -1)}
                        disabled={updatingId === item.cart_item_id || item.quantity <= 1}
                        style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid rgba(26,58,42,0.2)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a3a2a', opacity: item.quantity <= 1 ? 0.4 : 1 }}
                      >
                        <Minus size={13} />
                      </button>
                      <span style={{ width: 32, textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#1a3a2a' }}>{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item, 1)}
                        disabled={updatingId === item.cart_item_id || item.quantity >= item.inventory}
                        style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid rgba(26,58,42,0.2)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a3a2a', opacity: item.quantity >= item.inventory ? 0.4 : 1 }}
                      >
                        <Plus size={13} />
                      </button>
                      <button
                        onClick={() => removeItem(item)}
                        disabled={updatingId === item.cart_item_id}
                        style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#fff0f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e05252', marginLeft: 4 }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Stock warning + Save for Later row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap', gap: 6 }}>
                    {item.inventory <= 5 && item.inventory > 0 ? (
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#c2410c', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 6, padding: '3px 8px' }}>
                        ⚠ Only {item.inventory} left!
                      </span>
                    ) : item.inventory === 0 ? (
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '3px 8px' }}>
                        Out of stock
                      </span>
                    ) : <span />}

                    <button
                      onClick={() => saveForLater(item)}
                      disabled={savingId === item.product_id}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#4a7c5e', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                    >
                      <Bookmark size={13} />
                      {savingId === item.product_id ? 'Saving…' : 'Save for Later'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Saved for Later */}
        {wishlistdata?.items?.length > 0 && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(26,58,42,0.1)', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Bookmark size={16} style={{ color: '#4a7c5e' }} />
              <span style={{ fontSize: 15, fontWeight: 600, color: '#1a3a2a' }}>Saved for Later</span>
              <span style={{ fontSize: 12, color: '#888', marginLeft: 4 }}>({wishlistdata.items.length})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {wishlistdata.items.map((wItem: any) => (
                <div key={wItem.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid rgba(26,58,42,0.06)' }}>
                  <Link href={`/product/${wItem.slug || wItem.id}`}>
                    <img
                      src={wItem.images?.[0] || '/placeholder.png'}
                      alt={wItem.name}
                      style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 10, flexShrink: 0, background: '#e8f5ee' }}
                    />
                  </Link>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/product/${wItem.slug || wItem.id}`} style={{ textDecoration: 'none' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1a3a2a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wItem.name}</p>
                    </Link>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#2d5a3d', marginTop: 3 }}>₹{Number(wItem.price).toLocaleString('en-IN')}</p>
                    {wItem.inventory <= 0 && <p style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>Out of stock</p>}
                  </div>
                  <button
                    onClick={() => moveToCart(wItem.id)}
                    disabled={wItem.inventory <= 0}
                    style={{
                      fontSize: 12, fontWeight: 600, color: wItem.inventory <= 0 ? '#aaa' : '#1a3a2a',
                      background: wItem.inventory <= 0 ? '#f5f5f5' : '#e8f5ee',
                      border: '1.5px solid',
                      borderColor: wItem.inventory <= 0 ? '#e5e5e5' : 'rgba(26,58,42,0.2)',
                      borderRadius: 8, padding: '6px 12px', cursor: wItem.inventory <= 0 ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {wItem.inventory <= 0 ? 'Out of Stock' : '+ Move to Cart'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Coupon */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(26,58,42,0.1)', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Tag size={16} style={{ color: '#4a7c5e' }} />
              <span style={{ fontSize: 15, fontWeight: 600, color: '#1a3a2a' }}>Apply Coupon</span>
            </div>

            {coupon ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#e8f5ee', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} style={{ color: '#2d5a3d' }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a3a2a' }}>{coupon.code} applied</div>
                    <div style={{ fontSize: 12, color: '#4a7c5e' }}>You save ₹{coupon.discount.toFixed(2)}</div>
                  </div>
                </div>
                <button onClick={removeCoupon} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><X size={15} /></button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: couponError ? 8 : 0 }}>
                  <input
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                    placeholder="Enter coupon code"
                    onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                    style={{ flex: 1, height: 40, border: '1.5px solid rgba(26,58,42,0.2)', borderRadius: 10, padding: '0 12px', fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none', color: '#1a3a2a' }}
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    style={{ padding: '0 18px', height: 40, background: '#1a3a2a', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: !couponCode.trim() ? 0.5 : 1 }}
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
                {couponError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e05252', fontSize: 12 }}>
                    <AlertCircle size={13} /> {couponError}
                  </div>
                )}
              </>
            )}

            {availableCoupons.length > 0 && !coupon && (
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={() => setShowCoupons((v) => !v)}
                  style={{ background: 'none', border: 'none', color: '#4a7c5e', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  {showCoupons ? 'Hide' : 'View'} available offers ({availableCoupons.length})
                </button>
                <AnimatePresence>
                  {showCoupons && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginTop: 10 }}>
                      {availableCoupons.map((c) => (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, border: '1px dashed rgba(26,58,42,0.2)', marginBottom: 6 }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1a3a2a', letterSpacing: '0.05em' }}>{c.code}</div>
                            <div style={{ fontSize: 11, color: '#6b8f74' }}>{c.description || (c.type === 'percent' ? `${c.value}% off` : `₹${c.value} off`)} {Number(c.min_order) > 0 ? `• Min ₹${c.min_order}` : ''}</div>
                          </div>
                          <button
                            onClick={() => { setCouponCode(c.code); setShowCoupons(false) }}
                            style={{ fontSize: 11, fontWeight: 600, color: '#2d5a3d', background: '#e8f5ee', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}
                          >
                            Use
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(26,58,42,0.1)', padding: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1a3a2a', marginBottom: 16 }}>Order Summary</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Row label={`Subtotal (${items.length} items)`} value={`₹${subtotal.toFixed(2)}`} />
              {gstTotal > 0 && <Row label="GST" value={`+₹${gstTotal.toFixed(2)}`} />}
              <Row label="Delivery" value={freeShipping ? 'FREE 🎉' : `₹${shippingCharge}`} valueColor={freeShipping ? '#2d5a3d' : undefined} />
              {discount > 0 && <Row label={`Coupon (${coupon?.code})`} value={`-₹${discount.toFixed(2)}`} valueColor="#2d5a3d" />}

              <div style={{ height: 1, background: 'rgba(26,58,42,0.08)', margin: '4px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1a3a2a' }}>Total</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#1a3a2a' }}>₹{total.toFixed(2)}</span>
              </div>

              {!freeShipping && deliveryCharge > 0 && (
                <div style={{ background: '#fff8e6', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#8a6a00' }}>
                  <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Add ₹{(freeLimit - subtotal).toFixed(2)} more for FREE delivery!
                </div>
              )}
            </div>

            <button
              onClick={proceedToCheckout}
              style={{ width: '100%', marginTop: 20, height: 50, background: '#1a3a2a', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              Proceed to Checkout <ArrowRight size={17} />
            </button>

            <div style={{ marginTop: 12, textAlign: 'center', fontSize: 11, color: '#888' }}>
              🔒 Secure checkout · 100% Natural & Ayurvedic
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @media (min-width: 768px) {
          .cart-grid { grid-template-columns: 1fr 380px !important; }
        }
      `}</style>
    </div>
  )
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: '#6b8f74' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: valueColor || '#1a3a2a' }}>{value}</span>
    </div>
  )
}
