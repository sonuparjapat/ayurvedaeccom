'use client'

import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Play,
  Sparkles,
  Star,
  Leaf,
  Heart,
  Shield,
  TrendingUp,
  ChevronRight
} from 'lucide-react'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRef, useState, useEffect, useCallback } from 'react'

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const benefits = [
  { text: "100% Natural & Organic", icon: Leaf },
  { text: "Traditional Ayurvedic Recipes", icon: Heart },
  { text: "Sourced Directly from Farms", icon: Shield },
  { text: "No Preservatives or Additives", icon: Sparkles }
]

const floatingProducts = [
  { emoji: "🌿", name: "Ayurvedic Herbs",  color: "from-emerald-400 to-green-500",  delay: 0   },
  { emoji: "🥜", name: "Premium Dry Fruits", color: "from-amber-400 to-orange-500", delay: 0.2 },
  { emoji: "🌱", name: "Organic Seeds",    color: "from-lime-400 to-emerald-500",   delay: 0.4 },
  { emoji: "🍃", name: "Fresh Tofu",       color: "from-teal-400 to-cyan-500",      delay: 0.6 },
]

const stats = [
  { value: 10000, suffix: "+", label: "Happy Customers", icon: Heart },
  { value: 50,    suffix: "+", label: "Premium Products", icon: Star },
  { value: 4.8,   suffix: "★", label: "Customer Rating",  icon: TrendingUp },
]

const trustItems = [
  { icon: "🌿", label: "USDA Organic Certified" },
  { icon: "🧪", label: "Lab Tested & Verified" },
  { icon: "🚚", label: "Free Delivery Over ₹999" },
  { icon: "↩️",  label: "Easy 7-Day Returns"  },
  { icon: "🔒", label: "Secure Payments"      },
]

/* ─────────────────────────────────────────────
   HOOKS
───────────────────────────────────────────── */
function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const hasAnimated = useRef(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (hasAnimated.current) return
    hasAnimated.current = true
    let startTime: number
    const duration = 2000
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setCount(value * easeOut)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value])

  return (
    <span ref={ref}>
      {value >= 1000
        ? Math.floor(count).toLocaleString()
        : value < 10
        ? count.toFixed(1)
        : Math.floor(count)}
      {suffix}
    </span>
  )
}

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */

/** Glossy shine overlay used on cards */
const GlossyShine = ({ className = "" }: { className?: string }) => (
  <div
    className={`absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit] ${className}`}
  >
    <div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(
          135deg,
          rgba(255,255,255,0.45) 0%,
          rgba(255,255,255,0.12) 30%,
          transparent 50%,
          transparent 100%
        )`,
      }}
    />
    <div
      className="absolute top-0 left-0 right-0 h-[2px]"
      style={{
        background: `linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.7) 50%, transparent 90%)`,
      }}
    />
  </div>
)

/** Animated shine sweep for buttons */
const ShineSweep = () => (
  <motion.span
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] rounded-[inherit]"
    initial={{ x: "-120%" }}
    whileHover={{ x: "120%" }}
    transition={{ duration: 0.6, ease: "easeInOut" }}
  />
)

/** Thin horizontal marquee strip */
const MarqueeStrip = () => {
  const items = [
    "100% Certified Organic", "Lab-Tested Purity", "Farm to Doorstep",
    "No Preservatives", "Ayurvedic Heritage", "10,000+ Happy Customers",
    "Chemical-Free Promise", "Direct from Indian Farms",
  ]
  const repeated = [...items, ...items]

  return (
    <div className="absolute top-0 left-0 right-0 h-8 sm:h-9 bg-gradient-to-r from-[#0a2e22] via-[#0f3d2e] to-[#0a2e22] overflow-hidden flex items-center z-20">
      {/* glossy top edge */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
      <motion.div
        className="flex gap-8 sm:gap-10 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        {repeated.map((item, i) => (
          <span key={i} className="text-[10px] sm:text-xs font-semibold tracking-[0.15em] uppercase text-emerald-200/80 flex items-center gap-2 sm:gap-3">
            <span className="text-amber-400 text-[8px] sm:text-xs">✦</span>
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  )
}

/** Large organic blob SVG decoration */
const BlobDecoration = () => (
  <svg
    className="absolute right-[-10%] top-[-5%] w-[70vw] max-w-[800px] opacity-[0.06] pointer-events-none select-none"
    viewBox="0 0 800 800"
    xmlns="http://www.w3.org/2000/svg"
  >
    <motion.path
      d="M400,80 C550,60 720,160 740,300 C760,440 680,580 560,640 C440,700 260,680 160,580 C60,480 40,300 120,180 C200,60 250,100 400,80Z"
      fill="#10b981"
      animate={{
        d: [
          "M400,80 C550,60 720,160 740,300 C760,440 680,580 560,640 C440,700 260,680 160,580 C60,480 40,300 120,180 C200,60 250,100 400,80Z",
          "M420,100 C560,50 730,170 720,320 C710,470 640,600 520,650 C400,700 240,670 150,560 C60,450 70,280 160,170 C250,60 280,150 420,100Z",
          "M400,80 C550,60 720,160 740,300 C760,440 680,580 560,640 C440,700 260,680 160,580 C60,480 40,300 120,180 C200,60 250,100 400,80Z"
        ]
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
    />
  </svg>
)

/** Orbiting dot rings */
const OrbitRings = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none hidden md:flex">
    {[220, 290, 360].map((r, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full border border-dashed"
        style={{
          width: r * 2,
          height: r * 2,
          borderColor: i === 1 ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.12)",
        }}
        animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
        transition={{ duration: 40 + i * 10, repeat: Infinity, ease: "linear" }}
      />
    ))}
  </div>
)

/** Single floating product pill — hidden on small screens */
const ProductPill = ({
  product,
  style,
}: {
  product: typeof floatingProducts[0]
  style: React.CSSProperties
}) => {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      className="absolute hidden lg:block"
      style={style}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
      transition={{
        opacity: { duration: 0.5, delay: product.delay + 0.8 },
        scale:   { duration: 0.5, delay: product.delay + 0.8 },
        y: { duration: 3.5 + product.delay, repeat: Infinity, ease: "easeInOut", delay: product.delay },
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: 1.1 }}
    >
      {/* glow */}
      <motion.div
        className={`absolute -inset-3 rounded-3xl bg-gradient-to-r ${product.color} blur-2xl`}
        animate={{ opacity: hovered ? 0.6 : 0 }}
        transition={{ duration: 0.3 }}
      />
      <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/80 flex items-center gap-3 min-w-[170px]">
        <GlossyShine className="rounded-2xl" />
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${product.color} flex items-center justify-center shadow-[0_4px_16px_rgba(16,185,129,0.3)] shrink-0`}>
          <span className="text-xl">{product.emoji}</span>
        </div>
        <div>
          <p className="text-[13px] font-bold text-gray-800 leading-tight">{product.name}</p>
          <div className="flex gap-px mt-0.5">
            {[...Array(5)].map((_, k) => (
              <Star key={k} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/** Central hero orb with glossy enhancements */
const HeroOrb = () => (
  <motion.div
    className="relative w-52 h-52 sm:w-60 sm:h-60 lg:w-80 lg:h-80"
    animate={{ y: [0, -14, 0] }}
    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
  >
    {/* outer glow — stronger, more diffused */}
    <motion.div
      className="absolute inset-[-20%] rounded-full bg-gradient-to-br from-emerald-400/30 via-teal-300/20 to-amber-300/25 blur-[60px]"
      animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.9, 0.6] }}
      transition={{ duration: 4, repeat: Infinity }}
    />
    {/* secondary glow ring */}
    <motion.div
      className="absolute inset-[-8%] rounded-full bg-gradient-to-tr from-emerald-300/20 to-transparent blur-[40px]"
      animate={{ rotate: [0, 180, 360] }}
      transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
    />

    {/* main circle with glossy glass effect */}
    <div className="relative w-full h-full rounded-full bg-gradient-to-br from-[#e8f5e9] via-[#f1f8e9] to-[#fffde7] shadow-[0_30px_80px_rgba(16,185,129,0.25),inset_0_1px_2px_rgba(255,255,255,0.9),inset_0_-1px_3px_rgba(0,0,0,0.05)] flex items-center justify-center overflow-hidden border border-white/90">
      {/* glossy top highlight arc */}
      <div
        className="absolute top-0 left-[10%] right-[10%] h-[45%] rounded-full pointer-events-none"
        style={{
          background: `linear-gradient(
            180deg,
            rgba(255,255,255,0.7) 0%,
            rgba(255,255,255,0.2) 60%,
            transparent 100%
          )`,
        }}
      />

      {/* rotating shine */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "conic-gradient(from 0deg, transparent 55%, rgba(255,255,255,0.5) 65%, rgba(255,255,255,0.2) 75%, transparent 85%)"
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />

      {/* inner content */}
      <div className="relative z-0 text-center">
        <motion.div
          className="w-24 h-24 sm:w-28 sm:h-28 lg:w-36 lg:h-36 rounded-full bg-gradient-to-br from-[#0f3d2e] via-emerald-700 to-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-[0_8px_32px_rgba(15,61,46,0.4),inset_0_1px_2px_rgba(255,255,255,0.15)]"
          animate={{ rotate: [0, 4, -4, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          {/* inner glossy highlight */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(ellipse at 35% 25%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
            }}
          />
          <span className="text-3xl sm:text-[3.5rem] lg:text-[4.5rem] relative z-10">🌿</span>
        </motion.div>
        <p className="font-bold text-gray-800 text-sm sm:text-base lg:text-lg leading-tight">Premium Quality</p>
        <p className="text-[10px] sm:text-xs text-emerald-700 font-semibold tracking-widest uppercase mt-0.5">100% Organic</p>
      </div>
    </div>

    {/* orbit dots */}
    {[0, 90, 180, 270].map((deg, i) => (
      <motion.div
        key={i}
        className="absolute top-1/2 left-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full hidden sm:block"
        style={{
          background: i % 2 === 0 ? "#10b981" : "#f59e0b",
          boxShadow: `0 0 8px ${i % 2 === 0 ? "rgba(16,185,129,0.5)" : "rgba(245,158,11,0.5)"}`,
          marginTop: -6,
          marginLeft: -6,
          transformOrigin: `6px ${(i % 2 === 0 ? 148 : 128) + 6}px`,
          rotate: deg,
        }}
        animate={{ rotate: [deg, deg + 360] }}
        transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "linear" }}
      />
    ))}
  </motion.div>
)

/** Glossy benefit card */
const BenefitCard = ({ b, index }: { b: typeof benefits[0]; index: number }) => (
  <motion.div
    key={b.text}
    initial={{ opacity: 0, x: -16 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.85 + index * 0.1 }}
    whileHover={{ x: 5, y: -2 }}
    whileTap={{ scale: 0.98 }}
    className="relative flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_2px_16px_rgba(0,0,0,0.04),0_1px_2px_rgba(255,255,255,0.8)_inset] cursor-default transition-colors duration-200 overflow-hidden group"
  >
    <GlossyShine className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-[#0f3d2e] to-emerald-600 flex items-center justify-center shadow-[0_4px_12px_rgba(15,61,46,0.3)] shrink-0">
      <b.icon className="w-4 h-4 text-white" />
      {/* icon glossy highlight */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/20 to-transparent" />
    </div>
    <span className="relative text-sm font-semibold text-gray-700">{b.text}</span>
  </motion.div>
)

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export function HeroSection() {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 40, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 40, damping: 20 })
  const isLoaded = useRef(false)
  const [mounted, setMounted] = useState(true)

  useEffect(() => {
    isLoaded.current = true
    const handler = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth - 0.5) * 2)
      mouseY.set((e.clientY / window.innerHeight - 0.5) * 2)
    }
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  const parallaxX = useTransform(springX, [-1, 1], [18, -18])
  const parallaxY = useTransform(springY, [-1, 1], [14, -14])

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#fafaf7] font-sans z-0">
      {/* ── Marquee ticker ── */}
      <MarqueeStrip />

      {/* ── Background layers ── */}
      <BlobDecoration />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      {/* Glossy mesh gradient blobs — multi-layered for depth */}
      <motion.div
        className="absolute -top-40 -left-40 w-[400px] sm:w-[500px] lg:w-[600px] h-[400px] sm:h-[500px] lg:h-[600px] rounded-full bg-gradient-to-br from-emerald-200/40 via-emerald-100/20 to-teal-100/30 blur-[80px] sm:blur-[100px] lg:blur-[120px] pointer-events-none"
        animate={{ x: useTransform(springX, v => v * 25), y: useTransform(springY, v => v * 25) }}
      />
      <motion.div
        className="absolute -bottom-40 -right-20 w-[350px] sm:w-[450px] lg:w-[500px] h-[350px] sm:h-[450px] lg:h-[500px] rounded-full bg-gradient-to-tl from-amber-200/40 via-yellow-100/20 to-orange-100/30 blur-[70px] sm:blur-[90px] lg:blur-[100px] pointer-events-none"
        animate={{ x: useTransform(springX, v => v * -18), y: useTransform(springY, v => v * -18) }}
      />
      {/* third layer for depth — rose tint */}
      <motion.div
        className="absolute top-1/3 right-1/4 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] rounded-full bg-gradient-to-br from-rose-100/20 to-transparent blur-[80px] sm:blur-[100px] pointer-events-none"
        animate={{ x: useTransform(springX, v => v * 12), y: useTransform(springY, v => v * 12) }}
      />

      {/* Fine grid */}
      <div
        className="absolute inset-0 pointer-events-none hidden sm:block"
        style={{
          backgroundImage: `linear-gradient(rgba(16,185,129,0.035) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(16,185,129,0.035) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Main content ── */}
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-12 pt-20 sm:pt-28 pb-12 sm:pb-16 min-h-screen flex items-center">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12 xl:gap-20 items-center w-full">

          {/* ════ LEFT COLUMN ════ */}
          <motion.div
            className="relative z-0 flex flex-col items-center lg:items-start text-center lg:text-left"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* ── Eyebrow badge ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="mb-5 sm:mb-7"
            >
              <span className="relative inline-flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-[#0f3d2e]/6 border border-[#0f3d2e]/12 text-[#0f3d2e] text-[10px] sm:text-xs font-bold tracking-[0.15em] sm:tracking-[0.18em] uppercase backdrop-blur-sm overflow-hidden">
                {/* glossy highlight */}
                <span className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
                <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                <span className="relative">Authentic Ayurvedic Products</span>
                <span className="relative w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
              </span>
            </motion.div>

            {/* ── Headline ── */}
            <div className="mb-5 sm:mb-7 overflow-hidden">
              <motion.h1
                className="text-[2.4rem] sm:text-[3.2rem] md:text-[3.8rem] lg:text-[4.6rem] xl:text-[5.2rem] leading-[1.02] font-black tracking-tight"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="block text-[#0f3d2e]">Discover the</span>
                <span className="block relative">
                  <span className="relative bg-gradient-to-r from-emerald-600 via-[#0f9d58] to-teal-600 bg-clip-text text-transparent drop-shadow-sm">
                    Ancient Wisdom
                  </span>
                  {/* hand-drawn underline */}
                  <svg
                    className="absolute -bottom-1 sm:-bottom-2 left-0 w-[80%] sm:w-full"
                    viewBox="0 0 400 12"
                    preserveAspectRatio="none"
                    height="10"
                  >
                    <motion.path
                      d="M2,8 Q100,2 200,8 Q300,14 398,6"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1, delay: 1.1 }}
                    />
                  </svg>
                </span>
                <span className="block text-[#0f3d2e]">of Ayurveda</span>
              </motion.h1>
            </div>

            {/* ── Description ── */}
            <motion.p
              className="text-gray-500 text-sm sm:text-base lg:text-lg leading-relaxed max-w-lg mb-7 sm:mb-9 px-2 lg:px-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.6 }}
            >
              Experience the healing power of nature with our premium collection of Ayurvedic herbs,
              dry fruits, dehydrated foods, and fresh tofu.{" "}
              <span className="text-[#0f3d2e] font-semibold">Sourced directly from Indian farms</span>{" "}
              and delivered to your doorstep.
            </motion.p>

            {/* ── Benefits ── */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-8 sm:mb-10 w-full max-w-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              {benefits.map((b, i) => (
                <BenefitCard key={b.text} b={b} index={i} />
              ))}
            </motion.div>

            {/* ── CTAs ── */}
            <motion.div
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-10 sm:mb-12 w-full sm:w-auto"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.5 }}
            >
              {/* Primary */}
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="relative group w-full sm:w-auto"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-[#0f3d2e] via-emerald-600 to-emerald-400 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
                <Button
                  size="lg"
                  className="relative w-full sm:w-auto px-8 sm:px-9 py-5 sm:py-6 text-base font-bold bg-gradient-to-r from-[#0f3d2e] via-[#134d38] to-[#0f3d2e] hover:from-[#0a2e22] hover:via-[#0f3d2e] hover:to-[#0a2e22] text-white rounded-xl shadow-[0_4px_20px_rgba(15,61,46,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)] overflow-hidden border border-emerald-800/50 transition-all duration-300"
                  asChild
                >
                  <Link href="/products" className="flex items-center justify-center gap-2">
                    <ShineSweep />
                    <span className="relative flex items-center gap-2">
                      Shop Now
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </motion.span>
                    </span>
                  </Link>
                </Button>
              </motion.div>

              {/* Secondary */}
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base font-semibold border-2 border-[#0f3d2e]/20 text-[#0f3d2e] hover:bg-[#0f3d2e]/5 rounded-xl bg-white/70 backdrop-blur-xl shadow-[0_2px_16px_rgba(0,0,0,0.04),inset_0_1px_2px_rgba(255,255,255,0.9)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(255,255,255,0.9)] transition-all duration-300"
                  asChild
                >
                  <Link href="/about" className="flex items-center justify-center gap-3 group">
                    <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_8px_rgba(16,185,129,0.15)]">
                      <Play className="w-3.5 h-3.5 text-[#0f3d2e] fill-[#0f3d2e]" />
                    </div>
                    Watch Our Story
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* ── Stats ── */}
            <motion.div
              className="flex flex-wrap justify-center lg:justify-start gap-6 sm:gap-8 lg:gap-14"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.5 }}
            >
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.4 + i * 0.1 }}
                  whileHover={{ scale: 1.06 }}
                  className="text-center lg:text-left px-2"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 justify-center lg:justify-start mb-0.5">
                    <s.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                    <span
                      className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0f3d2e]"
                      style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                    >
                      {mounted && <AnimatedCounter value={s.value} suffix={s.suffix} />}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs font-semibold text-gray-400 tracking-wider uppercase">{s.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* ════ RIGHT COLUMN ════ */}
          <motion.div
            className="relative flex items-center justify-center h-[380px] sm:h-[460px] lg:h-[640px]"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <OrbitRings />

            {/* parallax container */}
            <motion.div
              className="relative"
              style={{ x: parallaxX, y: parallaxY }}
            >
              <HeroOrb />
            </motion.div>

            {/* ── Floating product pills (desktop only) ── */}
            <ProductPill product={floatingProducts[0]} style={{ top: "6%",  left: "-4%" }} />
            <ProductPill product={floatingProducts[1]} style={{ top: "10%", right: "-6%" }} />
            <ProductPill product={floatingProducts[2]} style={{ bottom: "22%", left: "-6%" }} />
            <ProductPill product={floatingProducts[3]} style={{ bottom: "8%",  right: "-4%" }} />

            {/* ── Bestseller badge ── */}
            <motion.div
              className="absolute top-[12%] sm:top-[16%] right-[4%] sm:right-[6%] hidden sm:block"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
              transition={{
                opacity: { delay: 0.8, duration: 0.4 },
                scale: { delay: 0.8, type: "spring", bounce: 0.5 },
                y: { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1 },
              }}
            >
              <div className="relative">
                <motion.div
                  className="absolute -inset-2 rounded-full bg-gradient-to-r from-red-500 to-orange-400 blur-lg opacity-50"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.7, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <div className="relative flex items-center gap-2 bg-gradient-to-r from-red-500 via-red-400 to-orange-400 text-white text-xs font-bold px-4 py-2.5 mt-8 rounded-full shadow-[0_4px_20px_rgba(239,68,68,0.3)] border border-red-300/30 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                  <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }} className="relative">
                    🔥
                  </motion.span>
                  <span className="relative">Bestsellers</span>
                </div>
              </div>
            </motion.div>

            {/* ── Verified badge ── */}
            <motion.div
              className="absolute bottom-[28%] sm:bottom-[30%] right-[0%] sm:right-[2%] hidden md:block"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1, rotate: [0, 3, -3, 0] }}
              transition={{
                opacity: { delay: 1.1, duration: 0.4 },
                scale: { delay: 1.1, type: "spring" },
                rotate: { duration: 4, repeat: Infinity, delay: 1.5 },
              }}
            >
              <div className="relative flex items-center gap-2 bg-white/85 backdrop-blur-xl rounded-full px-4 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] border border-white/60 overflow-hidden">
                <GlossyShine className="rounded-full" />
                <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]">
                  <Shield className="w-3.5 h-3.5 text-emerald-700" />
                </div>
                <span className="relative text-xs font-bold text-gray-800">100% Verified</span>
              </div>
            </motion.div>

            {/* ── Lab-Tested badge ── */}
            <motion.div
              className="absolute top-[34%] sm:top-[38%] left-[0%] hidden lg:block"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0, y: [0, -5, 0] }}
              transition={{
                opacity: { delay: 1.3, duration: 0.4 },
                x: { delay: 1.3, duration: 0.4 },
                y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 },
              }}
            >
              <div className="relative flex items-center gap-2 bg-gradient-to-r from-[#0f3d2e] via-[#134d38] to-[#0f3d2e] backdrop-blur-xl rounded-full px-4 py-2.5 shadow-[0_4px_24px_rgba(15,61,46,0.3),inset_0_1px_1px_rgba(255,255,255,0.08)] border border-emerald-700/30 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                <span className="relative text-sm">🧪</span>
                <span className="relative text-xs font-bold text-emerald-100">Lab Tested</span>
              </div>
            </motion.div>

            {/* ── Mobile-only badge cluster ── */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-2 sm:hidden z-10">
              {[
                { emoji: "🔥", label: "Bestsellers", gradient: "from-red-500 to-orange-400", textColor: "text-white" },
                { emoji: "🧪", label: "Lab Tested", gradient: "from-[#0f3d2e] to-emerald-700", textColor: "text-emerald-100" },
                { emoji: "✅", label: "Verified", gradient: "from-white to-emerald-50", textColor: "text-gray-800" },
              ].map((badge, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 + i * 0.15 }}
                  className={`flex items-center gap-1.5 bg-gradient-to-r ${badge.gradient} ${badge.textColor} text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg border border-white/20`}
                >
                  <span className="text-xs">{badge.emoji}</span>
                  {badge.label}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Trust bar ── */}
      <motion.div
        className="relative z-10 bg-gradient-to-b from-white/50 to-white/70 backdrop-blur-xl border-t border-[#0f3d2e]/8 py-4 sm:py-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.5 }}
      >
        {/* glossy top line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          {/* Desktop layout */}
          <div className="hidden lg:flex items-center justify-between gap-4">
            {trustItems.map((t, i) => (
              <div key={i} className="flex items-center gap-2.5 text-gray-600 group cursor-default">
                <span className="text-lg transition-transform duration-300 group-hover:scale-110">{t.icon}</span>
                <span className="text-xs font-bold tracking-wide uppercase">{t.label}</span>
                {i < trustItems.length - 1 && <span className="w-px h-4 bg-gray-200/80 ml-2" />}
              </div>
            ))}
          </div>

          {/* Mobile/Tablet layout — horizontally scrollable */}
          <div className="flex lg:hidden items-center gap-4 sm:gap-6 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
            {trustItems.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-600 shrink-0">
                <span className="text-base sm:text-lg">{t.icon}</span>
                <span className="text-[10px] sm:text-xs font-bold tracking-wide uppercase whitespace-nowrap">{t.label}</span>
                {i < trustItems.length - 1 && (
                  <span className="w-px h-3 sm:h-4 bg-gray-200/80 ml-2 sm:ml-3" />
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Bottom wave ── */}
      <div className="absolute bottom-0 left-0 right-0 h-12 sm:h-16 pointer-events-none z-10">
        <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.9)" />
            </linearGradient>
          </defs>
          <motion.path
            d="M0,30 C300,60 600,0 900,30 C1050,45 1150,15 1200,30 L1200,60 L0,60Z"
            fill="url(#waveGrad)"
            animate={{
              d: [
                "M0,30 C300,60 600,0 900,30 C1050,45 1150,15 1200,30 L1200,60 L0,60Z",
                "M0,30 C300,0 600,60 900,30 C1050,15 1150,45 1200,30 L1200,60 L0,60Z",
                "M0,30 C300,60 600,0 900,30 C1050,45 1150,15 1200,30 L1200,60 L0,60Z",
              ]
            }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
      </div>
    </section>
  )
}