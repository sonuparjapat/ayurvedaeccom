'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Zap } from 'lucide-react'
import axiosInstance from '@/lib/axios'

interface FlashProduct {
  product_id: number
  product_name: string
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

  useEffect(() => {
    axiosInstance.get('/flash-sales/active')
      .then(r => setSales(r.data.sales || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || !sales.length) return null

  return (
    <section className="py-6 px-4 space-y-6">
      {sales.map(sale => (
        <div key={sale.id} className="rounded-2xl overflow-hidden shadow-lg bg-gradient-to-r from-red-600 via-orange-500 to-amber-500">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2 text-white">
              <Zap size={20} fill="white" />
              <span className="font-extrabold text-lg tracking-tight uppercase">{sale.title}</span>
            </div>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <span>Ends in</span>
              <Countdown endsAt={sale.ends_at} />
            </div>
          </div>

          {/* Products */}
          <div className="bg-white/5 px-4 pb-4">
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
              {sale.products.map(p => {
                const stockLeft = Math.max(0, (p.stock_limit || 999) - (p.sold_count || 0))
                const pctSold = p.stock_limit ? Math.min(100, Math.round(((p.sold_count || 0) / p.stock_limit) * 100)) : 0
                return (
                  <Link key={p.product_id} href={`/product/${p.product_id}`}
                    className="shrink-0 w-36 bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                    <div className="relative h-32 w-full bg-gray-50">
                      {p.image ? (
                        <Image src={p.image} alt={p.product_name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-orange-50 text-orange-300 text-3xl">⚡</div>
                      )}
                      <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                        -{p.discount_percent}%
                      </span>
                    </div>
                    <div className="p-2 space-y-1">
                      <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">{p.product_name}</p>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-red-600">₹{Number(p.flash_price).toFixed(0)}</span>
                        <span className="text-xs text-gray-400 line-through">₹{Number(p.original_price).toFixed(0)}</span>
                      </div>
                      {p.stock_limit > 0 && (
                        <div>
                          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${pctSold}%` }} />
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {stockLeft > 0 ? `${stockLeft} left` : 'Sold out'}
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
      ))}
    </section>
  )
}
