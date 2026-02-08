'use client'

import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube,
  Mail,
  Phone,
  MapPin,
  ChevronRight
} from 'lucide-react'

export function Footer() {
  const categories = [
    { name: 'Dry Fruits', href: '/category/dry-fruits' },
    { name: 'Ayurvedic Herbs', href: '/category/herbs' },
    { name: 'Dehydrated Foods', href: '/category/dehydrated' },
    { name: 'Tofu Products', href: '/category/tofu' },
  ]

  const quickLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Blog', href: '/blog' },
    { name: 'FAQs', href: '/faqs' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms & Conditions', href: '/terms' },
    { name: 'Shipping Policy', href: '/shipping' },
    { name: 'Return Policy', href: '/returns' },
  ]

  const contactInfo = [
    { icon: Phone, text: '+91 98765 43210', href: 'tel:+919876543210' },
    { icon: Mail, text: 'info@ayurvedesifoods.com', href: 'mailto:info@ayurvedesifoods.com' },
    { icon: MapPin, text: 'Mumbai, Maharashtra, India', href: '#' },
  ]

  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter */}
      <div className="bg-emerald-700 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">Subscribe to Our Newsletter</h3>
            <p className="mb-6 text-emerald-100">
              Get the latest updates on new products, Ayurvedic tips, and exclusive offers
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email address"
                className="bg-white text-gray-900 placeholder-gray-500 border-0"
              />
              <Button className="bg-white text-emerald-700 hover:bg-gray-100 font-semibold">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold">AyurVeda</h4>
                  <p className="text-emerald-400 text-sm">Desi Foods</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6">
                Bringing ancient Ayurvedic wisdom to modern wellness with 100% natural, 
                authentic Indian products. From premium dry fruits to fresh tofu, 
                we connect you with the essence of traditional Indian health.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2">
                  <Facebook className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2">
                  <Instagram className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2">
                  <Twitter className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2">
                  <Youtube className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-lg font-semibold mb-6">Shop Categories</h4>
              <ul className="space-y-3">
                {categories.map((category) => (
                  <li key={category.name}>
                    <Link
                      href={category.href}
                      className="text-gray-300 hover:text-emerald-400 transition-colors flex items-center gap-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-emerald-400 transition-colors flex items-center gap-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-semibold mb-6">Contact Info</h4>
              <div className="space-y-4">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <info.icon className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      {info.href.startsWith('tel') || info.href.startsWith('mailto') ? (
                        <a
                          href={info.href}
                          className="text-gray-300 hover:text-emerald-400 transition-colors"
                        >
                          {info.text}
                        </a>
                      ) : (
                        <span className="text-gray-300">{info.text}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Payment Methods */}
              <div className="mt-6">
                <h5 className="text-sm font-semibold mb-3 text-gray-400">We Accept</h5>
                <div className="flex flex-wrap gap-2">
                  <div className="bg-gray-800 px-3 py-1 rounded text-xs">COD</div>
                  <div className="bg-gray-800 px-3 py-1 rounded text-xs">Razorpay</div>
                  <div className="bg-gray-800 px-3 py-1 rounded text-xs">UPI</div>
                  <div className="bg-gray-800 px-3 py-1 rounded text-xs">Net Banking</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-sm">
              © 2024 AyurVeda Desi Foods. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <span>🌿 100% Natural Products</span>
              <span>🚚 Fast Delivery</span>
              <span>✅ Quality Assured</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}