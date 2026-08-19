'use client'

import { useRef, useState } from 'react'
import { Truck, Shield, Leaf, Award, Users, RefreshCw } from 'lucide-react'
import { useInView } from 'framer-motion'
import { useAuth } from '@/context/auth-context'

/* ─────────────────────────────────────────────
   DEFAULT FEATURES DATA
───────────────────────────────────────────── */
const DEFAULT_FEATURES = [
  {
    num: '01',
    Icon: Truck,
    title: 'Free shipping',
    description: 'On all orders above ₹500. Fast, tracked delivery across every corner of India.',
    bar: 'linear-gradient(90deg, #92400e, #f59e0b)',
    bg: '#fffbeb',
    accent: '#92400e',
    tagBg: '#fef3c7',
    tagText: '#92400e',
    tag: 'Pan-India',
  },
  {
    num: '02',
    Icon: Shield,
    title: '100% authentic',
    description: 'Genuine Ayurvedic products sourced directly from certified, trusted suppliers.',
    bar: 'linear-gradient(90deg, #0f3d2e, #10b981)',
    bg: '#f0fdf4',
    accent: '#0f3d2e',
    tagBg: '#dcfce7',
    tagText: '#166534',
    tag: 'Certified',
  },
  {
    num: '03',
    Icon: Leaf,
    title: 'Organic & natural',
    description: 'No preservatives, no additives, no artificial anything. Just pure, honest food.',
    bar: 'linear-gradient(90deg, #134e4a, #14b8a6)',
    bg: '#f0fdfa',
    accent: '#134e4a',
    tagBg: '#ccfbf1',
    tagText: '#0f766e',
    tag: 'No additives',
  },
  {
    num: '04',
    Icon: Award,
    title: 'Quality assured',
    description: 'Rigorous lab testing and certification by relevant Indian food authorities.',
    bar: 'linear-gradient(90deg, #581c87, #a855f7)',
    bg: '#faf5ff',
    accent: '#581c87',
    tagBg: '#f3e8ff',
    tagText: '#6b21a8',
    tag: 'Lab tested',
  },
  {
    num: '05',
    Icon: Users,
    title: 'Customer support',
    description: 'Dedicated wellness advisors to guide you at every step of your health journey.',
    bar: 'linear-gradient(90deg, #7c2d12, #f97316)',
    bg: '#fff7ed',
    accent: '#7c2d12',
    tagBg: '#ffedd5',
    tagText: '#9a3412',
    tag: '7 days a week',
  },
  {
    num: '06',
    Icon: RefreshCw,
    title: 'Easy returns',
    description: 'Hassle-free 30-day return policy. Not satisfied? We make it right, no questions asked.',
    bar: 'linear-gradient(90deg, #be185d, #ec4899)',
    bg: '#fdf2f8',
    accent: '#be185d',
    tagBg: '#fce7f3',
    tagText: '#9d174d',
    tag: '30-day policy',
  },
]

type Feature = typeof DEFAULT_FEATURES[0]
 
/* ─────────────────────────────────────────────
   FEATURE CARD
───────────────────────────────────────────── */
function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const [hovered, setHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, mx: 50, my: 50 })
  const { Icon } = feature

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setTilt({ rx: (0.5 - y) * 12, ry: (x - 0.5) * 12, mx: x * 100, my: y * 100 })
  }
  const onMouseLeave = () => {
    setHovered(false)
    setTilt({ rx: 0, ry: 0, mx: 50, my: 50 })
  }

  return (
    <div
      className="opacity-0 translate-y-7 h-full"
      style={{
        animation: `featFadeUp 0.6s cubic-bezier(0.22,1,0.36,1) ${index * 100 + 100}ms forwards`,
        perspective: '800px',
      }}
    >
      {/* outer glow wrapper */}
      <div
        ref={cardRef}
        className="h-full rounded-[20px]"
        style={{
          boxShadow: hovered
            ? `0 0 0 1.5px ${feature.tagBg}, 0 24px 56px ${feature.accent}20, 0 8px 20px rgba(0,0,0,0.07)`
            : '0 0 0 0.5px #e5e7eb',
          transform: hovered
            ? `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateY(-6px) scale(1.01)`
            : 'rotateX(0) rotateY(0) translateY(0) scale(1)',
          transition: hovered
            ? 'box-shadow 0.15s ease, transform 0.08s ease'
            : 'box-shadow 0.4s ease, transform 0.55s cubic-bezier(0.22,1,0.36,1)',
          transformStyle: 'preserve-3d',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <div
          className="relative flex flex-col h-full rounded-[20px] overflow-hidden bg-white cursor-default"
        >
          {/* Shine overlay */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none', zIndex: 20,
            background: `radial-gradient(circle at ${tilt.mx}% ${tilt.my}%, rgba(255,255,255,0.18) 0%, transparent 65%)`,
            opacity: hovered ? 1 : 0, transition: 'opacity 0.25s',
          }} />
          {/* top gradient bar */}
          <div className="h-[3px] w-full flex-shrink-0" style={{ background: feature.bar }} />
 
          {/* visual area */}
          <div
            className="relative flex items-center justify-center overflow-hidden flex-shrink-0"
            style={{ height: 140, background: feature.bg, color: feature.accent }}
          >
            {/* dot pattern */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle, ${feature.accent} 1px, transparent 1px)`,
                backgroundSize: '18px 18px',
                opacity: 0.07,
              }}
            />
 
            {/* icon ring */}
            <div
              className="relative z-10 flex items-center justify-center rounded-full bg-white transition-transform duration-350"
              style={{
                width: 72,
                height: 72,
                border: `1.5px solid ${feature.tagBg}`,
                boxShadow: `0 0 0 6px ${feature.tagBg}80, 0 8px 24px ${feature.accent}15`,
                transform: hovered ? 'scale(1.12) rotate(-5deg)' : 'scale(1) rotate(0deg)',
                transitionTimingFunction: 'cubic-bezier(0.22,1,0.36,1)',
              }}
            >
              <Icon
                style={{ width: 26, height: 26, color: feature.accent, strokeWidth: 1.8 }}
              />
            </div>
          </div>
 
          {/* body */}
          <div className="flex flex-col flex-1 px-5 pt-5 pb-6">
            <span
              className="text-[10px] font-medium tracking-[0.14em] uppercase mb-2"
              style={{
                color: feature.accent + '80',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {feature.num} —
            </span>
 
            <h3
              className="text-[18px] leading-tight mb-2"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontWeight: 900,
                letterSpacing: '-0.01em',
                color: feature.accent,
              }}
            >
              {feature.title}
            </h3>
 
            <p className="text-[13px] text-gray-500 leading-relaxed flex-1">
              {feature.description}
            </p>
 
            {/* footer */}
            <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-gray-100">
              <span
                className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                style={{
                  background: feature.tagBg,
                  color: feature.tagText,
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                {feature.tag}
              </span>
 
              <div
                className="flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200"
                style={{
                  background: feature.tagBg,
                  border: `0.5px solid ${feature.tagBg}`,
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke={feature.tagText}
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{
                    transform: hovered ? 'translate(2px, -2px)' : 'translate(0,0)',
                    transition: 'transform 0.2s',
                  }}
                >
                  <path d="M3 13L13 3M7 3h6v6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   BACKGROUND
───────────────────────────────────────────── */
function Background() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-[#F5F1E8]" />
      <div className="absolute -top-20 -left-20 w-[400px] h-[400px] rounded-full bg-amber-100/20 blur-[80px]" />
      <div className="absolute -bottom-16 -right-16 w-[360px] h-[360px] rounded-full bg-emerald-100/20 blur-[70px]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(#92400e 1px, transparent 1px)`,
          backgroundSize: '36px 36px',
        }}
      />
    </div>
  )
}
 
/* ─────────────────────────────────────────────
   SECTION HEADER
───────────────────────────────────────────── */
function SectionHeader({ isInView }: { isInView: boolean }) {
  return (
    <div
      className="text-center mb-16 opacity-0"
      style={isInView ? { animation: 'featFadeUp 0.65s cubic-bezier(0.22,1,0.36,1) 50ms forwards' } : {}}
    >
      <div
        className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-5"
        style={{
          background: 'rgba(15,61,46,0.05)',
          border: '0.5px solid rgba(15,61,46,0.12)',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-[#0f3d2e]">
          Premium quality promise
        </span>
      </div>
 
      <h2
        className="text-[clamp(2rem,4.5vw,3.2rem)] leading-[1.1] text-[#0f3d2e] mb-4"
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontWeight: 900,
          letterSpacing: '-0.02em',
        }}
      >
        Why choose{' '}
        <span className="relative inline-block">
          Oroganix
          <svg
            className="absolute left-0 w-full"
            style={{ bottom: -5 }}
            viewBox="0 0 320 10"
            height="10"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M2,7 Q80,2 160,7 Q240,12 318,5"
              stroke="#f59e0b"
              strokeWidth="3"
              strokeLinecap="round"
              style={{
                strokeDasharray: 340,
                strokeDashoffset: 0,
                animation: 'drawLine 1s ease-out 0.6s both',
              }}
            />
          </svg>
        </span>
      </h2>
 
      <p className="text-[15px] text-gray-500 max-w-[520px] mx-auto leading-relaxed mt-4">
        We bring you the finest Ayurvedic and traditional Indian products —
        with unmatched quality and care.
      </p>
    </div>
  )
}
 
/* ─────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────── */
export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' })
  const { companydata, settings } = useAuth()
  const freeLimit = Number((settings||[]).find((s:any)=>s.key==='free_delivery_limit')?.value||500)

  const baseFeatures = DEFAULT_FEATURES.map((f, i) =>
    i === 0 ? { ...f, description: `On all orders above ₹${freeLimit}. Fast, tracked delivery across every corner of India.` } : f
  )

  const rawFeatures = companydata?.extra_data?.features
  const features: Feature[] = rawFeatures?.length
    ? rawFeatures.map((f: any, i: number) => ({
        ...baseFeatures[i % baseFeatures.length],
        title: f.title || baseFeatures[i % baseFeatures.length].title,
        description: f.description || baseFeatures[i % baseFeatures.length].description,
        tag: f.tag || baseFeatures[i % baseFeatures.length].tag,
        num: String(i + 1).padStart(2, '0'),
      }))
    : baseFeatures

  return (
    <section ref={sectionRef} className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <Background />

      <div className="relative max-w-7xl mx-auto">
        <SectionHeader isInView={isInView} />

        {/* grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
 
        {/* bottom decorative divider */}
        <div
          className="flex items-center justify-center gap-3 mt-14 opacity-0"
          style={isInView ? { animation: 'featFadeUp 0.6s 0.7s forwards' } : {}}
        >
          <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#0f3d2e30]" />
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#0f3d2e30]" />
        </div>
      </div>
 
      <style jsx global>{`
        @keyframes featFadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes drawLine {
          from { stroke-dashoffset: 340; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>
    </section>
  )
}
 
export default FeaturesSection