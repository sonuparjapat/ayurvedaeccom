'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Quote, MapPin, ShoppingBag, Users, TrendingUp, Clock, Award, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import axios from '@/lib/axios'
import { notify } from '@/app/utils/notify'

const testimonials = [
  {
    name: "Priya Sharma",
    location: "Mumbai, Maharashtra",
    rating: 5,
    comment: "Amazing quality of dry fruits! The almonds are so fresh and the packaging is excellent. Will definitely order again.",
    product: "Premium Almonds",
    avatar: "PS",
    verified: true
  },
  {
    name: "Rajesh Kumar",
    location: "Delhi, NCR",
    rating: 5,
    comment: "The Ayurvedic herbs have made a significant difference in my health. Authentic products and great customer service.",
    product: "Ashwagandha Powder",
    avatar: "RK",
    verified: true
  },
  {
    name: "Anita Patel",
    location: "Ahmedabad, Gujarat",
    rating: 5,
    comment: "Finally found fresh tofu in India! The soya paneer is perfect for my healthy recipes. Thank you AyurVeda Foods!",
    product: "Organic Tofu",
    avatar: "AP",
    verified: true
  },
  {
    name: "Dr. Suresh Menon",
    location: "Bangalore, Karnataka",
    rating: 5,
    comment: "As a healthcare practitioner, I recommend these products to my patients. The quality and authenticity are unmatched.",
    product: "Turmeric Powder",
    avatar: "SM",
    verified: true
  },
  {
    name: "Meera Reddy",
    location: "Hyderabad, Telangana",
    rating: 5,
    comment: "The dehydrated vegetables retain their nutrients and flavor. Perfect for my busy lifestyle. Fast delivery too!",
    product: "Dehydrated Vegetables Mix",
    avatar: "MR",
    verified: true
  },
  {
    name: "Vikram Singh",
    location: "Jaipur, Rajasthan",
    rating: 5,
    comment: "Excellent customer service and premium quality products. The packaging ensures freshness. Highly recommended!",
    product: "Mixed Dry Fruits",
    avatar: "VS",
    verified: true
  }
]


const stats = [
  { label: "Happy Customers", value: "10,000+", icon: Users, suffix: "" },
  { label: "Average Rating", value: "4.8", icon: Star, suffix: "/5" },
  { label: "Repeat Orders", value: "95", icon: TrendingUp, suffix: "%" },
  { label: "Avg. Delivery", value: "24", icon: Clock, suffix: "hrs" }
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: i * 0.1, type: "spring", stiffness: 300 }}
        >
          <Star
            className={cn(
              "w-4 h-4 transition-all duration-300",
              i < rating 
                ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]" 
                : "text-gray-300"
            )}
          />
        </motion.div>
      ))}
    </div>
  )
}

function AvatarWithGlow({ initials, name }: { initials: string; name: string }) {
  const colors = [
    "from-emerald-400 to-teal-500",
    "from-amber-400 to-orange-500", 
    "from-violet-400 to-purple-500",
    "from-rose-400 to-pink-500",
    "from-blue-400 to-indigo-500",
    "from-cyan-400 to-sky-500"
  ]
  const colorIndex = Math.abs(name.charCodeAt(0)) % colors.length

  return (
    <div className="relative group">
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500",
        colors[colorIndex]
      )} />
      <div className={cn(
        "relative w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-white/50",
        colors[colorIndex]
      )}>
        {initials}
      </div>
    </div>
  )
}

function TestimonialCard({ testimonial, index }: { testimonial: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: -10 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="group relative h-full"
    >
      {/* Glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-200 rounded-3xl blur-xl opacity-0 group-hover:opacity-70 transition-all duration-500" />
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* Card */}
      <div className="relative h-full bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)] overflow-hidden">
        {/* Top gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
        
        {/* Quote icon */}
        <div className="absolute top-4 right-4 opacity-10">
          <Quote className="w-12 h-12 text-emerald-600" />
        </div>

        <div className="p-6 relative">
          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            <AvatarWithGlow initials={testimonial.avatar} name={testimonial?.user_name} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-gray-900 text-lg tracking-tight">{testimonial?.user_name}</h4>
                {/* {testimonial.verified && ( */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                {/* )} */}
              </div>
              {/* <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{testimonial.location}</span>
              </div> */}
            </div>
          </div>

          {/* Rating */}
          <div className="mb-4">
            <StarRating rating={testimonial?.rating} />
          </div>

          {/* Comment */}
          <blockquote className="text-gray-700 leading-relaxed mb-5 text-[15px] relative">
            <span className="text-emerald-500 text-2xl font-serif leading-none mr-1">"</span>
            {testimonial?.comment}
            <span className="text-emerald-500 text-2xl font-serif leading-none ml-1">"</span>
          </blockquote>

          {/* Footer */}
          <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Purchased</p>
              <p className="text-sm font-semibold text-emerald-700">{testimonial.product_name}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function StatCard({ stat, index }: { stat: typeof stats[0]; index: number }) {
  const Icon = stat.icon
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 30 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative"
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-200 to-teal-200 rounded-2xl blur-lg opacity-0 group-hover:opacity-60 transition-all duration-500" />
      <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-7 h-7 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {stat.value}
            </span>
            <span className="text-xl font-bold text-emerald-500">{stat.suffix}</span>
          </div>
          <p className="text-gray-600 font-medium mt-2">{stat.label}</p>
        </div>
      </div>
    </motion.div>
  )
}

function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large gradient orbs */}
      <motion.div
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-emerald-200/40 to-teal-200/40 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          x: [0, -20, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-br from-cyan-200/30 to-sky-200/30 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          x: [0, 25, 0],
          y: [0, -15, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-br from-teal-200/30 to-emerald-200/30 rounded-full blur-3xl"
      />
    </div>
  )
}

function SparkleEffect() {
  const sparkles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: Math.random() * 5,
    duration: 2 + Math.random() * 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 8 + Math.random() * 8
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: sparkle.duration,
            delay: sparkle.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ left: `${sparkle.x}%`, top: `${sparkle.y}%` }}
          className="absolute"
        >
          <Sparkles className="text-amber-300/60" style={{ width: sparkle.size, height: sparkle.size }} />
        </motion.div>
      ))}
    </div>
  )
}

export function TestimonialsSection() {
  const [testdata, setTestdata] = useState<any>([])
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/shop/reviews', {
        params: { rating: 5, limit: 5, page: 1 },
      })
      setTestdata(res.data.data || [])
    } catch {
      notify.error('Unable to load products')
    } finally {
      setLoading(false)
    }
  }
console.log(testdata,"testdata")
  return (
    <section className="relative py-20 lg:py-28 overflow-hidden bg-gradient-to-b from-gray-50 via-white to-emerald-50/30">
      {/* Background effects */}
      <FloatingOrbs />
      <SparkleEffect />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-200/50 mb-6"
          >
            <Award className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">Trusted by Thousands</span>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              What Our Customers
            </span>
            <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              Say About Us
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Join thousands of satisfied customers who have transformed their wellness journey 
            with our premium Ayurvedic products and organic foods.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-20">
          {testdata?.map((testimonial, index) => (
            <TestimonialCard key={testimonial?.user_name} testimonial={testimonial} index={index} />
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          {/* Stats container with glass effect */}
          <div className="relative bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-xl rounded-[2rem] border border-white/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-8 lg:p-12 overflow-hidden">
            {/* Decorative corner gradients */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-emerald-200/50 to-transparent rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-teal-200/50 to-transparent rounded-full translate-x-1/2 translate-y-1/2" />
            
            {/* Stats header */}
            <div className="text-center mb-10 relative">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Our Impact in Numbers
              </h3>
              <p className="text-gray-600">Delivering excellence across India</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 relative">
              {stats.map((stat, index) => (
                <StatCard key={stat.label} stat={stat} index={index} />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mt-16"
        >
          <p className="text-gray-600 mb-4">Ready to start your wellness journey?</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-semibold rounded-full shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300"
          >
            <span>Shop Now</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}