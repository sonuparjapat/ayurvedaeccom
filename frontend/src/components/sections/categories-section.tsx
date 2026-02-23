'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'

// ─── Theme map keyed by index (cycles if more than 4 categories) ──────────────
const THEMES = [
  {
    mesh: 'from-amber-900 via-amber-800 to-orange-900',
    glow: 'bg-amber-400',
    accent: 'text-amber-600',
    arrowBg: 'bg-amber-700',
    dot: '#fbbf24',
  },
  {
    mesh: 'from-emerald-900 via-emerald-800 to-green-900',
    glow: 'bg-emerald-400',
    accent: 'text-emerald-600',
    arrowBg: 'bg-emerald-700',
    dot: '#34d399',
  },
  {
    mesh: 'from-red-900 via-rose-800 to-pink-900',
    glow: 'bg-rose-400',
    accent: 'text-rose-600',
    arrowBg: 'bg-rose-700',
    dot: '#fb7185',
  },
  {
    mesh: 'from-blue-900 via-blue-800 to-indigo-900',
    glow: 'bg-blue-400',
    accent: 'text-blue-600',
    arrowBg: 'bg-blue-700',
    dot: '#60a5fa',
  },
]

// ─── Single Card ──────────────────────────────────────────────────────────────
function CategoryCard({ category, index }) {
  const cardRef = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)

  const theme = THEMES[index % THEMES.length]

  const handleMouseMove = (e) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    const nx = (e.clientX - rect.left) / rect.width - 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: nx, y: ny })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
    setHovered(false)
  }

  const tiltStyle = {
    transform: `perspective(900px) rotateY(${tilt.x * 10}deg) rotateX(${-tilt.y * 10}deg) translateZ(${hovered ? 6 : 0}px)`,
    transition: hovered
      ? 'transform 0.08s ease'
      : 'transform 0.55s cubic-bezier(0.22,1,0.36,1)',
    transformStyle: 'preserve-3d',
  }

  const wrapStyle = {
    opacity: 0,
    animation: `fadeUp 0.65s cubic-bezier(0.22,1,0.36,1) ${index * 0.1}s forwards`,
    height: '100%',
  }

  return (
    <div style={wrapStyle}>
      <div
        ref={cardRef}
        style={tiltStyle}
        className="h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={() => setHovered(true)}
      >
        <Link href={`/category/${category?.id}`} className="block h-full no-underline">
          <div
            className={[
              'group relative flex flex-col h-full rounded-3xl overflow-hidden bg-white',
              'border border-black/[0.07] cursor-pointer',
              'transition-shadow duration-500',
              hovered
                ? 'shadow-[0_16px_56px_rgba(0,0,0,0.13),0_4px_16px_rgba(0,0,0,0.07)]'
                : 'shadow-[0_4px_24px_rgba(0,0,0,0.07),0_1px_4px_rgba(0,0,0,0.04)]',
            ].join(' ')}
          >
            {/* ── Ambient glow ── */}
            <div
              className={`absolute -top-14 -left-14 w-52 h-52 rounded-full blur-3xl pointer-events-none ${theme.glow} transition-opacity duration-700`}
              style={{ opacity: hovered ? 0.25 : 0 }}
            />

            {/* ── Visual top area ── */}
            <div
              className={`relative h-44 flex items-center justify-center overflow-hidden bg-gradient-to-br ${theme.mesh}`}
            >
              {/* Noise grain */}
              <div
                className="absolute inset-0 opacity-[0.18] mix-blend-overlay pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                }}
              />

              {/* Category image / emoji */}
              <div
                className="relative z-10 w-20 h-20 rounded-2xl bg-black/30 backdrop-blur-sm border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center justify-center overflow-hidden transition-transform duration-300"
                style={{
                  transform: hovered ? 'scale(1.1) rotate(-4deg)' : 'scale(1) rotate(0deg)',
                }}
              >
                {category?.image_url ? (
                  <img
                    src={category.image_url}
                    alt={category?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">{category?.image}</span>
                )}
              </div>

              {/* Product count badge */}
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-white/80 backdrop-blur-md border border-white/90 rounded-full px-3 py-1 shadow-sm">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: theme.dot, animation: 'catPulse 2s infinite' }}
                />
                <span className="text-[10px] font-bold tracking-wide text-gray-600 whitespace-nowrap">
                  {category?.product_count||0}
                </span>
              </div>
            </div>

            {/* ── Card body ── */}
            <div className="flex flex-col flex-1 p-6 gap-2 bg-white">
              <h3 className="text-[17px] font-bold text-slate-900 tracking-tight leading-snug">
                {category?.name}
              </h3>

              <p className="text-[13px] text-gray-500 leading-relaxed flex-1">
                {category?.description}
              </p>

              {/* CTA row */}
              <div className="flex items-center justify-between mt-3 pt-4 border-t border-black/[0.07]">
                <span
                  className={`text-[10px] font-bold uppercase tracking-[0.18em] ${theme.accent}`}
                >
                  Shop Now
                </span>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${theme.arrowBg} transition-transform duration-300`}
                  style={{
                    transform: hovered ? 'scale(1.12) rotate(45deg)' : 'scale(1) rotate(0deg)',
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Bottom shimmer */}
            <div
              className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent transition-opacity duration-500"
              style={{ opacity: hovered ? 1 : 0 }}
            />
          </div>
        </Link>
      </div>
    </div>
  )
}

// ─── Main Section ─────────────────────────────────────────────────────────────
export function CategoriesSection() {
  const { categoriesdata } = useAuth()

  console.log(categoriesdata, 'comind cat')

  return (
    <section className="py-2 bg-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes catPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.45; transform: scale(0.8); }
        }
      `}</style>

      <div className="container mx-auto px-4">
        {/* ── Section header ── */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-7 h-px bg-emerald-500 opacity-40 block" />
            <span
              className="text-[11px] font-bold tracking-[0.2em] uppercase text-emerald-600"
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              What we offer
            </span>
            <span className="w-7 h-px bg-emerald-500 opacity-40 block" />
          </div>

          <h2
            className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-4"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            Shop by{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-emerald-400 bg-clip-text text-transparent">
              Category
            </span>
          </h2>

          <p className="text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Explore our carefully curated categories of premium Ayurvedic and traditional Indian
            products.
          </p>
        </div>

        {/* ── Cards grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {categoriesdata?.rows?.map((category: any, index: number) => (
            <CategoryCard key={category?.id ?? index} category={category} index={index} />
          ))}
        </div>

        {/* ── View All button ── */}
        <div className="text-center mt-14">
          <Button
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 rounded-full shadow-lg hover:shadow-emerald-200 hover:shadow-xl transition-all duration-300"
            asChild
          >
            <Link href="/products">
              View All Products
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}