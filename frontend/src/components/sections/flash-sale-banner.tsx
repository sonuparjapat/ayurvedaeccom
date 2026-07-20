'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Zap, AlertTriangle, ArrowRight, Flame } from 'lucide-react'
import axiosInstance from '@/lib/axios'
import { io } from 'socket.io-client'

interface FlashProduct {
  product_id: number
  product_name: string
  slug?: string
  image: string
  flash_price: number
  original_price: number
  discount_percent: number
  stock_limit: number
  sold_count: number
}

interface FlashSale {
  id: number
  title: string
  ends_at: string
  seconds_remaining: number
  products: FlashProduct[]
  exhausted?: boolean
}

function Countdown({ endsAt }: { endsAt: string }) {
  const [secs, setSecs] = useState(() => Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000)))

  useEffect(() => {
    if (secs <= 0) return
    const id = setInterval(() => setSecs(s => {
      if (s <= 1) { clearInterval(id); return 0 }
      return s - 1
    }), 1000)
    return () => clearInterval(id)
  }, [endsAt])

  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  const pad = (n: number) => String(n).padStart(2, '0')

  if (secs <= 0) return (
    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'monospace' }}>Ended</span>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {[pad(h), pad(m), pad(s)].map((unit, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            padding: '4px 8px',
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            fontSize: 16,
            fontWeight: 800,
            color: '#fff',
            minWidth: 36,
            textAlign: 'center',
            lineHeight: 1,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
          }}>{unit}</div>
          {i < 2 && <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 800, fontSize: 16 }}>:</span>}
        </div>
      ))}
    </div>
  )
}

function ProductCard({ p, isExhausted }: { p: FlashProduct; isExhausted: boolean }) {
  const [hovered, setHovered] = useState(false)
  const stockLeft = Math.max(0, (p.stock_limit || 999) - (p.sold_count || 0))
  const pctSold = p.stock_limit ? Math.min(100, Math.round(((p.sold_count || 0) / p.stock_limit) * 100)) : 0
  const productSoldOut = p.stock_limit > 0 && stockLeft === 0

  return (
    <Link href={`/product/${p.slug || p.product_id}`} style={{ flexShrink: 0, display: 'block', textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: 160,
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${hovered ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.10)'}`,
          borderRadius: 16,
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.25s ease',
          transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.35)' : '0 4px 16px rgba(0,0,0,0.2)',
          position: 'relative',
        }}
      >
        {/* Sold out overlay */}
        {(productSoldOut || isExhausted) && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)',
            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              background: 'rgba(30,30,30,0.9)', color: '#fff',
              fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 99,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>Sold Out</span>
          </div>
        )}

        {/* Image */}
        <div style={{ height: 130, background: 'rgba(0,0,0,0.2)', position: 'relative', overflow: 'hidden' }}>
          {p.image ? (
            <img
              src={p.image}
              alt={p.product_name}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transition: 'transform 0.4s ease',
                transform: hovered ? 'scale(1.08)' : 'scale(1)',
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, opacity: 0.5 }}>⚡</div>
          )}

          {/* Discount badge */}
          {!isExhausted && !productSoldOut && (
            <div style={{
              position: 'absolute', top: 8, left: 8,
              background: 'linear-gradient(135deg, #ff4444, #ff6b00)',
              color: '#fff', fontSize: 10, fontWeight: 800,
              padding: '3px 7px', borderRadius: 99,
              boxShadow: '0 2px 8px rgba(255,68,68,0.4)',
            }}>
              -{p.discount_percent}%
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '10px 12px 12px' }}>
          <p style={{
            fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.92)',
            lineHeight: 1.35, marginBottom: 6, display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{p.product_name}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            {isExhausted || productSoldOut ? (
              <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>
                ₹{Number(p.original_price).toFixed(0)}
              </span>
            ) : (
              <>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#ffdd00' }}>
                  ₹{Number(p.flash_price).toFixed(0)}
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textDecoration: 'line-through' }}>
                  ₹{Number(p.original_price).toFixed(0)}
                </span>
              </>
            )}
          </div>

          {/* Stock progress bar */}
          {p.stock_limit > 0 && !isExhausted && (
            <div>
              <div style={{
                height: 4, background: 'rgba(255,255,255,0.12)',
                borderRadius: 99, overflow: 'hidden', marginBottom: 4,
              }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  background: pctSold > 80 ? 'linear-gradient(90deg,#ff4444,#ff6b00)' : 'linear-gradient(90deg,#22c55e,#16a34a)',
                  width: `${pctSold}%`,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                {productSoldOut ? '🔴 Sold out' : `${stockLeft} left`}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export function FlashSaleBanner() {
  const [sales, setSales] = useState<FlashSale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axiosInstance.get('/flash-sales/active')
      .then(r => setSales(r.data.sales || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    })

    socket.on('flash_product_update', ({ saleId, productId, soldCount }: {
      saleId: number; productId: number; soldCount: number; stockLimit: number
    }) => {
      setSales(prev => prev.map(sale =>
        sale.id !== saleId ? sale : {
          ...sale,
          products: sale.products.map(p =>
            p.product_id !== productId ? p : { ...p, sold_count: soldCount }
          )
        }
      ))
    })

    socket.on('flash_product_sold_out', ({ saleId, productId }: { saleId: number; productId: number }) => {
      setSales(prev => prev.map(sale =>
        sale.id !== saleId ? sale : {
          ...sale,
          products: sale.products.map(p =>
            p.product_id !== productId ? p : { ...p, sold_count: p.stock_limit }
          )
        }
      ))
    })

    socket.on('flash_sale_exhausted', ({ saleId }: { saleId: number }) => {
      setSales(prev => prev.map(sale =>
        sale.id === saleId ? { ...sale, exhausted: true } : sale
      ))
    })

    return () => { socket.disconnect() }
  }, [])

  if (loading || !sales.length) return null

  return (
    <section style={{ padding: '0 16px 24px' }}>
      {sales.map(sale => {
        const isExhausted = !!sale.exhausted

        return (
          <div key={sale.id} style={{
            position: 'relative',
            borderRadius: 20,
            overflow: 'hidden',
            background: isExhausted
              ? 'linear-gradient(135deg, #374151 0%, #4b5563 50%, #374151 100%)'
              : 'linear-gradient(135deg, #0f3d2e 0%, #1a2e10 40%, #0f1f0a 70%, #1a0a00 100%)',
            boxShadow: isExhausted
              ? '0 8px 40px rgba(0,0,0,0.3)'
              : '0 8px 40px rgba(15,61,46,0.5), 0 0 80px rgba(255,100,0,0.08)',
            border: isExhausted
              ? '1px solid rgba(255,255,255,0.06)'
              : '1px solid rgba(255,170,0,0.15)',
          }}>

            {/* Animated gradient overlay */}
            {!isExhausted && (
              <>
                <div style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
                  background: 'radial-gradient(ellipse at 80% 50%, rgba(255,120,0,0.12) 0%, transparent 60%)',
                }} />
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                  background: 'linear-gradient(90deg, transparent, rgba(255,170,0,0.7), rgba(255,80,0,0.7), transparent)',
                }} />
              </>
            )}

            {/* Exhausted overlay */}
            {isExhausted && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 20,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)',
              }}>
                <AlertTriangle size={32} style={{ color: '#fbbf24', marginBottom: 10 }} />
                <p style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>{sale.title}</p>
                <div style={{
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 12, padding: '10px 20px', marginTop: 10, textAlign: 'center',
                }}>
                  <p style={{ color: '#fff', fontWeight: 700 }}>🎉 Sale Fully Claimed!</p>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 }}>All flash discounts used up. Regular prices apply.</p>
                </div>
              </div>
            )}

            {/* Header bar */}
            <div style={{
              position: 'relative', zIndex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 12,
              padding: '14px 20px 12px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              {/* Left: icon + title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #ff6b00, #ff3300)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(255,100,0,0.5)',
                  flexShrink: 0,
                }}>
                  <Flame size={18} fill="#fff" style={{ color: '#fff' }} />
                </div>
                <div>
                  <p style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: 'rgba(255,200,80,0.9)',
                    lineHeight: 1, marginBottom: 3,
                  }}>Flash Sale</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{sale.title}</p>
                </div>
              </div>

              {/* Right: countdown or ended badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {!isExhausted && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.55)',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>Ends in</span>
                    <Countdown endsAt={sale.ends_at} />
                  </div>
                )}
                {isExhausted && (
                  <span style={{
                    background: 'rgba(255,255,255,0.15)', color: '#fff',
                    fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>Sale Ended</span>
                )}
              </div>
            </div>

            {/* Products row */}
            <div style={{ position: 'relative', zIndex: 1, padding: '16px 20px 20px' }}>
              <div style={{
                display: 'flex', gap: 12, overflowX: 'auto',
                paddingBottom: 4, scrollbarWidth: 'none',
              }}>
                {sale.products.map(p => (
                  <ProductCard key={p.product_id} p={p} isExhausted={isExhausted} />
                ))}

                {/* View All card */}
                {sale.products.length >= 3 && !isExhausted && (
                  <Link href="/offers" style={{ flexShrink: 0, display: 'block', textDecoration: 'none' }}>
                    <div style={{
                      width: 120, height: 200, borderRadius: 16,
                      border: '1.5px dashed rgba(255,255,255,0.2)',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 8,
                      cursor: 'pointer', transition: 'all 0.2s',
                      background: 'rgba(255,255,255,0.04)',
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <ArrowRight size={16} style={{ color: 'rgba(255,255,255,0.7)' }} />
                      </div>
                      <p style={{
                        fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)',
                        textAlign: 'center', lineHeight: 1.3,
                      }}>View All<br />Deals</p>
                    </div>
                  </Link>
                )}
              </div>
            </div>

          </div>
        )
      })}

      <style>{`
        section:has(.flash-scroll) div::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  )
}
