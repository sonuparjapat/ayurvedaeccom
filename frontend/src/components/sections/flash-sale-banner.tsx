'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Zap, AlertTriangle } from 'lucide-react'
import axiosInstance from '@/lib/axios'
import { io, Socket } from 'socket.io-client'

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
  exhausted?: boolean // set client-side when max_uses reached
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

  if (secs <= 0) return <span className="text-white/70 text-sm font-mono">Ended</span>

  return (
    <div className="flex items-center gap-1 text-white font-mono font-bold text-sm">
      <span className="bg-white/20 rounded px-1.5 py-0.5">{pad(h)}</span>
      <span>:</span>
      <span className="bg-white/20 rounded px-1.5 py-0.5">{pad(m)}</span>
      <span>:</span>
      <span className="bg-white/20 rounded px-1.5 py-0.5">{pad(s)}</span>
    </div>
  )
}

export function FlashSaleBanner() {
  const [sales, setSales] = useState<FlashSale[]>([])
  const [loading, setLoading] = useState(true)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    axiosInstance.get('/flash-sales/active')
      .then(r => setSales(r.data.sales || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Socket: listen for real-time flash sale events
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    // Live sold_count update for a product's progress bar
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

    // A specific product in the sale is sold out at flash price
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

    // Entire sale exhausted (max_uses reached)
    socket.on('flash_sale_exhausted', ({ saleId }: { saleId: number }) => {
      setSales(prev => prev.map(sale =>
        sale.id === saleId ? { ...sale, exhausted: true } : sale
      ))
    })

    return () => { socket.disconnect() }
  }, [])

  if (loading || !sales.length) return null

  return (
    <section className="py-6 px-4 space-y-6">
      {sales.map(sale => {
        const isExhausted = sale.exhausted

        return (
          <div key={sale.id} className="rounded-2xl overflow-hidden shadow-lg relative"
            style={{ background: isExhausted ? 'linear-gradient(135deg, #4b5563, #6b7280, #9ca3af)' : 'linear-gradient(135deg, #dc2626, #f97316, #f59e0b)' }}>

            {/* Exhausted overlay banner */}
            {isExhausted && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[2px] rounded-2xl">
                <div className="flex flex-col items-center gap-3 text-center px-6">
                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                    <AlertTriangle size={28} className="text-amber-300" />
                  </div>
                  <p className="text-white font-extrabold text-xl tracking-tight">{sale.title}</p>
                  <div className="bg-white/15 rounded-xl px-5 py-2.5">
                    <p className="text-white font-bold text-base">🎉 Sale Fully Claimed!</p>
                    <p className="text-white/75 text-sm mt-1">All discounts for this sale have been used up. Regular prices apply.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2 text-white">
                <Zap size={20} fill="white" />
                <span className="font-extrabold text-lg tracking-tight uppercase">{sale.title}</span>
              </div>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                {isExhausted ? (
                  <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Sale Ended
                  </span>
                ) : (
                  <>
                    <span>Ends in</span>
                    <Countdown endsAt={sale.ends_at} />
                  </>
                )}
              </div>
            </div>

            {/* Products */}
            <div className="bg-white/5 px-4 pb-4">
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {sale.products.map(p => {
                  const stockLeft = Math.max(0, (p.stock_limit || 999) - (p.sold_count || 0))
                  const pctSold = p.stock_limit ? Math.min(100, Math.round(((p.sold_count || 0) / p.stock_limit) * 100)) : 0
                  const productSoldOut = p.stock_limit > 0 && stockLeft === 0

                  return (
                    <Link key={p.product_id} href={`/product/${p.slug || p.product_id}`}
                      className="shrink-0 w-36 bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow relative">

                      {/* Product sold-out overlay */}
                      {productSoldOut && !isExhausted && (
                        <div className="absolute inset-0 z-10 bg-black/50 rounded-xl flex items-center justify-center">
                          <span className="bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                            Sold Out
                          </span>
                        </div>
                      )}

                      <div className="relative h-32 w-full bg-gray-50">
                        {p.image ? (
                          <img src={p.image} alt={p.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-orange-50 text-orange-300 text-3xl">⚡</div>
                        )}
                        {!isExhausted && !productSoldOut && (
                          <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                            -{p.discount_percent}%
                          </span>
                        )}
                      </div>
                      <div className="p-2 space-y-1">
                        <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">{p.product_name}</p>
                        <div className="flex items-center gap-1">
                          {isExhausted || productSoldOut ? (
                            <span className="text-sm font-bold text-gray-700">₹{Number(p.original_price).toFixed(0)}</span>
                          ) : (
                            <>
                              <span className="text-sm font-bold text-red-600">₹{Number(p.flash_price).toFixed(0)}</span>
                              <span className="text-xs text-gray-400 line-through">₹{Number(p.original_price).toFixed(0)}</span>
                            </>
                          )}
                        </div>
                        {p.stock_limit > 0 && (
                          <div>
                            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: `${pctSold}%` }} />
                            </div>
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              {productSoldOut ? '🔴 Sold out' : `${stockLeft} left`}
                            </p>
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </section>
  )
}
