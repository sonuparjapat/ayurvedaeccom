'use client'

import { useEffect, useState, useRef } from 'react'
import axios from '@/lib/axios'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Tag, Zap, Package, Clock, Copy, CheckCircle, Flame, Sparkles, ShoppingCart, ArrowRight, TrendingDown } from 'lucide-react'
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

function Countdown({ endsAt, large = false }: { endsAt: string; large?: boolean }) {
  const [secs, setSecs] = useState(() => Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000)))
  useEffect(() => {
    if (secs <= 0) return
    const t = setInterval(() => setSecs(s => s <= 1 ? 0 : s - 1), 1000)
    return () => clearInterval(t)
  }, [endsAt])
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  if (secs <= 0) return <span style={{ color: '#f87171', fontWeight: 700, fontSize: large ? 14 : 12 }}>Expired</span>

  const labels = ['HRS', 'MIN', 'SEC']
  const values = [pad(h), pad(m), pad(s)]

  if (large) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {values.map((v, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <span style={{ color: 'rgba(255,210,80,0.8)', fontWeight: 900, fontSize: 20, lineHeight: 1 }}>:</span>}
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{
                background: 'rgba(0,0,0,0.5)', color: '#ffd250', fontFamily: 'monospace',
                fontWeight: 900, fontSize: 28, lineHeight: 1, padding: '6px 10px', borderRadius: 8,
                border: '1px solid rgba(255,210,80,0.3)', minWidth: 48, textAlign: 'center',
                boxShadow: '0 2px 12px rgba(255,180,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
                letterSpacing: 2
              }}>{v}</span>
              <span style={{ color: 'rgba(255,210,80,0.6)', fontSize: 9, fontWeight: 700, letterSpacing: 1.5 }}>{labels[i]}</span>
            </span>
          </span>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {values.map((v, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {i > 0 && <span style={{ color: 'rgba(255,210,80,0.7)', fontWeight: 900, fontSize: 14 }}>:</span>}
          <span style={{
            background: 'rgba(0,0,0,0.45)', color: '#ffd250', fontFamily: 'monospace',
            fontWeight: 800, fontSize: 13, padding: '3px 7px', borderRadius: 5,
            border: '1px solid rgba(255,210,80,0.25)', minWidth: 28, textAlign: 'center'
          }}>{v}</span>
        </span>
      ))}
    </div>
  )
}

function FlashProductCard({ p }: { p: FlashSale['products'][0] }) {
  const soldPct = p.stock_limit > 0 ? (p.sold_count / p.stock_limit) * 100 : 0
  const remaining = p.stock_limit - p.sold_count
  const isCritical = soldPct >= 80

  return (
    <Link href={`/product/${p.product_id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 16, overflow: 'hidden', width: 180, flexShrink: 0,
        transition: 'all 0.3s ease', cursor: 'pointer', position: 'relative'
      }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.background = 'rgba(255,255,255,0.13)'
          el.style.transform = 'translateY(-4px)'
          el.style.boxShadow = '0 20px 60px rgba(0,0,0,0.4)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.background = 'rgba(255,255,255,0.07)'
          el.style.transform = 'translateY(0)'
          el.style.boxShadow = 'none'
        }}
      >
        <span style={{
          position: 'absolute', top: 10, right: 10, zIndex: 2,
          background: 'linear-gradient(135deg,#f59e0b,#ef4444)',
          color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 20,
          boxShadow: '0 2px 8px rgba(239,68,68,0.5)'
        }}>{p.discount_percent}% OFF</span>

        {p.image ? (
          <img src={p.image} alt={p.product_name} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: 160, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>⚡</div>
        )}

        <div style={{ padding: '12px 12px 14px' }}>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600, margin: '0 0 8px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {p.product_name}
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
            <span style={{ color: '#ffd250', fontSize: 18, fontWeight: 800 }}>₹{p.flash_price}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textDecoration: 'line-through' }}>₹{p.original_price}</span>
          </div>

          {p.stock_limit > 0 && (
            <div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
                <div style={{
                  height: '100%', borderRadius: 4, width: `${Math.min(soldPct, 100)}%`,
                  background: isCritical ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#22c55e,#16a34a)',
                  transition: 'width 0.5s ease'
                }} />
              </div>
              <p style={{ color: isCritical ? '#f87171' : 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 600 }}>
                {isCritical ? `Only ${remaining} left!` : `${remaining} remaining`}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20, padding: 24, animation: 'pulse 1.5s ease-in-out infinite'
    }}>
      <div style={{ height: 16, background: 'rgba(255,255,255,0.08)', borderRadius: 8, width: '60%', marginBottom: 12 }} />
      <div style={{ height: 48, background: 'rgba(255,255,255,0.05)', borderRadius: 8, marginBottom: 8 }} />
      <div style={{ height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 6, width: '80%' }} />
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
  const heroRef = useRef<HTMLDivElement>(null)

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

  const totalSavings = coupons.reduce((acc, c) => acc + (c.discount_type === 'percent' ? c.discount_value : 0), 0)

  return (
    <>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes float1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-30px,20px) scale(1.08); } }
        @keyframes float2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(20px,-25px) scale(0.94); } }
        @keyframes float3 { 0%,100% { transform: translate(0,0); } 33% { transform: translate(15px,10px); } 66% { transform: translate(-10px,20px); } }
        @keyframes shimmer { 0% { transform: translateX(-100%) skewX(-15deg); } 100% { transform: translateX(300%) skewX(-15deg); } }
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .offer-fadeup { animation: fadeUp 0.6s ease forwards; }
        .offer-fadeup-2 { animation: fadeUp 0.6s 0.12s ease both; }
        .offer-fadeup-3 { animation: fadeUp 0.6s 0.24s ease both; }
        .coupon-card:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(255,210,80,0.15) !important; }
        .coupon-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .bundle-card:hover .bundle-overlay { opacity: 1 !important; }
        .bundle-card:hover { transform: translateY(-4px); }
        .bundle-card { transition: transform 0.25s ease; }
        .copy-btn:hover { background: rgba(255,210,80,0.2) !important; }
        .copy-btn { transition: background 0.2s; }
        .section-fade { opacity: 0; transform: translateY(20px); transition: opacity 0.5s ease, transform 0.5s ease; }
        .section-fade.visible { opacity: 1; transform: translateY(0); }
      `}</style>

      <Header />

      {/* ═══ HERO ═══ */}
      <div ref={heroRef} style={{
        position: 'relative', overflow: 'hidden', minHeight: 340,
        background: 'linear-gradient(160deg, #061812 0%, #0f2d1e 35%, #1a2e10 65%, #0d1a08 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        paddingTop: 80, paddingBottom: 60, paddingLeft: 16, paddingRight: 16, textAlign: 'center'
      }}>
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: -80, left: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)', animation: 'float1 12s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: -100, right: -60, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,180,0,0.12) 0%, transparent 70%)', animation: 'float2 15s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', top: '20%', right: '25%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)', animation: 'float3 10s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.015) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.015) 40px)' }} />
        </div>

        {/* Gold top accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, #f59e0b 30%, #ffd250 50%, #f59e0b 70%, transparent)', boxShadow: '0 0 24px rgba(245,158,11,0.6)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div className="offer-fadeup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,210,80,0.1)', border: '1px solid rgba(255,210,80,0.3)', borderRadius: 100, padding: '6px 16px', marginBottom: 20 }}>
            <Sparkles size={14} color="#ffd250" />
            <span style={{ color: '#ffd250', fontSize: 12, fontWeight: 700, letterSpacing: 1.5 }}>EXCLUSIVE DEALS</span>
          </div>

          <h1 className="offer-fadeup-2" style={{ fontSize: 'clamp(36px,6vw,64px)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 16px', color: '#fff', letterSpacing: -1 }}>
            Offers &{' '}
            <span style={{ background: 'linear-gradient(135deg,#ffd250,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Deals
            </span>
          </h1>

          <p className="offer-fadeup-3" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.6 }}>
            Exclusive discounts on premium Ayurvedic products. Save more on your wellness journey.
          </p>

          {/* Stats row */}
          {!loading && (flashSales.length + coupons.length + bundles.length) > 0 && (
            <div className="offer-fadeup-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
              {flashSales.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '8px 16px' }}>
                  <Flame size={16} color="#f87171" />
                  <span style={{ color: '#f87171', fontSize: 13, fontWeight: 700 }}>{flashSales.length} Flash Sale{flashSales.length > 1 ? 's' : ''}</span>
                </div>
              )}
              {coupons.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, padding: '8px 16px' }}>
                  <Tag size={16} color="#34d399" />
                  <span style={{ color: '#34d399', fontSize: 13, fontWeight: 700 }}>{coupons.length} Coupon{coupons.length > 1 ? 's' : ''}</span>
                </div>
              )}
              {bundles.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 12, padding: '8px 16px' }}>
                  <Package size={16} color="#c4b5fd" />
                  <span style={{ color: '#c4b5fd', fontSize: 13, fontWeight: 700 }}>{bundles.length} Bundle{bundles.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div style={{ background: 'linear-gradient(180deg, #061812 0%, #0b2018 40%, #0f1a0a 100%)', minHeight: '60vh' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 16px 80px' }}>

          {/* Loading skeletons */}
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* ─── FLASH SALES ─── */}
          {!loading && flashSales.length > 0 && (
            <section style={{ marginBottom: 64 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#7f1d1d,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(239,68,68,0.4)' }}>
                  <Flame size={22} color="#fecaca" />
                </div>
                <div>
                  <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: 0 }}>Flash Sales</h2>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: 0 }}>Limited time — grab before they&apos;re gone!</p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                  <Clock size={12} />
                  <span>Live deals</span>
                </div>
              </div>

              {flashSales.map(sale => (
                <div key={sale.id} style={{
                  borderRadius: 24, overflow: 'hidden', marginBottom: 24,
                  background: 'linear-gradient(135deg, rgba(127,29,29,0.4) 0%, rgba(30,8,8,0.8) 100%)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  boxShadow: '0 8px 48px rgba(239,68,68,0.1), inset 0 1px 0 rgba(255,255,255,0.05)'
                }}>
                  {/* Sale header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 20 }}>⚡</span>
                      <span style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>{sale.title}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600 }}>ENDS IN</span>
                      <Countdown endsAt={sale.ends_at} large />
                    </div>
                  </div>

                  {/* Products horizontal scroll */}
                  <div style={{ padding: '20px 20px 24px', overflowX: 'auto' }}>
                    <div style={{ display: 'flex', gap: 16, width: 'max-content' }}>
                      {sale.products.map(p => <FlashProductCard key={p.product_id} p={p} />)}
                      <Link href="/products" style={{ textDecoration: 'none', flexShrink: 0 }}>
                        <div style={{
                          width: 160, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center',
                          justifyContent: 'center', height: '100%', minHeight: 260, gap: 12, padding: 20,
                          cursor: 'pointer', transition: 'all 0.25s'
                        }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
                        >
                          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ArrowRight size={22} color="#f87171" />
                          </div>
                          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>View All Deals</span>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* ─── COUPONS ─── */}
          {!loading && coupons.length > 0 && (
            <section style={{ marginBottom: 64 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#065f46,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(16,185,129,0.35)' }}>
                  <Tag size={22} color="#6ee7b7" />
                </div>
                <div>
                  <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: 0 }}>Coupon Codes</h2>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: 0 }}>Apply at checkout to unlock your savings</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {coupons.map((c, idx) => (
                  <div key={c.id} className="coupon-card" style={{
                    position: 'relative', borderRadius: 20, overflow: 'hidden',
                    background: 'linear-gradient(135deg, rgba(6,95,70,0.35) 0%, rgba(2,44,34,0.8) 100%)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                    animationDelay: `${idx * 0.06}s`
                  }}>
                    {/* Decorative circles for ticket look */}
                    <div style={{ position: 'absolute', left: -16, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(160deg,#061812,#0b2018)' }} />
                    <div style={{ position: 'absolute', right: -16, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(160deg,#061812,#0b2018)' }} />

                    {/* Dashed separator line */}
                    <div style={{ position: 'absolute', left: 16, right: 16, top: '50%', borderTop: '1px dashed rgba(16,185,129,0.2)' }} />

                    <div style={{ padding: '22px 24px 18px', position: 'relative' }}>
                      {/* Discount badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <span style={{
                          background: 'linear-gradient(135deg,#059669,#10b981)',
                          color: '#fff', fontSize: 13, fontWeight: 800, padding: '5px 14px', borderRadius: 100,
                          boxShadow: '0 2px 12px rgba(16,185,129,0.4)'
                        }}>
                          {c.discount_type === 'percent' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                        </span>
                        {c.valid_to && (
                          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={10} />
                            Till {new Date(c.valid_to).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                      </div>

                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 16px', lineHeight: 1.5 }}>
                        {c.description || 'Use this code at checkout'}
                      </p>
                    </div>

                    {/* Code + copy row */}
                    <div style={{ borderTop: '1px dashed rgba(16,185,129,0.15)', padding: '14px 20px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(16,185,129,0.25)',
                        borderRadius: 12, padding: '10px 16px', fontFamily: 'monospace', fontWeight: 800,
                        fontSize: 18, color: '#6ee7b7', textAlign: 'center', letterSpacing: 3
                      }}>
                        {c.code}
                      </div>
                      <button className="copy-btn" onClick={() => copyCode(c.code)} style={{
                        background: copiedCode === c.code ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12,
                        width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: copiedCode === c.code ? '#34d399' : '#6ee7b7', flexShrink: 0
                      }}>
                        {copiedCode === c.code ? <CheckCircle size={18} /> : <Copy size={18} />}
                      </button>
                    </div>

                    {/* Fine print */}
                    {(c.min_order_amount > 0 || (c.max_discount > 0 && c.discount_type === 'percent')) && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '10px 20px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {c.min_order_amount > 0 && (
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Min. order ₹{c.min_order_amount}</span>
                        )}
                        {c.max_discount > 0 && c.discount_type === 'percent' && (
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Max ₹{c.max_discount} off</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ─── BUNDLES ─── */}
          {!loading && bundles.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#4c1d95,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}>
                  <Package size={22} color="#ddd6fe" />
                </div>
                <div>
                  <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: 0 }}>Bundle Deals</h2>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: 0 }}>Buy together and save more</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
                {bundles.map(b => (
                  <div key={b.id} className="bundle-card" style={{
                    borderRadius: 24, overflow: 'hidden', position: 'relative',
                    background: 'linear-gradient(135deg, rgba(76,29,149,0.3) 0%, rgba(20,10,40,0.85) 100%)',
                    border: '1px solid rgba(124,58,237,0.2)',
                    boxShadow: '0 4px 32px rgba(0,0,0,0.3)'
                  }}>
                    {b.image_url ? (
                      <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                        <img src={b.image_url} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.75)' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(20,10,40,0.95) 100%)' }} />
                        <div className="bundle-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(124,58,237,0.15)', opacity: 0, transition: 'opacity 0.25s' }} />
                        <span style={{
                          position: 'absolute', top: 16, right: 16,
                          background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff',
                          fontSize: 12, fontWeight: 800, padding: '5px 12px', borderRadius: 100,
                          boxShadow: '0 2px 12px rgba(124,58,237,0.5)'
                        }}>
                          {b.discount_type === 'percent' ? `${b.discount_value}% OFF` : `₹${b.discount_value} OFF`}
                        </span>
                      </div>
                    ) : (
                      <div style={{ height: 120, background: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(76,29,149,0.4))', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <Package size={40} color="rgba(196,181,253,0.4)" />
                        <span style={{
                          position: 'absolute', top: 16, right: 16,
                          background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff',
                          fontSize: 12, fontWeight: 800, padding: '5px 12px', borderRadius: 100
                        }}>
                          {b.discount_type === 'percent' ? `${b.discount_value}% OFF` : `₹${b.discount_value} OFF`}
                        </span>
                      </div>
                    )}

                    <div style={{ padding: '20px 22px 24px' }}>
                      <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 17, margin: '0 0 8px' }}>{b.name}</h3>
                      {b.description && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 12px', lineHeight: 1.5 }}>{b.description}</p>}
                      {b.products?.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                          <span style={{ color: 'rgba(167,139,250,0.7)', fontSize: 12 }}>📦</span>
                          <span style={{ color: 'rgba(167,139,250,0.7)', fontSize: 12, fontWeight: 600 }}>{b.products.length} products included</span>
                        </div>
                      )}
                      <button
                        onClick={() => addBundleToCart(b.id)}
                        disabled={addingBundleId === b.id}
                        style={{
                          width: '100%', background: addingBundleId === b.id ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg,#7c3aed,#6d28d9)',
                          border: 'none', borderRadius: 14, color: '#fff', fontSize: 14, fontWeight: 700,
                          padding: '13px 0', cursor: addingBundleId === b.id ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          boxShadow: addingBundleId === b.id ? 'none' : '0 4px 20px rgba(124,58,237,0.4)',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { if (addingBundleId !== b.id) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
                      >
                        {addingBundleId === b.id ? (
                          <>
                            <span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />
                            Adding...
                          </>
                        ) : (
                          <><ShoppingCart size={16} /> Add Bundle to Cart</>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ─── EMPTY STATE ─── */}
          {!loading && !flashSales.length && !coupons.length && !bundles.length && (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Tag size={36} color="rgba(255,255,255,0.2)" />
              </div>
              <h3 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 10px' }}>No Active Offers</h3>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, margin: '0 0 28px', maxWidth: 360, marginInline: 'auto' }}>
                Check back soon — we regularly add new deals and discounts for your wellness journey!
              </p>
              <Link href="/products" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg,#059669,#10b981)', color: '#fff',
                padding: '13px 28px', borderRadius: 14, fontWeight: 700, fontSize: 14,
                textDecoration: 'none', boxShadow: '0 4px 20px rgba(16,185,129,0.4)'
              }}>
                <ShoppingCart size={16} /> Browse Products
              </Link>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  )
}
