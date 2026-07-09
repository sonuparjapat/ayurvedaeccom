'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import {
  Facebook, Instagram, Twitter, Youtube,
  Mail, Phone, MapPin, ChevronRight, Loader2,
  Leaf, Shield, Truck, ArrowRight
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'

const FALLBACK_LOGO = 'https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/mainayurvedalogo.png'

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

  const socialIcons = [
    { Icon: Facebook, url: socialLinks.facebook, label: 'Facebook', color: '#4267B2' },
    { Icon: Instagram, url: socialLinks.instagram, label: 'Instagram', color: '#E1306C' },
    { Icon: Twitter, url: socialLinks.twitter, label: 'Twitter', color: '#1DA1F2' },
    { Icon: Youtube, url: socialLinks.youtube, label: 'YouTube', color: '#FF0000' },
  ].filter(s => s.url)

  return (
    <>
      <style>{`
        .footer-root {
          position: relative;
          overflow: hidden;
          font-family: 'DM Sans', 'Inter', sans-serif;
          background: linear-gradient(175deg, #081a10 0%, #0a2016 30%, #0d2a1c 60%, #0a1e14 100%);
        }

        /* Ambient blobs */
        .footer-blob-1 {
          position: absolute; width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 65%);
          top: -200px; left: -200px; pointer-events: none;
        }
        .footer-blob-2 {
          position: absolute; width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 65%);
          bottom: -150px; right: -150px; pointer-events: none;
        }
        .footer-grid-pattern {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
          background-size: 64px 64px;
        }

        /* Newsletter section */
        .footer-newsletter {
          position: relative; z-index: 2;
          padding: 52px 0 48px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .footer-newsletter::before {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.3) 30%, rgba(245,158,11,0.25) 70%, transparent 100%);
        }
        .footer-newsletter-inner {
          max-width: 1280px; margin: 0 auto; padding: 0 24px;
        }
        @media (min-width: 1024px) { .footer-newsletter-inner { padding: 0 48px; } }
        .footer-newsletter-content {
          display: flex; flex-direction: column; gap: 28px; align-items: center;
        }
        @media (min-width: 768px) {
          .footer-newsletter-content { flex-direction: row; justify-content: space-between; align-items: center; }
        }
        .footer-newsletter-eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
          color: #6ee7b7; margin-bottom: 8px;
        }
        .footer-newsletter-dot { width: 7px; height: 7px; border-radius: 50%; background: #10b981; box-shadow: 0 0 6px rgba(16,185,129,0.6); animation: footerPulse 2s ease-in-out infinite; }
        @keyframes footerPulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(1.3); } }
        .footer-newsletter-title {
          font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 800; color: #f0fdf4;
          letter-spacing: -0.02em; line-height: 1.15;
        }
        .footer-newsletter-sub { color: rgba(167,243,208,0.6); font-size: 13.5px; margin-top: 4px; }

        .footer-subscribe-row {
          display: flex; gap: 10px; flex-direction: column; width: 100%; max-width: 420px; flex-shrink: 0;
        }
        @media (min-width: 480px) { .footer-subscribe-row { flex-direction: row; } }
        .footer-email-input {
          flex: 1; height: 48px; border-radius: 14px;
          border: 1.5px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.07);
          backdrop-filter: blur(12px);
          padding: 0 16px;
          color: #f0fdf4; font-size: 13.5px; font-family: inherit;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .footer-email-input::placeholder { color: rgba(255,255,255,0.28); }
        .footer-email-input:focus {
          border-color: rgba(16,185,129,0.5);
          background: rgba(255,255,255,0.10);
          box-shadow: 0 0 0 3px rgba(16,185,129,0.10);
        }
        .footer-subscribe-btn {
          height: 48px; padding: 0 22px; border-radius: 14px; border: none; cursor: pointer;
          font-family: inherit; font-size: 13.5px; font-weight: 700; color: white;
          background: linear-gradient(135deg, #059669, #0f3d2e);
          box-shadow: 0 4px 20px rgba(5,150,105,0.35), inset 0 1px 0 rgba(255,255,255,0.12);
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex; align-items: center; gap: 6px; white-space: nowrap;
        }
        .footer-subscribe-btn:hover:not(:disabled) {
          transform: translateY(-1.5px);
          box-shadow: 0 8px 28px rgba(5,150,105,0.42), inset 0 1px 0 rgba(255,255,255,0.15);
        }
        .footer-subscribe-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        /* Main body */
        .footer-body {
          position: relative; z-index: 2;
          padding: 56px 0 40px;
        }
        .footer-body-inner {
          max-width: 1280px; margin: 0 auto; padding: 0 24px;
        }
        @media (min-width: 1024px) { .footer-body-inner { padding: 0 48px; } }
        .footer-grid {
          display: grid; grid-template-columns: 1fr;
          gap: 40px;
        }
        @media (min-width: 640px) { .footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; } }
        @media (min-width: 1024px) { .footer-grid { grid-template-columns: 1.6fr 1fr 1fr 1.2fr; gap: 40px; } }

        /* Company column */
        .footer-logo-wrap {
          position: relative; overflow: hidden;
          width: 160px; height: 48px; border-radius: 10px;
          background: rgba(255,255,255,0.9);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 18px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.9);
        }
        .footer-logo-wrap img {
          width: 150px; height: auto; object-fit: contain;
        }
        .footer-company-desc {
          color: rgba(167,243,208,0.55); font-size: 13px; line-height: 1.75;
          margin-bottom: 22px; max-width: 280px;
        }

        /* Social icons */
        .footer-socials { display: flex; gap: 8px; }
        .footer-social-btn {
          width: 38px; height: 38px; border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.10);
          color: rgba(255,255,255,0.55); cursor: pointer; text-decoration: none;
          transition: background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.15s;
        }
        .footer-social-btn:hover {
          background: rgba(255,255,255,0.14);
          color: rgba(255,255,255,0.9);
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        }

        /* Column headings */
        .footer-col-title {
          font-size: 10.5px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
          color: rgba(167,243,208,0.55); margin-bottom: 18px;
          display: flex; align-items: center; gap: 8px;
        }
        .footer-col-title::after {
          content: ''; flex: 1; height: 1px;
          background: linear-gradient(90deg, rgba(16,185,129,0.25), transparent);
        }

        /* Links */
        .footer-link {
          display: flex; align-items: center; gap: 6px;
          color: rgba(167,243,208,0.60); font-size: 13px; text-decoration: none;
          padding: 4px 0; transition: color 0.2s, gap 0.2s;
        }
        .footer-link:hover { color: #6ee7b7; gap: 9px; }
        .footer-link svg { opacity: 0.5; flex-shrink: 0; transition: opacity 0.2s; }
        .footer-link:hover svg { opacity: 1; }

        /* Contact */
        .footer-contact-item {
          display: flex; align-items: flex-start; gap: 10px;
          color: rgba(167,243,208,0.60); font-size: 13px; text-decoration: none;
          padding: 5px 0; transition: color 0.2s;
        }
        .footer-contact-item:hover { color: #6ee7b7; }
        .footer-contact-icon {
          width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.2);
          margin-top: 1px;
        }

        /* Payment chips */
        .footer-payments { margin-top: 20px; }
        .footer-payments-title { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.25); margin-bottom: 8px; }
        .footer-payment-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .footer-payment-chip {
          font-size: 10.5px; font-weight: 600;
          color: rgba(167,243,208,0.65);
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 8px; padding: 4px 10px;
          letter-spacing: 0.03em;
        }

        /* Bottom bar */
        .footer-bottom {
          position: relative; z-index: 2;
          border-top: 1px solid rgba(255,255,255,0.05);
          padding: 18px 0;
        }
        .footer-bottom::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.2) 50%, transparent 100%);
        }
        .footer-bottom-inner {
          max-width: 1280px; margin: 0 auto; padding: 0 24px;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
        }
        @media (min-width: 768px) { .footer-bottom-inner { flex-direction: row; justify-content: space-between; padding: 0 48px; } }
        .footer-copyright { color: rgba(255,255,255,0.25); font-size: 12px; }
        .footer-trust-badges { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; }
        .footer-trust-badge {
          font-size: 11px; color: rgba(167,243,208,0.5);
          display: flex; align-items: center; gap: 4px;
        }
      `}</style>

      <footer className="footer-root">
        <div className="footer-blob-1" />
        <div className="footer-blob-2" />
        <div className="footer-grid-pattern" />

        {/* Newsletter */}
        <div className="footer-newsletter">
          <div className="footer-newsletter-inner">
            <div className="footer-newsletter-content">
              <div>
                <div className="footer-newsletter-eyebrow">
                  <span className="footer-newsletter-dot" />
                  Stay Updated
                </div>
                <div className="footer-newsletter-title">Join the Wellness Circle</div>
                <div className="footer-newsletter-sub">Exclusive offers, Ayurvedic tips & new arrivals straight to your inbox</div>
              </div>
              <div className="footer-subscribe-row">
                <input
                  type="email"
                  className="footer-email-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
                />
                <button className="footer-subscribe-btn" onClick={handleSubscribe} disabled={subscribing}>
                  {subscribing
                    ? <Loader2 size={14} style={{ animation: 'loginSpin 0.7s linear infinite' }} />
                    : <><span>Subscribe</span><ArrowRight size={14} /></>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main body */}
        <div className="footer-body">
          <div className="footer-body-inner">
            <div className="footer-grid">

              {/* Company */}
              <div>
                <div className="footer-logo-wrap">
                  <img src={company.logo_url || FALLBACK_LOGO} alt="Oroganix" />
                </div>
                <p className="footer-company-desc">
                  Premium Ayurvedic herbs, organic supplements, and natural wellness products.
                  100% organic, lab-tested, farm-direct. Ancient wisdom for modern health.
                </p>
                <div className="footer-socials">
                  {socialIcons.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noreferrer" aria-label={s.label} className="footer-social-btn">
                      <s.Icon size={16} />
                    </a>
                  ))}
                </div>
              </div>

              {/* Shop Categories */}
              <div>
                <div className="footer-col-title">Shop Categories</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {categories.length > 0 ? categories.map((cat: any) => (
                    <li key={cat.id}>
                      <Link href={`/category/${cat.slug || cat.id}`} className="footer-link">
                        <ChevronRight size={11} />
                        {cat.name}
                      </Link>
                    </li>
                  )) : (
                    <li><Link href="/products" className="footer-link"><ChevronRight size={11} />All Products</Link></li>
                  )}
                </ul>
              </div>

              {/* Quick Links */}
              <div>
                <div className="footer-col-title">Quick Links</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {quickLinks.map(link => (
                    <li key={link.name}>
                      <Link href={link.href} className="footer-link">
                        <ChevronRight size={11} />
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact */}
              <div>
                <div className="footer-col-title">Contact Us</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {company.email && (
                    <a href={`mailto:${company.email}`} className="footer-contact-item">
                      <div className="footer-contact-icon">
                        <Mail size={13} color="#10b981" />
                      </div>
                      <span style={{ marginTop: 4 }}>{company.email}</span>
                    </a>
                  )}
                  {company.phone && (
                    <a href={`tel:${company.phone}`} className="footer-contact-item">
                      <div className="footer-contact-icon">
                        <Phone size={13} color="#10b981" />
                      </div>
                      <span style={{ marginTop: 4 }}>{company.phone}</span>
                    </a>
                  )}
                  <div className="footer-contact-item">
                    <div className="footer-contact-icon">
                      <MapPin size={13} color="#10b981" />
                    </div>
                    <span style={{ marginTop: 4 }}>
                      {company.city ? `${company.city}, ${company.state || ''} ${company.country || ''}`.trim() : 'India'}
                    </span>
                  </div>
                </div>

                <div className="footer-payments">
                  <div className="footer-payments-title">We Accept</div>
                  <div className="footer-payment-chips">
                    {['UPI', 'Cards', 'Net Banking', 'COD'].map(m => (
                      <span key={m} className="footer-payment-chip">{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <div className="footer-bottom-inner">
            <p className="footer-copyright">
              © {new Date().getFullYear()} {company.company_name || 'Oroganix'}. All rights reserved.
            </p>
            <div className="footer-trust-badges">
              {[
                { icon: Leaf, text: '100% Organic' },
                { icon: Shield, text: 'Lab Tested' },
                { icon: Truck, text: 'Fast Delivery' },
              ].map(({ icon: Icon, text }) => (
                <span key={text} className="footer-trust-badge">
                  <Icon size={11} />
                  {text}
                </span>
              ))}
              <span className="footer-trust-badge">✅ FSSAI Certified</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
