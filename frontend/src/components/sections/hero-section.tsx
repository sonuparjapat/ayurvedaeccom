'use client'
 
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  Play,
  CheckCircle,
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
import { useRef, useState, useEffect } from 'react'
 
/* ─────────────────────────────────────────────
   DATA  (unchanged — backend stays intact)
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
 
/* ─────────────────────────────────────────────
   HOOKS
───────────────────────────────────────────── */
function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
 
  useEffect(() => {
    if (hasAnimated) return
    setHasAnimated(true)
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
  }, [value, hasAnimated])
 
  return (
    <>
      {value >= 1000
        ? Math.floor(count).toLocaleString()
        : value < 10
        ? count.toFixed(1)
        : Math.floor(count)}
      {suffix}
    </>
  )
}
 
/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */
 
/** Thin horizontal marquee strip */
const MarqueeStrip = () => {
  const items = [
    "100% Certified Organic", "Lab-Tested Purity", "Farm to Doorstep",
    "No Preservatives", "Ayurvedic Heritage", "10,000+ Happy Customers",
    "Chemical-Free Promise", "Direct from Indian Farms",
  ]
  const repeated = [...items, ...items]
 
  return (
    <div className="absolute top-0 left-0 right-0 h-9 bg-[#0f3d2e] overflow-hidden flex items-center ">
      <motion.div
        className="flex gap-10 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        {repeated.map((item, i) => (
          <span key={i} className="text-xs font-semibold tracking-[0.15em] uppercase text-emerald-200/80 flex items-center gap-3">
            <span className="text-amber-400">✦</span>
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
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    {[220, 290, 360].map((r, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full border border-dashed"
        style={{
          width: r * 2,
          height: r * 2,
          borderColor: i === 1 ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.15)",
        }}
        animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
        transition={{ duration: 40 + i * 10, repeat: Infinity, ease: "linear" }}
      />
    ))}
  </div>
)
 
/** Single floating product pill */
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
      className="absolute"
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
      whileHover={{ scale: 1.08 }}
    >
      {/* glow */}
      <motion.div
        className={`absolute -inset-2 rounded-2xl bg-gradient-to-r ${product.color} blur-xl`}
        animate={{ opacity: hovered ? 0.55 : 0 }}
        transition={{ duration: 0.3 }}
      />
      <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-xl border border-white/70 flex items-center gap-3 min-w-[170px]">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${product.color} flex items-center justify-center shadow-md shrink-0`}>
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
 
/** Central hero orb */
const HeroOrb = () => (
  <motion.div
    className="relative w-64 h-64 lg:w-80 lg:h-80"
    animate={{ y: [0, -14, 0] }}
    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
  >
    {/* outer glow */}
    <motion.div
      className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/40 to-amber-300/30 blur-3xl"
      animate={{ scale: [1, 1.15, 1] }}
      transition={{ duration: 4, repeat: Infinity }}
    />
    {/* main circle */}
    <div className="relative w-full h-full rounded-full bg-gradient-to-br from-[#e8f5e9] to-[#fffde7] shadow-[0_30px_80px_rgba(16,185,129,0.25)] flex items-center justify-center overflow-hidden border border-white/80">
      {/* rotating shine */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "conic-gradient(from 0deg, transparent 60%, rgba(255,255,255,0.35) 70%, transparent 80%)"
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />
      <div className="relative z-0 text-center">
        <motion.div
          className="w-28 h-28 lg:w-36 lg:h-36 rounded-full bg-gradient-to-br from-[#0f3d2e] to-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-2xl"
          animate={{ rotate: [0, 4, -4, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          <span className="text-[3.5rem] lg:text-[4.5rem]">🌿</span>
        </motion.div>
        <p className="font-bold text-gray-800 text-lg leading-tight">Premium Quality</p>
        <p className="text-xs text-emerald-700 font-semibold tracking-widest uppercase mt-0.5">100% Organic</p>
      </div>
    </div>
 
    {/* orbit dots */}
    {[0, 90, 180, 270].map((deg, i) => (
      <motion.div
        key={i}
        className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
        style={{
          background: i % 2 === 0 ? "#10b981" : "#f59e0b",
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
 
/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export function HeroSection() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isLoaded, setIsLoaded] = useState(false)
 
  useEffect(() => {
    setIsLoaded(true)
    const handler = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      })
    }
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])
 
  return (
<section className="relative min-h-screen overflow-hidden bg-[#fafaf7] font-sans z-0">
      {/* ── Marquee ticker ── */}
      <MarqueeStrip />
 
      {/* ── Background layers ── */}
      <BlobDecoration />
 
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />
 
      {/* Soft mesh blobs */}
      <motion.div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-emerald-200/30 blur-[120px] pointer-events-none"
        animate={{ x: mousePosition.x * 25, y: mousePosition.y * 25 }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      />
      <motion.div
        className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full bg-amber-200/30 blur-[100px] pointer-events-none"
        animate={{ x: mousePosition.x * -18, y: mousePosition.y * -18 }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      />
 
      {/* Fine grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(16,185,129,0.04) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
 
      {/* ── Main content ── */}
      <div className="relative container mx-auto px-6 lg:px-12 pt-28 pb-16 min-h-screen flex items-center">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-10 xl:gap-20 items-center w-full">
 
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
              className="mb-7"
            >
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#0f3d2e]/8 border border-[#0f3d2e]/15 text-[#0f3d2e] text-xs font-bold tracking-[0.18em] uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Authentic Ayurvedic Products
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              </span>
            </motion.div>
 
            {/* ── Headline ── */}
            <div className="mb-7 overflow-hidden">
              <motion.h1
                className="text-[3.2rem] sm:text-[3.8rem] lg:text-[4.6rem] xl:text-[5.2rem] leading-[1.02] font-black tracking-tight"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="block text-[#0f3d2e]">Discover the</span>
                <span className="block relative">
                  <span className="relative bg-gradient-to-r from-emerald-600 via-[#0f9d58] to-teal-600 bg-clip-text text-transparent">
                    Ancient Wisdom
                  </span>
                  {/* hand-drawn underline */}
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
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
              className="text-gray-500 text-base lg:text-lg leading-relaxed max-w-lg mb-9"
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
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10 w-full max-w-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              {benefits.map((b, i) => (
                <motion.div
                  key={b.text}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.85 + i * 0.1 }}
                  whileHover={{ x: 5, backgroundColor: "rgba(255,255,255,0.95)" }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/70 backdrop-blur-sm border border-white shadow-sm cursor-default transition-colors duration-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0f3d2e] to-emerald-600 flex items-center justify-center shadow shrink-0">
                    <b.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{b.text}</span>
                </motion.div>
              ))}
            </motion.div>
 
            {/* ── CTAs ── */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 mb-12"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.5 }}
            >
              {/* Primary */}
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0f3d2e] to-emerald-500 rounded-xl blur opacity-50 group-hover:opacity-80 transition-opacity duration-300" />
                <Button
                  size="lg"
                  className="relative px-9 py-6 text-base font-bold bg-[#0f3d2e] hover:bg-emerald-800 text-white rounded-xl shadow-xl overflow-hidden"
                  asChild
                >
                  <Link href="/products">
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-[-20deg]"
                      initial={{ x: "-120%" }}
                      whileHover={{ x: "120%" }}
                      transition={{ duration: 0.55 }}
                    />
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
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-6 text-base font-semibold border-2 border-[#0f3d2e]/25 text-[#0f3d2e] hover:bg-[#0f3d2e]/5 rounded-xl bg-white/60 backdrop-blur-sm shadow-sm"
                  asChild
                >
                  <Link href="/about" className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
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
              className="flex flex-wrap justify-center lg:justify-start gap-8 lg:gap-14"
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
                  className="text-center lg:text-left"
                >
                  <div className="flex items-center gap-2 justify-center lg:justify-start mb-0.5">
                    <s.icon className="w-4 h-4 text-emerald-500" />
                    <span
                      className="text-3xl lg:text-4xl font-black text-[#0f3d2e]"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                      {isLoaded && <AnimatedCounter value={s.value} suffix={s.suffix} />}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase">{s.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
 
          {/* ════ RIGHT COLUMN ════ */}
          <motion.div
            className="relative flex items-center justify-center h-[520px] lg:h-[640px]"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <OrbitRings />
 
            {/* parallax container */}
            <motion.div
              className="relative"
              style={{
                x: useTransform(() => mousePosition.x * -18),
                y: useTransform(() => mousePosition.y * -14),
              }}
            >
              <HeroOrb />
            </motion.div>
 
            {/* ── Floating product pills ── */}
            <ProductPill product={floatingProducts[0]} style={{ top: "6%",  left: "-4%" }} />
            <ProductPill product={floatingProducts[1]} style={{ top: "10%", right: "-6%" }} />
            <ProductPill product={floatingProducts[2]} style={{ bottom: "22%", left: "-6%" }} />
            <ProductPill product={floatingProducts[3]} style={{ bottom: "8%",  right: "-4%" }} />
 
            {/* ── Bestseller badge ── */}
            <motion.div
              className="absolute top-[16%] right-[6%]"
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
                  className="absolute -inset-1 rounded-full bg-gradient-to-r from-red-500 to-orange-400 blur-md opacity-60"
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <div className="relative flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-400 text-white text-xs font-bold px-4 py-2 mt-8 rounded-full shadow-xl">
                  <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                    🔥
                  </motion.span>
                  Bestsellers
                </div>
              </div>
            </motion.div>
 
            {/* ── Verified badge ── */}
            <motion.div
              className="absolute bottom-[30%] right-[2%]"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1, rotate: [0, 3, -3, 0] }}
              transition={{
                opacity: { delay: 1.1, duration: 0.4 },
                scale: { delay: 1.1, type: "spring" },
                rotate: { duration: 4, repeat: Infinity, delay: 1.5 },
              }}
            >
              <div className="flex items-center gap-2 bg-white/95 backdrop-blur rounded-full px-4 py-2 shadow-xl border border-white/60">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-emerald-700" />
                </div>
                <span className="text-xs font-bold text-gray-800">100% Verified</span>
              </div>
            </motion.div>
 
            {/* ── Lab-Tested badge ── */}
            <motion.div
              className="absolute top-[38%] left-[0%]"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0, y: [0, -5, 0] }}
              transition={{
                opacity: { delay: 1.3, duration: 0.4 },
                x: { delay: 1.3, duration: 0.4 },
                y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 },
              }}
            >
              <div className="flex items-center gap-2 bg-[#0f3d2e]/90 backdrop-blur rounded-full px-4 py-2 shadow-xl">
                <span className="text-sm">🧪</span>
                <span className="text-xs font-bold text-emerald-100">Lab Tested</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
 
      {/* ── Trust bar ── */}
      <motion.div
        className="relative z-0 border-t border-[#0f3d2e]/10 bg-white/60 backdrop-blur-md py-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.5 }}
      >
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-wrap items-center justify-center lg:justify-between gap-6 lg:gap-4">
            {[
              { icon: "🌿", label: "USDA Organic Certified" },
              { icon: "🧪", label: "Lab Tested & Verified" },
              { icon: "🚚", label: "Free Delivery Over ₹999" },
              { icon: "↩️",  label: "Easy 7-Day Returns"  },
              { icon: "🔒", label: "Secure Payments"      },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-2.5 text-gray-600">
                <span className="text-lg">{t.icon}</span>
                <span className="text-xs font-bold tracking-wide uppercase">{t.label}</span>
                {i < 4 && <span className="hidden lg:block w-px h-4 bg-gray-200 ml-2" />}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
 
      {/* ── Bottom wave ── */}
      <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none">
        <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="w-full h-full">
          <motion.path
            d="M0,30 C300,60 600,0 900,30 C1050,45 1150,15 1200,30 L1200,60 L0,60Z"
            fill="rgba(255,255,255,0.7)"
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