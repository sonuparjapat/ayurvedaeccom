'use client'

import { useState, useEffect } from 'react'
import axios from '@/lib/axios'
import Link from 'next/link'
import toast from 'react-hot-toast'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import StarRating from '@/components/StartRatings'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'

import {
  Grid,
  List,
  ShoppingCart,
  Heart,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  AlertCircle,
  Check,
  Package,
  X,
  Sparkles,
  Leaf,
} from 'lucide-react'

import { motion, AnimatePresence } from 'framer-motion'

import { notify } from '../utils/notify'
import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'

/* ================= TYPES ================= */

interface Product {
  id: string
  name: string
  slug: string
  shortdescription: string
  price: number
  compareprice?: number
  images: string
  inventory: number
  category_name: string
  averagerating: number
  reviewcount: number
}

/* ================= COMPONENT ================= */
import { useSearchParams } from 'next/navigation'
export default function ProductsPage() {
  /* ---------- STATE ---------- */
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
const params = useSearchParams()
  const q = params.get('q') || ''
  const [search, setSearch] = useState(q||'')
  const [category, setCategory] = useState('all')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [rating, setRating] = useState('0')
  const [inStock, setInStock] = useState(false)
  const [discount, setDiscount] = useState(false)
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  const [page, setPage] = useState(1)
  const limit = 9
  const [total, setTotal] = useState(0)

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  const { handleCart, fetchCart, cartdata, loginuserdata,getwishlist } = useAuth()
  const router = useRouter()
const {wishlistdata}=useAuth()
  /* ---------- FETCH ---------- */
  useEffect(() => {
    fetchCategories()
    fetchProducts()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      fetchProducts()
    }, 400)
    return () => clearTimeout(t)
  }, [search, category, minPrice, maxPrice, rating, inStock, discount, sortBy, sortOrder, page])

  /* ---------- API ---------- */
  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/shop/public', {
        params: { search, category, minPrice, maxPrice, rating, inStock, discount, sortBy, sortOrder, page, limit },
      })
      setProducts(res.data.products || [])
      setTotal(res.data.total || 0)
    } catch {
      notify.error('Unable to load products')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/shop/categories')
      setCategories(res.data.categories || [])
    } catch {
      notify.error('Category load failed')
    }
  }

  /* ---------- HELPERS ---------- */
  const getImageUrl = (images: string) => {
    try {
      const arr = images || '[]'
      return arr[0] || '/placeholder-product.jpg'
    } catch {
      return '/placeholder-product.jpg'
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(price)
  }

  const getDiscount = (price: number, comparePrice?: number) => {
    if (!comparePrice || comparePrice <= price) return null
    return Math.round(((comparePrice - price) / comparePrice) * 100)
  }

  /* ---------- ACTIONS ---------- */
  const toggleLike = async (id: string) => {
    try {
      await axios.post('/shop/wishlist', { productId: id })
      notify.success('Wishlist updated')
      getwishlist()
    } catch {
      notify.error('Login required')
    }
  }

  const addToCart = async (id: string) => {
    if (!loginuserdata?.id) {
      notify.error('Login first')
      router.push('/auth')
      return
    }
    try {
      await axios.post('/cart', { productId: id, quantity: 1 })
      notify.success('Added to cart')
      fetchCart(loginuserdata?.id)
    } catch {
      notify.error('Add to cart failed')
    }
  }

  const totalPages = Math.ceil(total / limit)

  const clearFilters = () => {
    setMinPrice('')
    setMaxPrice('')
    setRating('0')
    setInStock(false)
    setDiscount(false)
    setSortBy('created_at')
    setSortOrder('desc')
    setPage(1)
  }
console.log(wishlistdata,"wishlistdata")
  const hasActiveFilters = minPrice || maxPrice || rating !== '0' || inStock || discount || sortBy !== 'created_at'

  /* ================= UI ================= */
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

        :root {
          --cream: #faf7f2;
          --warm-white: #f5f0e8;
          --gold: #b8860b;
          --gold-light: #d4a843;
          --gold-pale: #f0e6c8;
          --charcoal: #1a1a1a;
          --dark-brown: #2c1f0e;
          --medium-brown: #5c4a32;
          --light-brown: #8b6e4e;
          --sage: #7a8c6e;
          --terracotta: #c4673a;
        }

        .font-display { font-family: 'Cormorant Garamond', serif; }
        .font-body { font-family: 'DM Sans', sans-serif; }

        .gold-shimmer {
          background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 50%, var(--gold) 100%);
          background-size: 200% 200%;
          animation: shimmer 3s ease infinite;
        }
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .card-hover {
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .card-hover:hover {
          transform: translateY(-8px);
          box-shadow: 0 32px 64px rgba(44, 31, 14, 0.15), 0 8px 16px rgba(44, 31, 14, 0.08);
        }

        .img-zoom img {
          transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .img-zoom:hover img {
          transform: scale(1.08);
        }

        .grain-overlay::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1;
          opacity: 0.4;
        }

        .custom-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235c4a32' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px;
        }

        .skeleton-wave {
          background: linear-gradient(90deg, #f0e6c8 25%, #f8f2e4 50%, #f0e6c8 75%);
          background-size: 200% 100%;
          animation: wave 1.5s ease infinite;
        }
        @keyframes wave {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .filter-chip {
          transition: all 0.2s ease;
        }
        .filter-chip:hover {
          transform: translateY(-1px);
        }

        .page-btn {
          transition: all 0.2s ease;
        }
        .page-btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { opacity: 0.6; }
      `}</style>

      <div className="min-h-screen font-body" style={{ background: 'var(--cream)' }}>
        <Header />

        {/* ================= HERO ================= */}
        <div
          className="relative overflow-hidden grain-overlay"
          style={{
            background: 'linear-gradient(135deg, var(--dark-brown) 0%, #1f1208 40%, var(--medium-brown) 100%)',
            paddingTop: '5rem',
            paddingBottom: '5rem',
          }}
        >
          {/* Decorative orbs */}
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl"
            style={{ background: 'var(--gold-light)', transform: 'translate(30%, -30%)' }}
          />
          <div
            className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 blur-3xl"
            style={{ background: 'var(--terracotta)', transform: 'translate(-30%, 30%)' }}
          />

          {/* Decorative horizontal lines */}
          <div className="absolute inset-x-0 top-8 flex items-center justify-center gap-4 opacity-20">
            <div className="h-px flex-1 max-w-xs" style={{ background: 'var(--gold)' }} />
            <Leaf size={12} color="var(--gold)" />
            <div className="h-px flex-1 max-w-xs" style={{ background: 'var(--gold)' }} />
          </div>

          <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <p
                className="text-xs tracking-[0.35em] uppercase mb-4 font-body font-medium"
                style={{ color: 'var(--gold-light)' }}
              >
                Premium Ayurvedic Collection
              </p>
              <h1
                className="font-display text-6xl md:text-7xl lg:text-8xl font-light text-white mb-4"
                style={{ letterSpacing: '-0.02em', lineHeight: 1.05 }}
              >
                Our{' '}
                <em
                  className="italic font-light"
                  style={{ color: 'var(--gold-light)' }}
                >
                  Products
                </em>
              </h1>
              <div className="flex items-center justify-center gap-4 mt-6 opacity-30">
                <div className="h-px w-20" style={{ background: 'var(--gold)' }} />
                <Sparkles size={14} color="var(--gold)" />
                <div className="h-px w-20" style={{ background: 'var(--gold)' }} />
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">

          {/* ================= CONTROLS ================= */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="rounded-3xl p-5 sm:p-7 mb-8 flex flex-col lg:flex-row gap-4 justify-between items-center"
            style={{
              background: 'white',
              boxShadow: '0 4px 24px rgba(44,31,14,0.07), 0 1px 4px rgba(44,31,14,0.05)',
              border: '1px solid rgba(184,134,11,0.12)',
            }}
          >
            {/* SEARCH */}
            <div className="relative w-full lg:w-[420px]">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2"
                size={17}
                style={{ color: 'var(--gold)' }}
              />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search products…"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm font-body outline-none transition-all"
                style={{
                  background: 'var(--warm-white)',
                  border: '1.5px solid transparent',
                  color: 'var(--charcoal)',
                  fontFamily: 'inherit',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--gold)')}
                onBlur={e => (e.target.style.borderColor = 'transparent')}
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-center">
              {/* Total count */}
              {!loading && (
                <span className="text-sm font-body" style={{ color: 'var(--light-brown)' }}>
                  <strong style={{ color: 'var(--charcoal)' }}>{total}</strong> products
                </span>
              )}

              {/* FILTER TOGGLE */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium transition-all"
                style={{
                  background: showFilters ? 'var(--dark-brown)' : 'var(--gold-pale)',
                  color: showFilters ? 'white' : 'var(--medium-brown)',
                  fontFamily: 'inherit',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <SlidersHorizontal size={15} />
                Filters
                {hasActiveFilters && (
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ background: 'var(--gold)' }}
                  />
                )}
              </button>

              {/* VIEW MODE */}
              <div
                className="flex rounded-2xl overflow-hidden"
                style={{ border: '1.5px solid var(--gold-pale)' }}
              >
                {(['grid', 'list'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className="p-3 transition-all"
                    style={{
                      background: viewMode === mode ? 'var(--dark-brown)' : 'transparent',
                      color: viewMode === mode ? 'white' : 'var(--light-brown)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {mode === 'grid' ? <Grid size={16} /> : <List size={16} />}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ================= FILTERS ================= */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="overflow-hidden mb-8"
              >
                <div
                  className="rounded-3xl p-6 sm:p-8"
                  style={{
                    background: 'white',
                    boxShadow: '0 4px 24px rgba(44,31,14,0.07)',
                    border: '1px solid rgba(184,134,11,0.12)',
                  }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3
                      className="font-display text-xl font-semibold"
                      style={{ color: 'var(--dark-brown)' }}
                    >
                      Refine Results
                    </h3>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
                        style={{
                          background: 'var(--gold-pale)',
                          color: 'var(--medium-brown)',
                          border: 'none',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        <X size={12} /> Clear all
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* CATEGORY */}
                    <div>
                      <label
                        className="block text-xs font-medium tracking-wider uppercase mb-3"
                        style={{ color: 'var(--light-brown)' }}
                      >
                        Category
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['all', ...categories].map(c => (
                          <button
                            key={c}
                            onClick={() => { setCategory(c); setPage(1) }}
                            className="filter-chip px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                            style={{
                              background: category === c ? 'var(--dark-brown)' : 'var(--warm-white)',
                              color: category === c ? 'white' : 'var(--medium-brown)',
                              border: category === c ? '1.5px solid var(--dark-brown)' : '1.5px solid var(--gold-pale)',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              textTransform: 'capitalize',
                            }}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* PRICE */}
                    <div>
                      <label
                        className="block text-xs font-medium tracking-wider uppercase mb-3"
                        style={{ color: 'var(--light-brown)' }}
                      >
                        Price Range
                      </label>
                      <div className="flex gap-2">
                        {[
                          { placeholder: 'Min ₹', value: minPrice, onChange: setMinPrice },
                          { placeholder: 'Max ₹', value: maxPrice, onChange: setMaxPrice },
                        ].map((field, i) => (
                          <input
                            key={i}
                            type="number"
                            placeholder={field.placeholder}
                            value={field.value}
                            onChange={e => field.onChange(e.target.value)}
                            className="flex-1 min-w-0 px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                            style={{
                              background: 'var(--warm-white)',
                              border: '1.5px solid transparent',
                              color: 'var(--charcoal)',
                              fontFamily: 'inherit',
                            }}
                            onFocus={e => (e.target.style.borderColor = 'var(--gold)')}
                            onBlur={e => (e.target.style.borderColor = 'transparent')}
                          />
                        ))}
                      </div>
                    </div>

                    {/* RATING + SORT */}
                    <div>
                      <label
                        className="block text-xs font-medium tracking-wider uppercase mb-3"
                        style={{ color: 'var(--light-brown)' }}
                      >
                        Sort & Rating
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={rating}
                          onChange={e => setRating(e.target.value)}
                          className="custom-select flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                          style={{
                            background: 'var(--warm-white)',
                            border: '1.5px solid var(--gold-pale)',
                            color: 'var(--charcoal)',
                            fontFamily: 'inherit',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="0">All Ratings</option>
                          <option value="4">4★ +</option>
                          <option value="3">3★ +</option>
                          <option value="2">2★ +</option>
                        </select>

                        <select
                          value={sortBy}
                          onChange={e => setSortBy(e.target.value)}
                          className="custom-select flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                          style={{
                            background: 'var(--warm-white)',
                            border: '1.5px solid var(--gold-pale)',
                            color: 'var(--charcoal)',
                            fontFamily: 'inherit',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="created_at">Newest</option>
                          <option value="price">Price</option>
                          <option value="averagerating">Rating</option>
                          <option value="name">Name</option>
                        </select>
                      </div>
                    </div>

                    {/* TOGGLES */}
                    <div className="flex gap-6">
                      {[
                        { label: 'In Stock', value: inStock, onChange: setInStock },
                        { label: 'On Sale', value: discount, onChange: setDiscount },
                      ].map(toggle => (
                        <label
                          key={toggle.label}
                          className="flex items-center gap-3 cursor-pointer select-none"
                        >
                          <div
                            onClick={() => toggle.onChange(!toggle.value)}
                            className="relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0"
                            style={{
                              background: toggle.value ? 'var(--dark-brown)' : 'var(--gold-pale)',
                              cursor: 'pointer',
                            }}
                          >
                            <div
                              className="absolute top-1 w-4 h-4 rounded-full transition-all duration-300"
                              style={{
                                left: toggle.value ? '24px' : '4px',
                                background: toggle.value ? 'var(--gold-light)' : 'var(--light-brown)',
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium" style={{ color: 'var(--medium-brown)' }}>
                            {toggle.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ================= PRODUCTS ================= */}
          {loading ? (
            <div
              className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}
            >
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-3xl overflow-hidden" style={{ background: 'white' }}>
                  <div className="h-72 skeleton-wave" />
                  <div className="p-6 space-y-3">
                    <div className="h-3 w-20 rounded-full skeleton-wave" />
                    <div className="h-5 w-3/4 rounded-full skeleton-wave" />
                    <div className="h-3 w-full rounded-full skeleton-wave" />
                    <div className="h-3 w-2/3 rounded-full skeleton-wave" />
                    <div className="h-10 rounded-2xl skeleton-wave mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24"
            >
              <Package size={48} style={{ color: 'var(--gold-pale)', margin: '0 auto 16px' }} />
              <h3 className="font-display text-2xl mb-2" style={{ color: 'var(--medium-brown)' }}>
                No products found
              </h3>
              <p className="text-sm" style={{ color: 'var(--light-brown)' }}>
                Try adjusting your filters or search term
              </p>
            </motion.div>
          ) : (
            <div
              className={`grid ${
                viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1'
              } gap-6 lg:gap-8`}
            >
              {products.map((product, i) => {
                const inCart = cartdata?.items?.filter(c => c.product_id == product.id).length >= 1
                const discountPct = getDiscount(product.price, product.compareprice)
                const isOutOfStock = product.inventory === 0
                const isLowStock = product.inventory > 0 && product.inventory <= 5

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className={`card-hover rounded-3xl overflow-hidden ${viewMode === 'list' ? 'flex' : ''}`}
                    style={{
                      background: 'white',
                      boxShadow: '0 2px 16px rgba(44,31,14,0.06), 0 1px 4px rgba(44,31,14,0.04)',
                      border: '1px solid rgba(184,134,11,0.08)',
                    }}
                  >
                    {/* IMAGE */}
                    <div
                      className={`relative overflow-hidden img-zoom ${
                        viewMode === 'list' ? 'w-52 flex-shrink-0' : 'h-64'
                      }`}
                      style={{ background: 'var(--warm-white)' }}
                    >
                      <img
                        src={getImageUrl(product.images)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />

                      {/* Gradient overlay bottom */}
                      {!isOutOfStock && (
                        <div
                          className="absolute inset-x-0 bottom-0 h-16"
                          style={{
                            background: 'linear-gradient(to top, rgba(255,255,255,0.3), transparent)',
                          }}
                        />
                      )}

                      {/* OUT OF STOCK overlay */}
                      {isOutOfStock && (
                        <div
                          className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                          style={{ background: 'rgba(26,10,3,0.65)', backdropFilter: 'blur(2px)' }}
                        >
                          <Package size={28} color="white" />
                          <span className="text-white text-xs font-medium tracking-wider uppercase font-body">
                            Unavailable
                          </span>
                        </div>
                      )}

                      {/* DISCOUNT BADGE */}
                      {discountPct && !isOutOfStock && (
                        <div
                          className="absolute top-4 left-4 px-2.5 py-1 rounded-full text-xs font-semibold font-body"
                          style={{ background: 'var(--terracotta)', color: 'white' }}
                        >
                          -{discountPct}%
                        </div>
                      )}

                      {/* WISHLIST */}
                      <button
                        onClick={() => toggleLike(product.id)}
                        className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                        style={{
                          background: 'rgba(255,255,255,0.92)',
                          backdropFilter: 'blur(4px)',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                        }}
                      >
  <Heart
        size={18}
        strokeWidth={2}
        className="transition-all duration-200"
        fill={wishlistdata?.items?.find((item:any)=>item?.id==product?.id)?.id ? "red" : "transparent"}
        color={wishlistdata?.items?.find((item:any)=>item?.id==product?.id)?.id  ? "red" : "var(--terracotta)"}
      />
                      </button>
                    </div>

                    {/* INFO */}
                    <div className={`p-5 sm:p-6 flex flex-col ${viewMode === 'list' ? 'flex-1' : ''}`}>
                      {/* Category */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-xs font-semibold tracking-widest uppercase font-body"
                          style={{ color: 'var(--gold)' }}
                        >
                          {product.category_name}
                        </span>

                        {/* Stock badge */}
                        {isLowStock ? (
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full font-body"
                            style={{ background: '#fff3e0', color: '#e65100' }}
                          >
                            Only {product.inventory} left
                          </span>
                        ) : !isOutOfStock ? (
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full font-body"
                            style={{ background: '#e8f5e9', color: '#2e7d32' }}
                          >
                            In Stock
                          </span>
                        ) : null}
                      </div>

                      {/* Name */}
                      <h3
                        className="font-display text-xl sm:text-2xl font-semibold mb-1.5 leading-tight"
                        style={{ color: 'var(--dark-brown)' }}
                      >
                        {product.name}
                      </h3>

                      {/* Description */}
                      <p
                        className="text-sm leading-relaxed mb-3 line-clamp-2 font-body flex-1"
                        style={{ color: 'var(--light-brown)' }}
                      >
                        {product.shortdescription}
                      </p>

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-4">
                        <StarRating
                          productId={product.id}
                          avgRating={product.averagerating}
                          refresh={fetchProducts}
                        />
                        <span className="text-xs font-body" style={{ color: 'var(--light-brown)' }}>
                          ({product.reviewcount})
                        </span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center gap-2.5 mb-5">
                        <span
                          className="font-display text-2xl font-semibold"
                          style={{ color: 'var(--dark-brown)' }}
                        >
                          {formatPrice(product.price)}
                        </span>
                        {product.compareprice && (
                          <span
                            className="text-sm line-through font-body"
                            style={{ color: '#bbb' }}
                          >
                            {formatPrice(product.compareprice)}
                          </span>
                        )}
                      </div>

                      {/* ACTIONS */}
                      <div className="flex gap-3 mt-auto">
                        <Link href={`/product/${product.id}`} className="flex-1">
                          <button
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium font-body transition-all hover:opacity-80"
                            style={{
                              background: 'var(--warm-white)',
                              color: 'var(--medium-brown)',
                              border: '1.5px solid var(--gold-pale)',
                              cursor: 'pointer',
                            }}
                          >
                            <Eye size={15} />
                            View
                          </button>
                        </Link>

                        {isOutOfStock ? (
                          <button
                            disabled
                            className="flex-1 py-3 rounded-2xl text-sm font-medium font-body"
                            style={{
                              background: '#f5f5f5',
                              color: '#bbb',
                              border: '1.5px solid #e0e0e0',
                              cursor: 'not-allowed',
                            }}
                          >
                            Out of Stock
                          </button>
                        ) : inCart ? (
                          <button
                            onClick={() => handleCart(true)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold font-body transition-all hover:opacity-90"
                            style={{
                              background: 'var(--sage)',
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <Check size={15} />
                            In Cart
                          </button>
                        ) : (
                          <button
                            onClick={() => addToCart(product.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold font-body transition-all hover:opacity-90 gold-shimmer"
                            style={{
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <ShoppingCart size={15} />
                            Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* ================= PAGINATION ================= */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center items-center gap-2 mt-14"
            >
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="page-btn w-10 h-10 rounded-2xl flex items-center justify-center transition-all"
                style={{
                  background: page === 1 ? 'var(--warm-white)' : 'white',
                  border: '1.5px solid var(--gold-pale)',
                  color: page === 1 ? '#bbb' : 'var(--medium-brown)',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  boxShadow: page === 1 ? 'none' : '0 2px 8px rgba(44,31,14,0.08)',
                }}
              >
                <ChevronLeft size={17} />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const isActive = page === i + 1
                const isNear = Math.abs(page - (i + 1)) <= 2

                if (!isNear && i !== 0 && i !== totalPages - 1) {
                  if (i === 1 || i === totalPages - 2) {
                    return (
                      <span key={i} className="px-1" style={{ color: 'var(--light-brown)' }}>
                        …
                      </span>
                    )
                  }
                  return null
                }

                return (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className="page-btn w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-semibold font-body transition-all"
                    style={{
                      background: isActive ? 'var(--dark-brown)' : 'white',
                      color: isActive ? 'white' : 'var(--medium-brown)',
                      border: isActive ? 'none' : '1.5px solid var(--gold-pale)',
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 4px 16px rgba(44,31,14,0.25)' : '0 2px 8px rgba(44,31,14,0.05)',
                    }}
                  >
                    {i + 1}
                  </button>
                )
              })}

              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="page-btn w-10 h-10 rounded-2xl flex items-center justify-center transition-all"
                style={{
                  background: page === totalPages ? 'var(--warm-white)' : 'white',
                  border: '1.5px solid var(--gold-pale)',
                  color: page === totalPages ? '#bbb' : 'var(--medium-brown)',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  boxShadow: page === totalPages ? 'none' : '0 2px 8px rgba(44,31,14,0.08)',
                }}
              >
                <ChevronRight size={17} />
              </button>
            </motion.div>
          )}
        </div>

        <Footer />
      </div>
    </>
  )
}