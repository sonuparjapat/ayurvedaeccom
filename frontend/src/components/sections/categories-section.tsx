'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

const categories = [
  {
    title: "Dry Fruits",
    description: "Premium quality almonds, cashews, pistachios, and more from the best Indian farms.",
    image: "🥜",
    color: "from-amber-400 to-orange-500",
    href: "/category/dry-fruits",
    productCount: "25+ Products"
  },
  {
    title: "Ayurvedic Herbs",
    description: "Authentic medicinal herbs and powders for holistic health and wellness.",
    image: "🌿",
    color: "from-green-400 to-emerald-500",
    href: "/category/herbs",
    productCount: "40+ Products"
  },
  {
    title: "Dehydrated Foods",
    description: "Nutrient-rich dehydrated vegetables and fruits preserving natural goodness.",
    image: "🍅",
    color: "from-red-400 to-pink-500",
    href: "/category/dehydrated",
    productCount: "15+ Products"
  },
  {
    title: "Tofu Products",
    description: "Fresh and organic tofu (soya paneer) rich in protein and essential nutrients.",
    image: "🧈",
    color: "from-blue-400 to-indigo-500",
    href: "/category/tofu",
    productCount: "10+ Products"
  }
]

export function CategoriesSection() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our carefully curated categories of premium Ayurvedic and traditional Indian products.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="group h-full hover:shadow-xl transition-all duration-300 overflow-hidden border-0">
                <div className={`h-32 bg-gradient-to-br ${category.color} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
                  <span className="text-5xl z-10 transform group-hover:scale-110 transition-transform duration-300">
                    {category.image}
                  </span>
                </div>
                
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {category.title}
                    </h3>
                    <span className="text-sm text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded">
                      {category.productCount}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {category.description}
                  </p>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full group/btn justify-between p-0 h-auto font-semibold text-emerald-600 hover:text-emerald-700"
                    asChild
                  >
                    <Link href={category.href}>
                      Shop Now
                      <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform duration-200" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Button 
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
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