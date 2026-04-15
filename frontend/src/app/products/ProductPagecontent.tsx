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
  Truck,
  Shield,
  RefreshCw,
  Zap,
  Filter,
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
export default function ProductsPageContent() {
  /* ---------- STATE ---------- */
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const params = useSearchParams()
  const q = params.get('q') || ''
  const [search, setSearch] = useState(q || '')
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const { handleCart, fetchCart, cartdata, loginuserdata, getwishlist } = useAuth()
  const router = useRouter()
  const { wishlistdata } = useAuth()

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

  const hasActiveFilters = minPrice || maxPrice || rating !== '0' || inStock || discount || sortBy !== 'created_at'
  const activeFiltersCount = [minPrice, maxPrice, rating !== '0', inStock, discount, sortBy !== 'created_at'].filter(Boolean).length

  /* ================= UI ================= */
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        :root {
          --cream: #faf8f3;
          --warm-white: #f5f1e8;
          --gold: #b8860b;
          --gold-light: #d4a843;
          --gold-pale: #f0e6c8;
          --gold-faint: #fdf8ee;
          --charcoal: #1a1a1a;
          --dark-brown: #2c1f0e;
          --medium-brown: #5c4a32;
          --light-brown: #8b6e4e;
          --sage: #5d7a52;
          --sage-light: #7a9c6e;
          --terracotta: #c4673a;
          --emerald: #1a6b4a;
          --emerald-light: #2d8a60;
          --emerald-pale: #e8f5ee;
        }

        .font-display { font-family: 'Cormorant Garamond', serif; }
        .font-body { font-family: 'DM Sans', sans-serif; }

        /* ── PREMIUM CARD ── */
        .product-card {
          position: relative;
          transition:
            transform 0.5s cubic-bezier(0.23, 1, 0.32, 1),
            box-shadow 0.5s cubic-bezier(0.23, 1, 0.32, 1);
          transform-style: preserve-3d;
          will-change: transform;
        }
        .product-card:hover {
          transform: translateY(-10px) scale(1.018);
          box-shadow:
            0 32px 64px rgba(44, 31, 14, 0.18),
            0 8px 24px rgba(44, 31, 14, 0.1),
            0 0 0 1px rgba(212, 168, 67, 0.2) !important;
        }

        /* Shimmer sweep on hover */
        .product-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(
            110deg,
            transparent 20%,
            rgba(255, 255, 255, 0.55) 50%,
            transparent 80%
          );
          background-size: 250% 100%;
          background-position: 200% 0;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
          z-index: 10;
        }
        .product-card:hover::before {
          opacity: 1;
          animation: shimmerSweep 0.65s ease forwards;
        }
        @keyframes shimmerSweep {
          from { background-position: 200% 0; }
          to   { background-position: -50% 0; }
        }

        /* Gold border glow on hover */
        .product-card::after {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          background: linear-gradient(135deg, rgba(212,168,67,0.6) 0%, rgba(184,134,11,0.3) 50%, rgba(212,168,67,0.5) 100%);
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
          z-index: -1;
        }
        .product-card:hover::after {
          opacity: 1;
        }

        /* Image zoom */
        .card-img-wrap {
          overflow: hidden;
        }
        .card-img-wrap img {
          transition: transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          will-change: transform;
        }
        .product-card:hover .card-img-wrap img {
          transform: scale(1.12);
        }

        /* Overlay fade */
        .card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(26, 12, 3, 0.52) 0%,
            rgba(26, 12, 3, 0.12) 45%,
            transparent 70%
          );
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        .product-card:hover .card-overlay {
          opacity: 1;
        }

        /* Floating action buttons */
        .card-actions {
          position: absolute;
          top: 14px;
          right: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          z-index: 20;
        }
        .card-action-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.96);
          border: none;
          cursor: pointer;
          transition:
            transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
            opacity 0.25s ease,
            background 0.2s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.14);
          opacity: 0;
          transform: translateX(10px);
        }
        .product-card:hover .card-action-btn {
          opacity: 1;
          transform: translateX(0);
        }
        .product-card:hover .card-action-btn:nth-child(1) { transition-delay: 0s; }
        .product-card:hover .card-action-btn:nth-child(2) { transition-delay: 0.06s; }
        .card-action-btn:hover {
          transform: scale(1.15) !important;
          background: var(--dark-brown) !important;
        }
        .card-action-btn:hover svg { color: white !important; }

        /* Wishlist always visible */
        .wishlist-always {
          opacity: 1 !important;
          transform: none !important;
        }

        /* Add to cart — slide up on hover */
        .card-cta-wrap {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 0 14px 14px;
          transform: translateY(8px);
          opacity: 0;
          transition: transform 0.35s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.3s ease;
          z-index: 20;
        }
        .product-card:hover .card-cta-wrap {
          transform: translateY(0);
          opacity: 1;
        }

        /* Card body slide */
        .card-body {
          position: relative;
          transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        }

        /* Gold accent line */
        .gold-accent-line {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%) scaleX(0);
          width: 60%;
          height: 2px;
          background: linear-gradient(to right, transparent, var(--gold-light), transparent);
          transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          transform-origin: center;
        }
        .product-card:hover .gold-accent-line {
          transform: translateX(-50%) scaleX(1);
        }

        /* Category pill */
        .cat-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          padding: 3px 10px;
          border-radius: 100px;
          background: var(--gold-pale);
          color: var(--gold);
          border: 1px solid rgba(184,134,11,0.2);
        }

        /* Stock indicator dot */
        .stock-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
          animation: pulseDot 2s ease infinite;
        }
        @keyframes pulseDot {
          0%,100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* btn-gold */
        .btn-gold {
          background: linear-gradient(135deg, #b8860b 0%, #d4a843 50%, #b8860b 100%);
          background-size: 200% 200%;
          animation: goldShift 3s ease infinite;
          transition: opacity 0.2s ease, transform 0.15s ease;
        }
        .btn-gold:hover { opacity: 0.92; transform: translateY(-1px); }
        .btn-gold:active { transform: scale(0.97); }
        @keyframes goldShift {
          0%,100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .btn-outline-brown {
          background: transparent;
          border: 1.5px solid var(--gold-pale);
          color: var(--medium-brown);
          transition: all 0.2s ease;
        }
        .btn-outline-brown:hover {
          background: var(--gold-faint);
          border-color: var(--gold-light);
          color: var(--dark-brown);
        }

        /* List card */
        .list-card {
          transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.4s ease;
          position: relative;
          overflow: hidden;
        }
        .list-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: linear-gradient(to bottom, var(--gold-light), var(--terracotta));
          transform: scaleY(0);
          transition: transform 0.35s cubic-bezier(0.23, 1, 0.32, 1);
          transform-origin: top;
          border-radius: 0 2px 2px 0;
        }
        .list-card:hover {
          transform: translateX(6px);
          box-shadow: 0 12px 40px rgba(44,31,14,0.12), 0 2px 8px rgba(44,31,14,0.06) !important;
        }
        .list-card:hover::before { transform: scaleY(1); }
        .list-card .card-img-wrap img {
          transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .list-card:hover .card-img-wrap img { transform: scale(1.08); }

        /* Skeleton shimmer */
        .wave-skeleton {
          background: linear-gradient(90deg, #ede8de 25%, #f7f2e8 50%, #ede8de 75%);
          background-size: 200% 100%;
          animation: waveSkeleton 1.6s ease infinite;
        }
        @keyframes waveSkeleton {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Sidebar & misc */
        .filter-chip { transition: all 0.18s ease; cursor: pointer; }
        .filter-chip:hover { transform: translateY(-1px); }

        .custom-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235c4a32' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px;
        }

        .page-dot { transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .page-dot:hover:not(:disabled) { transform: translateY(-2px); }

        /* Heart pop */
        @keyframes heartPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.35); }
          100% { transform: scale(1); }
        }
        .heart-active { animation: heartPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }

        /* Image number badge */
        .img-badge-discount {
          position: absolute;
          top: 14px;
          left: 14px;
          padding: 5px 11px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.04em;
          color: white;
          background: var(--terracotta);
          backdrop-filter: blur(4px);
          box-shadow: 0 2px 8px rgba(196,103,58,0.4);
          z-index: 15;
        }
        .img-badge-low {
          position: absolute;
          top: 14px;
          left: 14px;
          padding: 5px 11px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 800;
          color: white;
          background: #e65100;
          z-index: 15;
          box-shadow: 0 2px 8px rgba(230,81,0,0.4);
        }

        /* Price */
        .price-main {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-weight: 600;
          color: var(--dark-brown);
          line-height: 1;
        }
        .price-strike {
          font-size: 13px;
          text-decoration: line-through;
          color: #c0b09a;
        }
        .price-save {
          font-size: 11px;
          font-weight: 700;
          color: var(--emerald);
          background: var(--emerald-pale);
          padding: 2px 7px;
          border-radius: 100px;
        }

        input[type=number]::-webkit-inner-spin-button { opacity: 0.5; }
      `}</style>

      <div className="min-h-screen font-body" style={{ background: 'var(--cream)' }}>
        <Header />

        {/* ================= HERO ================= */}
        <div
          className="relative overflow-hidden"
          style={{
            background: 'linear-gradient(140deg, #1e1208 0%, #2c1f0e 45%, #3d2912 100%)',
            paddingTop: '4.5rem',
            paddingBottom: '4.5rem',
          }}
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-8 blur-[80px] pointer-events-none" style={{ background: '#c4673a', transform: 'translate(40%, -40%)' }} />
          <div className="absolute bottom-0 left-0 w-[350px] h-[350px] rounded-full opacity-6 blur-[60px] pointer-events-none" style={{ background: '#b8860b', transform: 'translate(-35%, 35%)' }} />
          <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(212,168,67,0.4), transparent)' }} />
          <div className="absolute bottom-0 inset-x-0 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(212,168,67,0.3), transparent)' }} />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px w-8" style={{ background: 'var(--gold-light)' }} />
                  <span className="text-[10px] tracking-[0.4em] uppercase font-body font-semibold" style={{ color: 'var(--gold-light)' }}>
                    Premium Ayurvedic
                  </span>
                </div>
                <h1 className="font-display text-5xl md:text-6xl font-light text-white leading-tight mb-4" style={{ letterSpacing: '-0.02em' }}>
                  Our <em className="italic" style={{ color: 'var(--gold-light)' }}>Collection</em>
                </h1>
                <p className="text-sm font-body" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Handcrafted wellness from nature&apos;s finest ingredients
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="hidden lg:flex items-center gap-6"
              >
                {[
                  { icon: Truck, label: 'Free Delivery', sub: 'Orders over ₹499' },
                  { icon: Shield, label: 'Secure Pay', sub: '100% protected' },
                  { icon: RefreshCw, label: 'Easy Returns', sub: '7-day policy' },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.25)' }}>
                      <Icon size={15} style={{ color: 'var(--gold-light)' }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white leading-none mb-0.5">{label}</p>
                      <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>

        {/* ================= MAIN ================= */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

          {/* ================= TOP BAR ================= */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-6"
          >
            <div className="relative flex-1 max-w-[440px]">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--gold)' }} />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search products…"
                className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm font-body outline-none transition-all"
                style={{
                  background: 'white',
                  border: '1.5px solid rgba(184,134,11,0.15)',
                  color: 'var(--charcoal)',
                  fontFamily: 'inherit',
                  boxShadow: '0 2px 8px rgba(44,31,14,0.04)',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--gold)'; e.target.style.boxShadow = '0 0 0 3px rgba(184,134,11,0.08)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(184,134,11,0.15)'; e.target.style.boxShadow = '0 2px 8px rgba(44,31,14,0.04)' }}
              />
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {!loading && (
                <span className="text-sm font-body hidden sm:block" style={{ color: 'var(--light-brown)' }}>
                  <strong style={{ color: 'var(--charcoal)' }}>{total}</strong> results
                </span>
              )}

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold transition-all relative"
                style={{
                  background: showFilters ? 'var(--dark-brown)' : 'white',
                  color: showFilters ? 'white' : 'var(--medium-brown)',
                  border: showFilters ? 'none' : '1.5px solid rgba(184,134,11,0.18)',
                  boxShadow: showFilters ? '0 4px 12px rgba(44,31,14,0.2)' : '0 2px 8px rgba(44,31,14,0.04)',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <SlidersHorizontal size={15} />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center" style={{ background: 'var(--gold)', color: 'white' }}>
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <div className="flex rounded-2xl overflow-hidden" style={{ border: '1.5px solid rgba(184,134,11,0.18)', background: 'white' }}>
                {(['grid', 'list'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className="px-3 py-2.5 transition-all"
                    style={{
                      background: viewMode === mode ? 'var(--dark-brown)' : 'transparent',
                      color: viewMode === mode ? 'white' : 'var(--light-brown)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {mode === 'grid' ? <Grid size={15} /> : <List size={15} />}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ================= LAYOUT ================= */}
          <div className="flex gap-7">

            {/* ====== SIDEBAR ====== */}
            <AnimatePresence>
              {showFilters && (
                <motion.aside
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 280, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="hidden lg:block flex-shrink-0 overflow-hidden"
                >
                  <div
                    className="rounded-3xl p-6 sticky top-6"
                    style={{
                      background: 'white',
                      border: '1px solid rgba(184,134,11,0.12)',
                      boxShadow: '0 4px 20px rgba(44,31,14,0.06)',
                      width: 280,
                    }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'var(--gold-pale)' }}>
                          <Filter size={13} style={{ color: 'var(--gold)' }} />
                        </div>
                        <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--dark-brown)' }}>Refine</h3>
                      </div>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="text-xs font-semibold flex items-center gap-1 px-2.5 py-1 rounded-full transition-all"
                          style={{ background: 'var(--gold-pale)', color: 'var(--medium-brown)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          <X size={10} /> Clear
                        </button>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--light-brown)' }}>Category</p>
                        <div className="flex flex-wrap gap-1.5">
                          {['all', ...categories].map(c => (
                            <button
                              key={c}
                              onClick={() => { setCategory(c); setPage(1) }}
                              className="filter-chip px-3 py-1.5 rounded-full text-xs font-medium"
                              style={{
                                background: category === c ? 'var(--dark-brown)' : 'var(--warm-white)',
                                color: category === c ? 'white' : 'var(--medium-brown)',
                                border: category === c ? '1.5px solid var(--dark-brown)' : '1.5px solid var(--gold-pale)',
                                fontFamily: 'inherit',
                                textTransform: 'capitalize',
                              }}
                            >{c}</button>
                          ))}
                        </div>
                      </div>
                      <div style={{ height: '1px', background: 'rgba(184,134,11,0.1)' }} />
                      <div>
                        <p className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--light-brown)' }}>Price Range</p>
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
                              style={{ background: 'var(--warm-white)', border: '1.5px solid transparent', color: 'var(--charcoal)', fontFamily: 'inherit' }}
                              onFocus={e => (e.target.style.borderColor = 'var(--gold)')}
                              onBlur={e => (e.target.style.borderColor = 'transparent')}
                            />
                          ))}
                        </div>
                      </div>
                      <div style={{ height: '1px', background: 'rgba(184,134,11,0.1)' }} />
                      <div>
                        <p className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--light-brown)' }}>Min Rating</p>
                        <select value={rating} onChange={e => setRating(e.target.value)} className="custom-select w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--warm-white)', border: '1.5px solid var(--gold-pale)', color: 'var(--charcoal)', fontFamily: 'inherit', cursor: 'pointer' }}>
                          <option value="0">All Ratings</option>
                          <option value="4">4★ & above</option>
                          <option value="3">3★ & above</option>
                          <option value="2">2★ & above</option>
                        </select>
                      </div>
                      <div style={{ height: '1px', background: 'rgba(184,134,11,0.1)' }} />
                      <div>
                        <p className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--light-brown)' }}>Sort By</p>
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="custom-select w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--warm-white)', border: '1.5px solid var(--gold-pale)', color: 'var(--charcoal)', fontFamily: 'inherit', cursor: 'pointer' }}>
                          <option value="created_at">Newest First</option>
                          <option value="price">Price: Low to High</option>
                          <option value="averagerating">Top Rated</option>
                          <option value="name">Name A–Z</option>
                        </select>
                      </div>
                      <div style={{ height: '1px', background: 'rgba(184,134,11,0.1)' }} />
                      <div className="space-y-3">
                        {[
                          { label: 'In Stock Only', value: inStock, onChange: setInStock },
                          { label: 'On Sale', value: discount, onChange: setDiscount },
                        ].map(toggle => (
                          <label key={toggle.label} className="flex items-center justify-between cursor-pointer select-none">
                            <span className="text-sm font-medium" style={{ color: 'var(--medium-brown)' }}>{toggle.label}</span>
                            <div onClick={() => toggle.onChange(!toggle.value)} className="relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0" style={{ background: toggle.value ? 'var(--dark-brown)' : 'var(--gold-pale)', cursor: 'pointer' }}>
                              <div className="absolute top-1 w-4 h-4 rounded-full transition-all duration-300" style={{ left: toggle.value ? '24px' : '4px', background: toggle.value ? 'var(--gold-light)' : 'var(--light-brown)', boxShadow: toggle.value ? '0 1px 4px rgba(184,134,11,0.4)' : 'none' }} />
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

            {/* ====== PRODUCTS AREA ====== */}
            <div className="flex-1 min-w-0">

              {/* Active filter tags */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {minPrice && <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: 'var(--gold-pale)', color: 'var(--medium-brown)' }}>Min ₹{minPrice} <button onClick={() => setMinPrice('')}><X size={10} /></button></span>}
                  {maxPrice && <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: 'var(--gold-pale)', color: 'var(--medium-brown)' }}>Max ₹{maxPrice} <button onClick={() => setMaxPrice('')}><X size={10} /></button></span>}
                  {rating !== '0' && <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: '#fff8e1', color: '#b8860b' }}>{rating}★ & above <button onClick={() => setRating('0')}><X size={10} /></button></span>}
                  {inStock && <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: 'var(--emerald-pale)', color: 'var(--emerald)' }}>In Stock <button onClick={() => setInStock(false)}><X size={10} /></button></span>}
                  {discount && <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: '#fce8e1', color: 'var(--terracotta)' }}>On Sale <button onClick={() => setDiscount(false)}><X size={10} /></button></span>}
                </div>
              )}

              {/* Mobile filter button */}
              <div className="flex items-center justify-between lg:hidden mb-5">
                <p className="text-sm font-body" style={{ color: 'var(--light-brown)' }}>
                  {!loading && <><strong style={{ color: 'var(--charcoal)' }}>{total}</strong> products</>}
                </p>
                <button onClick={() => setMobileFiltersOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold relative" style={{ background: 'white', border: '1.5px solid rgba(184,134,11,0.2)', color: 'var(--medium-brown)', fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 2px 8px rgba(44,31,14,0.04)' }}>
                  <Filter size={14} /> Filters
                  {hasActiveFilters && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center" style={{ background: 'var(--gold)', color: 'white' }}>{activeFiltersCount}</span>}
                </button>
              </div>

              {/* ====== PRODUCTS GRID ====== */}
              {loading ? (
                <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'} gap-5`}>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="rounded-3xl overflow-hidden" style={{ background: 'white', border: '1px solid rgba(184,134,11,0.08)' }}>
                      <div className="h-64 wave-skeleton" />
                      <div className="p-5 space-y-3">
                        <div className="h-2.5 w-16 rounded-full wave-skeleton" />
                        <div className="h-5 w-3/4 rounded-full wave-skeleton" />
                        <div className="h-3 w-full rounded-full wave-skeleton" />
                        <div className="h-3 w-2/3 rounded-full wave-skeleton" />
                        <div className="h-10 rounded-2xl wave-skeleton mt-2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
                  <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: 'var(--gold-pale)' }}>
                    <Package size={32} style={{ color: 'var(--gold)' }} />
                  </div>
                  <h3 className="font-display text-2xl font-semibold mb-2" style={{ color: 'var(--medium-brown)' }}>No products found</h3>
                  <p className="text-sm mb-6" style={{ color: 'var(--light-brown)' }}>Try adjusting your filters or search term</p>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold btn-gold text-white" style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                      <X size={14} /> Clear Filters
                    </button>
                  )}
                </motion.div>
              ) : (
                <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-5`}>
                  {products.map((product, i) => {
                    const inCart = cartdata?.items?.filter(c => c.product_id == product.id).length >= 1
                    const discountPct = getDiscount(product.price, product.compareprice)
                    const isOutOfStock = product.inventory === 0
                    const isLowStock = product.inventory > 0 && product.inventory <= 5
                    const isWishlisted = !!(wishlistdata?.items?.find((item: any) => item?.id == product?.id)?.id)

                    /* ─── LIST VIEW ─── */
                    if (viewMode === 'list') {
                      return (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                          className="list-card rounded-3xl flex"
                          style={{ background: 'white', border: '1px solid rgba(184,134,11,0.1)', boxShadow: '0 2px 12px rgba(44,31,14,0.05)' }}
                        >
                          <div className="relative w-44 sm:w-56 flex-shrink-0 card-img-wrap rounded-l-3xl" style={{ background: 'var(--warm-white)', overflow: 'hidden' }}>
                            <img src={getImageUrl(product.images)} alt={product.name} className="w-full h-full object-cover" />
                            {isOutOfStock && (
                              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(26,10,3,0.6)' }}>
                                <span className="text-white text-xs font-semibold tracking-wider uppercase">Unavailable</span>
                              </div>
                            )}
                            {discountPct && !isOutOfStock && <div className="img-badge-discount">-{discountPct}%</div>}
                          </div>

                          <div className="flex-1 p-5 flex flex-col">
                            <div className="flex items-start justify-between mb-2">
                              <span className="cat-pill">{product.category_name}</span>
                              <button
                                onClick={() => toggleLike(product.id)}
                                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                                style={{ background: isWishlisted ? '#fef0ee' : 'var(--warm-white)', border: isWishlisted ? '1.5px solid #f5c6bb' : '1.5px solid var(--gold-pale)', cursor: 'pointer' }}
                              >
                                <Heart size={14} fill={isWishlisted ? '#c4673a' : 'transparent'} color={isWishlisted ? '#c4673a' : 'var(--light-brown)'} />
                              </button>
                            </div>
                            <h3 className="font-display text-xl font-semibold mb-1 leading-tight" style={{ color: 'var(--dark-brown)' }}>{product.name}</h3>
                            <p className="text-sm leading-relaxed mb-3 line-clamp-2 flex-1" style={{ color: 'var(--light-brown)' }}>{product.shortdescription}</p>

                            <div className="flex items-center gap-2 mb-3">
                              <StarRating productId={product.id} avgRating={product.averagerating} refresh={fetchProducts} />
                              <span className="text-xs" style={{ color: 'var(--light-brown)' }}>({product.reviewcount})</span>
                              {isLowStock && <span className="text-xs font-semibold px-2 py-0.5 rounded-full ml-auto" style={{ background: '#fff3e0', color: '#e65100' }}>Only {product.inventory} left</span>}
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-baseline gap-2">
                                <span className="price-main">{formatPrice(product.price)}</span>
                                {product.compareprice && <span className="price-strike">{formatPrice(product.compareprice)}</span>}
                              </div>
                              <div className="flex gap-2">
                                <Link href={`/product/${product.id}`}>
                                  <button className="btn-outline-brown flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold" style={{ cursor: 'pointer', fontFamily: 'inherit' }}><Eye size={13} /> View</button>
                                </Link>
                                {isOutOfStock ? (
                                  <button disabled className="px-4 py-2 rounded-2xl text-xs font-semibold" style={{ background: '#f5f5f5', color: '#bbb', border: '1.5px solid #e0e0e0', cursor: 'not-allowed', fontFamily: 'inherit' }}>Sold Out</button>
                                ) : inCart ? (
                                  <button onClick={() => handleCart(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold" style={{ background: 'var(--sage)', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}><Check size={13} /> In Cart</button>
                                ) : (
                                  <button onClick={() => addToCart(product.id)} className="btn-gold flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold text-white" style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}><ShoppingCart size={13} /> Add</button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    }

                    /* ─── GRID CARD (PREMIUM) ─── */
                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 32, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: i * 0.07, duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
                        className="product-card rounded-3xl overflow-visible group"
                        style={{
                          background: 'white',
                          border: '1px solid rgba(184,134,11,0.1)',
                          boxShadow: '0 4px 16px rgba(44,31,14,0.07)',
                          borderRadius: '24px',
                        }}
                      >
                        {/* ── IMAGE ZONE ── */}
                        <div
                          className="card-img-wrap relative"
                          style={{
                            height: 260,
                            background: 'var(--warm-white)',
                            borderRadius: '24px 24px 0 0',
                            overflow: 'hidden',
                          }}
                        >
                          <img
                            src={getImageUrl(product.images)}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />

                          {/* Gradient overlay */}
                          <div className="card-overlay" style={{ borderRadius: '24px 24px 0 0' }} />

                          {/* Out of stock */}
                          {isOutOfStock && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10" style={{ background: 'rgba(26,10,3,0.65)', backdropFilter: 'blur(3px)' }}>
                              <Package size={28} color="white" />
                              <span className="text-white text-xs font-semibold tracking-wider uppercase font-body">Unavailable</span>
                            </div>
                          )}

                          {/* Badges */}
                          {discountPct && !isOutOfStock && <div className="img-badge-discount">-{discountPct}%</div>}
                          {isLowStock && !isOutOfStock && <div className="img-badge-low">Only {product.inventory} left</div>}

                          {/* Floating actions — slide in on hover */}
                          <div className="card-actions">
                            <button
                              onClick={() => toggleLike(product.id)}
                              className={`card-action-btn wishlist-always ${isWishlisted ? 'heart-active' : ''}`}
                              style={{
                                opacity: 1,
                                transform: 'none',
                                background: isWishlisted ? '#fef0ee' : 'rgba(255,255,255,0.96)',
                              }}
                            >
                              <Heart size={15} fill={isWishlisted ? '#c4673a' : 'transparent'} color={isWishlisted ? '#c4673a' : 'var(--medium-brown)'} />
                            </button>
                            <Link href={`/product/${product.id}`}>
                              <button className="card-action-btn">
                                <Eye size={14} style={{ color: 'var(--medium-brown)' }} />
                              </button>
                            </Link>
                          </div>

                          {/* Quick Add CTA — slides up on hover */}
                          {!isOutOfStock && (
                            <div className="card-cta-wrap">
                              {inCart ? (
                                <button
                                  onClick={() => handleCart(true)}
                                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold"
                                  style={{ background: 'var(--sage)', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit', backdropFilter: 'blur(4px)' }}
                                >
                                  <Check size={15} /> In Cart
                                </button>
                              ) : (
                                <button
                                  onClick={() => addToCart(product.id)}
                                  className="btn-gold w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold text-white"
                                  style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                                >
                                  <ShoppingCart size={15} /> Add to Cart
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* ── CARD BODY ── */}
                        <div className="card-body p-5 pb-6" style={{ position: 'relative' }}>
                          {/* Gold accent line */}
                          <div className="gold-accent-line" />

                          {/* Top row */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="cat-pill">{product.category_name}</span>
                            {!isOutOfStock && !isLowStock && (
                              <span className="flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: 'var(--emerald)' }}>
                                <span className="stock-dot" style={{ background: 'var(--emerald)' }} />
                                In Stock
                              </span>
                            )}
                            {isLowStock && (
                              <span className="flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: '#e65100' }}>
                                <span className="stock-dot" style={{ background: '#e65100' }} />
                                Low Stock
                              </span>
                            )}
                          </div>

                          {/* Name */}
                          <h3
                            className="font-display font-semibold leading-tight mb-1.5"
                            style={{ color: 'var(--dark-brown)', fontSize: '19px' }}
                          >
                            {product.name}
                          </h3>

                          {/* Description */}
                          <p
                            className="text-sm leading-relaxed mb-3 line-clamp-2"
                            style={{ color: 'var(--light-brown)' }}
                          >
                            {product.shortdescription}
                          </p>

                          {/* Rating */}
                          <div className="flex items-center gap-2 mb-4">
                            <StarRating productId={product.id} avgRating={product.averagerating} refresh={fetchProducts} />
                            <span className="text-xs" style={{ color: 'var(--light-brown)' }}>({product.reviewcount})</span>
                          </div>

                          {/* Price row */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="price-main">{formatPrice(product.price)}</span>
                              {product.compareprice && (
                                <span className="price-strike">{formatPrice(product.compareprice)}</span>
                              )}
                              {discountPct && (
                                <span className="price-save">Save {discountPct}%</span>
                              )}
                            </div>

                            {/* View button (always visible) */}
                            <Link href={`/product/${product.id}`}>
                              <button
                                className="btn-outline-brown flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold"
                                style={{ cursor: 'pointer', fontFamily: 'inherit' }}
                              >
                                <Eye size={13} /> View
                              </button>
                            </Link>
                          </div>

                          {/* Static cart button (for touch / non-hover) visible only on mobile */}
                          {!isOutOfStock && (
                            <div className="mt-3 lg:hidden">
                              {inCart ? (
                                <button onClick={() => handleCart(true)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold" style={{ background: 'var(--sage)', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                                  <Check size={14} /> In Cart
                                </button>
                              ) : (
                                <button onClick={() => addToCart(product.id)} className="btn-gold w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold text-white" style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                                  <ShoppingCart size={14} /> Add to Cart
                                </button>
                              )}
                            </div>
                          )}
                          {isOutOfStock && (
                            <div className="mt-3">
                              <button disabled className="w-full py-2.5 rounded-2xl text-sm font-semibold" style={{ background: '#f5f5f5', color: '#bbb', border: '1.5px solid #e0e0e0', cursor: 'not-allowed', fontFamily: 'inherit' }}>Sold Out</button>
                            </div>
                          )}
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
                  className="flex justify-center items-center gap-2 mt-12"
                >
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="page-dot w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: page === 1 ? 'var(--warm-white)' : 'white', border: '1.5px solid rgba(184,134,11,0.18)', color: page === 1 ? '#ccc' : 'var(--medium-brown)', cursor: page === 1 ? 'not-allowed' : 'pointer', boxShadow: page === 1 ? 'none' : '0 2px 8px rgba(44,31,14,0.06)' }}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => {
                    const isActive = page === i + 1
                    const isNear = Math.abs(page - (i + 1)) <= 2
                    if (!isNear && i !== 0 && i !== totalPages - 1) {
                      if (i === 1 || i === totalPages - 2) return <span key={i} className="px-1 text-sm" style={{ color: 'var(--light-brown)' }}>…</span>
                      return null
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className="page-dot w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-semibold font-body"
                        style={{ background: isActive ? 'var(--dark-brown)' : 'white', color: isActive ? 'white' : 'var(--medium-brown)', border: isActive ? 'none' : '1.5px solid rgba(184,134,11,0.18)', cursor: 'pointer', boxShadow: isActive ? '0 4px 14px rgba(44,31,14,0.25)' : '0 2px 6px rgba(44,31,14,0.04)' }}
                      >
                        {i + 1}
                      </button>
                    )
                  })}

                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="page-dot w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: page === totalPages ? 'var(--warm-white)' : 'white', border: '1.5px solid rgba(184,134,11,0.18)', color: page === totalPages ? '#ccc' : 'var(--medium-brown)', cursor: page === totalPages ? 'not-allowed' : 'pointer', boxShadow: page === totalPages ? 'none' : '0 2px 8px rgba(44,31,14,0.06)' }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </motion.div>
              )}

              {totalPages > 1 && !loading && (
                <p className="text-center text-xs mt-3" style={{ color: 'var(--light-brown)' }}>
                  Page {page} of {totalPages} · {total} products
                </p>
              )}
            </div>
          </div>
        </div>

        <Footer />
      </div>

      {/* ================= MOBILE FILTER DRAWER ================= */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileFiltersOpen(false)} />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white z-50 shadow-2xl flex flex-col lg:hidden"
              style={{ borderRight: '1px solid rgba(184,134,11,0.12)' }}
            >
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(184,134,11,0.1)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'var(--gold-pale)' }}>
                    <Filter size={13} style={{ color: 'var(--gold)' }} />
                  </div>
                  <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--dark-brown)' }}>Filters</h3>
                  {hasActiveFilters && <span className="w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center" style={{ background: 'var(--gold)', color: 'white' }}>{activeFiltersCount}</span>}
                </div>
                <button onClick={() => setMobileFiltersOpen(false)} className="p-2 rounded-xl transition-colors hover:bg-gray-50" style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}>
                  <X size={17} style={{ color: 'var(--medium-brown)' }} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                <div>
                  <p className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--light-brown)' }}>Category</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['all', ...categories].map(c => (
                      <button key={c} onClick={() => { setCategory(c); setPage(1) }} className="filter-chip px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: category === c ? 'var(--dark-brown)' : 'var(--warm-white)', color: category === c ? 'white' : 'var(--medium-brown)', border: category === c ? '1.5px solid var(--dark-brown)' : '1.5px solid var(--gold-pale)', fontFamily: 'inherit', textTransform: 'capitalize' }}>{c}</button>
                    ))}
                  </div>
                </div>
                <div style={{ height: '1px', background: 'rgba(184,134,11,0.1)' }} />
                <div>
                  <p className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--light-brown)' }}>Price Range</p>
                  <div className="flex gap-2">
                    {[{ placeholder: 'Min ₹', value: minPrice, onChange: setMinPrice }, { placeholder: 'Max ₹', value: maxPrice, onChange: setMaxPrice }].map((field, i) => (
                      <input key={i} type="number" placeholder={field.placeholder} value={field.value} onChange={e => field.onChange(e.target.value)} className="flex-1 min-w-0 px-3 py-2.5 rounded-xl text-sm outline-none transition-all" style={{ background: 'var(--warm-white)', border: '1.5px solid transparent', color: 'var(--charcoal)', fontFamily: 'inherit' }} onFocus={e => (e.target.style.borderColor = 'var(--gold)')} onBlur={e => (e.target.style.borderColor = 'transparent')} />
                    ))}
                  </div>
                </div>
                <div style={{ height: '1px', background: 'rgba(184,134,11,0.1)' }} />
                <div>
                  <p className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--light-brown)' }}>Min Rating</p>
                  <select value={rating} onChange={e => setRating(e.target.value)} className="custom-select w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--warm-white)', border: '1.5px solid var(--gold-pale)', color: 'var(--charcoal)', fontFamily: 'inherit', cursor: 'pointer' }}>
                    <option value="0">All Ratings</option>
                    <option value="4">4★ & above</option>
                    <option value="3">3★ & above</option>
                    <option value="2">2★ & above</option>
                  </select>
                </div>
                <div style={{ height: '1px', background: 'rgba(184,134,11,0.1)' }} />
                <div>
                  <p className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--light-brown)' }}>Sort By</p>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="custom-select w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--warm-white)', border: '1.5px solid var(--gold-pale)', color: 'var(--charcoal)', fontFamily: 'inherit', cursor: 'pointer' }}>
                    <option value="created_at">Newest First</option>
                    <option value="price">Price: Low to High</option>
                    <option value="averagerating">Top Rated</option>
                    <option value="name">Name A–Z</option>
                  </select>
                </div>
                <div style={{ height: '1px', background: 'rgba(184,134,11,0.1)' }} />
                <div className="space-y-3">
                  {[{ label: 'In Stock Only', value: inStock, onChange: setInStock }, { label: 'On Sale', value: discount, onChange: setDiscount }].map(toggle => (
                    <label key={toggle.label} className="flex items-center justify-between cursor-pointer select-none">
                      <span className="text-sm font-medium" style={{ color: 'var(--medium-brown)' }}>{toggle.label}</span>
                      <div onClick={() => toggle.onChange(!toggle.value)} className="relative w-11 h-6 rounded-full transition-all duration-300" style={{ background: toggle.value ? 'var(--dark-brown)' : 'var(--gold-pale)', cursor: 'pointer' }}>
                        <div className="absolute top-1 w-4 h-4 rounded-full transition-all duration-300" style={{ left: toggle.value ? '24px' : '4px', background: toggle.value ? 'var(--gold-light)' : 'var(--light-brown)' }} />
                      </div>
                    </label>
                  ))}
                </div>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold" style={{ background: 'var(--gold-pale)', color: 'var(--medium-brown)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <X size={13} /> Clear All Filters
                  </button>
                )}
              </div>

              <div className="p-5" style={{ borderTop: '1px solid rgba(184,134,11,0.1)' }}>
                <button onClick={() => setMobileFiltersOpen(false)} className="btn-gold w-full py-3 rounded-2xl text-sm font-semibold text-white" style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Show {total} Products
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}