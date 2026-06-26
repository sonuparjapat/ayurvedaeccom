'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import {
  Facebook, Instagram, Twitter, Youtube,
  Mail, Phone, MapPin, ChevronRight, Loader2
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'

const LOGO_URL = 'https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/logoayurveda.png'

export function Footer() {
  const { categoriesdata, companydata } = useAuth()
  const company = (companydata as any)?.[0] || {}
  const socialLinks = company.social_links || {}
  const [email, setEmail] = useState('')
  const [subscribing, setSubscribing] = useState(false)

  const categories = (categoriesdata?.rows || [])
    .filter((c: any) => !c.parent_id && c.is_active !== false)
    .slice(0, 6)

  const handleSubscribe = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email')
      return
    }
    setSubscribing(true)
    try {
      const res = await axios.post('/newsletter/subscribe', { email })
      toast.success(res.data.message || 'Subscribed!')
      setEmail('')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Subscription failed')
    } finally { setSubscribing(false) }
  }

  const quickLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Blog', href: '/blog' },
    { name: 'FAQs', href: '/faq' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms & Conditions', href: '/terms' },
    { name: 'Shipping Policy', href: '/shipping' },
    { name: 'Return Policy', href: '/returns' },
  ]

  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-700 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-2">Subscribe to Our Newsletter</h3>
            <p className="mb-6 text-emerald-100 text-sm">
              Get the latest updates on new products, Ayurvedic tips, and exclusive offers
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email address"
                className="bg-white text-gray-900 placeholder-gray-500 border-0 rounded-xl"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
              />
              <Button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="bg-white text-emerald-700 hover:bg-gray-100 font-semibold rounded-xl px-6"
              >
                {subscribing ? <Loader2 size={16} className="animate-spin" /> : 'Subscribe'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* Company */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img src={LOGO_URL} alt="Oroganix" className="h-10 object-contain" />
              </div>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Premium Ayurvedic herbs, organic supplements, and natural wellness products.
                100% organic, lab-tested, farm-direct. Ancient wisdom for modern health.
              </p>
              <div className="flex gap-3">
                {[
                  { Icon: Facebook, url: socialLinks.facebook, label: 'Facebook' },
                  { Icon: Instagram, url: socialLinks.instagram, label: 'Instagram' },
                  { Icon: Twitter, url: socialLinks.twitter, label: 'Twitter' },
                  { Icon: Youtube, url: socialLinks.youtube, label: 'YouTube' },
                ].filter(s => s.url).map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noreferrer" aria-label={s.label}
                    className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-emerald-700 flex items-center justify-center transition">
                    <s.Icon size={16} className="text-gray-400" />
                  </a>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-5">Shop Categories</h4>
              <ul className="space-y-2.5">
                {categories.length > 0 ? categories.map((cat: any) => (
                  <li key={cat.id}>
                    <Link href={`/category/${cat.slug || cat.id}`}
                      className="text-gray-300 hover:text-emerald-400 transition text-sm flex items-center gap-1.5">
                      <ChevronRight size={12} />
                      {cat.name}
                    </Link>
                  </li>
                )) : (
                  <li><Link href="/products" className="text-gray-300 hover:text-emerald-400 transition text-sm">All Products</Link></li>
                )}
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-5">Quick Links</h4>
              <ul className="space-y-2.5">
                {quickLinks.map(link => (
                  <li key={link.name}>
                    <Link href={link.href}
                      className="text-gray-300 hover:text-emerald-400 transition text-sm flex items-center gap-1.5">
                      <ChevronRight size={12} />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-5">Contact Us</h4>
              <div className="space-y-3">
                {company.email && (
                  <a href={`mailto:${company.email}`} className="flex items-center gap-3 text-gray-300 hover:text-emerald-400 transition text-sm">
                    <Mail size={15} className="text-emerald-500 shrink-0" />
                    {company.email}
                  </a>
                )}
                {company.phone && (
                  <a href={`tel:${company.phone}`} className="flex items-center gap-3 text-gray-300 hover:text-emerald-400 transition text-sm">
                    <Phone size={15} className="text-emerald-500 shrink-0" />
                    {company.phone}
                  </a>
                )}
                <div className="flex items-start gap-3 text-gray-300 text-sm">
                  <MapPin size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  {company.city ? `${company.city}, ${company.state || ''} ${company.country || ''}`.trim() : 'India'}
                </div>
              </div>

              <div className="mt-6">
                <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">We Accept</h5>
                <div className="flex flex-wrap gap-2">
                  {['UPI', 'Cards', 'Net Banking', 'COD'].map(m => (
                    <span key={m} className="bg-gray-800 text-gray-400 px-2.5 py-1 rounded-lg text-xs">{m}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-800 py-5">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-gray-500 text-xs">
              © {new Date().getFullYear()} {company.company_name || 'Oroganix'}. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>🌿 100% Organic</span>
              <span>🔬 Lab Tested</span>
              <span>🚚 Fast Delivery</span>
              <span>✅ FSSAI Certified</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
