'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  Truck,
  Shield,
  Leaf,
  Award,
  Users,
  RefreshCw,
  Sparkles
} from 'lucide-react'
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useRef, useState } from 'react'

const features = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On all orders above ₹500. Fast delivery across India.",
    gradient: "from-amber-500 via-orange-500 to-yellow-500",
    glowColor: "rgba(245, 158, 11, 0.4)",
    bgGradient: "from-amber-50/80 via-orange-50/60 to-yellow-50/40"
  },
  {
    icon: Shield,
    title: "100% Authentic",
    description: "Genuine Ayurvedic products sourced directly from trusted suppliers.",
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    glowColor: "rgba(16, 185, 129, 0.4)",
    bgGradient: "from-emerald-50/80 via-green-50/60 to-teal-50/40"
  },
  {
    icon: Leaf,
    title: "Organic & Natural",
    description: "No preservatives, additives, or artificial ingredients.",
    gradient: "from-green-500 via-lime-500 to-emerald-500",
    glowColor: "rgba(34, 197, 94, 0.4)",
    bgGradient: "from-green-50/80 via-lime-50/60 to-emerald-50/40"
  },
  {
    icon: Award,
    title: "Quality Assured",
    description: "Rigorous quality checks and certified by relevant authorities.",
    gradient: "from-purple-500 via-violet-500 to-indigo-500",
    glowColor: "rgba(139, 92, 246, 0.4)",
    bgGradient: "from-purple-50/80 via-violet-50/60 to-indigo-50/40"
  },
  {
    icon: Users,
    title: "Customer Support",
    description: "Dedicated support team to help you with your wellness journey.",
    gradient: "from-orange-500 via-red-500 to-rose-500",
    glowColor: "rgba(249, 115, 22, 0.4)",
    bgGradient: "from-orange-50/80 via-red-50/60 to-rose-50/40"
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    description: "30-day return policy if you're not satisfied with our products.",
    gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
    glowColor: "rgba(244, 63, 94, 0.4)",
    bgGradient: "from-rose-50/80 via-pink-50/60 to-fuchsia-50/40"
  }
]

// Floating decorative elements
const FloatingOrb = ({ className, delay = 0 }: { className: string; delay?: number }) => (
  <motion.div
    className={className}
    animate={{
      y: [0, -20, 0],
      x: [0, 10, 0],
      scale: [1, 1.1, 1],
    }}
    transition={{
      duration: 6,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
)

// Interactive card component with mouse tracking
function PremiumCard({ 
  feature, 
  index 
}: { 
  feature: typeof features[0]
  index: number 
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  
  // Mouse position for 3D tilt effect
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 })
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) / rect.width)
    y.set((e.clientY - centerY) / rect.height)
  }
  
  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
    setIsHovered(false)
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1]
      }}
      viewport={{ once: true, margin: "-50px" }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative group"
    >
      {/* Glow effect behind card */}
      <motion.div
        className={`absolute -inset-1 bg-gradient-to-r ${feature.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500`}
        animate={isHovered ? { scale: [1, 1.05, 1] } : { scale: 1 }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Card with glassmorphism */}
      <Card className="relative h-full overflow-hidden border-0 bg-white/80 backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] hover:shadow-[0_16px_60px_-12px_rgba(0,0,0,0.2)] transition-all duration-500 rounded-2xl">
        {/* Premium border gradient */}
        <div className={`absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}>
          <div className="w-full h-full bg-white/90 rounded-2xl" />
        </div>
        
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        
        {/* Background gradient on hover */}
        <motion.div 
          className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
        />
        
        <CardContent className="relative p-8 text-center" style={{ transform: "translateZ(40px)" }}>
          {/* Icon container with glow */}
          <motion.div 
            className="relative mx-auto mb-6 w-20 h-20"
            animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            {/* Icon glow backdrop */}
            <div 
              className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500`}
            />
            
            {/* Icon background */}
            <div className={`relative w-full h-full bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
              <motion.div
                animate={isHovered ? { rotate: [0, -10, 10, 0] } : { rotate: 0 }}
                transition={{ duration: 0.5 }}
              >
                <feature.icon className="w-9 h-9 text-white drop-shadow-sm" />
              </motion.div>
              
              {/* Shine effect */}
              <motion.div 
                className="absolute inset-0 rounded-2xl overflow-hidden"
                initial={{ x: "-100%" }}
                animate={isHovered ? { x: "100%" } : { x: "-100%" }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg]" />
              </motion.div>
            </div>
          </motion.div>
          
          {/* Title with gradient on hover */}
          <motion.h3 
            className={`relative text-xl font-bold mb-3 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent transition-all duration-300`}
            animate={isHovered ? { scale: 1.02 } : { scale: 1 }}
          >
            {feature.title}
          </motion.h3>
          
          {/* Description */}
          <p className="text-gray-600 leading-relaxed text-sm group-hover:text-gray-700 transition-colors duration-300">
            {feature.description}
          </p>
          
          {/* Learn more link */}
          <motion.div 
            className="mt-5 opacity-0 group-hover:opacity-100 transition-all duration-300"
            initial={{ y: 10 }}
            animate={isHovered ? { y: 0 } : { y: 10 }}
          >
            <span className={`inline-flex items-center gap-1 text-sm font-medium bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
              Learn more
              <motion.span
                animate={isHovered ? { x: [0, 4, 0] } : { x: 0 }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                →
              </motion.span>
            </span>
          </motion.div>
        </CardContent>
        
        {/* Corner accent */}
        <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-bl-full`} />
      </Card>
    </motion.div>
  )
}

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  return (
    <section 
      ref={sectionRef}
      className="relative py-24 overflow-hidden"
    >
      {/* Premium background with warm gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-50/50 via-orange-50/30 to-white" />
      
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(180, 83, 9, 0.5) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />
      
      {/* Floating decorative orbs */}
      <FloatingOrb 
        className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-amber-200/30 to-orange-200/20 rounded-full blur-3xl"
        delay={0}
      />
      <FloatingOrb 
        className="absolute top-40 right-20 w-80 h-80 bg-gradient-to-br from-emerald-200/20 to-teal-200/10 rounded-full blur-3xl"
        delay={1}
      />
      <FloatingOrb 
        className="absolute bottom-20 left-1/4 w-72 h-72 bg-gradient-to-br from-purple-200/20 to-pink-200/10 rounded-full blur-3xl"
        delay={2}
      />
      <FloatingOrb 
        className="absolute bottom-40 right-1/3 w-56 h-56 bg-gradient-to-br from-rose-200/20 to-orange-200/10 rounded-full blur-3xl"
        delay={1.5}
      />
      
      {/* Gold accent lines */}
      <motion.div 
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      
      <div className="relative container mx-auto px-4">
        {/* Header section */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Premium badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200/50 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">
              Premium Quality Promise
            </span>
          </motion.div>
          
          {/* Main heading with decorative elements */}
          <div className="relative inline-block">
            <motion.h2 
              className="text-4xl lg:text-5xl font-bold mb-5"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <span className="text-gray-900">Why Choose </span>
              <span className="relative">
                <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">
                  AyurVeda Desi Foods
                </span>
                {/* Underline accent */}
                <motion.span 
                  className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                />
              </span>
            </motion.h2>
          </div>
          
          <motion.p 
            className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            We're committed to bringing you the finest Ayurvedic and traditional Indian products
            with unmatched quality and service.
          </motion.p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <PremiumCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
        
        {/* Bottom decorative element */}
        <motion.div 
          className="flex justify-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-amber-300" />
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400" />
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-amber-300" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}