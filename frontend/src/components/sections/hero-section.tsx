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
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect } from 'react'
 
/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const benefits = [
  { text: "100% Natural & Organic", icon: Leaf },
  { text: "Traditional Ayurvedic Recipes", icon: Heart },
  { text: "Sourced Directly from Farms", icon: Shield },
  { text: "No Preservatives or Additives", icon: Sparkles },
]
 
const floatingProducts = [
  { emoji: "🌿", name: "Ayurvedic Herbs",    iconBg: "linear-gradient(135deg,#34d399,#10b981)", pos: "top-[5%] left-[-2%]",   anim: "pill-float-1" },
  { emoji: "🥜", name: "Premium Dry Fruits", iconBg: "linear-gradient(135deg,#fbbf24,#f97316)", pos: "top-[8%] right-[-4%]",  anim: "pill-float-2" },
  { emoji: "🌱", name: "Organic Seeds",      iconBg: "linear-gradient(135deg,#a3e635,#34d399)", pos: "bottom-[20%] left-[-4%]",anim: "pill-float-1" },
  { emoji: "🍃", name: "Fresh Tofu",         iconBg: "linear-gradient(135deg,#2dd4bf,#06b6d4)", pos: "bottom-[6%] right-[-2%]",anim: "pill-float-2" },
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
  { icon: "↩️", label: "Easy 7-Day Returns" },
  { icon: "🔒", label: "Secure Payments" },
]
 
const marqueeItems = [
  "100% Certified Organic", "Lab-Tested Purity", "Farm to Doorstep",
  "No Preservatives", "Ayurvedic Heritage", "10,000+ Happy Customers",
  "Chemical-Free Promise", "Direct from Indian Farms",
]
 
/* ─────────────────────────────────────────────
   CSS KEYFRAMES — injected once, GPU-composited
───────────────────────────────────────────── */
const GLOBAL_STYLES = `
  @keyframes marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  @keyframes orb-float {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-14px); }
  }
  @keyframes orb-wobble {
    0%,100% { transform: rotate(0deg); }
    30%     { transform: rotate(3deg); }
    70%     { transform: rotate(-3deg); }
  }
  @keyframes orb-shine {
    to { transform: rotate(360deg); }
  }
  @keyframes ring-cw  { to { transform: rotate(360deg); } }
  @keyframes ring-ccw { to { transform: rotate(-360deg); } }
  @keyframes pill-float-1 {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-8px); }
  }
  @keyframes pill-float-2 {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-10px); }
  }
  @keyframes badge-bob {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-6px); }
  }
  @keyframes badge-rock {
    0%,100% { transform: rotate(0deg); }
    30%     { transform: rotate(3deg); }
    70%     { transform: rotate(-3deg); }
  }
  @keyframes flame-pulse {
    0%,100% { transform: scale(1); }
    50%      { transform: scale(1.2); }
  }
  @keyframes blob-move-1 {
    0%,100% { transform: translate(0,0); }
    50%      { transform: translate(18px,-22px); }
  }
  @keyframes blob-move-2 {
    0%,100% { transform: translate(0,0); }
    50%      { transform: translate(-14px,18px); }
  }
  @keyframes glow-pulse {
    0%,100% { opacity: 0.22; transform: scale(1); }
    50%      { opacity: 0.3;  transform: scale(1.08); }
  }
  @keyframes wave {
    0%,100% { d: path("M0,30 C300,60 600,0 900,30 C1050,45 1150,15 1200,30 L1200,60 L0,60Z"); }
    50%      { d: path("M0,30 C300,0 600,60 900,30 C1050,15 1150,45 1200,30 L1200,60 L0,60Z"); }
  }
  .marquee-track   { animation: marquee 28s linear infinite; }
  .orb-wrap        { animation: orb-float 5s ease-in-out infinite; }
  .orb-inner-icon  { animation: orb-wobble 5s ease-in-out infinite; }
  .orb-shine-ring  { animation: orb-shine 6s linear infinite; }
  .ring-cw         { animation: ring-cw  var(--dur) linear infinite; }
  .ring-ccw        { animation: ring-ccw var(--dur) linear infinite; }
  .pill-float-1    { animation: pill-float-1 4s ease-in-out infinite; }
  .pill-float-2    { animation: pill-float-2 4.5s ease-in-out infinite; }
  .badge-bob       { animation: badge-bob 2.8s ease-in-out infinite; }
  .badge-rock      { animation: badge-rock 4s ease-in-out infinite; }
  .blob-1          { animation: blob-move-1 9s ease-in-out infinite; }
  .blob-2          { animation: blob-move-2 11s ease-in-out infinite; }
  .glow-pulse      { animation: glow-pulse 4s ease-in-out infinite; }
  .wave-path       { animation: wave 9s ease-in-out infinite; }
`
 
/* ─────────────────────────────────────────────
   ANIMATED COUNTER — only runs once on mount
───────────────────────────────────────────── */
function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0)
 
  useEffect(() => {
    let startTime: number
    const duration = 2000
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setCount(value * easeOut)
      if (progress < 1) requestAnimationFrame(animate)
    }
    const id = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(id)
  }, [value])
 
  const display =
    value >= 1000 ? Math.floor(count).toLocaleString()
    : value < 10  ? count.toFixed(1)
    : Math.floor(count)
 
  return <>{display}{suffix}</>
}
 
/* ─────────────────────────────────────────────
   MARQUEE STRIP — CSS-only scroll
───────────────────────────────────────────── */
function MarqueeStrip() {
  const doubled = [...marqueeItems, ...marqueeItems]
  return (
    <div className="absolute top-0 left-0 right-0 h-9 bg-[#0f3d2e] overflow-hidden flex items-center z-10">
      <div className="marquee-track flex gap-10 whitespace-nowrap">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="text-xs font-semibold tracking-[0.15em] uppercase text-emerald-200/80 flex items-center gap-3"
          >
            <span className="text-amber-400">✦</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
 
/* ─────────────────────────────────────────────
   ORBIT RINGS — CSS transforms only
───────────────────────────────────────────── */
function OrbitRings() {
  const rings = [
    { size: 440, color: "rgba(16,185,129,0.15)", dur: "50s", dir: "cw"  },
    { size: 360, color: "rgba(245,158,11,0.2)",  dur: "36s", dir: "ccw" },
    { size: 280, color: "rgba(16,185,129,0.13)", dur: "60s", dir: "cw"  },
  ]
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {rings.map((r, i) => (
        <div
          key={i}
          className={`absolute rounded-full border border-dashed ring-${r.dir}`}
          style={{
            width: r.size,
            height: r.size,
            borderColor: r.color,
            ["--dur" as string]: r.dur,
          }}
        />
      ))}
    </div>
  )
}
 
/* ─────────────────────────────────────────────
   HERO ORB — CSS animations, zero JS motion
───────────────────────────────────────────── */
function HeroOrb() {
  return (
    <div className="orb-wrap relative w-64 h-64 lg:w-80 lg:h-80">
      {/* ambient glow — CSS pulse */}
      <div
        className="glow-pulse absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(16,185,129,0.35) 0%, rgba(245,158,11,0.2) 70%, transparent 100%)",
          filter: "blur(32px)",
        }}
      />
 
      {/* main sphere */}
      <div className="relative w-full h-full rounded-full bg-gradient-to-br from-[#e8f5e9] to-[#fffde7] shadow-[0_30px_80px_rgba(16,185,129,0.22)] flex items-center justify-center overflow-hidden border border-white/80">
        {/* rotating shine arc */}
        <div
          className="orb-shine-ring absolute inset-0 rounded-full"
          style={{
            background: "conic-gradient(from 0deg, transparent 60%, rgba(255,255,255,0.3) 70%, transparent 80%)",
          }}
        />
        <div className="relative z-10 text-center">
          <div className="orb-inner-icon w-28 h-28 lg:w-36 lg:h-36 rounded-full bg-gradient-to-br from-[#0f3d2e] to-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-2xl">
            <span className="text-[3.5rem] lg:text-[4.5rem]">🌿</span>
          </div>
          <p className="font-bold text-gray-800 text-lg leading-tight">Premium Quality</p>
          <p className="text-xs text-emerald-700 font-semibold tracking-widest uppercase mt-0.5">100% Organic</p>
        </div>
      </div>
 
      {/* orbit dots — pure CSS rotate */}
      {[
        { color: "#10b981", dur: "10s", radius: 154 },
        { color: "#f59e0b", dur: "13s", radius: 134 },
        { color: "#10b981", dur: "16s", radius: 154 },
        { color: "#f59e0b", dur: "19s", radius: 134 },
      ].map((d, i) => (
        <div
          key={i}
          className="ring-cw absolute"
          style={{
            top: "50%", left: "50%",
            width: 12, height: 12,
            marginTop: -6, marginLeft: -6,
            transformOrigin: `6px ${d.radius + 6}px`,
            ["--dur" as string]: d.dur,
          }}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: d.color }}
          />
        </div>
      ))}
    </div>
  )
}
 
/* ─────────────────────────────────────────────
   PRODUCT PILL — CSS float, Framer only for hover
───────────────────────────────────────────── */
function ProductPill({ emoji, name, iconBg, pos, anim }: typeof floatingProducts[0]) {
  return (
    <motion.div
      className={`absolute ${pos} ${anim} z-20`}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      whileHover={{ scale: 1.07 }}
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl border border-white/70 flex items-center gap-3 min-w-[162px]">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md shrink-0"
          style={{ background: iconBg }}
        >
          <span className="text-xl">{emoji}</span>
        </div>
        <div>
          <p className="text-[13px] font-bold text-gray-800 leading-tight">{name}</p>
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
 
/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false)
 
  useEffect(() => { setIsLoaded(true) }, [])
 
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#fafaf7] font-sans z-0">
      {/* inject CSS keyframes once */}
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />
 
      {/* ── Marquee ── */}
      <MarqueeStrip />
 
      {/* ── Background blob decoration — static SVG, no animation ── */}
      <svg
        className="absolute right-[-10%] top-[-5%] w-[70vw] max-w-[800px] opacity-[0.06] pointer-events-none select-none"
        viewBox="0 0 800 800"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M400,80 C550,60 720,160 740,300 C760,440 680,580 560,640 C440,700 260,680 160,580 C60,480 40,300 120,180 C200,60 250,100 400,80Z"
          fill="#10b981"
        />
      </svg>
 
      {/* ── Ambient blobs — CSS only, no mouse tracking ── */}
      <div
        className="blob-1 absolute -top-40 -left-40 w-[560px] h-[560px] rounded-full pointer-events-none"
        style={{ background: "rgba(167,243,208,0.28)", filter: "blur(100px)" }}
      />
      <div
        className="blob-2 absolute -bottom-40 -right-20 w-[480px] h-[480px] rounded-full pointer-events-none"
        style={{ background: "rgba(253,230,138,0.28)", filter: "blur(90px)" }}
      />
 
      {/* ── Fine grid ── */}
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
 
          {/* ════ LEFT COLUMN — Framer only for mount transitions ════ */}
          <motion.div
            className="relative z-0 flex flex-col items-center lg:items-start text-center lg:text-left"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="mb-7"
            >
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#0f3d2e]/[0.08] border border-[#0f3d2e]/[0.15] text-[#0f3d2e] text-xs font-bold tracking-[0.18em] uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Authentic Ayurvedic Products
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              </span>
            </motion.div>
 
            {/* Headline */}
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
                  {/* underline drawn once — no repeat loop */}
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
 
            {/* Description */}
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
 
            {/* Benefits */}
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
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/70 backdrop-blur-sm border border-white shadow-sm cursor-default"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0f3d2e] to-emerald-600 flex items-center justify-center shadow shrink-0">
                    <b.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{b.text}</span>
                </motion.div>
              ))}
            </motion.div>
 
            {/* CTAs */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 mb-12"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.5 }}
            >
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0f3d2e] to-emerald-500 rounded-xl blur opacity-50 group-hover:opacity-80 transition-opacity duration-300" />
                <Button
                  size="lg"
                  className="relative px-9 py-6 text-base font-bold bg-[#0f3d2e] hover:bg-emerald-800 text-white rounded-xl shadow-xl overflow-hidden"
                  asChild
                >
                  <Link href="/products">
                    <span className="relative flex items-center gap-2">
                      Shop Now
                      {/* Arrow nudge — CSS transition only */}
                      <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </Link>
                </Button>
              </motion.div>
 
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
 
            {/* Stats */}
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
 
          {/* ════ RIGHT COLUMN — all CSS animations ════ */}
          <motion.div
            className="relative flex items-center justify-center h-[520px] lg:h-[640px]"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <OrbitRings />
 
            {/* Orb — no parallax, no JS-tracked mouse */}
            <HeroOrb />
 
            {/* Product pills */}
            {floatingProducts.map((p) => (
              <ProductPill key={p.name} {...p} />
            ))}
 
            {/* Bestseller badge */}
            <motion.div
              className="badge-bob absolute top-[14%] right-[5%] z-20"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, type: "spring", bounce: 0.5 }}
            >
              <div className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-400 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl">
                <span style={{ display: "inline-block", animation: "flame-pulse 1s ease-in-out infinite" }}>🔥</span>
                Bestsellers
              </div>
            </motion.div>
 
            {/* Verified badge */}
            <motion.div
              className="badge-rock absolute bottom-[28%] right-[1%] z-20"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1, type: "spring" }}
            >
              <div className="flex items-center gap-2 bg-white/95 backdrop-blur rounded-full px-4 py-2 shadow-xl border border-white/60">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-emerald-700" />
                </div>
                <span className="text-xs font-bold text-gray-800">100% Verified</span>
              </div>
            </motion.div>
 
            {/* Lab-Tested badge */}
            <motion.div
              className="pill-float-1 absolute top-[37%] left-[0%] z-20"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.3, duration: 0.4 }}
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
        className="relative z-10 border-t border-[#0f3d2e]/10 bg-white/60 backdrop-blur-md py-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.5 }}
      >
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-wrap items-center justify-center lg:justify-between gap-6 lg:gap-4">
            {trustItems.map((t, i) => (
              <div key={i} className="flex items-center gap-2.5 text-gray-600">
                <span className="text-lg">{t.icon}</span>
                <span className="text-xs font-bold tracking-wide uppercase">{t.label}</span>
                {i < 4 && <span className="hidden lg:block w-px h-4 bg-gray-200 ml-2" />}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
 
      {/* ── Bottom wave — CSS animation ── */}
      <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none">
        <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="w-full h-full">
          <path
            className="wave-path"
            d="M0,30 C300,60 600,0 900,30 C1050,45 1150,15 1200,30 L1200,60 L0,60Z"
            fill="rgba(255,255,255,0.7)"
          />
        </svg>
      </div>
    </section>
  )
}