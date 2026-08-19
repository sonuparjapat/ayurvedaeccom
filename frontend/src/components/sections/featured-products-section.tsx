'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import axios from '@/lib/axios'
import { Star, ShoppingCart, Heart, Zap, Tag, Package } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import toast from 'react-hot-toast'
import { useInView } from 'framer-motion'

/* ─── Types ─── */
interface Product {
  id: number
  name: string
  slug?: string
  price: string
  compareprice?: string
  images: string[]
  averagerating: string
  reviewcount: number
  inventory: number
  category_name?: string
  is_featured?: boolean
  flash_price?: number
}

/* ─── Product Card ─── */
function ProductCard({ product, index }: { product: Product; index: number }) {
  const [hovered, setHovered] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, mx: 50, my: 50 })
  const { loginuserdata, cartdata, fetchCart, getwishlist, wishlistdata, setOpencart } = useAuth()

  const isWishlisted = !!wishlistdata?.items?.find((i: any) => i?.id == product.id)
  const isOutOfStock = product.inventory <= 0
  const isInCart = cartdata?.items?.some((i: any) => i?.product_id == product.id)
  const discount = product.compareprice
    ? Math.round(((Number(product.compareprice) - Number(product.flash_price || product.price)) / Number(product.compareprice)) * 100)
    : 0

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = (e.clientX - rect.left) / rect.width   // 0–1
    const y = (e.clientY - rect.top) / rect.height   // 0–1
    setTilt({ rx: (0.5 - y) * 14, ry: (x - 0.5) * 14, mx: x * 100, my: y * 100 })
  }
  const onMouseLeave = () => {
    setHovered(false)
    setTilt({ rx: 0, ry: 0, mx: 50, my: 50 })
  }

  const handleCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (isOutOfStock || cartLoading) return

    // Already in cart — open cart drawer
    if (isInCart) {
      setOpencart(true)
      return
    }

    setCartLoading(true)
    try {
      const payload: any = { productId: product.id, quantity: 1 }
      if (!loginuserdata?.id) {
        const sid = localStorage.getItem('guest_session_id')
        if (sid) payload.sessionId = sid
      }
      // Always POST — backend upserts (inserts or increments, capped at stock)
      await axios.post('/cart', payload)
      toast.success('Added to cart!')
      fetchCart(loginuserdata?.id)
    } catch {
      toast.error('Could not add to cart')
    } finally {
      setCartLoading(false)
    }
  }

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await axios.post('/shop/wishlist', { productId: product.id })
      getwishlist()
    } catch {
      toast.error('Login required')
    }
  }

  const stars = Math.round(Number(product.averagerating) || 0)

  return (
    <Link href={`/product/${product.slug || product.id}`} className="block group focus:outline-none"
      style={{ animation: `pcFadeUp 0.55s cubic-bezier(0.22,1,0.36,1) ${index * 80 + 100}ms both`, perspective: '900px' }}>
      <div
        ref={cardRef}
        className="relative rounded-2xl overflow-hidden bg-white"
        style={{
          boxShadow: hovered
            ? `0 28px 60px rgba(0,0,0,0.13), 0 0 0 1.5px #c6f0dc, 0 0 40px rgba(16,185,129,0.08)`
            : '0 2px 16px rgba(0,0,0,0.06), 0 0 0 0.5px #f0f0f0',
          transform: hovered
            ? `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateY(-6px) scale(1.01)`
            : 'perspective(900px) rotateX(0) rotateY(0) translateY(0) scale(1)',
          transition: hovered
            ? 'box-shadow 0.15s ease, transform 0.08s ease'
            : 'box-shadow 0.35s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        {/* Shine overlay — moves with cursor */}
        <div
          style={{
            position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
            zIndex: 20,
            background: `radial-gradient(circle at ${tilt.mx}% ${tilt.my}%, rgba(255,255,255,0.22) 0%, transparent 65%)`,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.25s',
          }}
        />
        {/* Image */}
        <div className="relative overflow-hidden bg-gray-50" style={{ aspectRatio: '1/1' }}>
          <img
            src={product.images?.[0] || '/placeholder.png'}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500"
            style={{ transform: hovered ? 'scale(1.08)' : 'scale(1)' }}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {isInCart && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                ✓ In Cart
              </span>
            )}
            {discount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
                -{discount}%
              </span>
            )}
            {product.flash_price && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-linear-to-r from-orange-500 to-red-500 text-white flex items-center gap-0.5">
                <Zap size={9} /> Flash
              </span>
            )}
            {isOutOfStock && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-800/80 text-white">
                Out of stock
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)' }}
          >
            <Heart
              size={15}
              fill={isWishlisted ? '#ef4444' : 'transparent'}
              color={isWishlisted ? '#ef4444' : '#9ca3af'}
            />
          </button>

          {/* Quick add — visible on hover */}
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-center p-3 transition-all duration-300"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)',
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'translateY(0)' : 'translateY(8px)',
            }}
          >
            <button
              onClick={handleCart}
              disabled={isOutOfStock || cartLoading}
              className="flex items-center gap-2 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
              style={{
                background: isOutOfStock
                  ? 'rgba(100,100,100,0.8)'
                  : isInCart
                  ? 'rgba(4,120,87,0.95)'
                  : 'rgba(45,90,61,0.95)',
                backdropFilter: 'blur(8px)',
                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
              }}
            >
              {cartLoading ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isOutOfStock ? (
                <><Package size={13} /> Out of Stock</>
              ) : isInCart ? (
                <><ShoppingCart size={13} /> Go to Cart</>
              ) : (
                <><ShoppingCart size={13} /> Add to Cart</>
              )}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 pt-3.5 relative z-10">
          {product.category_name && (
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-600 mb-1.5 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block" />
              {product.category_name}
            </p>
          )}

          <h3 className="text-[13px] font-bold text-gray-900 leading-snug mb-2 line-clamp-2 group-hover:text-emerald-800 transition-colors duration-200">
            {product.name}
          </h3>

          {/* Stars */}
          {stars > 0 && (
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={10}
                    fill={s <= stars ? '#f59e0b' : 'none'}
                    color={s <= stars ? '#f59e0b' : '#e5e7eb'}
                  />
                ))}
              </div>
              {product.reviewcount > 0 && (
                <span className="text-[10px] text-gray-400 font-medium">({product.reviewcount})</span>
              )}
            </div>
          )}

          {/* Price row */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[15px] font-extrabold text-emerald-700">
                ₹{Number(product.flash_price || product.price).toFixed(0)}
              </span>
              {product.compareprice && Number(product.compareprice) > Number(product.flash_price || product.price) && (
                <span className="text-[11px] text-gray-400 line-through font-medium">
                  ₹{Number(product.compareprice).toFixed(0)}
                </span>
              )}
            </div>
            {discount > 5 && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Save {discount}%
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ─── Tab Button ─── */
function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: any }) {
  return (
    <button
      onClick={onClick}
      className="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200"
      style={
        active
          ? { background: '#0f3d2e', color: '#fff', boxShadow: '0 4px 16px rgba(15,61,46,0.25)' }
          : { background: 'white', color: '#6b7280', border: '1px solid #e5e7eb' }
      }
    >
      {children}
    </button>
  )
}

/* ─── Main Export ─── */
export function FeaturedProductsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' })

  const [tab, setTab] = useState<'featured' | 'new' | 'sale'>('featured')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string> = { limit: '8', sort: tab === 'new' ? 'newest' : tab === 'sale' ? 'discount' : 'popular' }
    axios.get('/shop/public', { params })
      .then(r => setProducts(r.data?.data || r.data?.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [tab])

  return (
    <section ref={sectionRef} className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#fafaf7]">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-emerald-100/30 blur-[80px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-amber-100/30 blur-[70px]" />
      </div>

      <div className="relative max-w-7xl mx-auto">

        {/* Header */}
        <div
          className="text-center mb-12 opacity-0"
          style={isInView ? { animation: 'pcFadeUp 0.6s 50ms forwards' } : {}}
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-xs font-semibold uppercase tracking-wider"
            style={{ background: 'rgba(15,61,46,0.06)', color: '#0f3d2e', border: '0.5px solid rgba(15,61,46,0.12)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Handpicked for you
          </div>

          <h2
            className="text-4xl md:text-5xl font-black text-[#0f3d2e] mb-4"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: '-0.02em' }}
          >
            Our Best Products
          </h2>
          <p className="text-gray-500 text-base max-w-md mx-auto leading-relaxed">
            Pure Ayurvedic goodness, sourced directly from Indian farms and delivered to your door.
          </p>

          {/* Tabs */}
          <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
            <Tab active={tab === 'featured'} onClick={() => setTab('featured')}>
              🌟 Popular
            </Tab>
            <Tab active={tab === 'new'} onClick={() => setTab('new')}>
              ✨ New Arrivals
            </Tab>
            <Tab active={tab === 'sale'} onClick={() => setTab('sale')}>
              <Tag size={12} className="inline mr-1" />Sale
            </Tab>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white">
                <div className="aspect-square bg-gray-100 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p>No products found</p>
          </div>
        )}

        {/* View All button */}
        {products.length > 0 && (
          <div
            className="text-center mt-12 opacity-0"
            style={isInView ? { animation: 'pcFadeUp 0.6s 600ms forwards' } : {}}
          >
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 hover:-translate-y-1"
              style={{
                background: 'linear-gradient(135deg, #0f3d2e, #1a6645)',
                color: 'white',
                boxShadow: '0 6px 24px rgba(15,61,46,0.25)',
              }}
            >
              View All Products
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes pcFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  )
}
