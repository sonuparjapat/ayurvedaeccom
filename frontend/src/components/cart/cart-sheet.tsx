'use client'

import { useState } from 'react'
import axios from '@/lib/axios'
import {
  ShoppingCart, Plus, Minus, Trash2, ShoppingBag,
  Package, ArrowRight, X, Sparkles, Leaf
} from 'lucide-react'
import {
  Sheet, SheetContent, SheetTrigger
} from '@/components/ui/sheet'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'

interface CartItem {
  id: number
  quantity: number
  product_id: number
  name: string
  price: number
  images: string[]
  inventory: number
}

export function CartSheet() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    handleCart, opencart, setOpencart,
    totalCartProducts, fetchCart, cartdata, cartloading,
    loginuserdata, setOpenauth, setAuthMode, setPostLoginRedirect,
    settings,
  } = useAuth()
  const freeDeliveryLimit = Number((settings||[]).find((s:any)=>s.key==='free_delivery_limit')?.value||500)

  const updateQuantity = async (productId: number, newQty: number, stock: number) => {
    if (newQty < 1) return
    const finalQty = Math.min(newQty, stock)
    try {
      setLoading(true)
      const payload: any = { productId, quantity: finalQty }
      if (!loginuserdata?.id) payload.sessionId = localStorage.getItem('guest_session_id')
      await axios.put('/cart', payload)
      await fetchCart(loginuserdata?.id, true)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to update cart')
    } finally { setLoading(false) }
  }

  const removeFromCart = async (productId: number) => {
    try {
      setLoading(true)
      let url = `/cart/${productId}`
      if (!loginuserdata?.id) {
        const sessionId = localStorage.getItem('guest_session_id')
        url += `?sessionId=${sessionId}`
      }
      await axios.delete(url)
      await fetchCart(loginuserdata?.id, true)
      toast.success('Item removed')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to remove item')
    } finally { setLoading(false) }
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(price)

  const getImage = (images: string[]) => images?.[0] || '/placeholder-product.jpg'
  const cartCount = cartdata?.totalItems || 0

  return (
    <>
      <style>{`
        /* ── Cart trigger button ── */
        .cart-trigger-btn {
          position: relative;
          width: 38px; height: 38px; border-radius: 10px;
          border: none; background: transparent; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #1a3a2a;
          transition: background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.15s;
        }
        .cart-trigger-btn:hover {
          background: rgba(255,255,255,0.72);
          color: #2d5a3d;
          box-shadow: 0 2px 10px rgba(26,58,42,0.09), inset 0 1px 0 rgba(255,255,255,0.95);
          transform: translateY(-0.5px);
        }
        .cart-trigger-badge {
          position: absolute; top: -2px; right: -2px;
          min-width: 17px; height: 17px; border-radius: 9px;
          background: linear-gradient(135deg, #c9a84c, #a07828);
          color: white; font-size: 9.5px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          line-height: 1; padding: 0 3px; letter-spacing: 0;
          box-shadow: 0 0 6px rgba(201,168,76,0.5), 0 2px 4px rgba(0,0,0,0.2);
          border: 1.5px solid rgba(255,255,255,0.9);
        }

        /* ── Sheet panel ── */
        .cart-sheet-panel {
          display: flex; flex-direction: column;
          background: linear-gradient(180deg, #f8fffb 0%, #f0fdf4 40%, #fafff8 100%) !important;
          border-left: 1px solid rgba(16,185,129,0.10) !important;
          box-shadow: -8px 0 60px rgba(26,58,42,0.12) !important;
        }

        /* ── Header ── */
        .cart-header {
          position: sticky; top: 0; z-index: 10;
          background: rgba(248,255,251,0.92);
          backdrop-filter: blur(20px) saturate(1.6);
          -webkit-backdrop-filter: blur(20px) saturate(1.6);
          border-bottom: 1px solid rgba(16,185,129,0.10);
          padding: 18px 20px 16px;
          display: flex; align-items: center; justify-content: space-between;
          box-shadow: 0 2px 20px rgba(26,58,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9);
        }
        .cart-header-left { display: flex; align-items: center; gap: 12px; }
        .cart-header-icon {
          width: 42px; height: 42px; border-radius: 13px;
          background: linear-gradient(135deg, #2d5a3d, #0f3d2e);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 16px rgba(26,58,42,0.3), inset 0 1px 0 rgba(255,255,255,0.14);
        }
        .cart-header-title { font-size: 15px; font-weight: 700; color: #0f3d2e; letter-spacing: -0.01em; }
        .cart-header-count { font-size: 11.5px; color: rgba(15,61,46,0.5); margin-top: 1px; }
        .cart-close-btn {
          width: 34px; height: 34px; border-radius: 10px; border: none;
          background: rgba(15,61,46,0.06); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #0f3d2e; transition: background 0.2s, transform 0.15s;
        }
        .cart-close-btn:hover { background: rgba(15,61,46,0.10); transform: scale(1.06); }

        /* ── Body ── */
        .cart-body { flex: 1; overflow-y: auto; padding: 16px; overscroll-behavior: contain; }
        .cart-body::-webkit-scrollbar { width: 4px; }
        .cart-body::-webkit-scrollbar-track { background: transparent; }
        .cart-body::-webkit-scrollbar-thumb { background: rgba(16,185,129,0.2); border-radius: 4px; }

        /* ── Item card ── */
        .cart-item {
          display: flex; gap: 12px; padding: 14px;
          border-radius: 18px;
          background: rgba(255,255,255,0.82);
          border: 1px solid rgba(255,255,255,0.9);
          box-shadow: 0 2px 14px rgba(26,58,42,0.06), inset 0 1px 0 rgba(255,255,255,0.95);
          backdrop-filter: blur(8px);
          transition: box-shadow 0.2s, transform 0.2s;
          margin-bottom: 10px;
        }
        .cart-item:hover {
          box-shadow: 0 6px 24px rgba(26,58,42,0.10), inset 0 1px 0 rgba(255,255,255,0.95);
          transform: translateY(-1px);
        }
        .cart-item-img {
          width: 76px; height: 76px; border-radius: 12px; overflow: hidden;
          background: #f0fdf4; flex-shrink: 0;
          border: 1px solid rgba(16,185,129,0.10);
        }
        .cart-item-img img { width: 100%; height: 100%; object-fit: cover; }
        .cart-item-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; min-width: 0; }
        .cart-item-name {
          font-size: 13.5px; font-weight: 600; color: #0f3d2e;
          line-height: 1.35; display: -webkit-box;
          -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .cart-item-price {
          font-size: 16px; font-weight: 800; color: #0f3d2e; margin-top: 4px;
          background: linear-gradient(135deg, #0f3d2e, #10b981);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .cart-item-controls { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
        .cart-qty-wrap {
          display: flex; align-items: center; gap: 0;
          background: rgba(15,61,46,0.06); border-radius: 10px; overflow: hidden;
          border: 1px solid rgba(15,61,46,0.10);
        }
        .cart-qty-btn {
          width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
          border: none; background: transparent; cursor: pointer; color: #0f3d2e;
          transition: background 0.15s;
        }
        .cart-qty-btn:hover { background: rgba(15,61,46,0.10); }
        .cart-qty-val {
          min-width: 26px; text-align: center; font-size: 13px; font-weight: 700; color: #0f3d2e;
        }
        .cart-remove-btn {
          width: 28px; height: 28px; border-radius: 8px; border: none;
          background: rgba(239,68,68,0.08); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #dc2626; transition: background 0.15s, transform 0.15s;
        }
        .cart-remove-btn:hover { background: rgba(239,68,68,0.15); transform: scale(1.1); }

        /* ── Empty state ── */
        .cart-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 64px 24px; text-align: center;
        }
        .cart-empty-icon {
          width: 80px; height: 80px; border-radius: 24px;
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border: 1px solid rgba(16,185,129,0.15);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
          box-shadow: 0 8px 32px rgba(16,185,129,0.12);
        }
        .cart-empty-title { font-size: 16px; font-weight: 700; color: #0f3d2e; margin-bottom: 6px; }
        .cart-empty-sub { font-size: 13px; color: rgba(15,61,46,0.5); margin-bottom: 24px; }
        .cart-empty-btn {
          height: 44px; padding: 0 28px; border-radius: 14px; border: none; cursor: pointer;
          font-size: 14px; font-weight: 700; color: white; font-family: inherit;
          background: linear-gradient(135deg, #059669, #0f3d2e);
          box-shadow: 0 4px 18px rgba(5,150,105,0.35);
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex; align-items: center; gap: 6px;
        }
        .cart-empty-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(5,150,105,0.42); }

        /* ── Footer ── */
        .cart-footer {
          border-top: 1px solid rgba(16,185,129,0.10);
          padding: 18px 20px;
          background: rgba(248,255,251,0.95);
          backdrop-filter: blur(16px);
          box-shadow: 0 -4px 24px rgba(26,58,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9);
        }
        .cart-subtotal-row {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 14px;
        }
        .cart-subtotal-label { font-size: 13px; color: rgba(15,61,46,0.55); }
        .cart-subtotal-amount {
          font-size: 22px; font-weight: 900; letter-spacing: -0.02em;
          background: linear-gradient(135deg, #0f3d2e, #10b981);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .cart-checkout-btn {
          width: 100%; height: 52px; border: none; border-radius: 16px; cursor: pointer;
          font-size: 15px; font-weight: 700; color: white; font-family: inherit;
          background: linear-gradient(135deg, #059669 0%, #0f3d2e 100%);
          box-shadow: 0 6px 24px rgba(5,150,105,0.38), inset 0 1px 0 rgba(255,255,255,0.12);
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          position: relative; overflow: hidden; margin-bottom: 10px;
        }
        .cart-checkout-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 32px rgba(5,150,105,0.45), inset 0 1px 0 rgba(255,255,255,0.15);
        }
        .cart-checkout-btn::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%);
          transform: translateX(-100%) skewX(-15deg); transition: transform 0.5s;
        }
        .cart-checkout-btn:hover::after { transform: translateX(120%) skewX(-15deg); }
        .cart-continue-btn {
          width: 100%; height: 44px; border-radius: 14px; cursor: pointer;
          font-size: 13.5px; font-weight: 600; color: rgba(15,61,46,0.65); font-family: inherit;
          background: transparent; border: 1.5px solid rgba(15,61,46,0.12);
          display: flex; align-items: center; justify-content: center; gap: 6px;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
        }
        .cart-continue-btn:hover {
          background: rgba(15,61,46,0.05); color: #0f3d2e; border-color: rgba(15,61,46,0.22);
        }
        .cart-trust { display: flex; gap: 12px; justify-content: center; margin-top: 12px; flex-wrap: wrap; }
        .cart-trust-item { font-size: 10.5px; color: rgba(15,61,46,0.4); display: flex; align-items: center; gap: 4px; }
      `}</style>

      <Sheet open={opencart} onOpenChange={setOpencart}>

        {/* Trigger */}
        <SheetTrigger asChild>
          <button className="cart-trigger-btn" aria-label="Cart">
            <ShoppingCart size={18} />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.div
                  key="badge"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="cart-trigger-badge"
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </SheetTrigger>

        {/* Sheet */}
        <SheetContent className="cart-sheet-panel w-full sm:max-w-md flex flex-col z-[9999] p-0">

          {/* Header */}
          <div className="cart-header">
            <div className="cart-header-left">
              <div className="cart-header-icon">
                <ShoppingBag size={19} color="white" />
              </div>
              <div>
                <div className="cart-header-title">Your Cart</div>
                <div className="cart-header-count">{cartCount} {cartCount === 1 ? 'item' : 'items'}</div>
              </div>
            </div>
            <button className="cart-close-btn" onClick={() => setOpencart(false)}>
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="cart-body">
            {cartdata && cartdata?.items?.length > 0 ? (
              <AnimatePresence>
                {cartdata.items.map((item: any, index: number) => (
                  <motion.div
                    key={item.id}
                    className="cart-item"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 24, scale: 0.96 }}
                    transition={{ delay: index * 0.04, duration: 0.28 }}
                  >
                    <div className="cart-item-img">
                      <img src={getImage(item.images)} alt={item.name} />
                    </div>
                    <div className="cart-item-info">
                      <div>
                        <div className="cart-item-name">{item.name}</div>
                        <div className="cart-item-price">{formatPrice(item.price)}</div>
                      </div>
                      <div className="cart-item-controls">
                        <div className="cart-qty-wrap">
                          <button
                            className="cart-qty-btn"
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1, item.inventory)}
                          >
                            <Minus size={12} />
                          </button>
                          <span className="cart-qty-val">{item.quantity}</span>
                          <button
                            className="cart-qty-btn"
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1, item.inventory)}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <button className="cart-remove-btn" onClick={() => removeFromCart(item.product_id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="cart-empty">
                <div className="cart-empty-icon">
                  <Package size={32} color="#10b981" />
                </div>
                <div className="cart-empty-title">Your cart is empty</div>
                <div className="cart-empty-sub">Discover premium Ayurvedic products and add them here</div>
                <button
                  className="cart-empty-btn"
                  onClick={() => { setOpencart(false); router.push('/products') }}
                >
                  <Sparkles size={15} />
                  Shop Now
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {cartdata && cartdata?.items?.length > 0 && (
            <div className="cart-footer">
              <div className="cart-subtotal-row">
                <span className="cart-subtotal-label">Subtotal</span>
                <span className="cart-subtotal-amount">{formatPrice(cartdata?.subtotal)}</span>
              </div>
              <button
                className="cart-checkout-btn"
                onClick={() => {
                  setOpencart(false)
                  if (!loginuserdata?.id) {
                    setPostLoginRedirect('/checkout')
                    toast.error('Please login to continue checkout')
                    setAuthMode('login')
                    setTimeout(() => setOpenauth(true), 150)
                    return
                  }
                  setOpenauth(false)
                  router.push('/checkout')
                }}
              >
                Checkout
                <ArrowRight size={16} />
              </button>
              <button className="cart-continue-btn" onClick={() => setOpencart(false)}>
                Continue Shopping
              </button>
              <div className="cart-trust">
                {[
                  { icon: Leaf, text: '100% Organic' },
                  { icon: ShoppingBag, text: `Free Delivery ₹${freeDeliveryLimit}+` },
                ].map(({ icon: Icon, text }) => (
                  <span key={text} className="cart-trust-item">
                    <Icon size={11} />
                    {text}
                  </span>
                ))}
              </div>
            </div>
          )}

        </SheetContent>
      </Sheet>
    </>
  )
}
