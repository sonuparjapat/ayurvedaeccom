'use client'

import { Card, CardContent } from '@/components/ui/card'
import { 
  Truck, 
  Shield, 
  Leaf, 
  Award,
  Users,
  RefreshCw
} from 'lucide-react'
import { motion } from 'framer-motion'

const features = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On all orders above ₹500. Fast delivery across India.",
    color: "text-blue-600"
  },
  {
    icon: Shield,
    title: "100% Authentic",
    description: "Genuine Ayurvedic products sourced directly from trusted suppliers.",
    color: "text-green-600"
  },
  {
    icon: Leaf,
    title: "Organic & Natural",
    description: "No preservatives, additives, or artificial ingredients.",
    color: "text-emerald-600"
  },
  {
    icon: Award,
    title: "Quality Assured",
    description: "Rigorous quality checks and certified by relevant authorities.",
    color: "text-purple-600"
  },
  {
    icon: Users,
    title: "Customer Support",
    description: "Dedicated support team to help you with your wellness journey.",
    color: "text-orange-600"
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    description: "30-day return policy if you're not satisfied with our products.",
    color: "text-red-600"
  }
]

export function FeaturesSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Why Choose AyurVeda Desi Foods?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We're committed to bringing you the finest Ayurvedic and traditional Indian products 
            with unmatched quality and service.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-0 bg-white">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 ${feature.color} bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}