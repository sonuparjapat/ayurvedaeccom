'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Play, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export function HeroSection() {
  const benefits = [
    "100% Natural & Organic",
    "Traditional Ayurvedic Recipes", 
    "Sourced Directly from Farms",
    "No Preservatives or Additives"
  ]

  return (
    <section className="relative bg-gradient-to-br from-emerald-50 via-white to-amber-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23000000%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%3E%3C/path%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>

      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 mb-6">
              🌿 Authentic Ayurvedic Products
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Discover the
              <span className="text-emerald-600"> Ancient Wisdom</span>
              <br />
              of Ayurveda
            </h1>
            
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Experience the healing power of nature with our premium collection of 
              Ayurvedic herbs, dry fruits, dehydrated foods, and fresh tofu. 
              Sourced directly from Indian farms and delivered to your doorstep.
            </p>

            {/* Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                  className="flex items-center gap-2 text-gray-700"
                >
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm font-medium">{benefit}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA Buttons */}
        <div className="relative z-20 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">

  {/* Shop Now */}
  <Button
    size="lg"
    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg font-semibold"
    asChild
  >
    <Link href="/products">
      Shop Now
      <ArrowRight className="ml-2 w-5 h-5" />
    </Link>
  </Button>


  {/* Watch Story */}
  <Button
    variant="outline"
    size="lg"
    className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-8 py-3 text-lg font-semibold"
    asChild
  >
    <Link href="/about">
      <Play className="mr-2 w-5 h-5" />
      Watch Story
    </Link>
  </Button>

</div>

            {/* Trust Indicators */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-emerald-600">10K+</span>
                  <span>Happy Customers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-emerald-600">50+</span>
                  <span>Premium Products</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-emerald-600">4.8★</span>
                  <span>Customer Rating</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Image/Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative">
              {/* Main Image Placeholder */}
              <div className="bg-gradient-to-br from-emerald-200 to-amber-200 rounded-2xl h-96 lg:h-[500px] flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-6xl">🌿</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Premium Ayurvedic Products</h3>
                  <p className="text-gray-600">Nature's finest, delivered to your home</p>
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4"
              >
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🥜</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Premium Dry Fruits</p>
                    <p className="text-sm text-gray-600">From selected farms</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4"
              >
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🌱</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Ayurvedic Herbs</p>
                    <p className="text-sm text-gray-600">100% organic</p>
                  </div>
                </div>
              </motion.div>

              {/* Badge */}
              <div className="absolute top-4 left-4">
                <Badge className="bg-red-500 text-white px-3 py-1 text-sm font-semibold">
                  🔥 Bestsellers
                </Badge>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}