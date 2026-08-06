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
  { id: 'admin-categories', label: 'Admin: Categories',      icon: ShoppingCart },
  { id: 'admin-brands',     label: 'Admin: Brands',          icon: Tag },
  { id: 'admin-variants',   label: 'Admin: Variants',        icon: Package },
  { id: 'admin-bundles',    label: 'Admin: Bundles',          icon: Package },
  { id: 'admin-blog',       label: 'Admin: Blog',            icon: BookOpen },
  { id: 'admin-subscriptions', label: 'Admin: Subscriptions', icon: RotateCcw },
  { id: 'admin-visitors',   label: 'Admin: Visitors',        icon: BarChart3 },
  { id: 'admin-settings',   label: 'Admin: Settings',        icon: Settings },
  { id: 'admin-pincodes',   label: 'Admin: Pincodes',        icon: MapPin },
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
  const [tocOpen, setTocOpen] = useState(false)

  const scrollTo = (id: string) => {
    setActiveSection(id)
    setTocOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="flex flex-col md:flex-row gap-0 -m-6 min-h-screen bg-gray-50">

      {/* ── Mobile TOC toggle bar ── */}
      <div className="md:hidden flex items-center justify-between bg-white border-b px-4 py-2.5 sticky top-0 z-10">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <BookOpen size={15} className="text-green-600" /> User Manual
        </div>
        <button onClick={() => setTocOpen(o => !o)} className="text-xs text-green-600 font-semibold border border-green-200 rounded-lg px-3 py-1.5">
          {tocOpen ? 'Close' : 'Contents'}
        </button>
      </div>

      {/* ── Left TOC ── */}
      <aside className={`${tocOpen ? 'flex' : 'hidden'} md:flex w-full md:w-64 shrink-0 bg-white border-r border-gray-200 md:sticky md:top-0 md:h-screen overflow-y-auto flex-col`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-green-600" />
            <div>
              <p className="font-bold text-gray-900 text-sm">User Manual</p>
              <p className="text-xs text-gray-400">Oroganix</p>
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
              <p className="text-green-200 text-sm">Oroganix Platform</p>
            </div>
          </div>
          <p className="text-green-100 text-sm leading-relaxed max-w-2xl">
            This comprehensive guide covers every feature of the Oroganix platform — from how customers browse and buy products, to how administrators manage the entire store. Anyone reading this document will have a complete understanding of how the system works.
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
            <strong>Oroganix</strong> is a full-featured eCommerce platform specialising in authentic Ayurvedic and traditional Indian food products. The platform consists of three parts:
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
          <InfoBox type="info">
            <strong>Testing Guide available:</strong> A full end-to-end QA testing guide covering Admin, Web App, and Mobile is available at{' '}
            <a href="/admin/docs/testing" className="underline font-semibold">Admin → Documentation → Testing Guide</a>.
            It lists every feature's test steps and expected results.
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
              { num: 11, title: 'Receive & Review', body: 'After delivery, customers can rate each product from the order detail page — no need to navigate to the product page. On mobile, tap the amber "Rate This Order" button; on web, click "Review" in the Orders tab. Both support photo upload (up to 5 images per product). Loyalty points are automatically credited.' },
              { num: 12, title: 'Re-order', body: 'On any delivered or cancelled order, a Re-order button lets customers add all items back to cart in one tap and go straight to checkout.' },
              { num: 13, title: 'Return / Refund (if needed)', body: 'Customers can request a return within 7 days of delivery. The admin approves or rejects the request. On approval, the refund is credited to wallet or automatically returned to the original Razorpay payment method. For COD orders, cash refunds are handled manually.' },
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
              ['Category Navigation', 'Use the top navigation bar or homepage category icons to browse by product type. Categories support subcategories — click a parent category to see its children as filter chips.'],
              ['Search Bar', 'Type any keyword — product name, brand, ingredient. Get instant suggestions with brand names and bestseller badges as you type.'],
              ['Product Filters', 'On listing pages, filter by price range, category, brand, rating, or availability. Select a brand from the dropdown to see only that brand\'s products.'],
              ['Product Badges', 'Products may show "Bestseller" (gold badge), discount percentage, and "X+ sold" count. These help identify popular items.'],
              ['Product Specs', 'On the product detail page, scroll down to see product specifications (ingredients, weight, origin, etc.) displayed as a table.'],
              ['Brand Pages', 'Click a brand name on any product page to see all products from that brand.'],
              ['Flash Sales', 'A countdown banner appears on the homepage when a flash sale is active. Products show the discounted price and remaining stock.'],
              ['Recently Viewed', 'A section shows the last products you visited (requires being logged in).'],
              ['Wishlist', 'Click the heart icon on any product to save it. Access all saved items from My Account → Wishlist.'],
              ['Product Q&A', 'Scroll to the Q&A section on any product page to ask a question or read existing answers from other customers or the store team.'],
              ['Pincode Checker', 'Enter your pincode on the product page to confirm delivery availability and estimated days.'],
              ['Product FAQs', 'Admin-written FAQs appear on product pages as collapsible questions and answers. Helps customers find answers without contacting support. Also improves SEO with Google FAQ rich snippets.'],
              ['Newsletter', 'Subscribe to the newsletter via the footer form. Enter your email to receive updates on new products, Ayurvedic tips, and exclusive offers.'],
              ['Policy Pages', 'Privacy Policy, Terms & Conditions, Shipping Policy, and Return Policy pages are accessible from the footer. Content is managed by admin in Company Settings.'],
              ['SEO-friendly URLs', 'Product pages use slug-based URLs (e.g., /product/gokhru-whole-dried) instead of numeric IDs for better search engine ranking and readability.'],
            ]}
          />
          <InfoBox type="tip">Products marked <strong>Out of Stock</strong> show a "Notify Me" button. Enter your email and the system automatically emails you when the product is restocked.</InfoBox>
          <InfoBox type="tip"><strong>Already added to cart?</strong> On the product detail page (mobile), if an item is already in your cart, the quantity row shows a green <strong>"✓ IN CART (n)"</strong> badge showing how many are in your cart. Change the quantity and the button turns amber with <strong>"↻ Update Cart"</strong> — tap it to update the quantity. Tapping <strong>"✓ In Cart"</strong> (when qty unchanged) takes you straight to the cart.</InfoBox>
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
                  { step: '5', label: 'Choose Payment', desc: 'Select from two full-width premium payment cards: Cash on Delivery (pay on arrival, no extra charges) or Online via Razorpay (UPI, debit/credit cards, net banking, wallets — instant confirmation).' },
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
          <p className="text-sm text-gray-600 leading-relaxed">Once an order is placed, customers can track every stage directly from <strong>My Account → Orders</strong> without leaving the page — click <strong>Track Order</strong> on any order card to expand the inline tracking panel.</p>
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <p className="font-semibold text-gray-800 text-sm">What's shown in the inline tracking panel:</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '📊', label: 'Visual progress bar', desc: '6-step progress indicator: Order Placed → Confirmed → Processing → Shipped → Out for Delivery → Delivered' },
                { icon: '📦', label: 'Courier information', desc: 'Courier company name and tracking number shown once the order is shipped.' },
                { icon: '📅', label: 'Estimated delivery', desc: 'Calculated from shipping date + standard delivery days for your pincode.' },
                { icon: '🕐', label: 'Status history', desc: 'A reverse-chronological timeline showing every status change with exact date and time.' },
                { icon: '🧾', label: 'Invoice download', desc: 'The 📄 Invoice button appears in the order header for all confirmed, paid orders. Tap it to download the PDF — if the invoice has not been generated yet it is auto-generated on the spot and opens immediately.' },
                { icon: '↩️', label: 'Cancel & Return', desc: 'Cancel available on Pending/Confirmed orders. Online paid orders: Razorpay refund auto-triggered at cancellation. Return request available within 7 days of delivery.' },
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
          <InfoBox type="tip">For COD orders: payment status shows "Pay on Delivery" until the order is physically delivered. Once the admin marks the order as Delivered, the payment status automatically updates to "Paid". The delivery agent will ask for a 4-digit OTP to confirm delivery.</InfoBox>
        </Section>

        {/* ═══ 7. REVIEWS ═══ */}
        <Section id="reviews" title="Reviews & Ratings" icon={Star} color="#d97706">
          <p className="text-sm text-gray-600 leading-relaxed">Any <strong>logged-in</strong> customer can write a review directly from the product page. Guests see a "Login to write a review" prompt. Reviews submitted via the order page are marked <strong>Verified Purchase</strong>.</p>
          <div className="space-y-3">
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="font-semibold text-sm text-gray-800 mb-2">How to write a review:</p>
              <div className="space-y-2">
                <Step num={1} title="From your order (recommended — Verified Purchase)">Open a delivered order → tap/click "Rate This Order" (mobile: amber button; web: green "Review" button). Rate each product, write a comment, and optionally add up to 5 photos per product.</Step>
                <Step num={2} title="Select a star rating and write your comment">Pick 1–5 stars and describe your experience. You can edit and re-submit — only one review per product per account is saved.</Step>
                <Step num={3} title="Submit">Click Submit Review. Your review may be pending moderation before it appears publicly.</Step>
                <Step num={4} title="From the product page (no Verified Purchase badge)">Scroll to the Customer Reviews section on any product page and submit directly. No order required.</Step>
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
              ['Invoices', 'View and download all generated tax invoices. Each invoice is GST-compliant: shows CGST + SGST (intra-state orders) or IGST (inter-state orders) per line item, seller GSTIN, HSN/SAC codes, FSSAI licence, bank details, and amount-in-words in Indian format.'],
              ['Analytics', 'Revenue charts (daily, weekly, monthly), order stats, product performance.'],
              ['Visitors', 'Live visitor count (real-time via WebSocket — updates instantly when users connect or leave), total/unique page views, daily traffic chart, top pages, device breakdown (desktop/mobile/tablet), browser breakdown. Filter by 24h, 7 days, 30 days, or 90 days.'],
              ['Blog', 'Create and manage blog posts with a full WYSIWYG rich text editor — format text with bold, italic, headings, lists, blockquotes, code blocks, insert images and links, change text color and alignment. Upload cover images, set categories, tags, author name, and SEO meta fields. Posts can be draft, published, or archived. View count tracking. Blog is accessible on both website (/blog) and mobile app.'],
              ['Bundles', 'Create product bundles ("Buy together & save"). Set discount type (flat/percent), select products, and manage bundle images. Customers can add entire bundles to cart.'],
              ['Subscriptions', 'View all auto-reorder subscriptions. See customer, product, frequency, next order date, total orders, and status (active/paused/cancelled).'],
              ['Newsletter', 'View all newsletter subscribers (total, active, unsubscribed). Search, filter, export CSV. Send email campaigns directly — choose Custom Message (subject + body + optional CTA button) or Coupon Campaign (share a coupon code with discount details). A welcome email is automatically sent when someone subscribes. Flash sale creation auto-notifies subscribers when "Notify subscribers" is checked.'],
              ['Banners', 'Create homepage banner slides with images and call-to-action links.'],
              ['Coupons', 'Create global or user-specific discount codes (flat ₹ or % off). Search by user name/email to assign a coupon to a specific customer — only that user will see and can apply it. Leave the user field empty for a coupon available to all users. Set per-user usage limit, total usage cap, min order, max discount cap, and validity dates. At checkout, customers see their available coupons as chips; coupons with an unmet min order appear locked with an "Add ₹X more to unlock" hint. Works on web and mobile app.'],
              ['Flash Sales', 'Create time-limited sales with countdown timers and special prices. Check "Notify newsletter subscribers" when creating a sale to instantly email all active subscribers about the offer.'],
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
              ['Company', 'Manage all company branding and info. Upload your website logo (file upload or URL) — the logo appears in the web header, footer, and mobile app. Fill in company name, GST number, PAN number, primary email, support email, phone, website, and full address. Add Facebook, Instagram, Twitter, and YouTube links — they show in the footer. All four policy pages (Privacy, Terms, Shipping, Return) are edited here. Also fill in FSSAI licence number and bank details (bank name, branch, account number, IFSC) — these appear on tax invoices (required for GST compliance). Save once to update across the entire storefront.'],
              ['Logs', 'Audit trail of all admin actions.'],
              ['Jobs', 'Background task queue status and history.'],
            ]}
          />
        </Section>

        {/* ═══ 11. ADMIN PRODUCTS ═══ */}
        <Section id="admin-products" title="Admin: Managing Products" icon={Package} color="#2d5a3d">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              Products are the core of your store. Every item you sell is a product. The product form has many fields — each one exists for a specific reason. Below is a complete field-by-field explanation so you know exactly what every field does and why it matters.
            </p>

            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="font-semibold text-sm text-gray-800 mb-3">Complete Product Form — Field Reference</p>
              <Table
                headers={['Field', 'What it is', 'Why it matters']}
                rows={[
                  ['Name', 'Product title (e.g., "Organic Triphala Powder")', 'This is the main display name shown everywhere — product cards, search results, cart, invoices, emails.'],
                  ['Slug', 'URL-friendly version of the name (auto-generated from name)', 'Used in product URLs like /product/organic-triphala-powder. Good slugs improve SEO and make links readable when shared.'],
                  ['Category', 'Primary product category (select from dropdown)', 'Determines where the product appears in navigation and category filters. Also auto-fills GST%, HSN Code, and CESS% from the category defaults.'],
                  ['Brand', 'Select from your brands list (e.g., Patanjali, Dabur)', 'Customers can filter products by brand. The brand name shows on product cards and detail pages. Helps customers find all products from a brand they trust.'],
                  ['Price (₹)', 'The actual selling price customers pay', 'This is the price shown on the product card and charged at checkout. Set this to your final selling price after any permanent discounts.'],
                  ['Compare Price / MRP (₹)', 'Original or Maximum Retail Price', 'Shows as a strikethrough price next to the selling price (e.g., ₹599 ₹499). The system automatically calculates and shows a "X% OFF" badge. Leave empty if there is no discount.'],
                  ['Cost Price (₹)', 'Your purchase/manufacturing cost', 'Used internally in admin profit reports and analytics. Never shown to customers. Helps you track margins.'],
                  ['Inventory / Stock', 'Current stock quantity available', 'When this reaches 0, the product automatically shows "Out of Stock" and the Add to Cart button is disabled. The system decreases this number by 1 for each unit sold.'],
                  ['SKU', 'Stock Keeping Unit — your internal product code', 'A unique reference code for inventory management (e.g., TRP-250-ORG). Useful for warehouse operations, bulk imports, and matching with your supplier catalog.'],
                  ['Barcode', 'Product barcode number (EAN/UPC)', 'For scanning with barcode readers in warehouse/fulfillment. Not shown to customers. Leave empty if you do not use barcodes.'],
                  ['Weight (grams)', 'Net weight of the product', 'Shows on the product page as product information. Used for shipping cost calculation if you charge by weight. Important for compliance (net weight must be displayed for food products).'],
                  ['Low Stock Threshold', 'Alert number — notify when stock drops below this', 'When inventory falls below this number, the product appears in Admin → Stock Alerts. Set to 10 if you want to be warned when only 10 units remain so you can reorder from your supplier.'],
                  ['Tags', 'Comma-separated labels (e.g., "bestseller, new, organic")', 'Tags appear as small badges on product cards. Customers can also find products by searching for tags. Use tags to highlight product attributes.'],
                  ['Featured', 'Toggle on/off', 'Featured products appear in the "Featured Products" section on the homepage. Turn this on for products you want to promote prominently. Only a limited number should be featured at a time to keep the homepage curated.'],
                  ['Bestseller', 'Toggle on/off', 'Shows a gold "BESTSELLER" badge on the product card. Turn this on for your top-selling or most popular products. This is a manual flag — you decide which products get the badge.'],
                  ['Status', 'Draft / Active / Inactive', 'Only Active products are visible to customers on the store. Use Draft while you are still setting up the product (filling details, uploading images). Use Inactive to temporarily hide a product without deleting it.'],
                  ['Images', 'Upload up to 20 product photos', 'The first image becomes the main listing image shown on product cards. Additional images show in a gallery on the product detail page. Drag to reorder. Use high-quality images (at least 800x800px).'],
                  ['Short Description', 'Brief product summary (1-2 sentences)', 'Shows in product cards, search results, and category listing pages. Keep it concise — highlight the key benefit.'],
                  ['Long Description', 'Full product details (supports HTML formatting)', 'Shows on the product detail page below the main info. Include ingredients, usage instructions, benefits, warnings, and any other details customers need before purchasing.'],
                  ['GST %', 'Goods and Services Tax rate', 'Auto-filled from the product category when you select a category. Override here if this specific product has a different GST rate. Common rates: 5%, 12%, 18%.'],
                  ['HSN Code', 'Harmonized System Nomenclature code', 'Required on Indian tax invoices. Auto-filled from the category. Each product type has a specific HSN code (e.g., 2106 for food supplements). Check with your accountant if unsure.'],
                  ['CESS %', 'Additional cess tax on top of GST', 'Some product categories have CESS (e.g., tobacco, luxury items). Usually 0 for Ayurvedic food products. Auto-filled from category.'],
                  ['Specifications', 'Key-value pairs (e.g., Ingredient: Amla, Origin: Kerala)', 'Displays as a structured specifications table on the product detail page. Customers can see details like ingredients, origin, shelf life, certifications at a glance without reading the full description.'],
                  ['Meta Title', 'SEO page title (for search engines)', 'Shows in the browser tab and as the clickable title in Google search results. Keep it under 60 characters. Include your product name and a key benefit.'],
                  ['Meta Description', 'SEO description (for search engines)', 'Shows as the description snippet below the title in Google search results. Keep it under 160 characters. Write a compelling summary that makes people want to click.'],
                  ['Focus Keyword', 'Primary SEO keyword for this product', 'Helps you stay consistent with SEO optimization. This is the keyword you want this product to rank for in Google (e.g., "organic triphala powder").'],
                  ['Product Type', 'Simple / Variable / Bundle', 'Simple = single product. Variable = product with variants (sizes/packs). Bundle = a combination of multiple products sold together. Most products are Simple.'],
                  ['Unit', 'Display unit (e.g., 50g, 100ml, 1kg)', 'Shows next to the price on the product page and cards (e.g., "₹499 / 50g"). Essential for herbs, powders, and liquids sold in specific pack sizes.'],
                  ['Tax Included', 'Toggle: is the selling price inclusive of GST?', 'When ON, the listed price already includes GST — no extra tax is added at checkout. When OFF (default), GST is added separately in the checkout price breakdown.'],
                  ['Shipping Class', 'Standard / Free / Heavy / Fragile', 'Determines which shipping rate applies. Standard = normal charges. Free = no shipping fee. Heavy = higher shipping fee. Fragile = special handling fee.'],
                  ['Allow Backorder', 'Toggle: accept orders when stock is 0', 'When ON, customers can order even when stock is zero — useful for made-to-order or pre-order products. When OFF (default), out-of-stock products cannot be ordered.'],
                  ['Min Order Qty', 'Minimum quantity per order (default: 1)', 'Prevents customers from ordering too few. Set to 2 or more for bulk-only products (e.g., "minimum 3 packs per order"). Cart will reject quantities below this.'],
                  ['Max Order Qty', 'Maximum quantity per order (default: 100)', 'Prevents stock hoarding. Set to a reasonable limit (e.g., 10) if you want to ensure fair distribution. Cart will reject quantities above this.'],
                  ['Is Returnable', 'Toggle: can this product be returned?', 'When OFF, customers cannot request a return for this product after delivery. Essential for food items, herbs, opened supplements, and perishable goods that cannot be resold.'],
                  ['Sort Order', 'Display position number (0, 1, 2...)', 'Controls product ordering in listings. Lower numbers appear first. Products with sort_order=0 show before sort_order=5. Leave at 0 for default ordering.'],
                  ['Highlights', 'Key product features (bullet points)', 'Shows as a quick summary section on the product page. List 3-5 key features customers care about (e.g., "100% Organic", "Lab Tested", "No Preservatives"). Easier to scan than the long description.'],
                  ['Ingredients', 'Complete ingredient list', 'Mandatory for Ayurvedic and food products. Shows in a dedicated "Ingredients" section on the product page. Customers check this for allergies and dietary preferences.'],
                  ['Benefits', 'Health and wellness benefits', 'Shows in a "Benefits" section on the product page. List what the product does (e.g., "Supports digestion", "Boosts immunity"). Helps customers understand the value.'],
                  ['Usage / Dosage', 'How to use the product correctly', 'Shows in a "How to Use" section. For supplements: dosage and timing. For oils: application method. For powders: mixing instructions. Reduces support queries.'],
                  ['Storage Instructions', 'How to store the product', 'Shows on the product page. Important for herbs, oils, and food products (e.g., "Store in a cool dry place", "Refrigerate after opening"). Prevents spoilage complaints.'],
                  ['Warnings', 'Safety, allergy, and precaution information', 'Shows as a highlighted warning box on the product page. Include pregnancy warnings, allergy information, drug interactions, and age restrictions. Required for responsible Ayurvedic product sales.'],
                  ['Video URL', 'Product demo or explainer video URL', 'Embeds a video player on the product page. Use YouTube or direct video URLs. Product videos increase conversion rates by 20-30% as customers can see the product in action.'],
                  ['FSSAI Number', 'FSSAI license number', 'Required for food and supplement products in India. Shows as a compliance badge on the product page. Builds customer trust and is legally required where applicable.'],
                  ['COA / Lab Report URL', 'Certificate of Analysis upload URL', 'Link to the lab test report / certificate. Shows as a "View Lab Report" link on the product page. Especially valuable for B2B customers and quality-conscious buyers.'],
                ]}
              />
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="font-semibold text-sm text-gray-800 mb-3">Adding a New Product — Step by Step</p>
              <div className="space-y-2">
                <Step num={1} title="Admin → Products → Add Product">Fill in the product name. The slug is auto-generated. Add the short and long descriptions.</Step>
                <Step num={2} title="Set Pricing">Enter the selling price. If the product is discounted, set the Compare Price (MRP) to the original price so the discount badge appears.</Step>
                <Step num={3} title="Set Category & Brand">Select the category from the dropdown. GST rate, HSN code, and CESS are auto-filled from the category. Select the brand if applicable.</Step>
                <Step num={4} title="Upload Images">Upload up to 20 product images. Drag to reorder — the first image becomes the main listing image shown on product cards everywhere.</Step>
                <Step num={5} title="Set Inventory">Enter the current stock quantity and SKU. Set a low stock threshold (e.g., 10) to get alerts before you run out.</Step>
                <Step num={6} title="Add Tags & Badges">Add comma-separated tags. Toggle Featured if you want it on the homepage. Toggle Bestseller to add a gold badge.</Step>
                <Step num={7} title="Add Specifications">Add key-value pairs for product specs (ingredients, weight, origin, etc.). These show as a table on the product page.</Step>
                <Step num={8} title="SEO Fields">Fill in meta title and meta description for better Google search ranking. These are separate from the product name and description.</Step>
                <Step num={9} title="Add Variants (Optional)">If the product comes in multiple sizes or packs (e.g., 100g, 250g, 500g), add variants. See the Variants section below for details.</Step>
                <Step num={10} title="Set Status to Active">Only Active products appear on the store. Use Draft while setting up. Click Save.</Step>
              </div>
            </div>

            <Table
              headers={['Bulk Action', 'Purpose']}
              rows={[
                ['Bulk Upload', 'Import hundreds of products from a CSV/Excel file at once. Download the template CSV, fill it in, and upload.'],
                ['Bulk Stock Update', 'Update inventory quantities for multiple products in one go without editing each product individually.'],
                ['Bulk Price Update', 'Change selling prices for multiple products simultaneously. Useful during sales or price revisions.'],
                ['Bulk Status', 'Activate or deactivate multiple products at once. Useful for seasonal products.'],
                ['Bulk Category', 'Re-assign categories for multiple products when reorganizing your store structure.'],
                ['Bulk Images', 'Upload images for multiple products from a ZIP file. Images are matched to products by filename.'],
              ]}
            />

            <InfoBox type="tip">When a product goes out of stock (inventory = 0), it automatically shows as "Out of Stock" to customers and the "Add to Cart" button is disabled. Customers can click "Notify Me" to receive an email when you restock.</InfoBox>
            <InfoBox type="warning">The Compare Price (MRP) must always be higher than the selling Price. If they are the same, no discount badge will show. If Compare Price is lower than Price, customers will see a confusing negative discount.</InfoBox>
            <InfoBox type="info">Cost Price is completely private — it never appears anywhere on the customer-facing website or app. It is only used in admin reports to calculate your profit margins.</InfoBox>
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
                ['Add Tracking', 'After shipping — add courier name and tracking number. The customer is notified instantly on web and mobile via real-time push.'],
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
                  ['Code', 'The coupon code customers enter (e.g., SAVE20). Case-insensitive, stored in uppercase.'],
                  ['Type', 'Flat (₹ off) or Percent (% off).'],
                  ['Value', 'Amount of discount (e.g., 50 for ₹50 off, or 20 for 20% off).'],
                  ['For User', 'Optional — assign to a specific customer by searching their name or email. Leave empty for all users.'],
                  ['Min Order', 'Minimum cart value required to use this coupon. Customers see a "Add ₹X more to unlock" hint if not met.'],
                  ['Max Discount', 'For percent coupons: caps the maximum ₹ discount. (e.g., max ₹200 even if 30% is more)'],
                  ['Usage Limit', 'Total number of times this coupon can be used across all customers (0 = unlimited).'],
                  ['Per User Limit', 'How many times one customer can use this coupon (usually 1).'],
                  ['Valid From / To', 'Date range during which the coupon is active. Expiry date shown on coupon chip at checkout.'],
                ]}
              />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-800 mb-2">Flash Sales</p>
              <p className="text-sm text-gray-600 leading-relaxed">Flash Sales are time-limited promotions with a countdown timer visible on the homepage and product pages.</p>
              <div className="space-y-2 mt-2">
                <Step num={1} title="Admin → Flash Sales → Create">Set title, start/end time, and discount type (flat or percentage).</Step>
                <Step num={2} title="Add Products">Select which products are included in the flash sale. Set a special price per product.</Step>
                <Step num={3} title="Set Stock Limit (Optional)">Limit how many units of each product can be sold at the flash price. Once reached, that product charges the regular price.</Step>
                <Step num={4} title="Set Max Uses (Optional)">Maximum total number of orders that can receive the flash sale discount. Example: Max Uses = 2 means only 2 orders (across all customers) get the discounted price. After 2 orders, the sale stops applying — even if the sale is still active. Leave blank for unlimited orders.</Step>
                <Step num={5} title="Activate">Set is_active to true. The banner automatically appears on the homepage.</Step>
              </div>
              <p className="text-sm text-gray-500 mt-2">The <strong>"Used:"</strong> count on the flash sales list shows how many orders have already used the sale. When it reaches Max Uses, the discount stops automatically.</p>
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

        {/* ═══ ADMIN: CATEGORIES ═══ */}
        <Section id="admin-categories" title="Admin: Categories" icon={ShoppingCart} color="#2563eb">
          <p className="text-sm text-gray-600 leading-relaxed">
            Categories organize your products into logical groups so customers can find what they need. Think of categories as the aisles in a physical store — "Digestive Care", "Immunity Boosters", "Hair Care", etc. Without categories, customers would have to scroll through every single product. Categories also affect SEO (search engine ranking), tax defaults, and homepage layout.
          </p>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="font-semibold text-sm text-gray-800 mb-3">Category Form — Complete Field Reference</p>
            <Table
              headers={['Field', 'What it is', 'Why it matters']}
              rows={[
                ['Name', 'The category name displayed to customers (e.g., "Immunity Boosters")', 'Appears in the top navigation bar, category filter sidebar, product cards, and mobile app browse screen. Choose clear, customer-friendly names.'],
                ['Slug', 'URL-friendly version of the name (auto-generated from name)', 'Used in URLs like /category/immunity-boosters. Good slugs improve SEO and make links readable when shared on social media. You can edit the slug manually if needed.'],
                ['Parent Category', 'Select another category as the parent (dropdown)', 'Creates a subcategory hierarchy. For example, "Churna" under "Digestive Care". Leave empty (None) for top-level categories. Subcategories appear as filter chips when a customer clicks the parent category.'],
                ['Sort Order', 'A number (0, 1, 2, 3...) controlling display position', 'Lower numbers appear first in navigation and filter lists. Categories with sort_order=0 show before sort_order=5. If two categories have the same sort order, they are sorted alphabetically. Use this to put your most important categories first.'],
                ['Featured', 'Toggle on/off', 'Featured categories appear in special homepage sections (e.g., "Shop by Category" cards on the homepage). Turn this on for your most popular or promoted categories. Non-featured categories still appear in navigation — they just do not get a special spot on the homepage.'],
                ['GST %', 'Default GST tax rate for products in this category', 'When you create a product and select this category, the GST% field on the product auto-fills from here. Saves time when all products in a category share the same tax rate. You can still override GST per product if needed.'],
                ['HSN Code', 'Harmonized System Nomenclature code for tax classification', 'Required for Indian GST tax invoices. Each product type has a standard HSN code. Setting it at the category level auto-fills it on all products in this category, so you do not have to look it up for every product.'],
                ['CESS %', 'Additional cess tax on top of GST', 'Some product categories have additional CESS (e.g., tobacco, aerated drinks). For most Ayurvedic food products this is 0. Set it here so it auto-fills on products.'],
                ['Image', 'Category display image (square recommended)', 'Shows on category cards on the homepage "Shop by Category" section and in the mobile app category browser. Use a clear, representative image (e.g., a photo of immunity products for the Immunity category).'],
                ['Banner', 'Full-width banner image (1200x400px recommended)', 'Shows at the top of the category page when customers browse this category. Creates a professional, branded look for each category. If no banner is set, the category page shows a plain header.'],
                ['Description', 'Text description of the category', 'Shown on the category landing page below the banner. Also helps with SEO — Google indexes this text. Describe what types of products are in this category and their benefits.'],
              ]}
            />
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="font-semibold text-sm text-gray-800 mb-3">Creating a Category — Step by Step</p>
            <div className="space-y-2">
              <Step num={1} title="Admin → Categories → Add Category">Click the Add Category button to open the form.</Step>
              <Step num={2} title="Enter Name and Description">Type the category name. The slug is auto-generated. Add a description for SEO.</Step>
              <Step num={3} title="Set Parent (if subcategory)">If this is a subcategory, select the parent from the dropdown. Leave empty for top-level.</Step>
              <Step num={4} title="Set Sort Order">Enter a number to control position. Use 0 for the first category, 1 for the second, etc.</Step>
              <Step num={5} title="Toggle Featured">Turn on Featured if you want this category to appear on the homepage.</Step>
              <Step num={6} title="Set Tax Defaults">Enter GST%, HSN Code, and CESS%. These will auto-fill on every product you create in this category.</Step>
              <Step num={7} title="Upload Images">Upload the category image (for cards) and banner image (for the category page header).</Step>
              <Step num={8} title="Save">Click Save. The category is now available in the product form dropdown and in customer navigation.</Step>
            </div>
          </div>

          <InfoBox type="tip"><strong>Sort Order tip:</strong> Use increments of 10 (0, 10, 20, 30...) instead of 1, 2, 3. This way, if you later need to insert a category between two existing ones, you have room (e.g., insert at 15 between 10 and 20) without renumbering everything.</InfoBox>
          <InfoBox type="info"><strong>Featured vs. non-Featured:</strong> All categories appear in navigation menus and filter dropdowns regardless of the Featured toggle. Featured only controls whether the category gets a prominent card/section on the homepage. Think of it as "spotlight" — turning it on puts the category in the spotlight.</InfoBox>
          <InfoBox type="warning">Deleting a category does not delete its products. The products will become uncategorized. Reassign their category before deleting to keep your store organized.</InfoBox>
        </Section>

        {/* ═══ ADMIN: BRANDS ═══ */}
        <Section id="admin-brands" title="Admin: Brands" icon={Tag} color="#7c3aed">
          <p className="text-sm text-gray-600 leading-relaxed">
            Brands represent the manufacturers or companies behind your products (e.g., Patanjali, Dabur, Himalaya). Managing brands lets customers filter products by the brands they trust. Each product can be assigned to one brand.
          </p>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="font-semibold text-sm text-gray-800 mb-3">Brand Form — Complete Field Reference</p>
            <Table
              headers={['Field', 'What it is', 'Why it matters']}
              rows={[
                ['Name', 'Brand name (e.g., "Patanjali", "Dabur", "Himalaya")', 'Shows on product cards next to the product name, in brand filter dropdowns, and on brand detail pages. Use the official brand name.'],
                ['Slug', 'URL-friendly version of the name (auto-generated)', 'Used for brand pages like /brand/patanjali and for SEO. Customers can share brand page links.'],
                ['Logo', 'Brand logo image (square or transparent PNG recommended)', 'Displayed next to the brand name on product pages and in the brand filter. Use the official brand logo for recognition.'],
                ['Description', 'About the brand (text)', 'Can be shown on brand detail pages. Describe the brand history, values, and what makes them special. Also helps with SEO.'],
                ['Sort Order', 'A number controlling display position in lists', 'Controls the order in which brands appear in the brand filter dropdown on product listing pages. Lower numbers appear first. Use this to put your most popular brands at the top of the filter.'],
                ['Active', 'On/off toggle', 'Inactive brands will not appear in the brand filter dropdown or on the product creation form. Products already assigned to an inactive brand still show the brand name, but new products cannot be assigned to it. Use this to retire brands you no longer carry.'],
              ]}
            />
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="font-semibold text-sm text-gray-800 mb-3">Creating a Brand — Step by Step</p>
            <div className="space-y-2">
              <Step num={1} title="Admin → Brands → Add Brand">Click Add Brand to open the form.</Step>
              <Step num={2} title="Enter Name">Type the brand name. The slug is auto-generated.</Step>
              <Step num={3} title="Upload Logo">Upload the brand logo. Use a transparent PNG or a square image for best appearance.</Step>
              <Step num={4} title="Add Description">Write a brief description of the brand for the brand detail page.</Step>
              <Step num={5} title="Set Sort Order">Enter a number. Lower numbers appear first in the brand filter. Set your top brands to 0 or 1.</Step>
              <Step num={6} title="Keep Active toggled on">Active brands appear in filters and the product form. Turn off only for discontinued brands.</Step>
              <Step num={7} title="Save">The brand is now available when creating or editing products.</Step>
            </div>
          </div>

          <InfoBox type="tip">When customers click a brand name on any product page, they see all products from that brand on a dedicated brand page. This is great for brand-loyal customers.</InfoBox>
          <InfoBox type="info">The Sort Order for brands specifically controls the order in the brand filter dropdown that customers see on product listing pages. If you carry 50 brands but 3 are your best sellers, set those 3 to sort order 0, 1, 2 so they appear at the top of the filter.</InfoBox>
        </Section>

        {/* ═══ ADMIN: VARIANTS ═══ */}
        <Section id="admin-variants" title="Admin: Product Variants" icon={Package} color="#ea580c">
          <p className="text-sm text-gray-600 leading-relaxed">
            Variants let you sell different versions of the same product — for example, a "Triphala Powder" that comes in 100g, 250g, and 500g packs, each with its own price and stock. Without variants, you would have to create three separate products. With variants, customers see one product listing with a size selector.
          </p>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="font-semibold text-sm text-gray-800 mb-2">When to use variants vs. separate products</p>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Use variants when the products are the same item in different sizes, quantities, or packs. Use separate products when the items are fundamentally different (e.g., Triphala Powder vs. Triphala Tablets are different products, not variants).
            </p>
            <Table
              headers={['Example', 'Approach']}
              rows={[
                ['Triphala Powder in 100g, 250g, 500g', 'One product with 3 variants — same product, different sizes'],
                ['Chyawanprash 500g in Regular and Sugar-Free', 'One product with 2 variants — same product, different formulations'],
                ['Amla Juice and Amla Powder', 'Two separate products — fundamentally different items'],
              ]}
            />
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="font-semibold text-sm text-gray-800 mb-3">Variant Form — Complete Field Reference</p>
            <Table
              headers={['Field', 'What it is', 'Why it matters']}
              rows={[
                ['Label', 'Variant name shown to the customer (e.g., "250g Pack", "Family Size 1kg")', 'This is what customers see in the variant selector on the product page. Make it descriptive and clear.'],
                ['SKU', 'Unique stock code for this specific variant', 'Each variant needs its own SKU because they are tracked separately in inventory. Your warehouse uses this to pick the right size.'],
                ['Price (₹)', 'Selling price for this variant', 'Each variant can have a different price. The 500g pack might be ₹399 while the 100g pack is ₹99. The product page updates the displayed price when the customer selects a variant.'],
                ['Compare Price / MRP (₹)', 'Original price for this variant', 'Shows as a strikethrough price for this variant. Creates a "X% OFF" badge specific to this variant size.'],
                ['Cost Price (₹)', 'Your purchase cost for this variant', 'Used in admin profit reports. Never shown to customers. Track different costs for different sizes.'],
                ['Inventory / Stock', 'Stock quantity for this specific variant', 'Each variant tracks inventory independently. The 100g pack might have 50 units while the 500g pack has 20. When a variant reaches 0, it shows "Out of Stock" but other variants of the same product may still be available.'],
                ['Weight (grams)', 'Weight of this specific variant', 'Shows on the product page when this variant is selected. Important for accurate shipping cost calculation.'],
                ['Barcode', 'Barcode number for this variant', 'Each size/variant has its own barcode for warehouse scanning. Leave empty if not using barcodes.'],
                ['Image URL', 'Specific image for this variant', 'If different variants look different (e.g., different colored packaging), you can set a variant-specific image. When the customer selects this variant, the product image switches to this one.'],
                ['Sort Order', 'Display order in the variant selector', 'Controls which variant appears first in the dropdown/selector. Lower numbers first. Usually list smallest size first (100g=0, 250g=1, 500g=2).'],
                ['Active', 'Whether this variant is available for purchase', 'Inactive variants are hidden from customers. Use this to temporarily remove a size without deleting the variant data. Useful when a specific size is out of production.'],
              ]}
            />
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="font-semibold text-sm text-gray-800 mb-3">Adding Variants to a Product</p>
            <div className="space-y-2">
              <Step num={1} title="Go to the product edit page">Open the product you want to add variants to.</Step>
              <Step num={2} title="Scroll to the Variants section">Click "Add Variant" to add a new row.</Step>
              <Step num={3} title="Fill in each variant">Enter the label, price, stock, SKU, and other fields for each size/option.</Step>
              <Step num={4} title="Set sort order">Number them 0, 1, 2... so they display in the right order (smallest first, usually).</Step>
              <Step num={5} title="Save the product">All variants are saved together with the product.</Step>
            </div>
          </div>

          <InfoBox type="warning">When a product has variants, the main product price becomes the "starting from" price. The actual price changes based on which variant the customer selects. Make sure every variant has its own price set.</InfoBox>
          <InfoBox type="tip">You can also manage all variants across all products from <strong>Admin → Variants</strong>. This gives you a table view of every variant in the system, filterable by product. Useful for bulk inventory checks.</InfoBox>
        </Section>

        {/* ═══ ADMIN: BUNDLES ═══ */}
        <Section id="admin-bundles" title="Admin: Product Bundles" icon={Package} color="#16a34a">
          <p className="text-sm text-gray-600 leading-relaxed">
            Bundles let you group multiple products together and offer them at a discounted price — like a "Buy Together and Save" deal. For example, an "Immunity Starter Kit" might include Chyawanprash, Giloy Tablets, and Tulsi Drops for 20% off the combined price. Bundles increase average order value because customers get a deal by buying more.
          </p>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="font-semibold text-sm text-gray-800 mb-3">Bundle Form — Complete Field Reference</p>
            <Table
              headers={['Field', 'What it is', 'Why it matters']}
              rows={[
                ['Name', 'Bundle name (e.g., "Immunity Starter Kit", "Digestive Health Pack")', 'This is the title customers see. Make it descriptive and appealing. It should convey what the bundle is for.'],
                ['Description', 'What is included and why the customer should buy this bundle', 'Explain the value proposition — "Everything you need to boost immunity this season" or "Save 25% compared to buying individually". Shown on the bundle card.'],
                ['Discount Type', 'Percent or Flat — how the bundle discount is calculated', 'Percent: takes a percentage off the total of all included products. Flat: subtracts a fixed rupee amount. Choose Percent for proportional savings ("20% off") or Flat for a fixed deal ("Save ₹200").'],
                ['Discount Value', 'The discount amount (e.g., 20 for 20% off, or 200 for ₹200 off)', 'For Percent type: 20 means 20% off the combined price of all products. For Flat type: 200 means ₹200 off. The customer sees both the original total and the bundle price.'],
                ['Products', 'Select which products are included in the bundle', 'Choose 2 or more products that make sense together. Customers see the individual products listed with their prices, plus the bundle discount. They can add the entire bundle to cart in one click.'],
                ['Image', 'Display image for the bundle', 'A custom image showing all the bundled products together. If not set, the system may show the first product image. A good bundle image helps sell the package deal.'],
                ['Active', 'Whether the bundle is visible to customers', 'Only active bundles appear on the store. Set to inactive to pause a bundle without deleting it — useful for seasonal bundles you want to bring back later.'],
              ]}
            />
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="font-semibold text-sm text-gray-800 mb-3">Creating a Bundle — Step by Step</p>
            <div className="space-y-2">
              <Step num={1} title="Admin → Bundles → Create Bundle">Click the Create Bundle button.</Step>
              <Step num={2} title="Name and Describe the bundle">Give it a clear name. Write a description explaining the value.</Step>
              <Step num={3} title="Choose Discount Type and Value">Select Percent or Flat, then enter the discount amount.</Step>
              <Step num={4} title="Select Products">Add the products that make up this bundle. Choose products that complement each other.</Step>
              <Step num={5} title="Upload a Bundle Image">Use a photo showing all products together, or a designed graphic.</Step>
              <Step num={6} title="Set Active and Save">Toggle Active on so customers can see and buy the bundle.</Step>
            </div>
          </div>

          <InfoBox type="tip"><strong>Bundle strategy:</strong> Create bundles around themes — "Morning Wellness Routine", "Winter Immunity Pack", "Starter Kit for New Customers". Themed bundles sell better than random groupings.</InfoBox>
          <InfoBox type="info">When a customer adds a bundle to cart, each product in the bundle is added as an individual line item with the discount applied proportionally. Inventory is tracked per product, not per bundle.</InfoBox>
        </Section>

        {/* ═══ ADMIN: BLOG ═══ */}
        <Section id="admin-blog" title="Admin: Blog" icon={BookOpen} color="#0891b2">
          <p className="text-sm text-gray-600 leading-relaxed">
            The blog lets you publish articles about Ayurveda, health tips, recipes, product guides, and more. Blog posts drive organic traffic from Google (SEO), establish your store as a knowledge authority, and give you content to share on social media. Each post has its own URL that can be indexed by search engines.
          </p>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="font-semibold text-sm text-gray-800 mb-3">Blog Post Form — Complete Field Reference</p>
            <Table
              headers={['Field', 'What it is', 'Why it matters']}
              rows={[
                ['Title', 'Blog post headline (e.g., "5 Ayurvedic Remedies for Better Digestion")', 'The main headline shown at the top of the post and in the blog listing page. Write clear, engaging titles that tell readers what they will learn.'],
                ['Slug', 'URL-friendly version of the title (auto-generated)', 'Used in the blog post URL like /blog/5-ayurvedic-remedies-better-digestion. Good slugs help with SEO. You can edit the slug manually.'],
                ['Excerpt', 'Short preview text (1-2 sentences)', 'Shown in the blog listing page as a preview under each post title. Should summarize the article and entice readers to click and read the full post.'],
                ['Content', 'Full article text (supports HTML formatting)', 'The complete blog post body. You can format text with headings, bold, italic, lists, links, and embed images within the content. Write detailed, helpful articles.'],
                ['Cover Image', 'Hero image shown at the top of the post', 'The main visual for the blog post. Shows at the top of the article and as a thumbnail in the blog listing. Use a high-quality, relevant image (1200x630px recommended for social media sharing).'],
                ['Category', 'Blog category (e.g., "Ayurveda Tips", "Recipes", "Product Guides")', 'Organizes blog posts into topics. Readers can browse posts by category. Helps keep your blog organized as you publish more articles.'],
                ['Author', 'Author name displayed on the post', 'Shows below the title as "By [Author Name]". Can be the store name, a team member, or a health expert for credibility.'],
                ['Tags', 'Comma-separated topic tags (e.g., "digestion, gut health, triphala")', 'Help readers find related posts. Tags can be used for filtering and also help with SEO by associating posts with specific keywords.'],
                ['Status', 'Draft / Published / Archived', 'Draft: only visible in admin, not on the website. Published: live and visible to all visitors. Archived: hidden from the blog listing but the URL still works (for old posts you do not want to delete).'],
                ['Meta Title', 'SEO page title (for search engines)', 'Shows in the browser tab and as the title in Google search results. If not set, the post Title is used. Customize this to optimize for specific search keywords.'],
                ['Meta Description', 'SEO description (for search engines)', 'Shows as the snippet below the title in Google search results. Write a compelling 150-character summary that makes people want to click your article.'],
              ]}
            />
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="font-semibold text-sm text-gray-800 mb-3">Publishing a Blog Post</p>
            <div className="space-y-2">
              <Step num={1} title="Admin → Blog → Create Post">Click Create Post to open the editor.</Step>
              <Step num={2} title="Write the Title and Content">Enter a compelling headline. Write the full article in the content editor with formatting.</Step>
              <Step num={3} title="Add an Excerpt">Write a 1-2 sentence preview for the blog listing page.</Step>
              <Step num={4} title="Upload a Cover Image">Choose a high-quality hero image for the top of the article.</Step>
              <Step num={5} title="Set Category, Author, and Tags">Organize the post with a category, set the author name, and add relevant tags.</Step>
              <Step num={6} title="Fill SEO Fields">Add a meta title and meta description for search engine optimization.</Step>
              <Step num={7} title="Set Status to Published">Change the status from Draft to Published. The post is now live on your website.</Step>
            </div>
          </div>

          <InfoBox type="tip">Blog posts that answer common questions ("What is Triphala?", "How to use Chyawanprash?") rank well on Google and bring new customers who are searching for Ayurvedic information.</InfoBox>
          <InfoBox type="info">Each blog post tracks its view count automatically. Check view counts from the blog list in admin to see which topics resonate most with your audience.</InfoBox>
        </Section>

        {/* ═══ ADMIN: SUBSCRIPTIONS ═══ */}
        <Section id="admin-subscriptions" title="Admin: Subscriptions (Auto-Reorder)" icon={RotateCcw} color="#d97706">
          <p className="text-sm text-gray-600 leading-relaxed">
            Subscriptions let customers set up automatic recurring orders for products they use regularly. For example, a customer who uses Chyawanprash daily can subscribe to receive a new jar every 30 days without having to remember to reorder. This ensures they never run out, and it gives your store predictable recurring revenue.
          </p>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="font-semibold text-sm text-gray-800 mb-3">What the Admin Sees</p>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              The <strong>Admin → Subscriptions</strong> page shows a table of all active, paused, and cancelled subscriptions across all customers. This is a read-only view — subscriptions are created by customers from the product page.
            </p>
            <Table
              headers={['Column', 'What it shows', 'Why it matters']}
              rows={[
                ['Customer', 'Name and email of the subscriber', 'Identifies who has the subscription. Click to view their full account.'],
                ['Product', 'Which product is being auto-reordered', 'Shows the product name and variant (if applicable). Helps you forecast demand.'],
                ['Frequency', 'How often the order repeats (e.g., every 15 days, 30 days, 60 days)', 'Set by the customer when they subscribe. Common frequencies are monthly (30 days) for daily-use products.'],
                ['Next Order Date', 'When the next automatic order will be placed', 'Helps you ensure stock is available before this date. If the product is out of stock on this date, the auto-order may fail.'],
                ['Total Orders', 'How many times this subscription has successfully ordered', 'Shows the lifetime value of this subscription. A subscription with 12 total orders means 12 months of repeat revenue.'],
                ['Status', 'Active / Paused / Cancelled', 'Active: next order will be placed automatically. Paused: customer has temporarily stopped the subscription. Cancelled: subscription is permanently stopped.'],
              ]}
            />
          </div>

          <InfoBox type="tip"><strong>Forecast demand:</strong> Check the Next Order Date column regularly. If many subscriptions for the same product are due next week, make sure you have enough stock. Running out means failed auto-orders and unhappy subscribers.</InfoBox>
          <InfoBox type="info">Customers manage their own subscriptions — they can pause, resume, change frequency, or cancel from their account. Admins have a view-only dashboard to monitor all subscriptions across the platform.</InfoBox>
        </Section>

        {/* ═══ ADMIN: VISITORS ═══ */}
        <Section id="admin-visitors" title="Admin: Visitors & Traffic Analytics" icon={BarChart3} color="#16a34a">
          <p className="text-sm text-gray-600 leading-relaxed">
            The Visitors page (<strong>Admin → Visitors</strong>) shows you how many people are visiting your store, which pages they view, and what devices they use. This data helps you understand your audience, identify popular products, and make decisions about marketing and design. The page auto-refreshes every 60 seconds.
          </p>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="font-semibold text-sm text-gray-800 mb-3">Visitor Metrics — What Each Number Means</p>
            <Table
              headers={['Metric', 'What it tells you', 'How to use this information']}
              rows={[
                ['Total Views', 'How many pages were loaded in the selected time period', 'A high number means lots of browsing activity. Compare week over week to see growth trends. If total views are high but orders are low, customers are browsing but not buying — review your product pages and checkout flow.'],
                ['Unique Visitors', 'How many different people visited (counted by unique session)', 'More meaningful than total views because one person can load many pages. This tells you how many actual humans came to your store. Track this to measure marketing effectiveness.'],
                ['Today Views', 'Total page loads today so far', 'Quick check on today\'s traffic. Compare with yesterday at the same time to spot unusual patterns.'],
                ['Today Unique', 'Unique visitors today so far', 'How many different people have visited today. If you ran a social media ad today, this shows if people are responding.'],
                ['Live Now', 'People on your website right now (active in the last 5 minutes)', 'Real-time activity indicator. Useful during flash sales or marketing campaigns to see immediate impact. If you just posted on social media, watch this number spike.'],
                ['Top Pages', 'Most visited pages ranked by view count', 'Shows where customers spend time. If a product page is in the top list, it is getting a lot of interest — make sure it is well-stocked and has great images. If a category page is top, that category is popular.'],
                ['Device Breakdown', 'Desktop vs. Mobile vs. Tablet visitor percentages', 'If 70% of your visitors are on mobile, your mobile experience must be excellent. This helps decide design priorities — if almost no one visits on tablet, you do not need to prioritize tablet layouts.'],
                ['Browser Breakdown', 'Which browsers visitors use (Chrome, Safari, Firefox, etc.)', 'Helps with technical decisions. If 90% of visitors use Chrome, prioritize Chrome testing. If some visitors use older browsers, you may need to ensure compatibility.'],
              ]}
            />
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="font-semibold text-sm text-gray-800 mb-2">Time Period Filters</p>
            <Table
              headers={['Filter', 'What it shows']}
              rows={[
                ['24 Hours', 'Traffic from the last 24 hours. Use for real-time campaign monitoring.'],
                ['7 Days', 'One week of data. Good for comparing weekday vs. weekend traffic patterns.'],
                ['30 Days', 'One month of data. Standard view for monthly performance reviews.'],
                ['90 Days', 'Three months of data. Best for identifying long-term trends and seasonal patterns.'],
              ]}
            />
          </div>

          <InfoBox type="tip">Check the <strong>Top Pages</strong> list weekly. If a product page is getting high views but the product has few orders, it might have a pricing issue, unclear description, or poor images that are preventing conversions.</InfoBox>
          <InfoBox type="info">The traffic chart shows a visual graph of daily visitor counts over the selected period. Look for spikes (marketing campaigns working) and dips (website issues or low-traffic days).</InfoBox>
        </Section>

        {/* ═══ ADMIN: SETTINGS ═══ */}
        <Section id="admin-settings" title="Admin: Platform Settings" icon={Settings} color="#6b7280">
          <p className="text-sm text-gray-600 leading-relaxed">
            The Settings page (<strong>Admin → Settings</strong>) controls platform-wide configuration that affects every order. These settings directly impact what customers pay at checkout — in both the web app and the mobile app.
          </p>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="font-semibold text-sm text-emerald-900 mb-1">⚡ Quick Edit — Delivery &amp; Charges Card</p>
            <p className="text-xs text-emerald-800 leading-relaxed">At the top of the Settings page is a <strong>Delivery &amp; Charges</strong> panel with three clearly labelled fields. Type the new value and click <strong>Save</strong> — no need to know any setting key names. Changes apply instantly to cart totals, checkout, and order processing across web and mobile.</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="font-semibold text-sm text-gray-800 mb-3">Settings — Complete Field Reference</p>
            <Table
              headers={['Setting', 'What it controls', 'How it works']}
              rows={[
                ['Free Delivery Above (₹)', 'Cart threshold for automatic free delivery', 'Orders at or above this amount get free delivery. The cart page shows an animated progress bar ("Add ₹X more for free delivery") to encourage customers to reach the threshold. Applies to web cart, web checkout, mobile cart, and mobile checkout.'],
                ['Delivery Charge (₹)', 'Shipping fee for orders below the free delivery threshold', 'Added to orders whose cart total is below the Free Delivery Above limit. Set to 0 to make all deliveries free regardless of order value.'],
                ['Platform Fee (₹)', 'Service/convenience charge on every order', 'A fixed fee added to every order. Shows as a separate line item at checkout. Set to 0 if you do not charge a platform fee.'],
              ]}
            />
          </div>

          <InfoBox type="tip"><strong>Free Delivery strategy:</strong> Set the threshold slightly above your average order value. If customers typically spend ₹350, set it to ₹499 — many customers add one more item to qualify, increasing average order value. The progress bar in the cart reinforces this.</InfoBox>
          <InfoBox type="warning">Changes take effect immediately for all new orders. Orders already placed keep the charges calculated at the time of checkout.</InfoBox>
        </Section>

        {/* ═══ ADMIN: PINCODES ═══ */}
        <Section id="admin-pincodes" title="Admin: Delivery Pincodes" icon={MapPin} color="#dc2626">
          <p className="text-sm text-gray-600 leading-relaxed">
            Pincodes define where you can deliver. Customers enter their pincode on the product page and during checkout to check if delivery is available to their area. If the pincode is not in your list, the customer sees "Delivery not available to this pincode" and cannot place the order. Managing pincodes lets you control your delivery coverage area.
          </p>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="font-semibold text-sm text-gray-800 mb-3">Pincode Form — Complete Field Reference</p>
            <Table
              headers={['Field', 'What it is', 'Why it matters']}
              rows={[
                ['Pincode', '6-digit Indian postal code (e.g., 110001, 400001)', 'The exact pincode where you can deliver. Customers type this on the product page to check availability. Must be exactly 6 digits.'],
                ['City', 'City name for this pincode (e.g., "New Delhi", "Mumbai")', 'Shows to the customer when they check pincode availability — "Delivery available to Mumbai". Also useful for admin reporting on which cities get the most orders.'],
                ['State', 'State name (e.g., "Delhi", "Maharashtra")', 'Used for address validation and shipping logistics. Shows in order details and invoices.'],
                ['Delivery Days', 'Estimated delivery time to this pincode (e.g., 3, 5, 7)', 'Shows to the customer as "Estimated delivery in X days" on the product page and at checkout. Set realistic estimates based on your courier partner capabilities for each area.'],
                ['Active', 'Whether delivery is currently available to this pincode', 'Only active pincodes accept orders. Set to inactive to temporarily stop delivering to an area (e.g., during floods, lockdowns, or courier issues) without deleting the pincode data.'],
              ]}
            />
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="font-semibold text-sm text-gray-800 mb-3">Managing Pincodes</p>
            <div className="space-y-2">
              <Step num={1} title="Admin → Pincodes → Add Pincode">Enter the pincode, city, state, and estimated delivery days.</Step>
              <Step num={2} title="Set Active to on">This pincode is now serviceable — customers with this pincode can place orders.</Step>
              <Step num={3} title="Review the stats bar">The top of the page shows total pincodes, active pincodes, and inactive pincodes at a glance.</Step>
            </div>
          </div>

          <InfoBox type="tip"><strong>Bulk add:</strong> If you deliver to an entire city, add all pincodes for that city at once. You can find lists of pincodes by city on India Post website.</InfoBox>
          <InfoBox type="warning">If a pincode is not in your list, customers in that area <strong>cannot place orders</strong>. They will see a "Not serviceable" message. Make sure to add all pincodes your courier partner covers.</InfoBox>
          <InfoBox type="info">Setting a pincode to Inactive (instead of deleting it) is useful for temporary delivery suspensions. When the issue is resolved, just toggle it back to Active — no need to re-enter all the data.</InfoBox>
        </Section>

        {/* ═══ 17. MOBILE APP ═══ */}
        <Section id="mobile-app" title="Mobile App" icon={Bell} color="#7c3aed">
          <p className="text-sm text-gray-600 leading-relaxed">The Oroganix mobile app (React Native / Expo) provides the full shopping experience on Android and iOS.</p>
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
              ['Auth', 'Login with email/password, OTP, or Google.'],
              ['Blog', 'Browse blog posts with cover images, categories, and excerpts. Tap any post to read the full article with share button.'],
            ]}
          />
          <InfoBox type="tip">A persistent <strong>bottom navigation bar</strong> appears on all main screens (Home, Browse/Products, Wishlist, Account) so you can switch sections without going back. It uses a frosted glass effect and highlights the active tab.</InfoBox>
          <InfoBox type="info">The mobile app receives <strong>real-time push notifications</strong> for order status updates. Tapping the notification takes you directly to that order's detail screen. Tapping a support reply notification opens the Support screen. Allow notifications when prompted on first launch.</InfoBox>
          <InfoBox type="info">After <strong>logging in</strong>, the app automatically fetches your full profile (verified status, referral code, phone, etc.), cart, wishlist, orders, and addresses — everything updates instantly without needing to refresh or restart.</InfoBox>
          <InfoBox type="tip">Your <strong>referral code</strong> is visible in the Account screen. Tap <strong>Copy</strong> to copy it to clipboard, or tap <strong>Share</strong> to send it via WhatsApp, email, or any app — friends who use your code get a discount and you earn wallet credits.</InfoBox>
          <InfoBox type="tip">The mobile app gives <strong>haptic feedback</strong> (vibration) on key actions — adding to cart, toggling wishlist, removing items — so you always feel confirmation without looking at the screen.</InfoBox>
          <InfoBox type="tip">The app uses the <strong>real Oroganix logo</strong> (from your S3 bucket) in the top bar, auth screen, floating header, and order details — consistent with the website branding.</InfoBox>
          <InfoBox type="tip">After logging in, the <strong>top bar shows your default delivery address</strong> (city + pincode) below the logo. Tap it to jump straight to the Addresses section in your Account. If no address is saved, it shows "Select address ›".</InfoBox>
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
          <p>Oroganix — User Manual · Last updated 2026 · For technical queries see Developer Docs</p>
        </div>

      </main>
    </div>
  )
}
