'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import Link from 'next/link'
import { ArrowLeft, Package, Star } from 'lucide-react'
import { motion } from 'framer-motion'

interface Brand {
  id: number; name: string; slug: string; logo_url?: string; description?: string
  total_products: number; avg_rating: string
}
interface Product {
  id: number; name: string; slug: string; price: string; compareprice?: string
  images: string[]; averagerating?: number; reviewcount?: number; inventory?: number
}

const fmt = (n: string | number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n))

export default function BrandPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string

  const [brand, setBrand] = useState<Brand | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sort, setSort] = useState('created_at')

  useEffect(() => {
    if (!slug) return
    axios.get(`/brands/${slug}`).then(r => setBrand(r.data?.data)).catch(() => {})
  }, [slug])

  useEffect(() => {
    if (!brand) return
    setLoading(true)
    axios.get(`/shop?brand_id=${brand.id}&sortBy=${sort}&limit=12&page=${page}`)
      .then(r => {
        setProducts(r.data.products || [])
        setTotalPages(r.data.totalPages || 1)
      }).catch(() => {}).finally(() => setLoading(false))
  }, [brand, sort, page])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        {/* ── Hero ── */}
        <div style={{ background: 'linear-gradient(135deg, #1a2e1a 0%, #2d5a3d 50%, #1a3a2a 100%)', padding: '48px 24px 36px' }}>
          <div className="max-w-6xl mx-auto">
            <button onClick={() => router.back()} className="flex items-center gap-1 text-emerald-300 hover:text-white text-sm mb-6 transition">
              <ArrowLeft size={16} /> Back
            </button>
            {!brand ? (
              <div className="animate-pulse h-16 w-48 bg-white/10 rounded-xl" />
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-6">
                {brand.logo_url ? (
                  <div style={{ width: 88, height: 88, borderRadius: 16, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, flexShrink: 0 }}>
                    <img src={brand.logo_url} alt={brand.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                ) : (
                  <div style={{ width: 88, height: 88, borderRadius: 16, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0 }}>
                    🌿
                  </div>
                )}
                <div>
                  <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 800, margin: '0 0 6px' }}>{brand.name}</h1>
                  {brand.description && <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, margin: '0 0 10px', maxWidth: 560, lineHeight: 1.6 }}>{brand.description}</p>}
                  <div style={{ display: 'flex', gap: 20 }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Package size={14} /> {brand.total_products} products
                    </span>
                    {parseFloat(brand.avg_rating) > 0 && (
                      <span style={{ color: '#fbbf24', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Star size={14} /> {brand.avg_rating} avg rating
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Sort */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500">{products.length} products shown</p>
            <select value={sort} onChange={e => { setSort(e.target.value); setPage(1) }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:border-emerald-400">
              <option value="created_at">Newest First</option>
              <option value="price">Price: Low to High</option>
              <option value="averagerating">Top Rated</option>
            </select>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl animate-pulse" style={{ aspectRatio: '3/4' }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <Package size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No products from this brand yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link href={`/product/${p.slug || p.id}`} className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all duration-300">
                    <div style={{ aspectRatio: '1', overflow: 'hidden', background: '#f9fafb' }}>
                      <img
                        src={p.images?.[0] || '/placeholder.png'}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1a2e1a', lineHeight: 1.35, marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>{fmt(p.price)}</span>
                        {p.compareprice && Number(p.compareprice) > Number(p.price) && (
                          <span style={{ fontSize: 11, color: '#9ca3af', textDecoration: 'line-through' }}>{fmt(p.compareprice)}</span>
                        )}
                      </div>
                      {p.averagerating != null && p.reviewcount != null && p.reviewcount > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                          <Star size={11} className="fill-amber-400 text-amber-400" />
                          <span style={{ fontSize: 11, color: '#6b7280' }}>{Number(p.averagerating).toFixed(1)} ({p.reviewcount})</span>
                        </div>
                      )}
                      {p.inventory === 0 && (
                        <span style={{ display: 'inline-block', marginTop: 6, fontSize: 10, color: '#ef4444', fontWeight: 600, background: '#fef2f2', padding: '2px 6px', borderRadius: 4 }}>Out of Stock</span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                <button key={pg} onClick={() => setPage(pg)}
                  style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    background: pg === page ? '#059669' : '#fff',
                    borderColor: pg === page ? '#059669' : '#e5e7eb',
                    color: pg === page ? '#fff' : '#374151',
                  }}>
                  {pg}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
