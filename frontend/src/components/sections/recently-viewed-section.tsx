'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import axios from '@/lib/axios'
import { ShoppingCart, Heart, Clock } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import toast from 'react-hot-toast'

interface RecentProduct {
  id: number
  name: string
  slug?: string
  price: string
  compareprice?: string
  images: string
  averagerating: string
  inventory: number
  category_name?: string
}

const getImage = (images: any): string => {
  try {
    if (Array.isArray(images)) return images[0] || '/placeholder.png'
    const arr = JSON.parse(images || '[]')
    return arr[0] || '/placeholder.png'
  } catch { return '/placeholder.png' }
}

function RecentCard({ product }: { product: RecentProduct }) {
  const [cartLoading, setCartLoading] = useState(false)
  const { loginuserdata, cartdata, fetchCart, getwishlist, wishlistdata, setOpencart } = useAuth()

  const isWishlisted = !!wishlistdata?.items?.find((i: any) => i?.id == product.id)
  const isOutOfStock = product.inventory <= 0
  const isInCart = cartdata?.items?.some((i: any) => i?.product_id == product.id)
  const discount = product.compareprice
    ? Math.round(((Number(product.compareprice) - Number(product.price)) / Number(product.compareprice)) * 100)
    : 0

  const handleCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (isOutOfStock || cartLoading) return
    if (isInCart) { setOpencart(true); return }
    setCartLoading(true)
    try {
      const payload: any = { productId: product.id, quantity: 1 }
      if (!loginuserdata?.id) {
        const sid = localStorage.getItem('guest_session_id')
        if (sid) payload.sessionId = sid
      }
      await axios.post('/cart', payload)
      toast.success('Added to cart!')
      fetchCart(loginuserdata?.id)
    } catch { toast.error('Could not add to cart') }
    finally { setCartLoading(false) }
  }

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await axios.post('/shop/wishlist', { productId: product.id })
      getwishlist()
    } catch { toast.error('Login required') }
  }

  return (
    <Link
      href={`/product/${product.slug || product.id}`}
      className="group block flex-shrink-0"
      style={{ width: 200 }}
    >
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className="relative overflow-hidden bg-gray-50" style={{ height: 200 }}>
          <img
            src={getImage(product.images)}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {discount > 0 && (
            <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
              -{discount}%
            </span>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="text-[10px] font-bold text-gray-500 border border-gray-300 px-3 py-1 rounded-full">Out of Stock</span>
            </div>
          )}
          <button
            onClick={handleWishlist}
            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Heart
              size={13}
              fill={isWishlisted ? '#ef4444' : 'transparent'}
              color={isWishlisted ? '#ef4444' : '#9ca3af'}
            />
          </button>
        </div>
        <div className="p-3">
          {product.category_name && (
            <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-600 mb-1">{product.category_name}</p>
          )}
          <p className="text-sm font-semibold text-gray-800 leading-snug mb-2 line-clamp-2">{product.name}</p>
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-base font-bold text-gray-900">
              ₹{Number(product.price).toLocaleString('en-IN')}
            </span>
            {product.compareprice && (
              <span className="text-xs text-gray-400 line-through">
                ₹{Number(product.compareprice).toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <button
            onClick={handleCart}
            disabled={isOutOfStock || cartLoading}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl transition-all"
            style={{
              background: isOutOfStock ? '#f3f4f6' : isInCart ? '#d1fae5' : '#1a2e1a',
              color: isOutOfStock ? '#9ca3af' : isInCart ? '#059669' : '#fff',
              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
            }}
          >
            {cartLoading
              ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : <ShoppingCart size={12} />}
            {cartLoading ? 'Adding…' : isOutOfStock ? 'Out of Stock' : isInCart ? 'In Cart' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </Link>
  )
}

export function RecentlyViewedSection() {
  const { loginuserdata } = useAuth()
  const [products, setProducts] = useState<RecentProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!loginuserdata?.id) { setLoading(false); return }
    axios.get('/shop/recently-viewed')
      .then(res => setProducts(res.data?.products || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [loginuserdata?.id])

  if (!loginuserdata?.id || loading || products.length === 0) return null

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Clock size={16} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Recently Viewed</h2>
            <p className="text-xs text-gray-400 mt-0.5">Pick up where you left off</p>
          </div>
          <Link href="/products" className="ml-auto text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
            Browse all →
          </Link>
        </div>

        <div
          className="flex gap-4 overflow-x-auto pb-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map(p => (
            <RecentCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  )
}
