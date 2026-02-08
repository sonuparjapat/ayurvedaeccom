'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Star } from 'lucide-react'
import { motion } from 'framer-motion'

const testimonials = [
  {
    name: "Priya Sharma",
    location: "Mumbai, Maharashtra",
    rating: 5,
    comment: "Amazing quality of dry fruits! The almonds are so fresh and the packaging is excellent. Will definitely order again.",
    product: "Premium Almonds"
  },
  {
    name: "Rajesh Kumar",
    location: "Delhi, NCR",
    rating: 5,
    comment: "The Ayurvedic herbs have made a significant difference in my health. Authentic products and great customer service.",
    product: "Ashwagandha Powder"
  },
  {
    name: "Anita Patel",
    location: "Ahmedabad, Gujarat",
    rating: 5,
    comment: "Finally found fresh tofu in India! The soya paneer is perfect for my healthy recipes. Thank you AyurVeda Foods!",
    product: "Organic Tofu"
  },
  {
    name: "Dr. Suresh Menon",
    location: "Bangalore, Karnataka",
    rating: 5,
    comment: "As a healthcare practitioner, I recommend these products to my patients. The quality and authenticity are unmatched.",
    product: "Turmeric Powder"
  },
  {
    name: "Meera Reddy",
    location: "Hyderabad, Telangana",
    rating: 5,
    comment: "The dehydrated vegetables retain their nutrients and flavor. Perfect for my busy lifestyle. Fast delivery too!",
    product: "Dehydrated Vegetables Mix"
  },
  {
    name: "Vikram Singh",
    location: "Jaipur, Rajasthan",
    rating: 5,
    comment: "Excellent customer service and premium quality products. The packaging ensures freshness. Highly recommended!",
    product: "Mixed Dry Fruits"
  }
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  )
}

export function TestimonialsSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join thousands of satisfied customers who have transformed their wellness journey with our products.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-500">{testimonial.location}</p>
                    </div>
                    <StarRating rating={testimonial.rating} />
                  </div>
                  
                  <blockquote className="text-gray-700 mb-4 leading-relaxed">
                    "{testimonial.comment}"
                  </blockquote>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm text-emerald-600 font-medium">
                      Purchased: {testimonial.product}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-emerald-600 mb-2">10,000+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-600 mb-2">4.8/5</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-600 mb-2">95%</div>
              <div className="text-gray-600">Repeat Orders</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-600 mb-2">24hrs</div>
              <div className="text-gray-600">Avg. Delivery Time</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}