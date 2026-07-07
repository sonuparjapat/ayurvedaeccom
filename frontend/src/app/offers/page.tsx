'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Tag, Zap, Package, Clock, Copy, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Coupon {
  id: number; code: string; discount_type: string; discount_value: number
  min_order_amount: number; max_discount: number; description?: string
  valid_from?: string; valid_to?: string
}

interface FlashSale {
  id: number; title: string; ends_at: string; seconds_remaining: number
  products: { product_id: number; product_name: string; image: string; flash_price: number; original_price: number; discount_percent: number; stock_limit: number; sold_count: number }[]
}

interface Bundle {
  id: number; name: string; description?: string; discount_type: string
  discount_value: number; image_url?: string; products: any[]
}

function Countdown({ endsAt }: { endsAt: string }) {
  const [secs, setSecs] = useState(() => Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000)))
  useEffect(() => {
    if (secs <= 0) return
    const t = setInterval(() => setSecs(s => s <= 1 ? 0 : s - 1), 1000)
    return () => clearInterval(t)
  }, [endsAt])
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  if (secs <= 0) return <span className="text-sm text-red-500 font-bold">Expired</span>
  return (
    <div className="flex items-center gap-1 font-mono font-bold text-sm">
      {[pad(h), pad(m), pad(s)].map((v, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-400">:</span>}
          <span className="bg-gray-900 text-white px-1.5 py-0.5 rounded">{v}</span>
        </span>
      ))}
    </div>
  )
}

export default function OffersPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [flashSales, setFlashSales] = useState<FlashSale[]>([])
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState('')
  const [addingBundleId, setAddingBundleId] = useState<number | null>(null)

  useEffect(() => {
    document.title = 'Offers & Deals | Oroganix'
    Promise.all([
      axios.get('/coupons/public').then(r => setCoupons(r.data?.coupons || [])).catch(() => {}),
      axios.get('/flash-sales/active').then(r => setFlashSales(r.data?.sales || [])).catch(() => {}),
      axios.get('/bundles/public').then(r => setBundles(r.data?.data || r.data?.bundles || [])).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const addBundleToCart = async (bundleId: number) => {
    setAddingBundleId(bundleId)
    try {
      await axios.post('/bundles/add-to-cart', { bundleId })
      toast.success('Bundle added to cart!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Please login to add to cart')
    } finally {
      setAddingBundleId(null)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success(`Code "${code}" copied!`)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">

        {/* Hero */}
        <div className="bg-linear-to-r from-orange-500 via-red-500 to-pink-500 py-16 px-4 text-center text-white">
          <h1 className="text-4xl font-bold mb-3">Offers & Deals</h1>
          <p className="text-lg text-white/80 max-w-xl mx-auto">Exclusive discounts on premium Ayurvedic products. Save more on your wellness journey.</p>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">

          {loading && (
            <div className="text-center py-20 text-gray-400">Loading offers...</div>
          )}

          {/* Flash Sales */}
          {flashSales.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <Zap size={20} className="text-red-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Flash Sales</h2>
                  <p className="text-sm text-gray-500">Limited time deals — grab before they're gone!</p>
                </div>
              </div>
              {flashSales.map(sale => (
                <div key={sale.id} className="bg-linear-to-r from-red-600 to-orange-500 rounded-2xl overflow-hidden shadow-lg mb-6">
                  <div className="flex items-center justify-between px-6 py-4">
                    <h3 className="text-white font-bold text-lg">{sale.title}</h3>
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                      <Clock size={14} /> Ends in <Countdown endsAt={sale.ends_at} />
                    </div>
                  </div>
                  <div className="bg-white/10 px-4 pb-4">
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {sale.products.map(p => (
                        <Link key={p.product_id} href={`/product/${p.product_id}`}
                          className="shrink-0 w-44 bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition">
                          {p.image ? (
                            <img src={p.image} alt={p.product_name} className="w-full h-36 object-cover" />
                          ) : (
                            <div className="w-full h-36 bg-orange-50 flex items-center justify-center text-3xl">⚡</div>
                          )}
                          <div className="p-3">
                            <p className="text-sm font-medium text-gray-800 truncate">{p.product_name}</p>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-lg font-bold text-red-600">₹{p.flash_price}</span>
                              <span className="text-xs text-gray-400 line-through">₹{p.original_price}</span>
                            </div>
                            <span className="inline-block mt-1 bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded">{p.discount_percent}% OFF</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Coupons */}
          {coupons.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Tag size={20} className="text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Coupon Codes</h2>
                  <p className="text-sm text-gray-500">Apply these codes at checkout to save</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map(c => (
                  <div key={c.id} className="bg-white border-2 border-dashed border-emerald-200 rounded-2xl p-5 relative overflow-hidden hover:border-emerald-400 transition">
                    <div className="absolute top-0 right-0 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                      {c.discount_type === 'percent' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                    </div>
                    <p className="text-sm text-gray-500 mt-4 mb-2">{c.description || 'Use this code at checkout'}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-100 border border-gray-200 rounded-lg px-4 py-2.5 font-mono font-bold text-lg text-gray-800 tracking-wider text-center">
                        {c.code}
                      </div>
                      <button onClick={() => copyCode(c.code)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2.5 text-sm font-semibold flex items-center gap-1.5 transition">
                        {copiedCode === c.code ? <><CheckCircle size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                      </button>
                    </div>
                    <div className="mt-3 text-xs text-gray-400 space-y-0.5">
                      {c.min_order_amount > 0 && <p>Min. order: ₹{c.min_order_amount}</p>}
                      {c.max_discount > 0 && c.discount_type === 'percent' && <p>Max discount: ₹{c.max_discount}</p>}
                      {c.valid_to && <p>Valid till: {new Date(c.valid_to).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Bundles */}
          {bundles.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Package size={20} className="text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Bundle Deals</h2>
                  <p className="text-sm text-gray-500">Buy together and save more</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bundles.map(b => (
                  <div key={b.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition">
                    {b.image_url && <img src={b.image_url} alt={b.name} className="w-full h-48 object-cover" />}
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-lg text-gray-900">{b.name}</h3>
                        <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-full">
                          {b.discount_type === 'percent' ? `${b.discount_value}% OFF` : `₹${b.discount_value} OFF`}
                        </span>
                      </div>
                      {b.description && <p className="text-sm text-gray-500 mb-3">{b.description}</p>}
                      {b.products?.length > 0 && (
                        <p className="text-xs text-gray-400 mb-4">{b.products.length} products included</p>
                      )}
                      <button
                        onClick={() => addBundleToCart(b.id)}
                        disabled={addingBundleId === b.id}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition"
                      >
                        {addingBundleId === b.id ? 'Adding...' : '🛒 Add Bundle to Cart'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* No offers */}
          {!loading && !flashSales.length && !coupons.length && !bundles.length && (
            <div className="text-center py-20">
              <Tag size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">No Active Offers</h3>
              <p className="text-gray-500 mb-6">Check back soon — we regularly add new deals and discounts!</p>
              <Link href="/products" className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition">
                Browse Products
              </Link>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
