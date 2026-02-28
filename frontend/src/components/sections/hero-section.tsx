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

const benefits = [
  { text: "100% Natural & Organic", icon: Leaf },
  { text: "Traditional Ayurvedic Recipes", icon: Heart },
  { text: "Sourced Directly from Farms", icon: Shield },
  { text: "No Preservatives or Additives", icon: Sparkles }
]

const floatingProducts = [
  { emoji: "🌿", name: "Ayurvedic Herbs", color: "from-emerald-400 to-green-500", delay: 0 },
  { emoji: "🥜", name: "Premium Dry Fruits", color: "from-amber-400 to-orange-500", delay: 0.2 },
  { emoji: "🌱", name: "Organic Seeds", color: "from-lime-400 to-emerald-500", delay: 0.4 },
  { emoji: "🍃", name: "Fresh Tofu", color: "from-teal-400 to-cyan-500", delay: 0.6 },
]

const stats = [
  { value: 10000, suffix: "+", label: "Happy Customers", icon: Heart },
  { value: 50, suffix: "+", label: "Premium Products", icon: Star },
  { value: 4.8, suffix: "★", label: "Customer Rating", icon: TrendingUp },
]

// Animated counter hook
function useCounter(end: number, duration: number = 2, startAnimation: boolean = true) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    if (!startAnimation) return
    
    let startTime: number
    let animationFrame: number
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      
      // Easing function
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(easeOut * end))
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }
    
    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration, startAnimation])
  
  return count
}

// Magnetic button component
function MagneticButton({ children, className, variant, size, asChild }: {
  children: React.ReactNode
  className?: string
  variant?: string
  size?: string
  asChild?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const springConfig = { damping: 15, stiffness: 150 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) * 0.3)
    y.set((e.clientY - centerY) * 0.3)
  }
  
  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }
  
  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className="inline-block"
    >
      <Button className={className} size={size as "default" | "sm" | "lg" | "icon" | undefined} asChild>
        {children}
      </Button>
    </motion.div>
  )
}

// Floating particle component
const FloatingParticle = ({ delay = 0, duration = 20 }: { delay?: number; duration?: number }) => (
  <motion.div
    className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400/40 to-amber-400/40"
    initial={{ 
      x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
      y: typeof window !== 'undefined' ? window.innerHeight + 50 : 800,
      scale: 0,
      opacity: 0
    }}
    animate={{
      y: -100,
      scale: [0, 1, 1, 0],
      opacity: [0, 0.6, 0.6, 0],
      rotate: [0, 180, 360]
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "linear"
    }}
  />
)

// Animated text reveal
const AnimatedText = ({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) => {
  const words = text.split(' ')
  
  return (
    <motion.span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.25em]"
          initial={{ opacity: 0, y: 50, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            duration: 0.6,
            delay: delay + i * 0.1,
            ease: [0.22, 1, 0.36, 1]
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  )
}

// 3D Product Card
const ProductCard = ({ product, index }: { product: typeof floatingProducts[0]; index: number }) => {
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [15, -15]), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-15, 15]), { stiffness: 300, damping: 30 })
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top) / rect.height - 0.5)
  }
  
  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 + product.delay }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        x.set(0)
        y.set(0)
      }}
      className="absolute cursor-pointer"
    >
      {/* Glow effect */}
      <motion.div
        className={`absolute -inset-2 bg-gradient-to-r ${product.color} rounded-2xl blur-xl opacity-0`}
        animate={{ opacity: isHovered ? 0.6 : 0 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Card */}
      <motion.div
        className={`relative bg-white/90 backdrop-blur-xl rounded-xl p-4 shadow-xl border border-white/50`}
        animate={{ 
          y: [0, -10, 0],
          scale: isHovered ? 1.05 : 1
        }}
        transition={{ 
          y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: index * 0.5 },
          scale: { duration: 0.3 }
        }}
        style={{ transform: "translateZ(30px)" }}
      >
        <div className="flex items-center gap-3">
          <motion.div 
            className={`w-14 h-14 bg-gradient-to-br ${product.color} rounded-xl flex items-center justify-center shadow-lg`}
            animate={{ rotate: isHovered ? [0, -10, 10, 0] : 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-2xl">{product.emoji}</span>
          </motion.div>
          <div>
            <p className="font-bold text-gray-800">{product.name}</p>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
              ))}
            </div>
          </div>
        </div>
        
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 rounded-xl overflow-hidden"
          initial={{ x: "-100%" }}
          animate={{ x: isHovered ? "100%" : "-100%" }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]" />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

// Animated mandala background
const MandalaPattern = () => (
  <motion.div
    className="absolute right-0 top-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-[0.03]"
    animate={{ rotate: 360 }}
    transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
  >
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {[...Array(12)].map((_, i) => (
        <motion.path
          key={i}
          d="M100 10 L100 190 M10 100 L190 100"
          stroke="currentColor"
          strokeWidth="0.5"
          transform={`rotate(${i * 15} 100 100)`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
        />
      ))}
      {[...Array(6)].map((_, i) => (
        <motion.circle
          key={`circle-${i}`}
          cx="100"
          cy="100"
          r={20 + i * 15}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.2, duration: 0.5 }}
        />
      ))}
    </svg>
  </motion.div>
)

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Mouse parallax effect
  useEffect(() => {
    setIsLoaded(true)
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const x = (clientX / window.innerWidth - 0.5) * 2
      const y = (clientY / window.innerHeight - 0.5) * 2
      setMousePosition({ x, y })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <section 
      ref={sectionRef}
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-amber-50"
    >
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-300/30 to-teal-200/20 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * 30,
            y: mousePosition.y * 30,
            scale: [1, 1.1, 1],
          }}
          transition={{ scale: { duration: 8, repeat: Infinity }, x: { duration: 0.5 }, y: { duration: 0.5 } }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-gradient-to-tl from-amber-300/30 to-orange-200/20 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * -20,
            y: mousePosition.y * -20,
            scale: [1, 1.15, 1],
          }}
          transition={{ scale: { duration: 10, repeat: Infinity }, x: { duration: 0.5 }, y: { duration: 0.5 } }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-lime-200/20 to-emerald-200/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Mandala pattern */}
      <MandalaPattern />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <FloatingParticle key={i} delay={i * 2} duration={15 + Math.random() * 10} />
        ))}
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `
          linear-gradient(rgba(16, 185, 129, 0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(16, 185, 129, 0.3) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px'
      }} />

      {/* Content container */}
      <div className="relative container mx-auto px-4 py-16 lg:py-24 min-h-screen flex items-center">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full">
          
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center lg:text-left relative z-10"
          >
            {/* Premium badge */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex mb-8"
            >
              <Badge className="relative px-6 py-2 text-sm font-medium bg-gradient-to-r from-emerald-100 to-amber-100 text-emerald-800 border border-emerald-200/50 shadow-lg overflow-hidden group">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
                <Sparkles className="w-4 h-4 mr-2 inline" />
                <span className="relative">Authentic Ayurvedic Products</span>
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-amber-400/20"
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </Badge>
            </motion.div>

            {/* Main headline */}
            <div className="relative mb-8">
              <motion.h1 
                className="text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <AnimatedText 
                  text="Discover the" 
                  className="text-gray-900"
                  delay={0.3}
                />
                <br />
                <motion.span 
                  className="relative inline-block"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <span className="bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 bg-clip-text text-transparent">
                    Ancient Wisdom
                  </span>
                  <motion.span
                    className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 rounded-full"
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 1 }}
                  />
                </motion.span>
                <br />
                <AnimatedText 
                  text="of Ayurveda" 
                  className="text-gray-900"
                  delay={0.8}
                />
              </motion.h1>
            </div>

            {/* Description */}
            <motion.p 
              className="text-lg lg:text-xl text-gray-600 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              Experience the healing power of nature with our premium collection of
              Ayurvedic herbs, dry fruits, dehydrated foods, and fresh tofu.
              <span className="text-emerald-700 font-medium"> Sourced directly from Indian farms</span> and delivered to your doorstep.
            </motion.p>

            {/* Benefits grid */}
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
            >
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 1 + index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-white/80 shadow-sm hover:shadow-md hover:bg-white/80 transition-all duration-300 group cursor-default"
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <motion.div 
                    className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-md"
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    <benefit.icon className="w-4 h-4 text-white" />
                  </motion.div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                    {benefit.text}
                  </span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.4 }}
            >
              {/* Primary button with shine effect */}
              <motion.div className="relative group">
                <motion.div
                  className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-green-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <Button
                  size="lg"
                  className="relative px-8 py-6 text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white rounded-xl shadow-xl overflow-hidden group/btn"
                  asChild
                >
                  <Link href="/products">
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.6 }}
                    />
                    <span className="relative flex items-center">
                      Shop Now
                      <motion.span
                        className="ml-2"
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </motion.span>
                    </span>
                  </Link>
                </Button>
              </motion.div>

              {/* Secondary button */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-6 text-lg font-semibold border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 rounded-xl shadow-lg backdrop-blur-sm bg-white/50"
                  asChild
                >
                  <Link href="/about" className="group">
                    <motion.div
                      className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mr-3"
                      whileHover={{ scale: 1.1 }}
                    >
                      <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                    </motion.div>
                    Watch Our Story
                    <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Stats with animated counters */}
            <motion.div 
              className="flex flex-wrap justify-center lg:justify-start gap-8 lg:gap-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.6 }}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="text-center lg:text-left"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 1.8 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <stat.icon className="w-5 h-5 text-emerald-500" />
                    <span className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
                      {isLoaded && <AnimatedCounter value={stat.value} suffix={stat.suffix} />}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            className="relative h-[500px] lg:h-[600px] pr-40 lg:pr-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Main visual container */}
            <motion.div 
              className="relative w-full h-full"
              style={{
                x: useTransform(() => mousePosition.x * -20),
                y: useTransform(() => mousePosition.y * -20),
              }}
            >
              {/* Central glow */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-amber-400/20 rounded-full blur-3xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              />

              {/* Main product showcase */}
              <motion.div
                className="absolute top-1/2 lg:left-1/2 md:left-100 left-50 -translate-x-1/2 -translate-y-1/2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                {/* Outer ring */}
                <motion.div
                  className="absolute -inset-8 rounded-full border-2 border-dashed border-emerald-300/50"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Middle ring */}
                <motion.div
                  className="absolute -inset-4 rounded-full border border-amber-300/30"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />

                {/* Main circle */}
                <motion.div
                  className="relative w-56 h-56 lg:w-72 lg:h-72 rounded-full bg-gradient-to-br from-emerald-100 to-amber-100 shadow-2xl flex items-center justify-center overflow-hidden"
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  {/* Inner pattern */}
                  <motion.div
                    className="absolute inset-4 rounded-full border border-emerald-200/50"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  />
                  
                  {/* Content */}
                  <motion.div
                    className="relative z-10 text-center p-8"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <motion.div
                      className="w-24 h-24 lg:w-28 lg:h-28 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                      <span className="text-5xl lg:text-6xl">🌿</span>
                    </motion.div>
                    <h3 className="text-xl lg:text-2xl font-bold text-gray-800 mb-1">Premium Quality</h3>
                    <p className="text-sm text-gray-600">100% Organic</p>
                  </motion.div>

                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
              </motion.div>

              {/* Floating product cards */}
              <ProductCard 
                product={floatingProducts[0]} 
                index={0} 
              />
              <motion.div
                className="absolute top-8 right-4 lg:right-12"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <ProductCard product={floatingProducts[1]} index={1} />
              </motion.div>
              <motion.div
                className="absolute bottom-20 left-0 lg:left-8"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <ProductCard product={floatingProducts[2]} index={2} />
              </motion.div>
              <motion.div
                className="absolute bottom-8 right-8 lg:right-16"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <ProductCard product={floatingProducts[3]} index={3} />
              </motion.div>

              {/* Bestseller badge */}
              <motion.div
                className="absolute top-18 left-4 lg:left-8"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <motion.div
                  className="relative"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.div
                    className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-full blur-md opacity-60"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <Badge className="relative bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 text-sm font-bold shadow-lg">
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="inline-block mr-1"
                    >
                      🔥
                    </motion.span>
                    Bestsellers
                  </Badge>
                </motion.div>
              </motion.div>

              {/* Verified badge */}
              <motion.div
                className="absolute top-32 right-0"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, type: "spring" }}
              >
                <motion.div
                  className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-white/50"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-semibold text-gray-800">100% Verified</span>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom wave decoration */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="absolute bottom-0 w-full h-full"
        >
          <motion.path
            d="M0,64 C300,120 600,0 900,64 C1050,96 1150,32 1200,64 L1200,120 L0,120 Z"
            fill="rgba(255,255,255,0.8)"
            initial={{ d: "M0,64 C300,120 600,0 900,64 C1050,96 1150,32 1200,64 L1200,120 L0,120 Z" }}
            animate={{
              d: [
                "M0,64 C300,120 600,0 900,64 C1050,96 1150,32 1200,64 L1200,120 L0,120 Z",
                "M0,64 C300,0 600,120 900,64 C1050,32 1150,96 1200,64 L1200,120 L0,120 Z",
                "M0,64 C300,120 600,0 900,64 C1050,96 1150,32 1200,64 L1200,120 L0,120 Z"
              ]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
      </motion.div>
    </section>
  )
}

// Animated counter component
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
      {value >= 1000 ? Math.floor(count).toLocaleString() : (value < 10 ? count.toFixed(1) : Math.floor(count))}
      {suffix}
    </>
  )
}
