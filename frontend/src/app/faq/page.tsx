'use client'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  MessageCircle, 
  Package, 
  Truck, 
  CreditCard,
  RefreshCw,
  Shield,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import Link from 'next/link'

const faqData = [
  {
    category: "Products & Quality",
    icon: Package,
    questions: [
      {
        q: "Are your products 100% natural and organic?",
        a: "Yes, all our products are sourced directly from certified organic farms. We work closely with farmers who follow traditional and sustainable farming practices. Each product undergoes rigorous quality testing to ensure it meets our high standards."
      },
      {
        q: "How do you ensure the quality of your Ayurvedic herbs?",
        a: "We source our herbs from trusted suppliers with decades of experience. Each batch is tested in certified labs for purity, potency, and absence of contaminants. We also provide certificates of analysis for our premium products."
      },
      {
        q: "What is the shelf life of your products?",
        a: "Most of our dry fruits and dehydrated products have a shelf life of 12 months when stored in a cool, dry place. Ayurvedic herbs typically last 18-24 months. Each product is clearly labeled with manufacturing and expiry dates."
      },
      {
        q: "Do you add any preservatives or additives?",
        a: "No, we believe in keeping our products as natural as possible. We do not add any artificial preservatives, colors, or flavors. Our products are 100% natural and minimally processed to retain their nutritional value."
      }
    ]
  },
  {
    category: "Orders & Shipping",
    icon: Truck,
    questions: [
      {
        q: "How long does delivery take?",
        a: "Standard delivery takes 3-5 business days within India. Express delivery is available in major cities and takes 1-2 business days. International shipping typically takes 7-14 business days."
      },
      {
        q: "Do you offer free shipping?",
        a: "Yes, we offer free shipping on all orders above ₹500. For orders below ₹500, a nominal shipping fee of ₹50 is applied."
      },
      {
        q: "Can I track my order?",
        a: "Absolutely! Once your order is shipped, you'll receive a tracking number via email and SMS. You can track your package on our website or the courier's website in real-time."
      },
      {
        q: "Do you ship internationally?",
        a: "Currently, we ship within India. We're working on expanding our international shipping options and will announce them soon. Please sign up for our newsletter to stay updated."
      }
    ]
  },
  {
    category: "Payment & Pricing",
    icon: CreditCard,
    questions: [
      {
        q: "What payment methods do you accept?",
        a: "We accept all major payment methods including Credit/Debit cards, UPI, Net Banking, Wallets (Paytm, PhonePe, Google Pay), and Cash on Delivery (COD)."
      },
      {
        q: "Is it safe to use my credit/debit card on your site?",
        a: "Yes, absolutely. We use industry-standard SSL encryption and secure payment gateways (Razorpay) to ensure your payment information is always safe and secure."
      },
      {
        q: "Why are your prices lower than market rates?",
        a: "We work directly with farmers and eliminate middlemen, which allows us to offer premium quality products at competitive prices. We believe in making wellness accessible to everyone."
      },
      {
        q: "Do you offer bulk discounts?",
        a: "Yes, we offer special discounts for bulk orders and corporate gifting. Please contact our business team at business@ayurvedesifoods.com for custom quotes."
      }
    ]
  },
  {
    category: "Returns & Refunds",
    icon: RefreshCw,
    questions: [
      {
        q: "What is your return policy?",
        a: "We offer a 30-day return policy for unopened products in their original packaging. If you're not satisfied with your purchase, you can return it for a full refund or exchange."
      },
      {
        q: "How do I initiate a return?",
        a: "You can initiate a return by contacting our customer support team via email at support@ayurvedesifoods.com or calling our helpline. We'll guide you through the simple return process."
      },
      {
        q: "Who pays for return shipping?",
        a: "If the return is due to our error (wrong product, damaged item), we cover the return shipping. For other returns, the customer is responsible for return shipping costs."
      },
      {
        q: "How long does it take to process a refund?",
        a: "Once we receive your returned item, we process the refund within 5-7 business days. The refund will be credited to your original payment method."
      }
    ]
  },
  {
    category: "Account & Support",
    icon: Users,
    questions: [
      {
        q: "Do I need to create an account to place an order?",
        a: "No, you can checkout as a guest. However, creating an account allows you to track orders, save addresses, view order history, and enjoy a faster checkout experience."
      },
      {
        q: "How can I contact customer support?",
        a: "You can reach our customer support team via email at support@ayurvedesifoods.com, phone at +91 98765 43210, or through the live chat on our website. We're available Monday to Saturday, 9 AM to 6 PM."
      },
      {
        q: "Do you offer wellness consultations?",
        a: "Yes, we have certified Ayurvedic practitioners who provide personalized wellness consultations. You can book a consultation through our website or by calling our helpline."
      },
      {
        q: "Can I become a distributor or reseller?",
        a: "Absolutely! We're always looking to partner with like-minded individuals and businesses. Please contact our business team at business@ayurvedesifoods.com with your proposal."
      }
    ]
  }
]

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([])

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const toggleQuestion = (question: string) => {
    setExpandedQuestions(prev => 
      prev.includes(question) 
        ? prev.filter(q => q !== question)
        : [...prev, question]
    )
  }

  const filteredFAQ = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <Badge className="bg-emerald-100 text-emerald-800 mb-6">
                ❓ Help & Support
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Frequently Asked
                <span className="text-emerald-600"> Questions</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Find answers to common questions about our products, orders, and services. 
                Can't find what you're looking for? Our support team is here to help!
              </p>
              
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search for answers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 py-3 text-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Quick Help Cards */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { icon: Package, title: "Product Info", desc: "Learn about our products" },
                { icon: Truck, title: "Track Order", desc: "Check your order status" },
                { icon: RefreshCw, title: "Returns", desc: "Easy return policy" },
                { icon: Users, title: "Contact Us", desc: "Get in touch with support" }
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <item.icon className="w-6 h-6 text-emerald-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Categories */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {filteredFAQ.length === 0 ? (
                <div className="text-center py-12">
                  <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No results found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Try searching with different keywords or browse all categories below.
                  </p>
                  <Button onClick={() => setSearchTerm('')}>
                    Clear Search
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredFAQ.map((category, categoryIndex) => (
                    <motion.div
                      key={category.category}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <Card>
                        <CardHeader 
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => toggleCategory(category.category)}
                        >
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                <category.icon className="w-5 h-5 text-emerald-600" />
                              </div>
                              <span>{category.category}</span>
                              <Badge variant="secondary">{category.questions.length}</Badge>
                            </div>
                            {expandedCategories.includes(category.category) ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </CardTitle>
                        </CardHeader>
                        
                        {expandedCategories.includes(category.category) && (
                          <CardContent className="pt-0">
                            <div className="space-y-4">
                              {category.questions.map((item, questionIndex) => (
                                <div key={questionIndex} className="border-b last:border-0 pb-4 last:pb-0">
                                  <div
                                    className="flex items-start justify-between cursor-pointer hover:text-emerald-600 transition-colors"
                                    onClick={() => toggleQuestion(item.q)}
                                  >
                                    <h4 className="font-medium text-gray-900 pr-4">
                                      {item.q}
                                    </h4>
                                    {expandedQuestions.includes(item.q) ? (
                                      <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                                    )}
                                  </div>
                                  
                                  {expandedQuestions.includes(item.q) && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="mt-3 text-gray-600 leading-relaxed"
                                    >
                                      {item.a}
                                    </motion.div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Still Need Help */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <MessageCircle className="w-16 h-16 text-emerald-600 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Still Have Questions?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Our friendly support team is here to help you with any questions or concerns.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Quick Response</h3>
                  <p className="text-sm text-gray-600">Get replies within 24 hours</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Expert Team</h3>
                  <p className="text-sm text-gray-600">Knowledgeable and friendly staff</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Reliable Support</h3>
                  <p className="text-sm text-gray-600">Here to help you succeed</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700" asChild>
                  <Link href="/contact">
                    Contact Support
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="mailto:support@ayurvedesifoods.com">
                    Email Us
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="tel:+919876543210">
                    Call Us
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}