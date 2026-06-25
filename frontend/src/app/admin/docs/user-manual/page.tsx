'use client'

import { useState } from 'react'
import {
  BookOpen, ShoppingCart, Package, Users, BarChart3, Tag, Zap, Image,
  MessageSquare, Bell, Wallet, Star, MapPin, CreditCard, Truck,
  Settings, Shield, Search, Heart, RotateCcw, Download, ChevronRight,
  CheckCircle, AlertCircle, Info, Printer, ExternalLink
} from 'lucide-react'

/* ═══════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════ */

const SECTIONS = [
  { id: 'intro',           label: 'Introduction',           icon: BookOpen },
  { id: 'user-journey',    label: 'Customer Journey',        icon: ShoppingCart },
  { id: 'account',         label: 'Account & Profile',       icon: Users },
  { id: 'browse',          label: 'Browsing Products',       icon: Search },
  { id: 'cart-checkout',   label: 'Cart & Checkout',         icon: CreditCard },
  { id: 'orders',          label: 'Orders & Tracking',       icon: Truck },
  { id: 'reviews',         label: 'Reviews & Ratings',       icon: Star },
  { id: 'wallet-loyalty',  label: 'Wallet & Loyalty Points', icon: Wallet },
  { id: 'support',         label: 'Support & Tickets',       icon: MessageSquare },
  { id: 'admin-overview',  label: 'Admin Panel Overview',    icon: Shield },
  { id: 'admin-products',  label: 'Admin: Products',         icon: Package },
  { id: 'admin-orders',    label: 'Admin: Orders',           icon: Truck },
  { id: 'admin-users',     label: 'Admin: Users',            icon: Users },
  { id: 'admin-marketing', label: 'Admin: Marketing',        icon: Tag },
  { id: 'admin-analytics', label: 'Admin: Analytics',        icon: BarChart3 },
  { id: 'admin-support',   label: 'Admin: Support Tickets',  icon: MessageSquare },
  { id: 'admin-returns',   label: 'Admin: Returns',           icon: RotateCcw },
  { id: 'mobile-app',      label: 'Mobile App',              icon: Bell },
  { id: 'order-flow',      label: 'Order Status Guide',      icon: CheckCircle },
]

/* ═══════════════════════════════════════════════════
   COMPONENTS
═══════════════════════════════════════════════════ */

function Section({ id, title, icon: Icon, color = '#2d5a3d', children }: any) {
  return (
    <section id={id} className="mb-12 scroll-mt-6">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b-2" style={{ borderColor: `${color}25` }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={18} style={{ color }} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function InfoBox({ type = 'info', children }: { type?: 'info' | 'tip' | 'warning', children: any }) {
  const map = {
    info:    { bg: '#eff6ff', border: '#93c5fd', icon: Info,         color: '#1d4ed8' },
    tip:     { bg: '#f0fdf4', border: '#86efac', icon: CheckCircle,  color: '#16a34a' },
    warning: { bg: '#fffbeb', border: '#fcd34d', icon: AlertCircle,  color: '#d97706' },
  }
  const s = map[type]
  const Icon = s.icon
  return (
    <div className="flex gap-3 rounded-xl p-4 border" style={{ background: s.bg, borderColor: s.border }}>
      <Icon size={16} style={{ color: s.color, flexShrink: 0, marginTop: 2 }} />
      <div className="text-sm leading-relaxed" style={{ color: s.color }}>{children}</div>
    </div>
  )
}

function Step({ num, title, children }: { num: number; title: string; children: any }) {
  return (
    <div className="flex gap-4">
      <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{num}</div>
      <div>
        <p className="font-semibold text-gray-800 text-sm">{title}</p>
        <div className="text-sm text-gray-600 mt-1 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {headers.map(h => <th key={h} className="text-left px-4 py-3 font-semibold text-gray-700">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
              {row.map((cell, j) => <td key={j} className="px-4 py-3 text-gray-600">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: `${color}18`, color, border: `1px solid ${color}35` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */

export default function UserManualPage() {
  const [activeSection, setActiveSection] = useState('intro')

  const scrollTo = (id: string) => {
    setActiveSection(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="flex gap-0 -m-6 min-h-screen bg-gray-50">

      {/* ── Left TOC ── */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 sticky top-0 h-screen overflow-y-auto">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-green-600" />
            <div>
              <p className="font-bold text-gray-900 text-sm">User Manual</p>
              <p className="text-xs text-gray-400">AyurVeda Desi Foods</p>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-0.5">
          {SECTIONS.map(s => {
            const Icon = s.icon
            return (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-colors ${activeSection === s.id ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Icon size={13} />
                {s.label}
              </button>
            )
          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button onClick={() => window.print()} className="w-full flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
            <Printer size={13} /> Print / Save PDF
          </button>
        </div>
      </aside>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto p-8 max-w-4xl">

        {/* Cover */}
        <div className="bg-gradient-to-br from-green-700 to-green-900 rounded-2xl p-8 mb-10 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <BookOpen size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">User Manual</h1>
              <p className="text-green-200 text-sm">AyurVeda Desi Foods Platform</p>
            </div>
          </div>
          <p className="text-green-100 text-sm leading-relaxed max-w-2xl">
            This comprehensive guide covers every feature of the AyurVeda Desi Foods platform — from how customers browse and buy products, to how administrators manage the entire store. Anyone reading this document will have a complete understanding of how the system works.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            {['Customer Guide', 'Admin Guide', 'Order Tracking', 'Wallet & Loyalty', 'Support System'].map(tag => (
              <span key={tag} className="bg-white/15 text-xs px-3 py-1 rounded-full text-green-100">{tag}</span>
            ))}
          </div>
        </div>

        {/* ═══ 1. INTRODUCTION ═══ */}
        <Section id="intro" title="Introduction" icon={BookOpen}>
          <p className="text-gray-600 text-sm leading-relaxed">
            <strong>AyurVeda Desi Foods</strong> is a full-featured eCommerce platform specialising in authentic Ayurvedic and traditional Indian food products. The platform consists of three parts:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            {[
              { title: 'Customer Website', desc: 'A Next.js web app where customers browse, order, and track products. Available at the main domain.', icon: '🌐' },
              { title: 'Mobile App', desc: 'A React Native (Expo) app for Android and iOS with the full shopping experience on mobile.', icon: '📱' },
              { title: 'Admin Panel', desc: 'A password-protected dashboard at /admin where store managers control everything.', icon: '🔧' },
            ].map(c => (
              <div key={c.title} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="text-2xl mb-2">{c.icon}</div>
                <p className="font-semibold text-gray-800 text-sm">{c.title}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
          <InfoBox type="tip">
            <strong>Who should read this?</strong> This manual is written for anyone — a new admin, a customer service representative, a store owner, or even a new customer wanting to understand all platform features.
          </InfoBox>
        </Section>

        {/* ═══ 2. CUSTOMER JOURNEY ═══ */}
        <Section id="user-journey" title="Customer Journey (End to End)" icon={ShoppingCart} color="#2563eb">
          <p className="text-sm text-gray-600 leading-relaxed">Here is the complete path a customer takes from discovering the platform to receiving their order:</p>
          <div className="space-y-3 mt-2">
            {[
              { num: 1, title: 'Discover the Website', body: 'Customer visits the website (desktop or mobile browser) or downloads the mobile app.' },
              { num: 2, title: 'Browse or Search Products', body: 'Products are organised by category. Customers can use the search bar, filter by category, or browse featured sections on the homepage (banners, flash sales, featured products).' },
              { num: 3, title: 'View Product Details', body: 'Each product page shows: images, description, price, variants (sizes/packs), stock status, customer reviews, Q&A section, and related products.' },
              { num: 4, title: 'Register / Login', body: 'Customers can register with email and password, or log in using an OTP sent to their email. Google login is also available.' },
              { num: 5, title: 'Add to Cart & Wishlist', body: 'Products can be added to the shopping cart or saved to a Wishlist for later. The cart is saved even if you leave the site.' },
              { num: 6, title: 'Apply Coupons & Discounts', body: 'At checkout, customers can enter coupon codes for flat or percentage discounts. Flash sale prices are automatically applied.' },
              { num: 7, title: 'Use Wallet / Loyalty Points', body: 'Customers can apply their stored wallet balance or loyalty points to reduce the order total.' },
              { num: 8, title: 'Checkout & Payment', body: 'Enter a delivery address, confirm the order summary, then pay via Razorpay (Credit/Debit card, UPI, Net Banking, Wallets) or choose Cash on Delivery (COD).' },
              { num: 9, title: 'Order Confirmation', body: 'After successful payment, the customer receives a confirmation email with order details and an invoice.' },
              { num: 10, title: 'Track the Order', body: 'Customers can view real-time order status, a visual timeline of status changes, courier name, tracking number, and estimated delivery date.' },
              { num: 11, title: 'Receive & Review', body: 'After delivery, customers are invited to write a product review and star rating. Loyalty points are automatically credited to their account. A "Write a Review" card appears on the order detail page on both web and mobile.' },
              { num: 12, title: 'Re-order', body: 'On any delivered or cancelled order, a Re-order button lets customers add all items back to cart in one tap and go straight to checkout.' },
              { num: 13, title: 'Return / Refund (if needed)', body: 'Customers can request a return within the return window. The admin processes the return and issues a refund to wallet or original payment method.' },
            ].map(s => <Step key={s.num} num={s.num} title={s.title}>{s.body}</Step>)}
          </div>
        </Section>

        {/* ═══ 3. ACCOUNT ═══ */}
        <Section id="account" title="Customer Account & Profile" icon={Users} color="#7c3aed">
          <p className="text-sm text-gray-600">Customers manage their account from <strong>My Account</strong> (accessible via the top-right user icon).</p>
          <Table
            headers={['Tab', 'What it does']}
            rows={[
              ['Profile', 'View and edit name, email, phone number. See your unique referral code.'],
              ['Orders', 'View all past and current orders. Click any order for detailed tracking and invoice download.'],
              ['Wishlist', 'All saved products. Add directly to cart from here.'],
              ['Addresses', 'Save multiple delivery addresses (Home, Work, Other). Set one as default.'],
              ['Wallet', 'View wallet balance, transaction history, and loyalty points balance with earning/redemption log. Also accessible at /wallet from the header.'],
              ['Notifications', 'View a history of all order status updates as an in-app notification inbox. The bell icon in the header shows an unread count badge.'],
              ['Settings', 'Control email notification preferences (order updates, promotions, price drops).'],
            ]}
          />
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <p className="font-semibold text-green-800 text-sm mb-2">🔐 Login Options</p>
              <ul className="text-xs text-green-700 space-y-1 list-disc list-inside">
                <li>Email + Password</li>
                <li>OTP Login (email OTP)</li>
                <li>Google Sign-In</li>
              </ul>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <p className="font-semibold text-purple-800 text-sm mb-2">🎁 Referral System</p>
              <p className="text-xs text-purple-700">Every account has a unique referral code. Share it with friends to earn wallet credits when they make their first purchase.</p>
            </div>
          </div>
        </Section>

        {/* ═══ 4. BROWSING ═══ */}
        <Section id="browse" title="Browsing Products" icon={Search} color="#0891b2">
          <Table
            headers={['Feature', 'How to use']}
            rows={[
              ['Category Navigation', 'Use the top navigation bar or homepage category icons to filter by product type.'],
              ['Search Bar', 'Type any keyword — product name, brand, ingredient. Get instant suggestions as you type.'],
              ['Product Filters', 'On listing pages, filter by price range, category, rating, or availability.'],
              ['Flash Sales', 'A countdown banner appears on the homepage when a flash sale is active. Products show the discounted price and remaining stock.'],
              ['Recently Viewed', 'A section shows the last products you visited (requires being logged in).'],
              ['Wishlist', 'Click the heart icon on any product to save it. Access all saved items from My Account → Wishlist.'],
              ['Product Q&A', 'Scroll to the Q&A section on any product page to ask a question or read existing answers from other customers or the store team.'],
              ['Pincode Checker', 'Enter your pincode on the product page to confirm delivery availability and estimated days.'],
            ]}
          />
          <InfoBox type="tip">Products marked <strong>Out of Stock</strong> show a "Notify Me" button. Enter your email and the system automatically emails you when the product is restocked.</InfoBox>
        </Section>

        {/* ═══ 5. CART & CHECKOUT ═══ */}
        <Section id="cart-checkout" title="Cart & Checkout Process" icon={CreditCard} color="#ea580c">
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-gray-800 text-sm mb-2">Shopping Cart</p>
              <p className="text-sm text-gray-600 leading-relaxed">The cart icon in the header shows the number of items. Click it to open the cart side-panel. You can adjust quantities, remove items, or proceed to checkout. Guest users can also use the cart — items are saved in a session.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm mb-3">Checkout Steps</p>
              <div className="space-y-2">
                {[
                  { step: '1', label: 'Choose Address', desc: 'Select a saved address or enter a new one. The system checks if your pincode is serviceable.' },
                  { step: '2', label: 'Apply Coupon', desc: 'Enter a coupon code for flat (₹) or percentage (%) discounts. The system validates and shows the discount instantly.' },
                  { step: '3', label: 'Use Wallet / Loyalty', desc: 'Apply available wallet balance or convert loyalty points to discount (1 point = ₹0.10). Both can be used together.' },
                  { step: '4', label: 'Review Order Summary', desc: 'See subtotal, GST, delivery charge, all discounts, and the final amount payable.' },
                  { step: '5', label: 'Choose Payment', desc: 'Select Online (Razorpay) or Cash on Delivery (COD). COD may have a small convenience fee.' },
                  { step: '6', label: 'Confirm & Pay', desc: 'Complete payment. For COD, the order is placed immediately. For online, complete the Razorpay payment screen.' },
                ].map(s => (
                  <div key={s.step} className="flex gap-3 items-start bg-white rounded-xl p-3 border border-gray-100">
                    <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{s.step}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{s.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <InfoBox type="warning">
              Online orders that are not paid within 15 minutes are automatically cancelled and stock is released back to inventory.
            </InfoBox>
          </div>
        </Section>

        {/* ═══ 6. ORDERS ═══ */}
        <Section id="orders" title="Orders & Tracking" icon={Truck} color="#0891b2">
          <p className="text-sm text-gray-600 leading-relaxed">Once an order is placed, customers can track every stage in real time from <strong>My Account → Orders</strong> or by opening the order detail page.</p>
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <p className="font-semibold text-gray-800 text-sm">What's shown on the order tracking page:</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '📊', label: 'Visual progress bar', desc: '6-step progress indicator showing Order Placed → Confirmed → Processing → Shipped → Out for Delivery → Delivered' },
                { icon: '📦', label: 'Courier information', desc: 'Courier company name and tracking number. Click "Track Shipment" to open the carrier\'s website directly.' },
                { icon: '📅', label: 'Estimated delivery', desc: 'Calculated from shipping date + standard delivery days for your pincode.' },
                { icon: '🕐', label: 'Status history', desc: 'A reverse-chronological timeline showing every status change with exact date and time.' },
                { icon: '🧾', label: 'Invoice download', desc: 'Download the PDF invoice directly from the order page.' },
                { icon: '↩️', label: 'Return & cancel', desc: 'Cancel button available for Pending/Confirmed orders. Return button available 30 days after delivery.' },
              ].map(f => (
                <div key={f.label} className="flex gap-2 p-3 bg-gray-50 rounded-xl">
                  <span className="text-lg flex-shrink-0">{f.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">{f.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <InfoBox type="tip">For COD orders, the delivery agent will ask for a 4-digit OTP when delivering. This OTP is sent to your registered email and confirms successful delivery.</InfoBox>
        </Section>

        {/* ═══ 7. REVIEWS ═══ */}
        <Section id="reviews" title="Reviews & Ratings" icon={Star} color="#d97706">
          <p className="text-sm text-gray-600 leading-relaxed">Only customers who have actually purchased and received a product can write a review. This ensures all reviews are genuine.</p>
          <div className="space-y-3">
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="font-semibold text-sm text-gray-800 mb-2">How to write a review:</p>
              <div className="space-y-2">
                <Step num={1} title="Go to My Account → Orders">Find the delivered order.</Step>
                <Step num={2} title="Click 'Write Review'">This opens the review form for that specific product and order. On the <strong>mobile app</strong>, a "Write a Review ⭐" card appears automatically on the Order Detail screen once your order is delivered — tap it to go directly to the review form.</Step>
                <Step num={3} title="Add your rating (1–5 stars) and comment">You can also upload up to 5 product photos.</Step>
                <Step num={4} title="Submit">Your review may be pending moderation before it appears publicly.</Step>
              </div>
            </div>
            <Table
              headers={['Review Status', 'Meaning']}
              rows={[
                ['Pending', 'Submitted, waiting for admin to approve.'],
                ['Approved', 'Visible on the product page and counted in the average rating.'],
                ['Rejected', 'Hidden. Admin may reject spam or inappropriate reviews.'],
              ]}
            />
          </div>
        </Section>

        {/* ═══ 8. WALLET & LOYALTY ═══ */}
        <Section id="wallet-loyalty" title="Wallet & Loyalty Points" icon={Wallet} color="#7c3aed">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
              <p className="text-2xl mb-2">💜</p>
              <p className="font-bold text-purple-800 text-sm mb-2">Wallet (Store Credits)</p>
              <ul className="text-xs text-purple-700 space-y-1.5 leading-relaxed">
                <li>• Wallet balance can be topped up by the admin (refunds, compensation, referral rewards).</li>
                <li>• At checkout, toggle "Use Wallet Balance" to apply available credits toward your order.</li>
                <li>• Wallet is currency — ₹1 wallet = ₹1 discount.</li>
                <li>• View full transaction history in My Account → Wallet, or visit the dedicated <strong>/wallet</strong> page via the Wallet icon (💳) in the site header.</li>
              </ul>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-2xl mb-2">⭐</p>
              <p className="font-bold text-amber-800 text-sm mb-2">Loyalty Points</p>
              <ul className="text-xs text-amber-700 space-y-1.5 leading-relaxed">
                <li>• Earn <strong>1 point for every ₹10</strong> spent on delivered orders.</li>
                <li>• Points are credited automatically when your order is marked Delivered.</li>
                <li>• Redeem at checkout: <strong>1 point = ₹0.10 discount</strong>.</li>
                <li>• View point history in My Account → Wallet.</li>
              </ul>
            </div>
          </div>
          <InfoBox type="info">Wallet and Loyalty Points can both be applied to the same order simultaneously, stacking on top of coupon discounts.</InfoBox>
        </Section>

        {/* ═══ 9. SUPPORT ═══ */}
        <Section id="support" title="Customer Support & Tickets" icon={MessageSquare} color="#0891b2">
          <p className="text-sm text-gray-600 leading-relaxed">Customers can raise support tickets for any issue — order problem, payment query, return question, or general inquiry.</p>
          <div className="space-y-3">
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="font-semibold text-sm text-gray-800 mb-3">How to raise a support ticket:</p>
              <div className="space-y-2">
                <Step num={1} title="Go to Support page">Available via the website header (Support link) or My Account menu.</Step>
                <Step num={2} title="Click 'New Ticket'">Fill in the subject, category (Order, Payment, Return, Product, General), priority, and your message.</Step>
                <Step num={3} title="Submit the ticket">You'll be taken to a live chat thread for your ticket.</Step>
                <Step num={4} title="Wait for a reply">The support team replies directly in the ticket thread. You'll get a real-time notification on the website when they respond.</Step>
                <Step num={5} title="Close when resolved">Click 'Close' on the ticket once your issue is resolved.</Step>
              </div>
            </div>
            <Table
              headers={['Category', 'Use for']}
              rows={[
                ['General', 'Any question not fitting other categories.'],
                ['Order', 'Issues with a specific order — delay, wrong item, missing item.'],
                ['Payment', 'Payment failed, double charge, refund not received.'],
                ['Return', 'Initiating a return or checking return status.'],
                ['Product', 'Questions about a product\'s ingredients, usage, or availability.'],
                ['Other', 'Everything else.'],
              ]}
            />
            <InfoBox type="tip">You can also use the <strong>Contact Us</strong> page (no login required) to send a message. It automatically creates a support ticket in the system.</InfoBox>
          </div>
        </Section>

        {/* ═══ 10. ADMIN OVERVIEW ═══ */}
        <Section id="admin-overview" title="Admin Panel Overview" icon={Shield} color="#dc2626">
          <p className="text-sm text-gray-600 leading-relaxed">The Admin Panel is accessible only to users with <strong>Admin</strong> or <strong>Staff</strong> roles. It is located at <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/admin</code> on the website domain.</p>
          <Table
            headers={['Admin Section', 'Purpose']}
            rows={[
              ['Dashboard', 'Overview of total orders, revenue, users, and recent activity at a glance.'],
              ['Products', 'Add, edit, delete products with full details: pricing (sell/compare/cost), inventory (stock, SKU, barcode, low-stock threshold), brand, tags, featured/bestseller badges, weight, specifications, SEO meta fields, and multiple images.'],
              ['Orders', 'View all customer orders, update status, manage returns and refunds.'],
              ['Categories', 'Hierarchical category management — create parent and subcategories (unlimited depth). Each has slug (SEO URL), sort order, featured flag, banner image, GST/HSN/CESS tax defaults.'],
              ['Brands', 'Create and manage product brands with logo, slug, description, sort order, and active/inactive status. Products reference brands via dropdown.'],
              ['Users', 'View all registered customers. Create admin/staff accounts.'],
              ['Invoices', 'View and download all generated invoices.'],
              ['Analytics', 'Revenue charts (daily, weekly, monthly), order stats, product performance.'],
              ['Banners', 'Create homepage banner slides with images and call-to-action links.'],
              ['Coupons', 'Create discount codes (flat or percentage), set usage limits and validity.'],
              ['Flash Sales', 'Create time-limited sales with countdown timers and special prices.'],
              ['Variants', 'Manage product variants (e.g., 250g / 500g / 1kg packs).'],
              ['Pincodes', 'Add serviceable delivery pincodes with delivery day estimates. Stats show total, active, and inactive pincodes at a glance.'],
              ['Stock Alerts', 'View customers who requested "Notify me" for out-of-stock products.'],
              ['Reviews', 'Moderate customer reviews — approve, reject, or delete.'],
              ['Q&A', 'Moderate and answer product questions from customers. Filter by pending/approved/rejected status. Stats cards show counts per status.'],
              ['Push Notifications', 'Send broadcast notifications to all app users.'],
              ['Abandoned Carts', 'View customers with items in cart who haven\'t checked out. Stats show total carts and estimated lost revenue. Send recovery emails.'],
              ['Wallet & Credits', 'View all wallet balances and loyalty points. Search users, add credits manually. Stats show total balance, user count, total loyalty points, and average balance.'],
              ['Support Tickets', 'View and reply to all customer support tickets in real-time.'],
              ['Returns', 'View return requests from customers. Approve or reject returns, credit wallet refunds, and mark refunds complete.'],
              ['Export Data', 'Download orders, users, and revenue data as CSV files.'],
              ['Settings', 'Platform configuration — delivery charges, platform fees, free delivery threshold.'],
              ['Company', 'Update company name, address, GST number, logo, social links.'],
              ['Logs', 'Audit trail of all admin actions.'],
              ['Jobs', 'Background task queue status and history.'],
            ]}
          />
        </Section>

        {/* ═══ 11. ADMIN PRODUCTS ═══ */}
        <Section id="admin-products" title="Admin: Managing Products" icon={Package} color="#2d5a3d">
          <div className="space-y-4">
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="font-semibold text-sm text-gray-800 mb-3">Adding a New Product</p>
              <div className="space-y-2">
                <Step num={1} title="Admin → Products → Add Product">Fill in the product name, description, price, compare-at price (for showing a strikethrough).</Step>
                <Step num={2} title="Set Category & HSN/GST">Select the category. GST rate is auto-filled from the category. You can override per product.</Step>
                <Step num={3} title="Upload Images">Upload up to 10 product images. The first image becomes the main listing image.</Step>
                <Step num={4} title="Set Inventory">Enter the current stock quantity. The system auto-decreases inventory on each purchase.</Step>
                <Step num={5} title="Add Variants (Optional)">For products that come in multiple sizes (e.g., 250g, 500g), add variants each with their own price and inventory.</Step>
                <Step num={6} title="SEO Fields">Fill in meta title, meta description, and keywords for search engine visibility.</Step>
                <Step num={7} title="Set Status to Active">Only Active products appear on the customer-facing store. Use Draft to save without publishing.</Step>
              </div>
            </div>
            <Table
              headers={['Bulk Action', 'Purpose']}
              rows={[
                ['Bulk Upload', 'Import hundreds of products from a CSV/Excel file at once.'],
                ['Bulk Stock Update', 'Update inventory quantities for multiple products in one go.'],
                ['Bulk Price Update', 'Change prices for multiple products simultaneously.'],
                ['Bulk Status', 'Activate or deactivate multiple products at once.'],
                ['Bulk Category', 'Re-assign categories for multiple products.'],
                ['Bulk Images', 'Upload images for multiple products from a ZIP file.'],
              ]}
            />
            <InfoBox type="tip">When a product goes out of stock (inventory = 0), it automatically shows as "Out of Stock" to customers and the "Add to Cart" button is disabled.</InfoBox>
          </div>
        </Section>

        {/* ═══ 12. ADMIN ORDERS ═══ */}
        <Section id="admin-orders" title="Admin: Managing Orders" icon={Truck} color="#0891b2">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 leading-relaxed">The Orders page shows all orders with filters for status, payment method, and date range. Real-time notifications appear when a new order is placed.</p>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="font-semibold text-sm text-gray-800 mb-3">Order Status Management (Step-by-Step)</p>
              <div className="space-y-2">
                {[
                  { from: 'Pending', to: 'Confirmed', action: 'Review the order and confirm it. A confirmation email is sent to the customer.', color: '#2563eb' },
                  { from: 'Confirmed', to: 'Processing', action: 'Begin preparing/packing the order.', color: '#7c3aed' },
                  { from: 'Processing', to: 'Shipped', action: 'First add tracking info (courier name + tracking number) via the Tracking button, then move to Shipped.', color: '#0891b2' },
                  { from: 'Shipped', to: 'Out for Delivery', action: 'Update when the package is with the delivery agent.', color: '#ea580c' },
                  { from: 'Out for Delivery', to: 'Delivered', action: 'For COD orders: generate a delivery OTP and provide it to the delivery agent. Confirm delivery.', color: '#16a34a' },
                ].map(s => (
                  <div key={s.from} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                      <StatusBadge label={s.from} color="#6b7280" />
                      <ChevronRight size={12} className="text-gray-400" />
                      <StatusBadge label={s.to} color={s.color} />
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{s.action}</p>
                  </div>
                ))}
              </div>
            </div>
            <Table
              headers={['Action', 'When to use']}
              rows={[
                ['Add Tracking', 'After shipping — add courier name and tracking number.'],
                ['Generate OTP', 'For COD orders ready to deliver — generates a 6-digit OTP.'],
                ['View Timeline', 'See the full status history for any order.'],
                ['View Invoice', 'Open/download the PDF invoice for any order.'],
                ['Cancel Order', 'Cancel a Pending or Confirmed order. Stock is automatically restored.'],
                ['Process Refund', 'For returned online orders — initiates automatic Razorpay refund.'],
              ['Re-order', 'On delivered or cancelled orders — adds all items to cart for the customer to re-purchase.'],
              ]}
            />
            <InfoBox type="warning">You cannot skip order statuses (e.g., you cannot jump from Processing directly to Delivered). The system enforces valid transitions to maintain accurate tracking history.</InfoBox>
          </div>
        </Section>

        {/* ═══ 13. ADMIN USERS ═══ */}
        <Section id="admin-users" title="Admin: Managing Users" icon={Users} color="#7c3aed">
          <Table
            headers={['Role', 'Access Level']}
            rows={[
              ['Customer (Role 3)', 'Default. Can browse, purchase, write reviews, and raise support tickets.'],
              ['Staff (Role 2)', 'Can access admin panel with limited permissions. Suitable for support agents.'],
              ['Admin (Role 1)', 'Full access to all admin features including deleting products and issuing refunds.'],
              ['Super Admin (Role 0)', 'Highest access. Reserved for the platform owner.'],
            ]}
          />
          <div className="bg-white border border-gray-100 rounded-xl p-4 mt-2">
            <p className="font-semibold text-sm text-gray-800 mb-2">Creating a New Admin/Staff Account</p>
            <div className="space-y-2">
              <Step num={1} title="Admin → Users → Create User">Fill in name, email, phone, and set a temporary password.</Step>
              <Step num={2} title="Assign Role">Choose Admin or Staff from the role dropdown.</Step>
              <Step num={3} title="Send Credentials">The system automatically sends a welcome email with login credentials.</Step>
            </div>
          </div>
          <InfoBox type="warning">Never share admin credentials. Always create individual accounts for each team member so actions can be tracked in the Logs section.</InfoBox>
        </Section>

        {/* ═══ 14. ADMIN MARKETING ═══ */}
        <Section id="admin-marketing" title="Admin: Marketing Tools" icon={Tag} color="#dc2626">
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-sm text-gray-800 mb-2">Coupons</p>
              <Table
                headers={['Field', 'Description']}
                rows={[
                  ['Code', 'The coupon code customers enter (e.g., SAVE20). Case-insensitive.'],
                  ['Type', 'Flat (₹ off) or Percent (% off).'],
                  ['Value', 'Amount of discount (e.g., 50 for ₹50 off, or 20 for 20% off).'],
                  ['Min Order', 'Minimum cart value required to use this coupon.'],
                  ['Max Discount', 'For percent coupons: caps the maximum ₹ discount. (e.g., max ₹200 even if 30% is more)'],
                  ['Usage Limit', 'Total number of times this coupon can be used across all customers.'],
                  ['Per User Limit', 'How many times one customer can use this coupon (usually 1).'],
                  ['Valid From / To', 'Date range during which the coupon is active.'],
                ]}
              />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-800 mb-2">Flash Sales</p>
              <p className="text-sm text-gray-600 leading-relaxed">Flash Sales are time-limited promotions with a countdown timer visible on the homepage and product pages.</p>
              <div className="space-y-2 mt-2">
                <Step num={1} title="Admin → Flash Sales → Create">Set title, start/end time, and discount type (flat or percentage).</Step>
                <Step num={2} title="Add Products">Select which products are included in the flash sale. Set a special price per product.</Step>
                <Step num={3} title="Set Stock Limit (Optional)">Limit how many units can be sold at the flash sale price.</Step>
                <Step num={4} title="Activate">Set is_active to true. The banner automatically appears on the homepage.</Step>
              </div>
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-800 mb-2">Banners</p>
              <p className="text-sm text-gray-600 leading-relaxed">Homepage banner slides show at the top of the store. Each banner has a background image, title, subtitle, CTA button text, and link. Use sort_order to control the sequence.</p>
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-800 mb-2">Push Notifications</p>
              <p className="text-sm text-gray-600 leading-relaxed">Send push notifications to all mobile app users. Go to <strong>Admin → Push Notifications</strong>, write a title and body, and click Send. All users who have the app installed and notifications enabled will receive it instantly.</p>
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-800 mb-2">Abandoned Cart Recovery</p>
              <p className="text-sm text-gray-600 leading-relaxed">The system automatically tracks users who added items to cart but didn't checkout. Admins can view this list and trigger reminder emails to bring them back.</p>
            </div>
          </div>
        </Section>

        {/* ═══ 15. ANALYTICS ═══ */}
        <Section id="admin-analytics" title="Admin: Analytics & Reports" icon={BarChart3} color="#16a34a">
          <Table
            headers={['Report', 'What it shows']}
            rows={[
              ['Dashboard Summary', 'Total orders today, total revenue, new users, and pending orders.'],
              ['Revenue Chart', 'Bar chart of revenue over daily (30 days), weekly (12 weeks), or monthly (12 months) periods.'],
              ['Order Count Chart', 'Number of orders over the same periods.'],
              ['Product Performance', 'Best-selling products by order volume and revenue.'],
              ['User Growth', 'New registrations over time.'],
              ['Export CSV', 'Download raw data for orders, users, or revenue for external analysis in Excel/Google Sheets.'],
            ]}
          />
        </Section>

        {/* ═══ 16. ADMIN SUPPORT ═══ */}
        <Section id="admin-support" title="Admin: Support Ticket Management" icon={MessageSquare} color="#0891b2">
          <p className="text-sm text-gray-600 leading-relaxed">The Admin Support page (<strong>/admin/support</strong>) is a two-panel interface — ticket list on the left, live chat on the right.</p>
          <div className="space-y-3">
            <Table
              headers={['Feature', 'Description']}
              rows={[
                ['Ticket List', 'All customer tickets with filters for status, priority, and category. Refreshes automatically when new tickets arrive.'],
                ['Live Chat', 'Click any ticket to open the chat thread. Replies are delivered in real-time via WebSockets.'],
                ['Status Update', 'Change ticket status (Open → In Progress → Resolved → Closed) directly from the chat header.'],
                ['Priority', 'Adjust ticket priority (Low / Medium / High / Urgent) based on urgency.'],
                ['Real-time Alerts', 'A red badge shows when new tickets arrive while you\'re on the page. A toast notification pops up.'],
              ]}
            />
            <Table
              headers={['Ticket Status', 'Meaning']}
              rows={[
                ['Open', 'New ticket, not yet attended to.'],
                ['In Progress', 'Admin has replied at least once.'],
                ['Resolved', 'Issue is resolved. Customer can re-open by sending another message.'],
                ['Closed', 'Ticket is closed. No further messages can be added.'],
              ]}
            />
          </div>
        </Section>

        {/* ═══ 16.5. ADMIN RETURNS ═══ */}
        <Section id="admin-returns" title="Admin: Returns Management" icon={RotateCcw} color="#7c3aed">
          <p className="text-sm text-gray-600 leading-relaxed">The <strong>Admin → Returns</strong> page lists all orders where customers have requested a return (status 7 — Return Requested), returns being processed (status 8 — Refund Initiated), and completed refunds (status 9 — Refunded).</p>
          <div className="space-y-4">
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="font-semibold text-sm text-gray-800 mb-3">Return Processing Flow</p>
              <div className="space-y-2">
                <Step num={1} title="Customer requests return">Customer clicks Return on a delivered order. Status changes to <strong>Return Requested (7)</strong>. Visible in Admin → Returns.</Step>
                <Step num={2} title="Admin reviews the request">Filter by "Return Requested" to see all pending decisions. Click View to see the order items, amounts, and customer details.</Step>
                <Step num={3} title="Approve or Reject the return">
                  <ul className="mt-1 space-y-1 list-disc list-inside text-xs">
                    <li><strong>Approve with Wallet Credit</strong> — Status → Refund Initiated (8). The full order amount is credited to the customer's wallet instantly.</li>
                    <li><strong>Approve without Wallet Credit</strong> — Status → Refund Initiated (8) without adding wallet credit (use when processing a Razorpay refund externally).</li>
                    <li><strong>Reject</strong> — Enter a rejection reason. Status reverts to Delivered (5). The item stays with the customer.</li>
                  </ul>
                </Step>
                <Step num={4} title="Mark Refund Complete">Once the refund is confirmed (wallet credited or Razorpay processed), click <strong>Mark Refund Complete</strong>. Status → Refunded (9). This closes the return loop.</Step>
              </div>
            </div>
            <Table
              headers={['Status Filter', 'Shows']}
              rows={[
                ['Return Requested (7)', 'New return requests awaiting your decision.'],
                ['Refund Initiated (8)', 'Approved returns — complete the refund when ready.'],
                ['Refunded (9)', 'Fully completed returns for record-keeping.'],
              ]}
            />
            <InfoBox type="info">When a return is approved with wallet credit, the customer's wallet balance updates immediately — they can use it on their next purchase. For online payment returns (Razorpay), trigger the refund from the order detail page and then mark refund complete here.</InfoBox>
          </div>
        </Section>

        {/* ═══ 17. MOBILE APP ═══ */}
        <Section id="mobile-app" title="Mobile App" icon={Bell} color="#7c3aed">
          <p className="text-sm text-gray-600 leading-relaxed">The AyurVeda mobile app (React Native / Expo) provides the full shopping experience on Android and iOS.</p>
          <Table
            headers={['Screen', 'Features']}
            rows={[
              ['Home', 'Featured products, categories, banners, flash sale countdown.'],
              ['Products', 'Browse all products with search and category filter. Pull down on the list to refresh and load the latest products instantly.'],
              ['Product Detail', 'Full product info, variants, add to cart, wishlist, reviews, Q&A tab. Tap any product image to open a full-screen zoom viewer (pinch to zoom on iOS). Tap the Share icon in the top bar to share the product via any installed app (WhatsApp, email, etc.).'],
              ['Cart', 'View cart, adjust quantities, proceed to checkout.'],
              ['Checkout', 'Address, coupon, wallet credits, loyalty points redemption (1pt = ₹0.10), payment via Razorpay. Wallet and loyalty discounts are shown in the price breakdown and deducted from the total.'],
              ['Orders', 'List of all orders with status. Tap to see full tracking timeline, cancel, return, re-order, download invoice (PDF), retry payment for unpaid online orders, and tap "Track" to open the courier website (Delhivery, BlueDart, DTDC, etc.). Tap "Chat" to open a support ticket.'],
              ['Account', 'Profile, wishlist, cart, addresses, support link. Quick links to Wallet and Notifications screens. Displays your unique Referral Code with Copy and Share buttons. Auto-refreshes all data (profile, verification status, orders, addresses) every time you open the screen.'],
              ['Wallet', 'Wallet balance card, transaction history (credit/debit), and loyalty points earned/redeemed — all in one screen with tabs.'],
              ['Notifications', 'In-app notification inbox showing all order status updates, grouped by date and linked to the order detail screen.'],
              ['Support', 'Create and view support tickets. Chat with support team.'],
              ['Search', 'Full-text product search with instant autocomplete suggestions and recent search history. Results tap through to product or category.'],
              ['Wishlist', 'All saved products with add-to-cart shortcut. Pull down to refresh your saved items.'],
              ['Auth', 'Login with email/password or OTP.'],
            ]}
          />
          <InfoBox type="tip">A persistent <strong>bottom navigation bar</strong> appears on all main screens (Home, Browse/Products, Wishlist, Account) so you can switch sections without going back. It uses a frosted glass effect and highlights the active tab.</InfoBox>
          <InfoBox type="info">The mobile app receives <strong>real-time push notifications</strong> for order status updates. Tapping the notification takes you directly to that order's detail screen. Tapping a support reply notification opens the Support screen. Allow notifications when prompted on first launch.</InfoBox>
          <InfoBox type="info">After <strong>logging in</strong>, the app automatically fetches your full profile (verified status, referral code, phone, etc.), cart, wishlist, orders, and addresses — everything updates instantly without needing to refresh or restart.</InfoBox>
          <InfoBox type="tip">Your <strong>referral code</strong> is visible in the Account screen. Tap <strong>Copy</strong> to copy it to clipboard, or tap <strong>Share</strong> to send it via WhatsApp, email, or any app — friends who use your code get a discount and you earn wallet credits.</InfoBox>
          <InfoBox type="tip">The mobile app gives <strong>haptic feedback</strong> (vibration) on key actions — adding to cart, toggling wishlist, removing items — so you always feel confirmation without looking at the screen.</InfoBox>
          <InfoBox type="tip">The app uses the <strong>real Oroganix logo</strong> (from your S3 bucket) in the top bar, auth screen, floating header, and order details — consistent with the website branding.</InfoBox>
          <InfoBox type="tip">During checkout, if you have <strong>wallet credits</strong> or <strong>loyalty points</strong>, the app shows Apply/Redeem cards. Tap <strong>Apply</strong> to use wallet credits or <strong>Redeem</strong> to convert loyalty points (1 point = ₹0.10). Both discounts appear in the price breakdown. Tap <strong>Remove</strong> to undo.</InfoBox>
          <InfoBox type="info">If the Featured Products section shows a <strong>"Server is starting up"</strong> message, the backend server is on a free hosting plan and takes a moment to wake up. The app <strong>automatically retries up to 3 times</strong> — you will see "Server warming up (1/3)" below the skeleton cards. You can also tap <strong>Retry</strong> to reload manually at any time.</InfoBox>
        </Section>

        {/* ═══ 18. ORDER STATUS GUIDE ═══ */}
        <Section id="order-flow" title="Order Status Reference Guide" icon={CheckCircle} color="#16a34a">
          <p className="text-sm text-gray-600 mb-3">Complete reference for all possible order statuses:</p>
          <div className="grid grid-cols-1 gap-2">
            {[
              { code: 0, label: 'Pending',          color: '#d97706', desc: 'Order placed, awaiting admin confirmation. Payment may be pending for online orders.', who: 'Auto (on order creation)' },
              { code: 1, label: 'Confirmed',         color: '#2563eb', desc: 'Admin has confirmed the order. A confirmation email is sent to the customer.', who: 'Admin' },
              { code: 2, label: 'Processing',        color: '#7c3aed', desc: 'Order is being packed and prepared for shipping.', who: 'Admin' },
              { code: 3, label: 'Shipped',           color: '#0891b2', desc: 'Order handed over to courier. Tracking number added. Customer gets shipment email.', who: 'Admin' },
              { code: 4, label: 'Out for Delivery',  color: '#ea580c', desc: 'Package is with the last-mile delivery agent. Expected same-day delivery.', who: 'Admin' },
              { code: 5, label: 'Delivered',         color: '#16a34a', desc: 'Order successfully delivered. Loyalty points are automatically credited. Invoice is finalized.', who: 'Admin / Delivery OTP' },
              { code: 6, label: 'Cancelled',         color: '#dc2626', desc: 'Order cancelled. Stock is restored. Refund is issued for online paid orders.', who: 'Admin or Customer' },
              { code: 7, label: 'Return Requested',  color: '#d97706', desc: 'Customer has requested to return the order. Awaiting admin action.', who: 'Customer' },
              { code: 8, label: 'Returned',          color: '#6b7280', desc: 'Return approved and product received back. Inventory restored.', who: 'Admin' },
              { code: 9, label: 'Refunded',          color: '#16a34a', desc: 'Refund has been processed to the original payment method (Razorpay) or as wallet credit for COD.', who: 'Admin (auto Razorpay)' },
            ].map(s => (
              <div key={s.code} className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 p-3">
                <StatusBadge label={s.label} color={s.color} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 leading-relaxed">{s.desc}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Changed by: {s.who}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Footer */}
        <div className="mt-12 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
          <p>AyurVeda Desi Foods — User Manual · Last updated 2026 · For technical queries see Developer Docs</p>
        </div>

      </main>
    </div>
  )
}
