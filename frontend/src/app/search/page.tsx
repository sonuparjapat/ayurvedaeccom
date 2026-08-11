'use client'

import { Suspense, useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from '@/lib/axios'
import { useAuth } from '@/context/auth-context'
import toast from 'react-hot-toast'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import {
  Search, X, SlidersHorizontal, Star, ShoppingCart, Heart,
  ChevronLeft, ChevronRight, ChevronDown, Package
} from 'lucide-react'

/* ─────────────────────────── types ─────────────────────────── */
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
}

const SORT_OPTIONS = [
  { label: 'Relevance', value: 'created_at', order: 'desc' },
  { label: 'Price: Low → High', value: 'price', order: 'asc' },
  { label: 'Price: High → Low', value: 'price', order: 'desc' },
  { label: 'Newest', value: 'created_at', order: 'desc' },
  { label: 'Top Rated', value: 'averagerating', order: 'desc' },
  { label: 'Most Popular', value: 'reviewcount', order: 'desc' },
]

/* ─────────────────────────── mini card ─────────────────────── */
function ProductCard({ product }: { product: Product }) {
  const { loginuserdata, cartdata, fetchCart, getwishlist, wishlistdata, setOpencart } = useAuth()
  const [cartLoading, setCartLoading] = useState(false)

  const isWishlisted = !!wishlistdata?.items?.find((i: any) => i?.id == product.id)
  const isOOS = product.inventory <= 0
  const isInCart = cartdata?.items?.some((i: any) => i?.product_id == product.id)
  const discount = product.compareprice && Number(product.compareprice) > Number(product.price)
    ? Math.round(((Number(product.compareprice) - Number(product.price)) / Number(product.compareprice)) * 100)
    : 0

  const handleCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (isOOS || cartLoading) return
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
    } catch { toast.error('Failed to add to cart') }
    finally { setCartLoading(false) }
  }

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!loginuserdata?.id) { toast.error('Please login to wishlist'); return }
    try {
      if (isWishlisted) {
        await axios.delete(`/shop/${product.id}`)
        toast.success('Removed from wishlist')
      } else {
        await axios.post('/shop/wishlist', { productId: product.id })
        toast.success('Added to wishlist')
      }
      getwishlist()
    } catch { toast.error('Wishlist action failed') }
  }

  const img = product.images?.[0]

  return (
    <Link href={`/products/${product.slug || product.id}`} className="group relative bg-white rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col">
      {/* Discount badge */}
      {discount > 0 && (
        <span className="absolute top-2 left-2 z-10 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          -{discount}%
        </span>
      )}
      {/* Wishlist */}
      <button
        onClick={handleWishlist}
        className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white transition"
      >
        <Heart size={15} fill={isWishlisted ? '#10b981' : 'none'} stroke={isWishlisted ? '#10b981' : '#9ca3af'} />
      </button>

      {/* Image */}
      <div className="aspect-square overflow-hidden bg-gray-50">
        {img ? (
          <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={40} /></div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        {product.category_name && (
          <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide">{product.category_name}</span>
        )}
        <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight">{product.name}</p>

        {/* Rating */}
        {Number(product.averagerating) > 0 && (
          <div className="flex items-center gap-1">
            <Star size={11} fill="#f59e0b" stroke="none" />
            <span className="text-xs text-gray-500">{Number(product.averagerating).toFixed(1)} ({product.reviewcount})</span>
          </div>
        )}

        {/* Price row */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          <span className="text-sm font-bold text-gray-900">₹{Number(product.price).toLocaleString('en-IN')}</span>
          {product.compareprice && Number(product.compareprice) > Number(product.price) && (
            <span className="text-xs text-gray-400 line-through">₹{Number(product.compareprice).toLocaleString('en-IN')}</span>
          )}
        </div>

        {/* Cart button */}
        <button
          onClick={handleCart}
          disabled={isOOS || cartLoading}
          className={`mt-2 w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            isOOS
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : isInCart
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          <ShoppingCart size={13} />
          {isOOS ? 'Out of Stock' : isInCart ? 'In Cart' : cartLoading ? '...' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  )
}

/* ─────────────────────────── skeleton ──────────────────────── */
function Skeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-4/5" />
        <div className="h-4 bg-gray-200 rounded w-3/5" />
        <div className="h-3 bg-gray-200 rounded w-1/4 mt-2" />
        <div className="h-8 bg-gray-200 rounded-xl mt-2" />
      </div>
    </div>
  )
}

/* ─────────────────────────── main content ───────────────────── */
function SearchContent() {
  const params = useSearchParams()
  const router = useRouter()

  const [query, setQuery] = useState(params.get('q') || '')
  const [inputVal, setInputVal] = useState(params.get('q') || '')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [categories, setCategories] = useState<string[]>([])

  // Filters
  const [sortIdx, setSortIdx] = useState(0)
  const [category, setCategory] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [inStock, setInStock] = useState(false)
  const [discountOnly, setDiscountOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch categories once
  useEffect(() => {
    axios.get('/shop/categories').then(r => {
      setCategories(r.data?.categories || [])
    }).catch(() => {})
  }, [])

  const fetchResults = useCallback(async (q: string, pg: number, resetPage = false) => {
    if (!q.trim()) { setProducts([]); setTotalCount(0); setTotalPages(1); return }
    setLoading(true)
    try {
      const sort = SORT_OPTIONS[sortIdx]
      const res = await axios.get('/shop/public', {
        params: {
          search: q.trim(),
          page: resetPage ? 1 : pg,
          limit: 12,
          sortBy: sort.value,
          sortOrder: sort.order,
          ...(category ? { category } : {}),
          ...(minPrice ? { minPrice } : {}),
          ...(maxPrice ? { maxPrice } : {}),
          ...(inStock ? { inStock: 'true' } : {}),
          ...(discountOnly ? { discount: 'true' } : {}),
        },
      })
      setProducts(res.data.products || [])
      setTotalCount(res.data.total || 0)
      setTotalPages(res.data.totalPages || 1)
      if (resetPage) setPage(1)
    } catch {
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }, [sortIdx, category, minPrice, maxPrice, inStock, discountOnly])

  // Debounced search on input change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setQuery(inputVal)
      fetchResults(inputVal, 1, true)
      // Sync URL
      const url = new URL(window.location.href)
      if (inputVal.trim()) url.searchParams.set('q', inputVal.trim())
      else url.searchParams.delete('q')
      window.history.replaceState({}, '', url.toString())
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [inputVal]) // eslint-disable-line

  // Re-fetch when filters or sort change
  useEffect(() => {
    if (query.trim()) fetchResults(query, 1, true)
  }, [sortIdx, category, minPrice, maxPrice, inStock, discountOnly]) // eslint-disable-line

  // Page change
  useEffect(() => {
    if (query.trim()) fetchResults(query, page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page]) // eslint-disable-line

  const clearFilters = () => {
    setCategory('')
    setMinPrice('')
    setMaxPrice('')
    setInStock(false)
    setDiscountOnly(false)
  }

  const activeFilterCount = [category, minPrice, maxPrice, inStock, discountOnly].filter(Boolean).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Search bar ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-gray-50 focus:bg-white transition"
              placeholder="Search Ayurvedic products, herbs, brands..."
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
            />
            {inputVal && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => { setInputVal(''); setQuery('') }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setShowSort(s => !s)}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white hover:border-emerald-400 transition"
            >
              <span className="text-gray-600">{SORT_OPTIONS[sortIdx].label}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {showSort && (
              <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
                {SORT_OPTIONS.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => { setSortIdx(i); setShowSort(false) }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 hover:text-emerald-700 transition ${i === sortIdx ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-700'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(s => !s)}
            className={`relative flex items-center gap-1.5 px-3 py-2.5 text-sm border rounded-xl transition ${showFilters || activeFilterCount > 0 ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-400'}`}
          >
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${showFilters ? 'bg-white text-emerald-700' : 'bg-emerald-600 text-white'}`}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Filter panel ── */}
        {showFilters && (
          <div className="border-t border-gray-100 bg-white px-4 py-4">
            <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
              {/* Category */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Category</label>
                <select
                  className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-emerald-500"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {/* Min price */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Min Price (₹)</label>
                <input
                  type="number" min="0"
                  className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-emerald-500"
                  placeholder="0"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                />
              </div>
              {/* Max price */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Max Price (₹)</label>
                <input
                  type="number" min="0"
                  className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-emerald-500"
                  placeholder="Any"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                />
              </div>
              {/* Toggles */}
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} className="accent-emerald-600" />
                  <span className="text-sm text-gray-700">In Stock Only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={discountOnly} onChange={e => setDiscountOnly(e.target.checked)} className="accent-emerald-600" />
                  <span className="text-sm text-gray-700">On Sale Only</span>
                </label>
              </div>
              {/* Mobile sort + clear */}
              <div className="flex flex-col gap-2">
                <select
                  className="sm:hidden w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-emerald-500"
                  value={sortIdx}
                  onChange={e => setSortIdx(Number(e.target.value))}
                >
                  {SORT_OPTIONS.map((o, i) => <option key={i} value={i}>{o.label}</option>)}
                </select>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium underline text-left">
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Results area ── */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Result count */}
        {query.trim() && !loading && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              {totalCount > 0
                ? <><span className="font-semibold text-gray-900">{totalCount}</span> results for "<span className="font-semibold text-emerald-700">{query}</span>"</>
                : <>No results for "<span className="font-semibold">{query}</span>"</>
              }
            </p>
            {totalPages > 1 && (
              <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
            )}
          </div>
        )}

        {/* Skeletons */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} />)}
          </div>
        )}

        {/* Results grid */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && query.trim() && products.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No products found</h3>
            <p className="text-gray-500 text-sm mb-6">Try different keywords or remove some filters</p>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-sm text-emerald-600 underline font-medium">Clear filters</button>
            )}
          </div>
        )}

        {/* Blank state */}
        {!loading && !query.trim() && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🌿</p>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Search Ayurvedic Products</h3>
            <p className="text-sm text-gray-400 mb-6">Type above to find herbs, supplements & wellness products</p>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Popular Searches</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['Ashwagandha', 'Triphala', 'Giloy', 'Chyawanprash', 'Tulsi', 'Amla', 'Neem', 'Turmeric'].map(term => (
                  <button
                    key={term}
                    onClick={() => setInputVal(term)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all shadow-sm"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:border-emerald-400 hover:bg-emerald-50 transition"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
              .reduce<(number | string)[]>((acc, n, idx, arr) => {
                if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('…')
                acc.push(n)
                return acc
              }, [])
              .map((n, i) =>
                n === '…'
                  ? <span key={`e${i}`} className="px-1 text-gray-400">…</span>
                  : (
                    <button
                      key={n}
                      onClick={() => setPage(Number(n))}
                      className={`w-9 h-9 rounded-lg text-sm font-semibold transition ${Number(n) === page ? 'bg-emerald-600 text-white' : 'border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 text-gray-700'}`}
                    >
                      {n}
                    </button>
                  )
              )
            }
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:border-emerald-400 hover:bg-emerald-50 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────── export ────────────────────────── */
export default function SearchPage() {
  return (
    <>
      <Header />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      }>
        <SearchContent />
      </Suspense>
      <Footer />
    </>
  )
}
