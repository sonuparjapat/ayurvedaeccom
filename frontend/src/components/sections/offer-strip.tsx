'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import Link from 'next/link'
import { Tag, Copy, Check } from 'lucide-react'

interface Coupon {
  id: number
  code: string
  type: 'flat' | 'percent'
  value: number
  min_order: number
  description: string | null
}

export function OfferStrip() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    axios.get('/coupons/public')
      .then(r => setCoupons(r.data.coupons || []))
      .catch(() => {})
  }, [])

  if (!coupons.length) return null

  const copy = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="w-full bg-gradient-to-r from-[#0f3d2e] via-[#1a5c45] to-[#0f3d2e] py-3 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center gap-4 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: 'none' }}>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Tag size={14} className="text-amber-400" />
          <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-amber-400">
            Offers
          </span>
          <div className="w-px h-4 bg-white/20 ml-1" />
        </div>

        <div className="flex gap-3 items-center overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {coupons.map(c => (
            <div key={c.id} className="flex items-center gap-2 flex-shrink-0 group">
              {/* Coupon pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm">
                <span className="text-[11px] font-bold tracking-wider text-white/90">{c.code}</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300">
                  {c.type === 'percent' ? `${c.value}% OFF` : `₹${c.value} OFF`}
                </span>
                {c.min_order > 0 && (
                  <span className="text-[10px] text-white/50">Min ₹{c.min_order}</span>
                )}
              </div>
              {/* Copy button */}
              <button
                onClick={() => copy(c.code)}
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/20 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"
                title={`Copy ${c.code}`}
              >
                {copied === c.code ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
              <div className="w-px h-5 bg-white/10" />
            </div>
          ))}
        </div>

        <Link href="/products" className="flex-shrink-0 ml-auto text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap">
          Shop Now →
        </Link>
      </div>
    </div>
  )
}

export default OfferStrip
