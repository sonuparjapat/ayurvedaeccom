'use client'

import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Head from 'next/head'
import axios from '@/lib/axios'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Carousel,
  CarouselItem
} from '@/components/ui/carousel/carousel'

import {
  Search,
  Grid,
  List,
  ShoppingCart,
  Heart,
  Star,
  SlidersHorizontal,
  Package,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Zap,
  Shield,
  Truck,
  RefreshCw,
  ArrowUpDown,
  Check,
  AlertCircle,
  Filter,
  Sparkles,
  Eye,
  StarHalf,
} from 'lucide-react'

import { motion, AnimatePresence } from 'framer-motion'

import { useAuth } from '@/context/auth-context'
import { notify } from '@/app/utils/notify'

/* ================= TYPES ================= */

interface Product {
  id: number
  name: string
  shortdescription: string
  price: number
  compareprice?: number
  images: string[]
  inventory: number
  category_name: string
  averagerating: number
  reviewcount: number
}

/* ================= STAR RATING ================= */

function StarRating({ rating, count, size = 14 }: { rating: number; count?: number; size?: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: 5 }, (_, i) => {
          const full = i < Math.floor(rating)
          const half = !full && i < rating
          return (
            <span key={i} className="relative inline-block">
              <Star size={size} className="text-gray-200" />
              {(full || half) && (
                <span className="absolute inset-0 overflow-hidden" style={{ width: full ? '100%' : '50%' }}>
                  <Star size={size} className="fill-amber-400 text-amber-400" />
                </span>
              )}
            </span>
          )
        })}
      </div>
      {count !== undefined && (
        <span className="text-xs text-gray-400 font-medium">({count.toLocaleString()})</span>
      )}
    </div>
  )
}

/* ================= DISCOUNT BADGE ================= */

function DiscountBadge({ price, comparePrice }: { price: number; comparePrice?: number }) {
  if (!comparePrice || comparePrice <= price) return null
  const pct = Math.round(((comparePrice - price) / comparePrice) * 100)
  return (
    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
      -{pct}%
    </span>
  )
}

/* ================= PRODUCT SKELETON ================= */

function ProductSkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-5 animate-pulse">
        <div className="w-36 h-36 bg-gray-200 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-3 py-1">
          <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
          <div className="h-3 bg-gray-200 rounded-lg w-full" />
          <div className="h-3 bg-gray-200 rounded-lg w-2/3" />
          <div className="h-8 bg-gray-200 rounded-xl w-32 mt-4" />
        </div>
      </div>
    )
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-56 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded-lg w-4/5" />
        <div className="h-3 bg-gray-200 rounded-lg w-full" />
        <div className="h-3 bg-gray-200 rounded-lg w-2/3" />
        <div className="flex justify-between items-center pt-1">
          <div className="h-6 bg-gray-200 rounded-lg w-24" />
          <div className="h-9 bg-gray-200 rounded-xl w-24" />
        </div>
      </div>
    </div>
  )
}

/* ================= PAGE ================= */
const FilterPanel = memo(function FilterPanel({
  searchInput,
  setSearchInput,
  sortBy,
  setSortBy,
  priceRange,
  handlePriceChange,
  priceError,
  minRating,
  setMinRating,
  inStockOnly,
  setInStockOnly,
  clearAllFilters,
  activeFiltersCount,
  setPage
}: any) {
  return (
     <div className="space-y-6">
          {/* Search */}
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all bg-white"
            placeholder="Search products..."
          />
          {searchInput && (
            <button onClick={() => setSearchInput('')} className="absolute right-3 top-3">
              <X size={14} className="text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Sort By</label>
        <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1) }}>
          <SelectTrigger className="rounded-xl border-gray-200 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Newest First</SelectItem>
            <SelectItem value="price">Price: Low to High</SelectItem>
            <SelectItem value="name">Name A–Z</SelectItem>
            <SelectItem value="averagerating">Top Rated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Price Range (₹)</label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) => handlePriceChange('min', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
          />
          <span className="text-gray-400 text-xs font-bold">–</span>
          <input
            type="number"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) => handlePriceChange('max', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
          />
        </div>
        {priceError && (
          <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5 font-medium">
            <AlertCircle size={12} /> {priceError}
          </p>
        )}
      </div>

      {/* Min Rating */}
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Minimum Rating</label>
        <div className="space-y-1.5">
          {[4, 3, 2, 0].map((r) => (
            <button
              key={r}
              onClick={() => { setMinRating(r); setPage(1) }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${minRating === r ? 'bg-emerald-50 border border-emerald-300 text-emerald-700' : 'border border-transparent hover:bg-gray-50'}`}
            >
              {r > 0 ? (
                <>
                  <StarRating rating={r} size={13} />
                  <span className="font-medium">& above</span>
                </>
              ) : (
                <span className="font-medium text-gray-500">All Ratings</span>
              )}
              {minRating === r && <Check size={13} className="ml-auto text-emerald-600" />}
            </button>
          ))}
        </div>
      </div>

      {/* In Stock */}
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Availability</label>
        <button
          onClick={() => { setInStockOnly(!inStockOnly); setPage(1) }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${inStockOnly ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          In Stock Only
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${inStockOnly ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300'}`}>
            {inStockOnly && <Check size={12} className="text-white" />}
          </div>
        </button>
      </div>

      {/* Clear */}
      {activeFiltersCount > 0 && (
        <button
          onClick={clearAllFilters}
          className="w-full flex items-center justify-center gap-2 text-sm font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2.5 rounded-xl transition-all"
        >
          <X size={14} /> Clear All Filters
        </button>
      )}
    </div>)})
export default function CategoryPage() {
  const { slug } = useParams()
  const router = useRouter()

  const {
    loginuserdata,
    wishlistdata,
    getwishlist,
    fetchCart,
    cartdata,
    handleCart
  } = useAuth()

  /* ---------- STATE ---------- */

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cartLoading, setCartLoading] = useState<Record<number, boolean>>({})
  const [wishLoading, setWishLoading] = useState<Record<number, boolean>>({})
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sortBy, setSortBy] = useState('created_at')

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [priceError, setPriceError] = useState('')

  const [inStockOnly, setInStockOnly] = useState(false)
  const [minRating, setMinRating] = useState(0)

  const [page, setPage] = useState(1)
  const limit = 9
  const [total, setTotal] = useState(0)

  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ================= SEARCH DEBOUNCE ================= */

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => {
      setSearchTerm(searchInput)
      setPage(1)
    }, 400)
    return () => { if (searchRef.current) clearTimeout(searchRef.current) }
  }, [searchInput])

  /* ================= FETCH ================= */

  useEffect(() => {
    fetchProducts()
  }, [slug, searchTerm, sortBy, priceRange, page, inStockOnly, minRating])
console.log(slug,'idfsdfsdf')
  const fetchProducts = async () => {
    console.log(slug,"id cominggggggggggg")
    try {
      setLoading(true)
      const res = await axios.get('/shop/public', {
        params: {
          category_id: slug,
          search: searchTerm,
          minPrice: priceRange.min,
          maxPrice: priceRange.max,
          sortBy,
          sortOrder: 'desc',
          page,
          limit,
          inStock: inStockOnly || undefined,
          rating: minRating || undefined,
        }
      })
      setProducts(res.data.products || [])
      setTotal(res.data.total || 0)
    } catch {
      notify.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  /* ================= PRICE VALIDATION ================= */

  const handlePriceChange = (field: 'min' | 'max', val: string) => {
    const num = Number(val)
    setPriceError('')
    if (val && isNaN(num)) { setPriceError('Enter a valid number'); return }
    const newRange = { ...priceRange, [field]: val }
    if (newRange.min && newRange.max && Number(newRange.min) > Number(newRange.max)) {
      setPriceError('Min price cannot exceed max price')
      return
    }
    setPriceRange(newRange)
    setPage(1)
  }

  /* ================= HELPERS ================= */

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(price)

  const getImageUrl = (arr: string[]) => arr?.[0] || '/placeholder-product.jpg'

  const isWishlisted = (id: number) => wishlistdata?.items?.some((w: any) => w.id == id)
  const isInCart = (id: number) => cartdata?.items?.some((c: any) => c.product_id == id)

  const activeFiltersCount = [
    priceRange.min, priceRange.max, inStockOnly, minRating > 0
  ].filter(Boolean).length

  /* ================= ACTIONS ================= */

  const toggleWishlist = async (pid: number) => {
    if (!loginuserdata?.id) { notify.error('Please login to save items'); router.push('/auth'); return }
    try {
      setWishLoading(p => ({ ...p, [pid]: true }))
      await axios.post('/shop/wishlist', { productId: pid })
      getwishlist()
      notify.success(isWishlisted(pid) ? 'Removed from wishlist' : 'Added to wishlist')
    } catch {
      notify.error('Something went wrong')
    } finally {
      setWishLoading(p => ({ ...p, [pid]: false }))
    }
  }

 const addToCart = async (pid: number) => {
  try {
    /* if already in cart open cart */
    if (isInCart(pid)) {
      handleCart(true);
      return;
    }

    setCartLoading((p) => ({
      ...p,
      [pid]: true
    }));

    const payload: any = {
      productId: pid,
      quantity: 1
    };

    /* guest support */
    if (!loginuserdata?.id) {
      const sessionId =
        localStorage.getItem(
          "guest_session_id"
        );

      if (sessionId) {
        payload.sessionId = sessionId;
      }
    }

    const res = await axios.post(
      "/cart",
      payload
    );

    if (res.status === 200) {
      fetchCart(
        loginuserdata?.id
      );

      notify.success(
        "Woah..Product is Added to cart!"
      );
    }

  } catch (err: any) {
    if (
      err?.response?.status === 400
    ) {
      notify.error(
        err?.response?.data
          ?.message ||
        "Oops..Unable to add item"
      );

    } else if (
      err?.response?.status === 404
    ) {
      notify.error(
        "Oops..Product not found"
      );

    } else if (
      err?.response?.status === 500
    ) {
      notify.error(
        "Server issue. Try again."
      );

    } else {
      notify.error(
        "Oops..Add to cart failed"
      );
    }

  } finally {
    setCartLoading((p) => ({
      ...p,
      [pid]: false
    }));
  }
};

  const clearAllFilters = () => {
    setSearchInput('')
    setSearchTerm('')
    setSortBy('created_at')
    setPriceRange({ min: '', max: '' })
    setPriceError('')
    setInStockOnly(false)
    setMinRating(0)
    setPage(1)
  }

  const totalPages = Math.ceil(total / limit)
  const categoryName = products?.[0]?.category_name || 'Products'

  const bannerSlides = [
    { bg: 'from-emerald-600 to-teal-500', text: 'Premium Quality', sub: 'Handpicked for you', icon: Sparkles },
    { bg: 'from-violet-600 to-purple-500', text: 'Best Prices', sub: 'Guaranteed savings', icon: TrendingUp },
    { bg: 'from-orange-500 to-amber-500', text: 'Fast Delivery', sub: 'Ships within 24 hours', icon: Truck },
  ]

  /* ================= FILTER PANEL ================= */

  // const FilterPanel = () => (
  //   <div className="space-y-6">
  //     {/* Search */}
  //     <div>
  //       <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Search</label>
  //       <div className="relative">
  //         <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
  //         <input
  //           value={searchInput}
  //           onChange={(e) => setSearchInput(e.target.value)}
  //           className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all bg-white"
  //           placeholder="Search products..."
  //         />
  //         {searchInput && (
  //           <button onClick={() => setSearchInput('')} className="absolute right-3 top-3">
  //             <X size={14} className="text-gray-400 hover:text-gray-600" />
  //           </button>
  //         )}
  //       </div>
  //     </div>

  //     {/* Sort */}
  //     <div>
  //       <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Sort By</label>
  //       <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1) }}>
  //         <SelectTrigger className="rounded-xl border-gray-200 text-sm">
  //           <SelectValue />
  //         </SelectTrigger>
  //         <SelectContent>
  //           <SelectItem value="created_at">Newest First</SelectItem>
  //           <SelectItem value="price">Price: Low to High</SelectItem>
  //           <SelectItem value="name">Name A–Z</SelectItem>
  //           <SelectItem value="averagerating">Top Rated</SelectItem>
  //         </SelectContent>
  //       </Select>
  //     </div>

  //     {/* Price Range */}
  //     <div>
  //       <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Price Range (₹)</label>
  //       <div className="flex gap-2 items-center">
  //         <input
  //           type="number"
  //           placeholder="Min"
  //           value={priceRange.min}
  //           onChange={(e) => handlePriceChange('min', e.target.value)}
  //           className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
  //         />
  //         <span className="text-gray-400 text-xs font-bold">–</span>
  //         <input
  //           type="number"
  //           placeholder="Max"
  //           value={priceRange.max}
  //           onChange={(e) => handlePriceChange('max', e.target.value)}
  //           className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
  //         />
  //       </div>
  //       {priceError && (
  //         <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5 font-medium">
  //           <AlertCircle size={12} /> {priceError}
  //         </p>
  //       )}
  //     </div>

  //     {/* Min Rating */}
  //     <div>
  //       <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Minimum Rating</label>
  //       <div className="space-y-1.5">
  //         {[4, 3, 2, 0].map((r) => (
  //           <button
  //             key={r}
  //             onClick={() => { setMinRating(r); setPage(1) }}
  //             className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${minRating === r ? 'bg-emerald-50 border border-emerald-300 text-emerald-700' : 'border border-transparent hover:bg-gray-50'}`}
  //           >
  //             {r > 0 ? (
  //               <>
  //                 <StarRating rating={r} size={13} />
  //                 <span className="font-medium">& above</span>
  //               </>
  //             ) : (
  //               <span className="font-medium text-gray-500">All Ratings</span>
  //             )}
  //             {minRating === r && <Check size={13} className="ml-auto text-emerald-600" />}
  //           </button>
  //         ))}
  //       </div>
  //     </div>

  //     {/* In Stock */}
  //     <div>
  //       <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Availability</label>
  //       <button
  //         onClick={() => { setInStockOnly(!inStockOnly); setPage(1) }}
  //         className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${inStockOnly ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
  //       >
  //         In Stock Only
  //         <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${inStockOnly ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300'}`}>
  //           {inStockOnly && <Check size={12} className="text-white" />}
  //         </div>
  //       </button>
  //     </div>

  //     {/* Clear */}
  //     {activeFiltersCount > 0 && (
  //       <button
  //         onClick={clearAllFilters}
  //         className="w-full flex items-center justify-center gap-2 text-sm font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2.5 rounded-xl transition-all"
  //       >
  //         <X size={14} /> Clear All Filters
  //       </button>
  //     )}
  //   </div>
  // )

  /* ================= PRODUCT GRID CARD ================= */

  const GridCard = ({ p }: { p: Product }) => {
    const [imgIdx, setImgIdx] = useState(0)
    const wished = isWishlisted(p.id)
    const inCart = isInCart(p.id)
    const outOfStock = p.inventory === 0

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
        className="group"
      >
        <div
          className={`bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 ${outOfStock ? 'opacity-75' : ''}`}
          style={{ borderColor: '#f0f0f0' }}
        >
          {/* Image */}
          <div
            className="relative h-56 overflow-hidden bg-gray-50 cursor-pointer"
            onClick={() => router.push(`/product/${p.id}`)}
            onMouseEnter={() => p.images.length > 1 && setImgIdx(1)}
            onMouseLeave={() => setImgIdx(0)}
          >
            <img
              src={p.images[imgIdx] || '/placeholder-product.jpg'}
              alt={p.name}
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
            />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              <DiscountBadge price={p.price} comparePrice={p.compareprice} />
              {outOfStock && (
                <span className="bg-gray-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Out of Stock</span>
              )}
              {p.inventory > 0 && p.inventory <= 5 && (
                <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Only {p.inventory} left</span>
              )}
            </div>

            {/* Wishlist + Quick View */}
            <div className="absolute top-3 right-3 flex flex-col gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id) }}
                className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${wished ? 'bg-red-500 text-white scale-110' : 'bg-white text-gray-400 hover:text-red-400 hover:scale-110'}`}
              >
                {wishLoading[p.id] ? (
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Heart size={14} fill={wished ? 'currentColor' : 'none'} />
                )}
              </button>
              <button
               onClick={() => router.push(`/product/${p.id}`)}
                // onClick={(e) => { e.stopPropagation(); setQuickViewProduct(p) }}
                className="w-8 h-8 rounded-full bg-white text-gray-400 hover:text-emerald-600 hover:scale-110 flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100"
              >
                <Eye size={14} />
              </button>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300 pointer-events-none" />
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">{p.category_name}</p>
            <h3
              className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 cursor-pointer hover:text-emerald-700 transition-colors mb-1"
              onClick={() => router.push(`/product/${p.id}`)}
            >
              {p.name}
            </h3>
            <p className="text-xs text-gray-400 line-clamp-1 mb-2">{p.shortdescription}</p>

            <div className="mb-3">
              <StarRating rating={p.averagerating} count={p.reviewcount} size={12} />
            </div>

            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-xl font-black text-gray-900">{formatPrice(p.price)}</p>
                {p.compareprice && p.compareprice > p.price && (
                  <p className="text-xs text-gray-400 line-through">{formatPrice(p.compareprice)}</p>
                )}
              </div>
              {p.compareprice && p.compareprice > p.price && (
                <p className="text-xs font-bold text-emerald-600">
                  Save {formatPrice(p.compareprice - p.price)}
                </p>
              )}
            </div>

            <button
              disabled={outOfStock || cartLoading[p.id]}
              onClick={() => addToCart(p.id)}
              className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 ${outOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : inCart
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600'
                }`}
            >
              {cartLoading[p.id] ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : outOfStock ? (
                'Out of Stock'
              ) : inCart ? (
                <><Check size={14} /> Go to Cart</>
              ) : (
                <><ShoppingCart size={14} /> Add to Cart</>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  /* ================= LIST CARD ================= */

  const ListCard = ({ p }: { p: Product }) => {
    const wished = isWishlisted(p.id)
    const inCart = isInCart(p.id)
    const outOfStock = p.inventory === 0

    return (
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0 }}
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-emerald-200 transition-all duration-300"
      >
        <div className="flex gap-0 sm:gap-5 p-4 sm:p-5">
          {/* Image */}
          <div
            className="relative w-32 sm:w-44 h-32 sm:h-44 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 cursor-pointer"
            onClick={() => router.push(`/product/${p.id}`)}
          >
            <img src={getImageUrl(p.images)} alt={p.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            {outOfStock && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white text-[10px] font-black uppercase tracking-wider">Out of Stock</span>
              </div>
            )}
            <div className="absolute top-2 left-2">
              <DiscountBadge price={p.price} comparePrice={p.compareprice} />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col justify-between ml-4 sm:ml-0">
            <div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-0.5">{p.category_name}</p>
              <h3
                className="font-bold text-gray-900 text-base leading-snug cursor-pointer hover:text-emerald-700 transition-colors mb-1"
                onClick={() => router.push(`/product/${p.id}`)}
              >
                {p.name}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-2">{p.shortdescription}</p>
              <StarRating rating={p.averagerating} count={p.reviewcount} />

              {p.inventory > 0 && p.inventory <= 5 && (
                <p className="text-xs font-bold text-orange-500 mt-1">⚡ Only {p.inventory} left in stock</p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
              <div>
                <p className="text-2xl font-black text-gray-900">{formatPrice(p.price)}</p>
                <div className="flex items-center gap-2">
                  {p.compareprice && p.compareprice > p.price && (
                    <p className="text-sm text-gray-400 line-through">{formatPrice(p.compareprice)}</p>
                  )}
                  {p.compareprice && p.compareprice > p.price && (
                    <span className="text-xs font-bold text-emerald-600">
                      {Math.round(((p.compareprice - p.price) / p.compareprice) * 100)}% off
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => toggleWishlist(p.id)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${wished ? 'bg-red-50 border-red-200 text-red-500' : 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400'}`}
                >
                  {wishLoading[p.id] ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Heart size={16} fill={wished ? 'currentColor' : 'none'} />
                  )}
                </button>

                <button
                  disabled={outOfStock || cartLoading[p.id]}
                  onClick={() => addToCart(p.id)}
                  className={`px-5 h-10 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${outOfStock
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : inCart
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                >
                  {cartLoading[p.id] ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : inCart ? (
                    <><Check size={14} /> In Cart</>
                  ) : (
                    <><ShoppingCart size={14} /> Add to Cart</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }


  const getDiscount = (price: number, comparePrice?: number) => {
    if (!comparePrice || comparePrice <= price) return null
    return Math.round(((comparePrice - price) / comparePrice) * 100)
  }
  /* ================= QUICK VIEW MODAL ================= */

  const QuickViewModal = () => {
    if (!quickViewProduct) return null
    const p = quickViewProduct
      const inCart = cartdata?.items?.filter(c => c.product_id == p.id).length >= 1
                const discountPct = getDiscount(p.price, p.compareprice)
                const isOutOfStock = p.inventory === 0
                const isLowStock = p.inventory > 0 && p.inventory <= 5
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setQuickViewProduct(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col sm:flex-row">
              <div className="sm:w-64 h-64 sm:h-auto bg-gray-50 flex-shrink-0">
                <img src={getImageUrl(p.images)} alt={p.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 p-6 flex flex-col">
                <button onClick={() => setQuickViewProduct(null)} className="self-end p-2 rounded-xl hover:bg-gray-100 transition-colors mb-2">
                  <X size={18} className="text-gray-500" />
                </button>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">{p.category_name}</p>
                <h3 className="font-black text-gray-900 text-lg leading-snug mb-2">{p.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{p.shortdescription}</p>
                <StarRating rating={p.averagerating} count={p.reviewcount} />
                <div className="mt-3 mb-5">
                  <p className="text-2xl font-black text-gray-900">{formatPrice(p.price)}</p>
                  {p.compareprice && p.compareprice > p.price && (
                    <p className="text-sm text-gray-400 line-through">{formatPrice(p.compareprice)}</p>
                  )}
                </div>
                   {isLowStock ? (
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full font-body"
                            style={{ background: '#fff3e0', color: '#e65100' }}
                          >
                            Only {p.inventory} left
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
                            onClick={() => addToCart(p.id)}
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
                {/* <div className="flex gap-3 mt-auto">
                  <button
                    onClick={() => addToCart(p.id)}
                    disabled={p.inventory === 0 || cartLoading[p.id]}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <ShoppingCart size={16} /> Add to Cart
                  </button>
                  <button
                    onClick={() => router.push(`/product/${p.id}`)}
                    className="px-4 py-3 border-2 border-gray-200 hover:border-emerald-400 text-gray-700 font-bold rounded-xl transition-all text-sm"
                  >
                    View Full
                  </button>
                </div> */}
         
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  /* ================= UI ================= */

  return (
    <>
      <Head>
        <title>{categoryName} | Shop Online</title>
        <meta name="description" content={`Buy best ${categoryName} products online at best price.`} />
      </Head>

      <div className="min-h-screen flex flex-col bg-[#f7f8fc]">
        <Header />

        <main className="flex-1">

          {/* ======= HERO BANNER ======= */}
          <section className="relative bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-1/4 w-72 h-72 rounded-full bg-white translate-y-1/2" />
            </div>
            <div className="container mx-auto px-4 py-14 relative z-10 text-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-emerald-200 text-xs font-bold uppercase tracking-widest mb-3">Browse Category</p>
                <h1 className="text-4xl lg:text-6xl font-black text-white mb-3 leading-tight">{categoryName}</h1>
                <p className="text-emerald-100 text-lg mb-6">Discover our curated collection of premium products</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="bg-white/20 backdrop-blur text-white text-sm font-bold px-4 py-2 rounded-full border border-white/30">
                    {total} Products
                  </span>
                  {activeFiltersCount > 0 && (
                    <span className="bg-amber-400 text-amber-900 text-sm font-bold px-4 py-2 rounded-full">
                      {activeFiltersCount} Filter{activeFiltersCount > 1 ? 's' : ''} Active
                    </span>
                  )}
                </div>
              </motion.div>
            </div>
          </section>

          {/* ======= TRUST BADGES ======= */}
          <section className="bg-white border-b border-gray-100">
            <div className="container mx-auto px-4">
              <div className="flex flex-wrap items-center justify-center gap-6 py-4">
                {[
                  { icon: Truck, label: 'Free Delivery', sub: 'On orders over ₹499' },
                  { icon: Shield, label: 'Secure Payments', sub: '100% protected' },
                  { icon: RefreshCw, label: 'Easy Returns', sub: '7-day policy' },
                  { icon: Zap, label: 'Fast Shipping', sub: 'Within 24–48 hrs' },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex items-center gap-2.5 text-sm py-1">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                      <Icon size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-xs">{label}</p>
                      <p className="text-gray-400 text-[11px]">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ======= BANNER CAROUSEL ======= */}
          <section className="py-6 bg-white">
            <div className="container mx-auto px-4">
              <Carousel autoSlide autoSlideInterval={4000} className="h-48 sm:h-64 rounded-2xl overflow-hidden shadow-lg">
                {bannerSlides.map((slide, i) => (
                  <CarouselItem key={i}>
                    <div className={`h-48 sm:h-64 bg-gradient-to-r ${slide.bg} flex items-center justify-center relative overflow-hidden`}>
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute right-12 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-white" />
                      </div>
                      <div className="text-center text-white relative z-10">
                        <slide.icon size={36} className="mx-auto mb-3 opacity-80" />
                        <h3 className="text-3xl sm:text-4xl font-black">{slide.text}</h3>
                        <p className="text-white/70 mt-1 text-sm font-medium">{slide.sub}</p>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </Carousel>
            </div>
          </section>

          {/* ======= MAIN CONTENT ======= */}
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-6">

              {/* ======= DESKTOP SIDEBAR ======= */}
              <aside className="hidden lg:block w-72 flex-shrink-0">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-100 rounded-lg">
                        <Filter size={14} className="text-emerald-600" />
                      </div>
                      <h3 className="font-black text-gray-800">Filters</h3>
                    </div>
                    {activeFiltersCount > 0 && (
                      <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{activeFiltersCount}</span>
                    )}
                  </div>
                <FilterPanel
  searchInput={searchInput}
  setSearchInput={setSearchInput}
  sortBy={sortBy}
  setSortBy={setSortBy}
  priceRange={priceRange}
  handlePriceChange={handlePriceChange}
  priceError={priceError}
  minRating={minRating}
  setMinRating={setMinRating}
  inStockOnly={inStockOnly}
  setInStockOnly={setInStockOnly}
  clearAllFilters={clearAllFilters}
  activeFiltersCount={activeFiltersCount}
  setPage={setPage}
/>
                </div>
              </aside>

              {/* ======= PRODUCTS AREA ======= */}
              <div className="flex-1 min-w-0">

                {/* Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <div>
                    <h2 className="font-black text-gray-900 text-xl">
                      {loading ? 'Loading…' : `${categoryName}`}
                    </h2>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {!loading && `${total} product${total !== 1 ? 's' : ''} found`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Mobile Filters */}
                    <button
                      className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-emerald-400 transition-all relative"
                      onClick={() => setMobileFiltersOpen(true)}
                    >
                      <Filter size={14} /> Filters
                      {activeFiltersCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                          {activeFiltersCount}
                        </span>
                      )}
                    </button>

                    {/* View Toggle */}
                    <div className="hidden sm:flex bg-white border border-gray-200 rounded-xl overflow-hidden">
                      {(['grid', 'list'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setViewMode(mode)}
                          className={`px-3 py-2 flex items-center gap-1 text-sm font-semibold transition-all ${viewMode === mode ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                          {mode === 'grid' ? <Grid size={15} /> : <List size={15} />}
                          <span className="hidden md:inline capitalize">{mode}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Active Filter Tags */}
                {activeFiltersCount > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {searchTerm && (
                      <span className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                        Search: "{searchTerm}"
                        <button onClick={() => { setSearchInput(''); setSearchTerm('') }}><X size={11} /></button>
                      </span>
                    )}
                    {priceRange.min && (
                      <span className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                        Min: ₹{priceRange.min}
                        <button onClick={() => handlePriceChange('min', '')}><X size={11} /></button>
                      </span>
                    )}
                    {priceRange.max && (
                      <span className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                        Max: ₹{priceRange.max}
                        <button onClick={() => handlePriceChange('max', '')}><X size={11} /></button>
                      </span>
                    )}
                    {inStockOnly && (
                      <span className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                        In Stock Only
                        <button onClick={() => setInStockOnly(false)}><X size={11} /></button>
                      </span>
                    )}
                    {minRating > 0 && (
                      <span className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                        {minRating}★ & above
                        <button onClick={() => setMinRating(0)}><X size={11} /></button>
                      </span>
                    )}
                  </div>
                )}

                {/* Products Grid / List */}
                {loading ? (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-4'}>
                    {[...Array(6)].map((_, i) => <ProductSkeleton key={i} viewMode={viewMode} />)}
                  </div>
                ) : products.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 py-24 text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
                      <Package size={44} className="text-gray-300" />
                    </div>
                    <h3 className="text-xl font-black text-gray-700 mb-2">No products found</h3>
                    <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
                      Try adjusting your filters or search to find what you're looking for.
                    </p>
                    <button
                      onClick={clearAllFilters}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-all gap-2 inline-flex items-center text-sm"
                    >
                      <X size={14} /> Clear All Filters
                    </button>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <div className={viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
                      : 'space-y-4'
                    }>
                      {products.map(p => viewMode === 'grid'
                        ? <GridCard key={p.id} p={p} />
                        : <ListCard key={p.id} p={p} />
                      )}
                    </div>
                  </AnimatePresence>
                )}

                {/* Pagination */}
                {totalPages > 1 && !loading && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                      className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all bg-white"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
                      .reduce((acc: (number | '...')[], n, idx, arr) => {
                        if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('...')
                        acc.push(n)
                        return acc
                      }, [])
                      .map((n, i) => n === '...' ? (
                        <span key={`dots-${i}`} className="w-10 h-10 flex items-center justify-center text-gray-400 text-sm">…</span>
                      ) : (
                        <button
                          key={n}
                          onClick={() => setPage(n as number)}
                          className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${page === n
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                            : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-400 hover:text-emerald-600'
                            }`}
                        >
                          {n}
                        </button>
                      ))}

                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(p => p + 1)}
                      className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all bg-white"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}

                {totalPages > 1 && !loading && (
                  <p className="text-center text-xs text-gray-400 mt-3">
                    Page {page} of {totalPages} · {total} products
                  </p>
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>

      {/* ======= MOBILE FILTER DRAWER ======= */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white z-50 shadow-2xl flex flex-col lg:hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 rounded-lg">
                    <Filter size={14} className="text-emerald-600" />
                  </div>
                  <h3 className="font-black text-gray-800">Filters</h3>
                  {activeFiltersCount > 0 && (
                    <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{activeFiltersCount}</span>
                  )}
                </div>
                <button onClick={() => setMobileFiltersOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
    <FilterPanel
  searchInput={searchInput}
  setSearchInput={setSearchInput}
  sortBy={sortBy}
  setSortBy={setSortBy}
  priceRange={priceRange}
  handlePriceChange={handlePriceChange}
  priceError={priceError}
  minRating={minRating}
  setMinRating={setMinRating}
  inStockOnly={inStockOnly}
  setInStockOnly={setInStockOnly}
  clearAllFilters={clearAllFilters}
  activeFiltersCount={activeFiltersCount}
  setPage={setPage}
/>
              </div>
              <div className="p-5 border-t border-gray-100">
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all text-sm"
                >
                  Show {total} Products
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ======= QUICK VIEW MODAL ======= */}
      {quickViewProduct && <QuickViewModal />}
    </>
  )
}