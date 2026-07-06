'use client'

import { useState } from 'react'
import {
  Code2, Database, Globe, Lock, Zap, Bell, Package, ShoppingCart,
  Users, Tag, BarChart3, MessageSquare, Settings, Cpu, GitBranch,
  Server, Key, ArrowRight, CheckCircle, AlertCircle, Info, Printer,
  Layers, Shield, FileCode, Terminal
} from 'lucide-react'

/* ═══════════════════════════════════════════════════
   TOC SECTIONS
═══════════════════════════════════════════════════ */

const SECTIONS = [
  { id: 'arch',       label: 'Architecture Overview',  icon: Layers },
  { id: 'env',        label: 'Environment Variables',  icon: Key },
  { id: 'db',         label: 'Database Tables',        icon: Database },
  { id: 'auth',       label: 'Auth Flow',              icon: Lock },
  { id: 'api',        label: 'API Reference',          icon: Globe },
  { id: 'sockets',    label: 'Socket Events',          icon: Zap },
  { id: 'order-fsm',  label: 'Order State Machine',    icon: GitBranch },
  { id: 'email',      label: 'Email Triggers',         icon: Bell },
  { id: 'jobs',       label: 'Background Jobs',        icon: Cpu },
  { id: 'modules',    label: 'Backend Modules',        icon: FileCode },
  { id: 'frontend',   label: 'Frontend Structure',     icon: Server },
  { id: 'mobile',     label: 'Mobile App',             icon: Code2 },
  { id: 'deploy',     label: 'Deployment Notes',       icon: Terminal },
]

/* ═══════════════════════════════════════════════════
   REUSABLE COMPONENTS
═══════════════════════════════════════════════════ */

function Section({ id, title, icon: Icon, children }: any) {
  return (
    <section id={id} className="mb-14 scroll-mt-4">
      <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-200">
        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
          <Icon size={18} className="text-slate-700" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 font-mono">{title}</h2>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: (string | any)[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {headers.map(h => <th key={h} className="text-left px-4 py-2.5 font-semibold text-gray-700 whitespace-nowrap">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
              {row.map((cell, j) => <td key={j} className="px-4 py-2.5 text-gray-600 align-top">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-gray-950 text-green-300 rounded-xl p-4 text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap">
      {children}
    </pre>
  )
}

function Chip({ label, color = '#2563eb' }: { label: string; color?: string }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-bold mr-1"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
      {label}
    </span>
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
    <div className="flex gap-3 rounded-xl p-3 border text-xs leading-relaxed" style={{ background: s.bg, borderColor: s.border, color: s.color }}>
      <Icon size={14} style={{ flexShrink: 0, marginTop: 1 }} />
      <div>{children}</div>
    </div>
  )
}

function H3({ children }: { children: any }) {
  return <p className="font-bold text-sm text-gray-800 mt-4 mb-2">{children}</p>
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */

export default function DeveloperDocsPage() {
  const [active, setActive] = useState('arch')
  const scrollTo = (id: string) => { setActive(id); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }

  return (
    <div className="flex -m-6 min-h-screen bg-gray-50">

      {/* ── TOC ── */}
      <aside className="w-60 flex-shrink-0 bg-slate-950 sticky top-0 h-screen overflow-y-auto">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Code2 size={16} className="text-green-400" />
            <div>
              <p className="font-bold text-white text-sm">Developer Docs</p>
              <p className="text-xs text-slate-500">AyurVeda Desi Foods</p>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-0.5">
          {SECTIONS.map(s => {
            const Icon = s.icon
            return (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left text-xs transition-colors ${active === s.id ? 'bg-green-900/40 text-green-300 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                <Icon size={12} /> {s.label}
              </button>
            )
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={() => window.print()} className="w-full flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 bg-slate-900 px-3 py-2 rounded-lg">
            <Printer size={12} /> Print / Save PDF
          </button>
        </div>
      </aside>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto p-8 max-w-4xl">

        {/* Cover */}
        <div className="bg-gray-950 rounded-2xl p-8 mb-10 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center">
              <Code2 size={24} className="text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-mono">Developer Documentation</h1>
              <p className="text-gray-400 text-sm">AyurVeda Desi Foods · Backend + Frontend + Mobile</p>
            </div>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">
            Complete technical reference for the AyurVeda Desi Foods platform. Covers all database tables, API endpoints, authentication, WebSocket events, order state machine, background jobs, and frontend structure.
          </p>
          <div className="flex flex-wrap gap-2 mt-5">
            {['Node.js + Express', 'PostgreSQL', 'Next.js 14', 'React Native Expo 56', 'Socket.io', 'Razorpay', 'Brevo Email', 'Bull + Redis'].map(t => (
              <span key={t} className="bg-white/10 text-xs px-2.5 py-1 rounded-full text-gray-300">{t}</span>
            ))}
          </div>
        </div>

        {/* ═══ TESTING GUIDE NOTICE ═══ */}
        <InfoBox type="tip">
          <strong>Testing Guide:</strong> A full QA test plan covering Admin, Web App, and Mobile App is available at{' '}
          <a href="/admin/docs/testing" className="underline font-semibold">Admin → Documentation → Testing Guide</a>.
          Use it before every release to verify all critical flows end-to-end.
        </InfoBox>

        {/* ═══ ARCHITECTURE ═══ */}
        <Section id="arch" title="Architecture Overview" icon={Layers}>
          <Code>{`
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│  ┌──────────────────┐    ┌──────────────────────────┐   │
│  │  Next.js 14 Web  │    │  React Native (Expo 56)  │   │
│  │  (App Router)    │    │  Android + iOS           │   │
│  └────────┬─────────┘    └───────────┬──────────────┘   │
│           │ REST + Socket.io          │ REST + Push      │
└───────────┼──────────────────────────┼──────────────────┘
            │                          │
┌───────────▼──────────────────────────▼──────────────────┐
│                   BACKEND (Node.js + Express)           │
│                                                         │
│  ┌──────────────┐  ┌───────────┐  ┌────────────────┐   │
│  │  REST API    │  │ Socket.io │  │  Bull Workers  │   │
│  │  (18+ routes)│  │  Server   │  │  (background)  │   │
│  └──────┬───────┘  └─────┬─────┘  └───────┬────────┘   │
│         │                │                │             │
│  ┌──────▼────────────────▼────────────────▼──────────┐  │
│  │               PostgreSQL Database                 │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  External: Razorpay │ Brevo (Email) │ Expo Push         │
└─────────────────────────────────────────────────────────┘
`}</Code>
          <Table
            headers={['Layer', 'Technology', 'Location']}
            rows={[
              ['Backend API', 'Node.js 18+, Express 4, PostgreSQL (pg)', 'backend/'],
              ['WebSockets', 'Socket.io v4.8.1', 'backend/src/socket.js'],
              ['Web Frontend', 'Next.js 14, Tailwind CSS v4, TypeScript', 'frontend/'],
              ['Mobile App', 'React Native, Expo 56, expo-router', 'ayurveda-app/'],
              ['DB', 'PostgreSQL (any version ≥ 14)', 'docker / cloud provider'],
              ['Background Jobs', 'Bull + Redis', 'backend/src/workers/'],
              ['Email', 'Brevo (SibApiV3Sdk)', 'backend/src/utils/emailService.js'],
              ['Payment', 'Razorpay Node SDK', 'backend/src/modules/payments/'],
              ['Push Notifications', 'Expo Server SDK', 'backend/src/utils/pushNotification.js'],
            ]}
          />
        </Section>

        {/* ═══ ENV ═══ */}
        <Section id="env" title="Environment Variables" icon={Key}>
          <InfoBox type="warning">Never commit .env files. Copy .env.example and fill in real values locally and in your deployment platform.</InfoBox>
          <H3>backend/.env</H3>
          <Code>{`# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Server
PORT=5000
NODE_ENV=production

# JWT
JWT_SECRET=your_strong_random_secret_here

# Razorpay (payment gateway)
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_secret_here

# Brevo (email service — formerly Sendinblue)
BREVO_API_KEY=xkeysib-xxxxxxxxxxxx
BREVO_SENDER_EMAIL=noreply@yourstore.com
BREVO_SENDER_NAME=AyurVeda Desi Foods

# Redis (for Bull job queues)
REDIS_URL=redis://localhost:6379

# Expo Push (mobile notifications)
EXPO_ACCESS_TOKEN=your_expo_access_token

# Frontend URL (for CORS + email links)
FRONTEND_URL=https://yourdomain.com

# Google OAuth — web client ID
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
# Google OAuth — Android client ID (mobile app sends this as token audience)
GOOGLE_ANDROID_CLIENT_ID=xxxxx.apps.googleusercontent.com`}</Code>
          <H3>frontend/.env.local</H3>
          <Code>{`# Points to the backend API
NEXT_PUBLIC_API_URL=http://localhost:5000

# Razorpay public key (used on checkout page)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx`}</Code>
          <H3>ayurveda-app/.env (Expo)</H3>
          <Code>{`EXPO_PUBLIC_API_URL=http://localhost:5000`}</Code>
        </Section>

        {/* ═══ DATABASE ═══ */}
        <Section id="db" title="Database Tables" icon={Database}>
          <InfoBox type="info">All tables are created automatically on server start via <code>backend/src/database/init.js</code>. Run the backend once to initialise the schema.</InfoBox>

          <H3>Core Commerce Tables</H3>
          <Table
            headers={['Table', 'Primary Key', 'Key Columns', 'Notes']}
            rows={[
              ['users', 'id (serial)', 'name, email, phone, password_hash, role (0-3), wallet_balance, loyalty_points, referral_code', 'role: 0=superadmin, 1=admin, 2=staff, 3=customer'],
              ['brands', 'id (serial)', 'name, slug, logo_url, description, is_active, sort_order', 'Admin CRUD at /admin/brands'],
              ['products', 'id (serial)', 'name, slug, product_type (simple/variable/bundle), unit, shortdescription, longdescription, highlights, ingredients, benefits, usage_instructions, storage_instructions, warnings, price, compareprice, cost_price, tax_included, inventory, low_stock_threshold, track_inventory, allow_backorder, min_order_qty, max_order_qty, total_sold, sku, barcode, category_id, category_name, brand, brand_id (FK→brands), tags (JSONB), status, is_featured, is_bestseller, is_returnable, sort_order, weight_grams, length_cm, width_cm, height_cm, shipping_class, images (JSONB), video_url, gst_percent, hsn_code, cess_percent, fssai_number, coa_url, specifications (JSONB), meta_title, meta_description, meta_keywords, focus_keyword', 'Complete Ayurvedic eCommerce product with 50+ fields covering pricing, inventory, shipping, compliance, SEO, and content'],
              ['product_categories', '(product_id, category_id)', 'product_id (FK), category_id (FK)', 'Many-to-many junction for additional categories beyond primary category_id'],
              ['categories', 'id (serial)', 'name, slug, parent_id (self-ref FK), level, sort_order, gst_percent, hsn_code, cess_percent, image_url, banner_url, is_active, is_featured', 'Supports nested categories via parent_id; level auto-computed'],
              ['related_products', 'id (serial)', 'product_id (FK), related_id (FK), type (related/cross_sell/upsell), sort_order', 'Explicit product relations for "You may also like"'],
              ['orders', 'id (serial)', 'user_id, status (0-9), total_amount, payment_method, payment_status, razorpay_order_id, razorpay_payment_id, address_id, coupon_id, discount_amount, wallet_used, loyalty_points_used, cod_otp, shipped_at, courier_name, tracking_number', 'status enum: see Order State Machine'],
              ['order_items', 'id (serial)', 'order_id, product_id, variant_id, quantity, unit_price, total_price, gst_amount', 'Snapshot prices at order time'],
              ['user_addresses', 'id (serial)', 'user_id, name, phone, address_line1/2, city, state, pincode, is_default', ''],
              ['reviews', 'id (serial)', 'user_id, product_id, order_id, rating, comment, status (pending/approved/rejected)', 'status column added for moderation'],
              ['review_images', 'id (serial)', 'review_id (FK), url', 'Up to 5 images per review'],
              ['wishlist', 'id (serial)', 'user_id, product_id', 'UNIQUE(user_id, product_id)'],
              ['cart_items', 'id (serial)', 'user_id, product_id, variant_id, quantity', ''],
              ['coupons', 'id (serial)', 'code, type (flat/percent), value, min_order, max_discount, usage_limit, usage_per_user, used_count, valid_from, valid_to, is_active, user_id (nullable FK → users)', 'user_id = NULL means global coupon; set to a user ID for a personal offer only that user can apply'],
              ['coupon_uses', 'id (serial)', 'coupon_id, user_id, order_id, discount_amount', 'Tracks per-user usage and discount amount logged per order'],
            ]}
          />

          <H3>Marketing & Engagement Tables</H3>
          <Table
            headers={['Table', 'Primary Key', 'Key Columns', 'Notes']}
            rows={[
              ['banners', 'id (serial)', 'title, subtitle, image_url, link_url, cta_text, sort_order, is_active', 'Homepage carousel slides'],
              ['flash_sales', 'id (serial)', 'title, starts_at, ends_at, discount_type, discount_value, is_active, max_uses, uses_count', 'max_uses = total orders cap; uses_count incremented on each order. Both enforced at checkout.'],
              ['flash_sale_products', 'id (serial)', 'flash_sale_id, product_id, special_price, stock_limit, sold_count', 'sold_count incremented per qty ordered; stops applying flash price when sold_count ≥ stock_limit'],
              ['product_variants', 'id (serial)', 'product_id, name, value, price, stock_quantity, sku', 'e.g., name=Size value=500g'],
              ['stock_notifications', 'id (serial)', 'product_id, email, notified_at', '"Notify Me" signups for out-of-stock'],
              ['push_notification_tokens', 'id (serial)', 'user_id, token, platform (ios/android)', 'Expo push tokens'],
              ['wallet_transactions', 'id (serial)', 'user_id, type (credit/debit), amount, description, order_id', ''],
              ['loyalty_transactions', 'id (serial)', 'user_id, type (earn/redeem), points, order_id, description', ''],
              ['referrals', 'id (serial)', 'referrer_id, referred_id, status (pending/rewarded), reward_amount, rewarded_at', 'UNIQUE(referred_id) — one referral per user. Rewarded when referred user places first order.'],
            ]}
          />

          <H3>Content & UX Tables</H3>
          <Table
            headers={['Table', 'Primary Key', 'Key Columns', 'Notes']}
            rows={[
              ['qa', 'id (serial)', 'product_id, user_id, question, answer, is_approved', 'Product Q&A'],
              ['recently_viewed', 'id (serial)', 'user_id, product_id, viewed_at', 'UNIQUE(user_id, product_id)'],
              ['abandoned_carts', 'id (serial)', 'user_id, cart_snapshot (JSON), email_sent_at', ''],
            ]}
          />

          <H3>Operations Tables</H3>
          <Table
            headers={['Table', 'Primary Key', 'Key Columns', 'Notes']}
            rows={[
              ['serviceable_pincodes', 'id (serial)', 'pincode, city, state, delivery_days, is_active', 'Used for pincode check + ETA calc'],
              ['invoices', 'id (serial)', 'order_id, invoice_number, pdf_url, created_at', ''],
              ['order_status_logs', 'id (serial)', 'order_id, old_status, new_status, new_label, old_label, note, changed_by, created_at', 'Full timeline history per order'],
              ['admin_logs', 'id (serial)', 'admin_id, action, entity_type, entity_id, details (JSON), ip_address, created_at', 'Audit trail'],
              ['settings', 'id (serial)', 'key, value', 'Key-value store for platform config'],
              ['company_settings', 'id (serial)', 'company_name, email, support_email, phone, website, gst_number, address_line1, city, state, country, pincode, logo_url, social_links (JSONB: facebook/instagram/twitter/youtube), privacy_policy, terms_conditions, shipping_policy, return_policy, is_active, extra_data (JSONB)', 'Single-row table. logo_url is uploaded to S3 via multer. social_links is a JSONB column. companydata[0] is loaded globally in the auth context and used by the web header, footer, and exposed via GET /company.'],
            ]}
          />

          <H3>Support System Tables</H3>
          <Table
            headers={['Table', 'Primary Key', 'Key Columns', 'Notes']}
            rows={[
              ['support_tickets', 'id (serial)', 'user_id, user_name, user_email, subject, category, status (open/in_progress/resolved/closed), priority (low/medium/high/urgent), assigned_to, order_id, closed_at', ''],
              ['support_messages', 'id (serial)', 'ticket_id, sender_id, sender_type (user/admin), message, created_at', 'Chat messages within a ticket'],
            ]}
          />

          <H3>Job Queue Tables</H3>
          <Table
            headers={['Table', 'Primary Key', 'Key Columns', 'Notes']}
            rows={[
              ['jobs', 'id (serial)', 'type, payload (JSON), status (pending/processing/completed/failed), created_at, processed_at, error', 'Fallback job log if Bull/Redis not available'],
            ]}
          />
        </Section>

        {/* ═══ AUTH ═══ */}
        <Section id="auth" title="Authentication Flow" icon={Lock}>
          <Code>{`
POST /api/users/register        → Creates user, hashes password with bcrypt
POST /api/users/login           → Returns JWT token (24h expiry by default)
POST /api/users/login-otp       → Sends 6-digit OTP to email → verify OTP → JWT
POST /api/users/google-login    → Accepts Google id_token → find or create user → JWT
POST /api/users/refresh-token   → Issues new JWT from refresh token

Token payload: { id, email, role }
Token location: Authorization: Bearer <token>  (HTTP header)
`}</Code>
          <H3>Middleware Chain</H3>
          <Table
            headers={['Middleware', 'File', 'Behaviour']}
            rows={[
              ['auth', 'middlewares/auth.js', 'Validates JWT. Sets req.user. Returns 401 if invalid/missing.'],
              ['optionalAuth', 'middlewares/auth.js', 'Validates JWT if present, sets req.user. Does NOT block if missing.'],
              ['admin', 'middlewares/admin.js', 'Calls auth first, then checks req.user.role <= 2 (admin or staff). Returns 403 otherwise.'],
            ]}
          />
          <InfoBox type="tip">
            <strong>Role values:</strong> 0 = superadmin, 1 = admin, 2 = staff, 3 = customer.
            Admin middleware allows roles 0, 1, and 2 (all staff). Adjust the threshold in middlewares/admin.js if you need finer control.
          </InfoBox>
        </Section>

        {/* ═══ API ═══ */}
        <Section id="api" title="API Reference (All Routes)" icon={Globe}>
          <InfoBox type="info">Base URL: <code>http://localhost:5000/api</code>. All endpoints return JSON. Authentication is via <code>Authorization: Bearer &lt;token&gt;</code>.</InfoBox>

          {[
            {
              prefix: '/users', label: 'Users & Auth',
              routes: [
                ['POST', '/register', 'public', 'Register new customer. Body: { name, email, password, phone }'],
                ['POST', '/login', 'public', 'Login with email+password. Returns token.'],
                ['POST', '/login-otp', 'public', 'Request OTP → { email } | Verify OTP → { email, otp }'],
                ['POST', '/google-login', 'public', 'Google OAuth login. Body: { id_token }'],
                ['GET', '/profile', 'auth', 'Get logged-in user profile.'],
                ['PUT', '/profile', 'auth', 'Update profile (name, phone).'],
                ['POST', '/change-password', 'auth', 'Change password. Body: { current_password, new_password }'],
                ['GET', '/addresses', 'auth', 'List saved addresses.'],
                ['POST', '/addresses', 'auth', 'Add new address.'],
                ['PUT', '/addresses/:id', 'auth', 'Update address.'],
                ['DELETE', '/addresses/:id', 'auth', 'Delete address.'],
                ['GET', '/wallet', 'auth', 'Get wallet balance + transaction history.'],
                ['GET', '/loyalty', 'auth', 'Get loyalty points balance + history.'],
                ['GET', '/notifications', 'auth', 'List all notifications (order updates, ticket replies, etc.)'],
                ['PUT', '/notifications/:id/read', 'auth', 'Mark notification as read.'],
              ]
            },
            {
              prefix: '/products', label: 'Products (Customer)',
              routes: [
                ['GET', '/public', 'public', 'List all active products. Supports ?category=&search=&page=&limit=&sort='],
                ['GET', '/public/:id', 'public', 'Get single product details including images, variants, avg rating.'],
                ['GET', '/categories', 'public', 'List all active categories.'],
                ['GET', '/search/suggestions', 'public', 'Autocomplete. ?q=keyword (min 2 chars). Returns { products: [...], categories: [...] } (flat, NOT wrapped in suggestions{}). Products include: id, name, slug, price, compareprice, images[], category_name. Searches name, category_name, and tags columns.'],
                ['GET', '/related/:id', 'public', 'Related products by category.'],
                ['GET', '/variants/:id', 'public', 'All variants for a product.'],
                ['GET', '/rating/:id', 'public', 'Rating breakdown (star distribution).'],
                ['GET', '/pincode-check', 'public', '?pincode=123456 → serviceable + delivery_days'],
                ['POST', '/notify-me', 'optionalAuth', 'Subscribe to restock alert. Body: { product_id, email }'],
                ['POST', '/recently-viewed', 'auth', 'Log a product view.'],
                ['GET', '/recently-viewed', 'auth', 'Get recently viewed list.'],
                ['POST', '/wishlist', 'auth', 'Toggle wishlist (add if not present, remove if present).'],
                ['GET', '/', 'auth', 'Get wishlist items.'],
                ['DELETE', '/:productId', 'auth', 'Remove specific product from wishlist.'],
                ['POST', '/cart', 'auth', 'Add/update cart item. Body: { product_id, variant_id, quantity }'],
                ['GET', '/cart', 'auth', 'Get cart items.'],
                ['POST', '/reviews/order/:orderId/product/:productId', 'auth', 'Add/update review. Verifies purchase + delivered status.'],
                ['GET', '/reviews/product/:productId', 'optionalAuth', 'Get reviews for a product. Approved only for public.'],
                ['DELETE', '/review/:id', 'auth', 'Delete own review.'],
              ]
            },
            {
              prefix: '/orders', label: 'Orders',
              routes: [
                ['POST', '/', 'auth', 'Create new order. Body: { address_id, payment_method, coupon_code, wallet_amount, loyalty_points }'],
                ['GET', '/', 'auth', 'List user\'s own orders.'],
                ['GET', '/:id', 'auth', 'Get single order details.'],
                ['GET', '/:id/timeline', 'auth', 'Order status history + tracking info.'],
                ['GET', '/:id/invoice', 'auth', 'Download invoice PDF.'],
                ['PUT', '/:id/cancel', 'auth', 'Cancel order (only Pending/Confirmed states).'],
                ['POST', '/:id/return', 'auth', 'Request a return.'],
              ]
            },
            {
              prefix: '/payments', label: 'Payments (Razorpay)',
              routes: [
                ['POST', '/create-order', 'auth', 'Create Razorpay order. Body: { amount, order_id }'],
                ['POST', '/verify', 'auth', 'Verify Razorpay signature + confirm payment.'],
                ['POST', '/webhook', 'public', 'Razorpay webhook endpoint. Verifies HMAC signature.'],
              ]
            },
            {
              prefix: '/support', label: 'Support Tickets',
              routes: [
                ['POST', '/contact', 'optionalAuth', 'Contact form (no login required). Creates ticket + sends email.'],
                ['GET', '/tickets', 'auth', 'Get user\'s own tickets.'],
                ['POST', '/tickets', 'auth', 'Create new ticket.'],
                ['GET', '/tickets/:id', 'auth', 'Get ticket + all messages.'],
                ['POST', '/tickets/:id/reply', 'auth', 'Add message to ticket.'],
                ['PUT', '/tickets/:id/close', 'auth', 'Close ticket.'],
                ['GET', '/admin/tickets', 'admin', 'List all tickets with filters.'],
                ['GET', '/admin/tickets/:id', 'admin', 'Get any ticket with messages.'],
                ['PUT', '/admin/tickets/:id', 'admin', 'Update ticket status/priority.'],
                ['POST', '/admin/tickets/:id/reply', 'admin', 'Admin reply to ticket.'],
              ]
            },
            {
              prefix: '/push', label: 'Push Notifications',
              routes: [
                ['POST', '/push-token', 'auth', 'Register Expo push token. Body: { token, platform: "android"|"ios" }'],
                ['GET', '/notifications', 'auth', 'User notification inbox — order updates sourced from order_status_logs JOIN order_status_master.'],
              ]
            },
            {
              prefix: '/admin', label: 'Admin Routes',
              routes: [
                ['GET', '/products', 'admin', 'All products (incl. inactive). Supports filters.'],
                ['POST', '/products', 'admin', 'Create product.'],
                ['PUT', '/products/:id', 'admin', 'Update product.'],
                ['DELETE', '/products/:id', 'admin', 'Delete product.'],
                ['POST', '/products/bulk-upload', 'admin', 'CSV bulk product import.'],
                ['POST', '/products/bulk-images', 'admin', 'ZIP bulk image upload.'],
                ['POST', '/products/bulk-stock', 'admin', 'Bulk stock update.'],
                ['POST', '/products/bulk-price', 'admin', 'Bulk price update.'],
                ['POST', '/products/bulk-status', 'admin', 'Bulk active/inactive toggle.'],
                ['POST', '/products/bulk-category', 'admin', 'Bulk category reassignment.'],
                ['GET', '/orders', 'admin', 'All orders. ?status=&payment_method=&page='],
                ['PUT', '/orders/:id/status', 'admin', 'Update order status (with state machine validation).'],
                ['PUT', '/orders/:id/tracking', 'admin', 'Set courier_name + tracking_number.'],
                ['POST', '/orders/:id/otp', 'admin', 'Generate COD delivery OTP.'],
                ['POST', '/orders/:id/refund', 'admin', 'Process Razorpay refund.'],
                ['GET', '/users', 'admin', 'List all users.'],
                ['GET', '/users/:id', 'admin', 'Get single user + order summary.'],
                ['PUT', '/users/:id/wallet', 'admin', 'Add/deduct wallet balance.'],
                ['GET', '/analytics/summary', 'admin', 'Dashboard KPIs.'],
                ['GET', '/analytics/revenue', 'admin', 'Revenue chart data. ?period=daily|weekly|monthly'],
                ['GET', '/reviews', 'admin', 'All reviews with status filter.'],
                ['PUT', '/reviews/:id', 'admin', 'Approve/reject review.'],
                ['DELETE', '/reviews/:id', 'admin', 'Delete review.'],
                ['GET', '/stock-notifications', 'admin', 'All notify-me signups.'],
                ['DELETE', '/stock-notifications/:id', 'admin', 'Delete signup.'],
                ['POST', '/notifications/push', 'admin', 'Send push to all users.'],
                ['GET', '/export/orders', 'admin', 'Download orders CSV.'],
                ['GET', '/export/users', 'admin', 'Download users CSV.'],
                ['GET', '/returns', 'admin', 'All return requests (status 7, 8, 9) with order items and user details.'],
                ['PUT', '/returns/:id/approve', 'admin', 'Approve return: status→8, optionally credits wallet_balance. Body: { credit_wallet: bool }'],
                ['PUT', '/returns/:id/reject', 'admin', 'Reject return: status→5 (Delivered), stores cancel_reason.'],
                ['PUT', '/returns/:id/complete-refund', 'admin', 'Mark refund done: status→9 (requires status 8 first).'],
              ]
            },
            {
              prefix: '/banners /coupons /flash-sales /pincodes', label: 'Marketing & Config',
              routes: [
                ['GET', '/banners', 'public', 'Active banners for homepage carousel.'],
                ['POST /PUT /DELETE', '/banners/*', 'admin', 'Manage banners.'],
                ['GET', '/coupons/public', 'optionalAuth', 'List active coupons for the requesting user (global + user-specific). Returns two buckets: available now, and locked (min_order not met) for "Add ₹X more" UI.'],
                ['POST', '/coupons/apply', 'optionalAuth', 'Validate & compute discount. Enforces user_id restriction, usage limits, min_order. Returns discount + newTotal.'],
                ['POST /PUT /DELETE', '/coupons/admin/*', 'admin', 'CRUD coupons with user_id for user-specific offers.'],
                ['GET', '/coupons/admin/users-search', 'admin', 'Search users by name/email for coupon assignment.'],
                ['GET', '/flash-sales/active', 'public', 'Current active flash sale with products.'],
                ['POST /PUT /DELETE', '/flash-sales/*', 'admin', 'Manage flash sales.'],
                ['GET', '/pincodes/check', 'public', 'Pincode serviceability check.'],
                ['POST /PUT /DELETE', '/pincodes/*', 'admin', 'Manage serviceable pincodes.'],
              ]
            },
          ].map(group => (
            <div key={group.prefix}>
              <H3><code>{group.prefix}</code> — {group.label}</H3>
              <Table
                headers={['Method', 'Path', 'Auth', 'Description']}
                rows={group.routes.map(([method, path, auth, desc]) => [
                  <Chip key={method} label={method} color={method === 'GET' ? '#16a34a' : method === 'POST' ? '#2563eb' : method === 'PUT' ? '#d97706' : '#dc2626'} />,
                  <code key={path} className="text-xs">{path}</code>,
                  <Chip key={auth} label={auth} color={auth === 'public' ? '#6b7280' : auth === 'auth' ? '#7c3aed' : '#dc2626'} />,
                  desc,
                ])}
              />
            </div>
          ))}
        </Section>

        {/* ═══ SOCKETS ═══ */}
        <Section id="sockets" title="Socket.io Events" icon={Zap}>
          <InfoBox type="info">Socket.io server is initialised in <code>backend/src/socket.js</code>. The singleton pattern allows any controller to call <code>emitToUser()</code>, <code>emitToAdmin()</code>, <code>emitToTicket()</code>, or <code>emitToAll()</code>.</InfoBox>
          <Code>{`// backend/src/socket.js — Singleton
const { Server } = require('socket.io')
let io = null

function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { ... } })
  io.on('connection', (socket) => {
    socket.on('join_user',   (userId)   => socket.join(\`user_\${userId}\`))
    socket.on('join_admin',  ()         => socket.join('admin_room'))
    socket.on('join_ticket', (ticketId) => socket.join(\`ticket_\${ticketId}\`))
    socket.on('leave_ticket',(ticketId) => socket.leave(\`ticket_\${ticketId}\`))
  })
}

// helpers
emitToUser(userId, event, data)     // sends to room user_{userId}
emitToAdmin(event, data)            // sends to room admin_room
emitToTicket(ticketId, event, data) // sends to room ticket_{id}
emitToAll(event, data)              // broadcasts to ALL connected clients (flash sale etc.)`}</Code>

          <H3>Events Reference</H3>
          <Table
            headers={['Event Name', 'Direction', 'Room', 'Payload', 'When emitted']}
            rows={[
              ['join_user', 'Client → Server', '—', '{ userId }', 'On connect, after login'],
              ['join_admin', 'Client → Server', '—', '—', 'Admin panel on mount'],
              ['join_ticket', 'Client → Server', '—', '{ ticketId }', 'Open ticket chat view'],
              ['leave_ticket', 'Client → Server', '—', '{ ticketId }', 'Close ticket chat view'],
              ['new_order', 'Server → admin_room', 'admin_room', '{ order_id, user_id }', 'After order placed'],
              ['order_status_updated', 'Server → user_{id}', 'user_{userId}', '{ order_id, status, status_label }', 'When admin updates order status'],
              ['new_ticket', 'Server → admin_room', 'admin_room', '{ ticket_id, subject, user_name }', 'Customer creates support ticket'],
              ['new_message', 'Server → ticket_{id}', 'ticket_{id}', '{ id, sender_type, message, created_at }', 'Any reply to ticket'],
              ['ticket_status_updated', 'Server → user_{id}', 'user_{userId}', '{ ticket_id, status }', 'Admin changes ticket status'],
              ['admin_replied', 'Server → user_{id}', 'user_{userId}', '{ ticket_id, subject }', 'Admin sends message'],
              ['flash_product_update', 'Server → ALL', 'broadcast', '{ saleId, productId, soldCount, stockLimit }', 'After each order — live sold_count for progress bars'],
              ['flash_product_sold_out', 'Server → ALL', 'broadcast', '{ saleId, productId }', 'When a product hits its stock_limit in the flash sale'],
              ['flash_sale_exhausted', 'Server → ALL', 'broadcast', '{ saleId, title }', 'When flash sale uses_count reaches max_uses'],
            ]}
          />

          <H3>Flash Sale Real-Time Flow</H3>
          <InfoBox type="warning">Flash sale exhaustion events are broadcast to ALL clients so no user sees a stale discounted price after the sale is fully claimed.</InfoBox>
          <Code>{`// FlashSaleBanner, product page, mobile home — all listen for these:
socket.on('flash_product_update', ({ saleId, productId, soldCount }) => {
  // Update sold_count in local state → progress bar animates live
})
socket.on('flash_product_sold_out', ({ saleId, productId }) => {
  // Mark that product as sold out → show "Sold Out" overlay
})
socket.on('flash_sale_exhausted', ({ saleId, title }) => {
  // Mark entire sale as exhausted → show grey "Sale Fully Claimed" overlay
  // On product page: remove flash price, show regular price
  // useOrderSocket: shows toast warning if user has items in cart
})`}</Code>

          <H3>Frontend Usage</H3>
          <Code>{`// frontend/src/hooks/useOrderSocket.ts
import { io } from 'socket.io-client'

export function useOrderSocket(userId) {
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL)
    socket.emit('join_user', userId)
    socket.on('order_status_updated', (data) => toast.success(...))
    socket.on('admin_replied', (data) => toast.info(...))
    socket.on('flash_sale_exhausted', (data) => toast.warning(...))
    socket.on('flash_product_sold_out', (data) => toast.info(...))
    return () => socket.disconnect()
  }, [userId])
}`}</Code>
        </Section>

        {/* ═══ ORDER FSM ═══ */}
        <Section id="order-fsm" title="Order State Machine" icon={GitBranch}>
          <p className="text-sm text-gray-600">The backend enforces valid state transitions. Invalid transitions return HTTP 400.</p>
          <Code>{`
Order Status Codes:
  0 = Pending         (auto-set on create)
  1 = Confirmed       (admin action)
  2 = Processing      (admin action)
  3 = Shipped         (admin action — requires tracking info)
  4 = Out for Delivery(admin action)
  5 = Delivered       (admin action or COD OTP verification)
  6 = Cancelled       (admin or customer action — from 0 or 1 only)
  7 = Return Requested(customer action — from 5 only, within 30 days)
  8 = Returned        (admin action — from 7)
  9 = Refunded        (admin action — triggers Razorpay refund)

Valid transitions:
  0 → 1 (confirm)
  1 → 2 (start processing)
  2 → 3 (ship — add tracking first)
  3 → 4 (out for delivery)
  4 → 5 (deliver)
  0,1 → 6 (cancel)
  5 → 7 (return request, customer only)
  7 → 8 (mark returned, admin)
  8 → 9 (refund, admin)

Side effects on transition:
  → 1: Send confirmation email
  → 3: Send shipment email with tracking number
  → 5: Credit loyalty points, generate final invoice, send delivered email
  → 6: Restore stock quantities, refund online payments (if paid)
  → 8: Optionally credit wallet_balance (adminApproveReturn with credit_wallet=true)
  → 9: Final refund complete marker (Razorpay refund triggered separately if needed)`}</Code>
        </Section>

        {/* ═══ EMAIL ═══ */}
        <Section id="email" title="Email Triggers (Brevo)" icon={Bell}>
          <InfoBox type="info">Email service is in <code>backend/src/utils/emailService.js</code> using <code>SibApiV3Sdk</code>. All emails are transactional (one-to-one) via Brevo SMTP API.</InfoBox>
          <Table
            headers={['Trigger', 'Template function', 'Recipient', 'Contents']}
            rows={[
              ['User registers', 'sendWelcomeEmail()', 'Customer', 'Welcome message, store intro'],
              ['Order placed', 'sendOrderConfirmationEmail()', 'Customer', 'Order ID, items, total, address'],
              ['Order confirmed (admin)', 'sendOrderStatusEmail() → Confirmed', 'Customer', 'Confirmation + expected dispatch'],
              ['Order shipped', 'sendShipmentEmail()', 'Customer', 'Courier name, tracking number, tracking link'],
              ['Order delivered', 'sendDeliveryEmail()', 'Customer', 'Delivery confirmation, loyalty points earned'],
              ['Order cancelled', 'sendCancellationEmail()', 'Customer', 'Cancellation reason, refund details'],
              ['Return approved', 'sendReturnEmail()', 'Customer', 'Return ID, instructions'],
              ['OTP login', 'sendOTPEmail()', 'Customer', '6-digit OTP, 10-minute expiry'],
              ['Password reset', 'sendPasswordResetEmail()', 'Customer', 'Reset link (60-min token)'],
              ['Admin: new order', 'sendAdminNewOrderEmail()', 'Admin email', 'Order summary, customer details'],
              ['Contact form / ticket', 'sendContactFormEmail()', 'Admin + Customer', 'Ticket ID, message, auto-reply to customer'],
              ['Stock notification', 'sendStockNotificationEmail()', 'Interested users', 'Product back-in-stock alert'],
              ['Abandoned cart', 'sendAbandonedCartEmail()', 'Customer', 'Cart items, checkout link, optional coupon'],
              ['Invoice', 'sendInvoiceEmail()', 'Customer', 'PDF invoice attached'],
            ]}
          />
        </Section>

        {/* ═══ JOBS ═══ */}
        <Section id="jobs" title="Background Jobs" icon={Cpu}>
          <InfoBox type="info">Bull + Redis are used for job queues. Worker file: <code>backend/src/workers/jobWorker.js</code>. Service: <code>backend/src/services/expireUnpaidOrders.js</code>.</InfoBox>
          <Table
            headers={['Job Type', 'Trigger', 'Logic', 'File']}
            rows={[
              ['expire_unpaid_order', 'Scheduled 15 min after online order creation', 'If order still Pending + payment_status=pending → cancel order, restore stock', 'workers/jobWorker.js'],
              ['send_email', 'Queued from any controller', 'Process email jobs async (non-blocking)', 'workers/jobWorker.js'],
              ['stock_notification', 'When product stock updated to > 0', 'Send emails to all notify-me subscribers', 'workers/jobWorker.js'],
              ['abandoned_cart_reminder', 'Scheduled 24h after last cart update', 'Send recovery email if cart not checked out', 'workers/jobWorker.js'],
              ['generate_invoice', 'After order delivered', 'Generate PDF invoice + store URL', 'workers/jobWorker.js'],
            ]}
          />
          <H3>Adding a new job type</H3>
          <Code>{`// In any controller — add to queue:
const { addJob } = require('../../workers/jobWorker')
await addJob('my_job_type', { key: 'value' })

// In workers/jobWorker.js — handle it:
case 'my_job_type':
  await handleMyJob(job.data)
  break`}</Code>
        </Section>

        {/* ═══ MODULES ═══ */}
        <Section id="modules" title="Backend Module Structure" icon={FileCode}>
          <Code>{`backend/src/
├── app.js                    # Express app setup, all route registrations
├── server.js                 # http.createServer + socket init + listen
├── socket.js                 # Socket.io singleton
├── database/
│   ├── pool.js               # pg Pool singleton
│   └── init.js               # CREATE TABLE IF NOT EXISTS for all tables
├── middlewares/
│   ├── auth.js               # auth + optionalAuth middleware
│   └── admin.js              # admin role check middleware
├── config/
│   └── multer.js             # File upload config (images)
├── utils/
│   ├── emailService.js       # All email sending functions (Brevo)
│   ├── pushNotification.js   # Expo push notification helper
│   └── orderstatusmap.js     # Maps status codes to labels
├── services/
│   └── expireUnpaidOrders.js # Scheduled cancellation service
├── workers/
│   └── jobWorker.js          # Bull queue + job handlers
└── modules/
    ├── users/                # Auth, profile, addresses, wallet, loyalty
    ├── products/             # Products, reviews, cart, wishlist, Q&A
    ├── orders/               # Order creation, tracking, timeline
    ├── payments/             # Razorpay create + verify + webhook
    ├── admin/                # Admin: products, orders, users, analytics
    ├── support/              # Support tickets + messages
    ├── banners/              # Homepage banners
    ├── coupons/              # Coupon management
    ├── flash-sales/          # Flash sale management
    ├── pincodes/             # Serviceable pincode management
    └── push/                 # Push tokens, user notification inbox, admin broadcast`}</Code>
          <H3>Each module follows this pattern:</H3>
          <Code>{`modules/example/
├── example.controller.js    # All request handlers (no business logic in routes)
└── example.routes.js        # Express Router with middleware assignments`}</Code>
        </Section>

        {/* ═══ FRONTEND ═══ */}
        <Section id="frontend" title="Frontend Structure (Next.js 14)" icon={Server}>
          <Code>{`frontend/src/
├── app/                         # App Router pages
│   ├── page.tsx                 # Homepage (banners, featured, flash sale)
│   ├── product/[id]/page.tsx    # Product detail
│   ├── cart/page.tsx            # Cart page
│   ├── checkout/page.tsx        # Checkout flow
│   ├── orders/
│   │   ├── page.tsx             # Order list
│   │   └── [id]/page.tsx        # Order detail + tracking (Amazon-style)
│   ├── account/
│   │   └── page.tsx             # Account hub (profile, wishlist, addresses)
│   ├── wallet/page.tsx          # Standalone wallet + loyalty tabs page
│   ├── notifications/page.tsx   # User notification inbox (order updates, grouped by date)
│   ├── search/page.tsx          # Search landing page with popular chips
│   ├── product/
│   │   ├── [id]/page.tsx        # Product detail (client component)
│   │   └── [id]/layout.tsx      # Server component — generateMetadata() for SEO (title, desc, OG, Twitter)
│   ├── support/
│   │   ├── page.tsx             # Ticket list + create form
│   │   └── [id]/page.tsx        # Ticket chat view (real-time)
│   ├── contact/page.tsx         # Contact form → creates ticket
│   └── admin/
│       ├── layout.tsx           # Sidebar + topbar for admin panel (Bell+Wallet icons in header)
│       ├── dashboard/page.tsx   # KPI cards + charts
│       ├── products/page.tsx    # Product management
│       ├── orders/page.tsx      # Order management
│       ├── returns/page.tsx     # Returns management (approve/reject/refund)
│   orders/
│   │   └── [id]/page.tsx        # Order detail — Re-order button (status 5/6), cancel, return, retry payment
│       ├── users/page.tsx       # User list
│       ├── support/page.tsx     # Two-panel ticket management
│       ├── reviews/page.tsx     # Review moderation
│       ├── analytics/page.tsx   # Revenue charts
│       ├── banners/             # Banner management
│       ├── coupons/             # Coupon management
│       ├── flash-sales/         # Flash sale management
│       ├── pincodes/            # Pincode management
│       ├── stock-notifications/ # Notify-me list
│       └── docs/
│           ├── user-manual/     # This user manual
│           └── developer/       # This developer doc
├── components/
│   ├── layout/
│   │   └── header.tsx           # Navbar + cart count + user menu + bell badge (notification count) + wallet icon
│   └── sections/
│       ├── hero-section.tsx     # Homepage hero
│       ├── banner-carousel.tsx  # Homepage banners
│       ├── offer-strip.tsx      # Offer announcement bar
│       ├── features-section.tsx # Feature highlights
│       └── testimonials-section.tsx
├── context/
│   └── auth-context.tsx         # Login state, user data, JWT management
├── hooks/
│   └── useOrderSocket.ts        # Real-time order update + ticket notifications
└── lib/
    └── api.ts                   # Axios instance with baseURL + auth interceptor`}</Code>
          <H3>API Client Pattern</H3>
          <Code>{`// src/lib/api.ts
import axios from 'axios'

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL + '/api' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = \`Bearer \${token}\`
  return config
})

export default api

// Usage in any component:
const { data } = await api.get('/products/public')
await api.post('/orders', { address_id, payment_method })`}</Code>
        </Section>

        {/* ═══ MOBILE ═══ */}
        <Section id="mobile" title="Mobile App (React Native / Expo 56)" icon={Code2}>
          <Code>{`ayurveda-app/src/
├── components/
│   └── BottomNav.tsx        # Shared bottom nav bar (Home/Browse/Wishlist/Account tabs)
│                            # BlurView + LinearGradient, position:absolute bottom:0
│                            # Props: { active: string } — highlights current tab
└── app/
    ├── _layout.tsx              # Root layout + Stack navigator
    ├── index.tsx                # Home screen (products, banners)
    ├── product/[id].tsx         # Product detail + variants + reviews + Q&A tab + zoom modal + "Write Review" card
    ├── cart/index.tsx           # Cart screen
    ├── checkout/index.tsx       # Checkout (address, payment)
    ├── order/
    │   └── [id].tsx             # Order detail + tracking + Re-order button (status 5/6) + "Write a Review" card
    ├── account/
    │   ├── index.tsx            # Account screen + quick links (Wallet, Notifications)
    │   ├── wallet.tsx           # Wallet balance card + Transactions/Loyalty tabs
    │   └── notifications.tsx    # Notification inbox (order_status_logs, grouped by date)
    ├── wishlist/index.tsx       # Wishlist
    ├── search/index.tsx         # Search with autocomplete + recent search history
    ├── support/index.tsx        # Tickets (list + create + chat in one screen)
    ├── auth/
    │   ├── login.tsx            # Email/password login
    │   └── register.tsx         # Registration
    └── (tabs)/                  # Bottom tab navigator`}</Code>
          <H3>Key mobile dependencies</H3>
          <Table
            headers={['Package', 'Purpose']}
            rows={[
              ['expo-router', 'File-based routing (same pattern as Next.js App Router)'],
              ['expo-notifications', 'Push notification registration + handling (skipped in Expo Go via appOwnership check)'],
              ['expo-image', 'High-performance image with disk/memory cache, cross-fade transition, WebP support'],
              ['expo-haptics', 'Haptic feedback on add-to-cart, wishlist toggle, remove actions'],
              ['expo-linear-gradient', 'Gradient backgrounds in UI'],
              ['@react-native-async-storage/async-storage', 'Persists JWT token + user data locally'],
              ['axios', 'HTTP client (same api.ts pattern as web)'],
              ['socket.io-client', 'WebSocket connection for real-time order status updates and ticket reply alerts'],
              ['react-native-safe-area-context', 'Safe area (notch/status bar) handling'],
            ]}
          />
          <H3>Push notification registration flow</H3>
          <Code>{`// 1. On app launch, request permission
const { status } = await Notifications.requestPermissionsAsync()

// 2. Get Expo push token
const token = await Notifications.getExpoPushTokenAsync()

// 3. Send to backend
await api.post('/push/push-token', { token, platform: 'android' | 'ios' })

// 4. Backend stores in push_notification_tokens table
// 5. Admin sends broadcast → backend loops through all tokens → Expo API`}</Code>
          <H3>BottomNav shared component</H3>
          <Code>{`// ayurveda-app/src/components/BottomNav.tsx
// Usage: <BottomNav active="/products" />
// Reads user and cartCount from useStore() internally — no props needed for auth state
// Shows user avatar with initials + green online dot when logged in
// Shows 👤 icon with orange "Login" badge when NOT logged in
// Animated sliding pill indicator (LinearGradient) under active tab
// BlurView (iOS) + frosted white tint (Android) glass morphism background
// Tabs: Home (/), Browse (/products), Wishlist (/wishlist), Account (/account)
// Logout: navigates to / BEFORE setUser(null) to prevent NotLoggedIn flash
// (tabs)/ folder in app dir is intentionally empty — old structure, kept for Expo Router compat
// Auth screen: auth/index.tsx — always slide_from_right animation via _layout.tsx`}</Code>
          <H3>Real-time order updates (Socket.io on mobile)</H3>
          <Code>{`// ayurveda-app/src/hooks/useOrderSocket.ts
// Called from _layout.tsx Inner component — active for entire app session
// Connects to socket.io server (EXPO_PUBLIC_API_URL minus /api)
// socket.emit('join_user', user.id)  → joins user_{userId} room
// Listens for: order_status_updated → Alert.alert (has "View Order" nav button)
//              admin_replied → Alert.alert (has "Open Ticket" nav button)
// Uses dynamic import('socket.io-client') — install: npm install socket.io-client`}</Code>
          <H3>Custom Toast system (mobile)</H3>
          <Code>{`// ayurveda-app/src/components/ui/Toast.tsx
// Singleton animated toast — replaces Alert.alert for non-interactive notifications
// ToastContainer mounted in _layout.tsx outside navigation (survives screen changes)
// Usage: toast.success/error/warning/info('message') — call from anywhere in the app
// Spring slide-in from top, 3.5s auto-dismiss, tap to dismiss, max 3 stacked
// Alert.alert kept only for confirmation dialogs with Cancel/action buttons:
//   deleteAddress, handleLogout, closeTicket, No Address (with nav), socket alerts`}</Code>
          <H3>Image zoom on mobile product page</H3>
          <Code>{`// product/[id].tsx — ImageZoomModal component
// Tap any product image → opens fullscreen Modal (black background)
// Uses ScrollView with maximumZoomScale={4} for native pinch-to-zoom (iOS)
// Close button top-right, "Pinch to zoom" hint at bottom`}</Code>
          <H3>Q&A tab on mobile product page</H3>
          <Code>{`// product/[id].tsx — 3rd tab alongside Description and Reviews
// GET /qa/product/:id  → load approved questions with answers
// POST /qa/product/:id/ask → submit new question (pending admin approval)
// Shows answer author: "🌿 Store Team" for admin answers`}</Code>
          <H3>In-app notification inbox</H3>
          <Code>{`// GET /push/notifications — handler: push.controller.js → userNotifications
// Source: order_status_logs JOIN orders JOIN order_status_master
// WHERE orders.user_id = $1
// Returns: { id, order_id, invoice_no, new_status, title, body, emoji, created_at, type:'order_update' }
// No separate notifications table — synthesised from order history on every request`}</Code>
          <H3>Socket.io deep-link navigation on mobile</H3>
          <Code>{`// useOrderSocket.ts — both socket events include action buttons (not just "OK")
// order_status_updated → Alert buttons: "View Order" (router.push('/order/:id')) | "OK"
// admin_replied       → Alert buttons: "Open Ticket" (router.push('/support'))  | "Later"
// Gives users one-tap access to the relevant screen directly from the notification Alert`}</Code>
          <H3>Pull-to-refresh on Products and Wishlist</H3>
          <Code>{`// products/index.tsx and wishlist/index.tsx
// Added: import { RefreshControl } from 'react-native'
// Added: const [refreshing, setRefreshing] = useState(false)
// FlatList refreshControl prop:
<RefreshControl
  refreshing={refreshing}
  onRefresh={async () => { setRefreshing(true); await fetchProducts(1); setRefreshing(false) }}
  tintColor={Colors.forest}   // iOS spinner colour
  colors={[Colors.forest]}    // Android spinner colour
/>`}</Code>
          <H3>Native Share on Product Detail (mobile)</H3>
          <Code>{`// product/[id].tsx — Share button in top action row (alongside wishlist icon)
import { Share } from 'react-native'

// Handler:
Share.share({
  message: \`\${product.name} — AyurVeda Desi Foods\nCheck it out: \${API_BASE}/products/\${id}\`,
})
// Opens native share sheet: WhatsApp, email, SMS, copy link, etc.`}</Code>
          <H3>Referral system — full flow</H3>
          <Code>{`// ── DB ──
// users.referral_code   VARCHAR(20) UNIQUE — 8-char hex, generated at registration
// users.referred_by     INTEGER FK → users(id) — who referred this user (NULL = no referrer)
// users.wallet_balance  NUMERIC(10,2) — credited when referral reward fires
// referrals table       referrer_id, referred_id, status (pending/rewarded), reward_amount, rewarded_at
//                       UNIQUE(referred_id) — one referral per user, prevents double-tracking
//
// ── Registration flow ──
// POST /api/users/register accepts optional { referralCode } in body
//   1. Inserts new user, gets RETURNING id
//   2. Looks up: SELECT id FROM users WHERE UPPER(referral_code) = UPPER($1) AND id != newUserId
//   3. If referrer found: UPDATE users SET referred_by = referrerId WHERE id = newUserId
//   4. INSERT INTO referrals (referrer_id, referred_id, status='pending') ON CONFLICT DO NOTHING
//   Non-fatal — invalid code is silently skipped, registration always succeeds
//
// ── Google login flow ──
// Frontend reads localStorage('pending_ref') set when user visited /?ref=CODE
// Sends { id_token, referralCode } — backend tracks referral for new Google users only
//
// ── Reward trigger ──
// creditReferralReward(client, userId, orderId) — called inside the DB transaction
//   COD orders:    fires in createOrder() before COMMIT
//   Online orders: fires in verifyPayment() before COMMIT (payment confirmed)
//   Logic:
//     1. Count user's orders — reward only fires on first ever order (count === 1)
//     2. SELECT pending referral WHERE referred_id = userId AND status = 'pending'
//     3. UPDATE users SET wallet_balance += 50 WHERE id = referrerId
//     4. INSERT wallet_transactions (credit, source='referral')
//     5. UPDATE referrals SET status='rewarded', reward_amount=50, rewarded_at=NOW()
//   Reward amount: ₹50 (REFERRAL_REWARD constant in order.controller.js)
//   Idempotent: UNIQUE(referred_id) + status check prevents double reward
//
// ── GET /api/users/me now returns ──
// { id, name, email, role, phone, is_verified, referral_code, wallet_balance, referred_by, created_at }
//
// ── Frontend ──
// Web registration form: optional referral code field (Gift icon)
//   Auto-fills from ?ref= URL param or localStorage('pending_ref')
//   Cleared from localStorage after successful registration
// Web account page: referral code card with Copy + Share Link buttons
//   navigator.clipboard.writeText(code) for Copy
//   Copies full URL: window.location.origin + '/?ref=' + code for Share Link
//
// ── Mobile ──
// Registration form: optional "Referral Code" field, auto-uppercased
// Account screen: referral card with Copy (Clipboard) + Share (Share.share) buttons
//   Card visible only when user.referral_code is truthy (returned by /users/me)`}</Code>
          <H3>Chat button deep-link fix on Order Detail (mobile)</H3>
          <Code>{`// order/[id].tsx — Chat button previously had no onPress handler (dead button)
// Fixed: onPress={() => router.push('/support' as any)}
// Now opens the Support screen so the customer can create/view their ticket`}</Code>
          <H3>Cold-start retry for featured products (home screen)</H3>
          <Code>{`// index.tsx — fetchFeatured(catId, attempt)
// Problem: free-tier server (Railway/Render) takes 10-30s to wake up.
//          First request returns empty or network error → blank section.
// Fix: auto-retry up to MAX_RETRIES (3) with increasing delay:
//   attempt 0 → fail → wait 3s  → attempt 1
//   attempt 1 → fail → wait 6s  → attempt 2
//   attempt 2 → fail → wait 9s  → attempt 3 (last)
//   attempt 3 → fail → show error state + manual Retry button
//
// "Empty response" is also retried (server might respond 200 with [] during wake-up)
// retryTimerRef clears timer on unmount / category change to avoid stale updates
// During retry: skeleton cards remain visible + "Server warming up (N/3)" hint text`}</Code>
          <H3>expo-notifications Expo Go fix</H3>
          <Code>{`// src/utils/pushNotifications.ts
// expo-notifications remote push removed from Expo Go at SDK 53+
// Fix: check Constants.appOwnership === 'expo' and return null early
// Fix: use dynamic import('expo-notifications') inside try block
// Result: no crash in Expo Go; works normally in dev builds and standalone`}</Code>
          <H3>expo-image for cached image loading (mobile)</H3>
          <Code>{`// Replaced react-native Image with expo-image in:
//   index.tsx        → hero banner, category cards, product cards
//   products/index.tsx → product card images
//   wishlist/index.tsx → wishlist item images
//
// Changes:
//   resizeMode="cover"  →  contentFit="cover"
//   transition={200}       adds a 200ms cross-fade on load
//
// Benefits: disk cache, memory cache, faster re-render on scroll,
//   WebP support, no placeholder flicker on fast scroll`}</Code>
          <H3>Haptic feedback on key mobile actions</H3>
          <Code>{`// Package added: expo-haptics ~14.0.1
// Used in: products/index.tsx, wishlist/index.tsx, index.tsx (home)
//
// Patterns:
//   Haptics.impactAsync(ImpactFeedbackStyle.Medium)   → button press start
//   Haptics.notificationAsync(NotificationFeedbackType.Success) → after success
//   Haptics.notificationAsync(NotificationFeedbackType.Error)   → after failure
//   Haptics.impactAsync(ImpactFeedbackStyle.Light)    → wishlist toggle
//
// Actions with haptics: add-to-cart, wishlist toggle, remove-from-wishlist`}</Code>
          <H3>Post-login auto-refresh pattern</H3>
          <Code>{`// File: auth/index.tsx → afterLogin()
// Problem: login API returns partial user (no is_verified, referral_code, etc.)
// Fix: afterLogin calls /users/me in parallel with cart & wishlist fetch
const [cartRes, wishRes, meRes] = await Promise.allSettled([
  api.get('/cart'),
  api.get('/shop'),
  api.get('/users/me'),  // ← fetches full profile with is_verified, referral_code
])
if (meRes.status === 'fulfilled') {
  const fullUser = meRes.value.data?.user || user
  setUser(fullUser)  // ← store gets complete user data
  await AsyncStorage.setItem('stored_user', JSON.stringify(fullUser))
}

// File: account/index.tsx
// Uses useFocusEffect to auto-refresh on every screen visit:
//   1. Calls /users/me to sync verification status, phone, referral_code
//   2. Pre-fetches orders + addresses so stats row shows real counts
//   3. Updates store + AsyncStorage so all screens see fresh data`}</Code>
          <H3>Consistent brand logo across all screens</H3>
          <Code>{`// Logo URL (S3): same across web header, admin sidebar, and mobile app
const LOGO_URL = 'https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/logoayurveda.png'

// Used in mobile screens:
//   index.tsx    — TopBar (110×32) + floating header (100×28)
//   auth/        — brand section on login/register screen (140×40)
//   order/[id]   — help section footer (32×32)
// All use ExpoImage with contentFit="contain" + transition={200}

// Web:
//   header.tsx  — NEXT_PUBLIC_LOGO_URL env var → <img> in nav
//   admin/layout.tsx — same S3 URL in sidebar logo`}</Code>
          <H3>Wallet and loyalty points in mobile checkout</H3>
          <Code>{`// File: checkout/index.tsx
// Mirrors the web checkout (frontend/src/app/checkout/page.tsx)
//
// On mount: GET /wallet/ → { wallet_balance, loyalty_points }
// State: walletBalance, walletApplied, walletDiscount,
//        loyaltyBalance, loyaltyApplied, loyaltyDiscount
//
// Total calculation:
//   finalTotal = subtotal + tax + delivery + platform
//                - couponDiscount - walletDiscount - loyaltyDiscount
//
// Order payload includes:
//   walletDiscount, loyaltyDiscount, loyaltyPointsUsed
//
// UI: purple card for wallet, amber card for loyalty points
//     each with Apply/Remove toggle button
// Loyalty: 1 point = ₹0.10`}</Code>
          <H3>Flash sale banner on mobile home screen</H3>
          <Code>{`// File: index.tsx → FlashSaleSection component
// API: GET /flash-sales/active → { sales: [{ id, title, ends_at, products }] }
// Shows: gradient banner (red→orange→amber), live countdown timer,
//   horizontal scroll of flash products with image, flash_price,
//   original_price, discount %, and sold progress bar.
// Auto-hides when countdown reaches 0.`}</Code>
          <H3>Retry payment for unpaid online orders</H3>
          <Code>{`// File: order/[id].tsx → handleRetryPayment()
// Condition: payment_method==='online' && payment_status==='unpaid' && status!==6
// Flow:
//   1. POST /orders/:id/retry-payment → { payment_url }
//   2. WebBrowser.openAuthSessionAsync(payment_url, 'oroganix://')
//   3. On return: verify with POST /orders/:id/verify-payment
// UI: purple gradient button "Retry Payment" below order details`}</Code>
          <H3>Invoice download on order detail</H3>
          <Code>{`// File: order/[id].tsx → handleDownloadInvoice()
// Shows only when order.pdf_url exists
// Uses Linking.openURL(order.pdf_url) to open in browser/PDF viewer`}</Code>
          <H3>Carrier tracking links (web + mobile)</H3>
          <Code>{`// 14 carriers supported: Delhivery, BlueDart, Ekart, XpressBees,
// DTDC, Shadowfax, Ecom Express, India Post, Speed Post,
// Amazon, FedEx, DHL
//
// Web:    frontend/src/app/orders/[id]/page.tsx (CARRIER_URLS map)
// Mobile: ayurveda-app/src/app/order/[id].tsx (same map)
//
// getCarrierUrl(courier, trackingNum) → URL or null
// Mobile uses Linking.openURL() to open in browser
// Web uses <a href> target="_blank"
// Track button is disabled when courier not recognized`}</Code>
          <H3>Admin panel modal behaviour</H3>
          <Code>{`// AppModal (frontend/src/components/modal/AppModal.tsx)
// Modals close ONLY via:
//   1. Close (X) button in header
//   2. Cancel button in footer
//   3. Escape key press
// Modals do NOT close on backdrop click (prevents accidental data loss)
// Body scroll is locked while modal is open (document.body.style.overflow = 'hidden')
// Used by: categories, orders, banners, coupons, invoices, returns,
//          settings, company, jobs, logs, pincodes`}</Code>
          <H3>Admin UI consistency patterns</H3>
          <Code>{`// All admin pages follow these patterns:
// Wrapper:  min-h-screen bg-gray-50 p-4 md:p-6 space-y-6
// Header:   gradient card (emerald/blue/purple/orange) with icon + title + CTA
// Stats:    grid grid-cols-2 md:grid-cols-N gap-4, icon + metric + label
// Tables:   rounded-xl border shadow-sm, bg-slate-50 header, hover:bg-gray-50/80
// Inputs:   border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500
// Buttons:  bg-emerald-600 hover:bg-emerald-700 rounded-lg (primary)
// Empty:    centered icon + title + description
// Mobile:   responsive card layout below md: breakpoint`}</Code>
          <H3>Product/Category architecture (eCommerce-grade)</H3>
          <Code>{`// Categories: hierarchical via parent_id (unlimited depth)
//   GET /categories?parent_id=5    → subcategories of ID 5
//   GET /categories?parent_id=null → top-level only
//   GET /categories/tree           → nested tree structure
//   Fields: parent_id, slug, level, sort_order, is_featured, banner_url
//
// Brands: separate table with CRUD
//   GET /brands          → public list (active only)
//   GET /admin/brands    → admin list with pagination
//   POST/PUT/DELETE      → admin CRUD with logo upload
//
// Products: enhanced fields
//   brand_id (FK→brands), tags (JSONB), is_featured, is_bestseller,
//   cost_price, weight_grams, dimensions, low_stock_threshold,
//   total_sold, specifications (JSONB), barcode
//   Filters: brand_id, is_featured=true, is_bestseller=true
//
// product_categories: many-to-many junction (additional categories)
// related_products: explicit relations (related/cross_sell/upsell)
//
// Customer-facing display:
//   Web: brand filter dropdown, subcategory chips on category page,
//        bestseller badges, specs table, brand name link, tags pills
//   Mobile: same features + subcategory chips in products listing,
//        brand in search suggestions, specs section in product detail`}</Code>
          <H3>Visitor analytics tracking</H3>
          <Code>{`// Database: page_views table (path, referrer, user_agent, ip, device_type, browser, user_id, session_id)
// Backend:  POST /api/analytics/pageview — records a page view (public, no auth)
//           GET  /api/analytics/visitors  — admin-only stats endpoint
//
// Frontend: PageTracker component (layout.tsx) fires on every route change
//   - Skips /admin pages
//   - Debounced 300ms to avoid double-fires
//   - Generates session_id in sessionStorage for unique visitor tracking
//   - Sends: path, referrer, session_id
//   - Backend parses user-agent for device type + browser
//
// Admin page: /admin/visitors
//   - 5 stat cards: Total Views, Unique Visitors, Today Views, Today Unique, Live Now
//   - Daily traffic bar chart with hover tooltips
//   - Top 10 pages by views
//   - Device breakdown (desktop/mobile/tablet) with progress bars
//   - Browser breakdown with progress bars
//   - Period filter: 24h, 7d, 30d, 90d
//   - Auto-refreshes every 60 seconds
//   - "Live now" = visitors in last 5 minutes`}</Code>
          <H3>Blog system</H3>
          <Code>{`// Database: blog_posts (title, slug, excerpt, content, cover_image, category, tags, status, views_count)
// Backend: /api/blog/public (GET list), /api/blog/public/:slug (GET + view count++)
//          /api/blog/admin (CRUD with cover image upload to S3)
//
// Admin: /admin/blog — CRUD with WYSIWYG rich text editor
//   Editor: components/editor/RichTextEditor.tsx (contentEditable-based)
//   Features: Bold, Italic, Underline, Strikethrough, Headings (H1-H4),
//     Bullet/Numbered lists, Text alignment, Text color, Insert link/image,
//     Blockquote, Code block, Horizontal rule, Undo/Redo, Clear formatting
//   No external dependencies — uses browser native execCommand
//
// Web: /blog (listing with category filter) + /blog/[slug] (full post with HTML content)
// Mobile: /blog (listing with FlatList) + /blog/[slug] (post detail with share)
// SEO: Article JSON-LD schema on blog posts, sitemap includes blog URLs
// Features: auto-slug, SEO meta, draft/published/archived, view counting`}</Code>
          <H3>Product bundles</H3>
          <Code>{`// Database: product_bundles + bundle_products (many-to-many)
// Backend: /api/bundles/public (GET), /api/bundles/admin (CRUD)
//          /api/bundles/add-to-cart (POST — adds all products with stock check)
// Admin: /admin/bundles — CRUD with product multi-select
// Discount: flat or percent off total bundle price`}</Code>
          <H3>Subscriptions (auto-reorder)</H3>
          <Code>{`// Database: subscriptions (user_id, product_id, variant_id, quantity, frequency_days, next_order_date, status)
// Backend: /api/subscriptions (POST create, GET /my, PUT /:id, DELETE /:id)
//          /api/subscriptions/admin (GET — admin list with user/product details)
// Frequency options: 7, 14, 30, 60, 90 days
// Status: active, paused, cancelled
// Admin: /admin/subscriptions — view all with status filters`}</Code>
          <H3>Google social login</H3>
          <Code>{`// Backend endpoints:
//   POST /api/users/google-login         — primary path (id_token)
//     Body: { id_token }
//     Verifies token with Google tokeninfo API
//     Audience check: GOOGLE_CLIENT_ID OR GOOGLE_ANDROID_CLIENT_ID (both allowed)
//     Find-or-create user; stores google_id (sub claim)
//     Auto-verifies email; sets httpOnly 'token' cookie; returns JWT
//   POST /api/users/google-login-userinfo — mobile fallback (no id_token)
//     Body: { email, name, email_verified }
//     Trusted path: Google userinfo already fetched on device
//     Find-or-create user; sets httpOnly 'token' cookie; returns JWT
//   IMPORTANT: Both endpoints set res.cookie('token') — same as email/OTP login.
//     Frontend must NOT manually set any cookie after these calls.
//
// Web: Google One Tap via accounts.google.com/gsi/client
//   Layout: loads GSI script; AuthSheet has "Continue with Google" button
//   Env: NEXT_PUBLIC_GOOGLE_CLIENT_ID
//
// Mobile (Expo): @react-native-google-signin/google-signin (native SDK)
//   GoogleSignin.configure({ webClientId }) called at module level in auth/index.tsx
//   GoogleSignin.signIn() → returns { type:'success', data: { idToken } } | { type:'cancelled' }
//   Sends idToken → /google-login (same backend endpoint as web)
//   Android OAuth client (SHA-1 fingerprint) auto-configured from google-services.json via EAS
//   Env: EXPO_PUBLIC_GOOGLE_CLIENT_ID (webClientId for idToken audience)
//
// Backend .env required:
//   GOOGLE_CLIENT_ID=<web-client-id>.apps.googleusercontent.com
//   GOOGLE_ANDROID_CLIENT_ID=<android-client-id>.apps.googleusercontent.com
//
// DB: users.password column receives a random bcrypt hash (never used for login)
//     users.google_id stores Google sub claim for future linking`}</Code>
          <H3>Sitemap.xml</H3>
          <Code>{`// Backend: GET /sitemap.xml (served at root, before /api routes)
// Auto-generates from: products (by slug), categories (by slug),
//   blog posts (by slug), and static pages
// Content-Type: application/xml
// Env: FRONTEND_URL for base URL`}</Code>
          <H3>Low-stock email alerts</H3>
          <Code>{`// Backend: GET /admin/low-stock-alerts
// Returns products where inventory <= low_stock_threshold (and > 0)
// Also returns completely out-of-stock products (inventory <= 0)
// Admin UI: stock-notifications page shows alerts at top with badges`}</Code>
          <H3>Slug-based product URLs (SEO)</H3>
          <Code>{`// Product URLs changed from /product/123 to /product/gokhru-whole-dried
//
// Backend: resolveProductId(idOrSlug) helper in product.controller.js + qa.controller.js
//   - If input is numeric → use as ID directly
//   - If input is string → SELECT id FROM products WHERE slug=$1
//   - Used in: getsingleproduct, getRelatedProducts, getProductVariants,
//     getRatingBreakdown, getProductReviews, addOrUpdateReview,
//     getProductQA, askQuestion
//
// Frontend (web): all <Link href="/product/..."> use slug || id
// Frontend (mobile): all router.push("/product/...") use slug || id
// Sitemap: uses slug-based URLs for products
// Backend single product: WHERE p.id=$1 OR p.slug=$1 (auto-detect)`}</Code>
          <H3>Product FAQs (admin-written)</H3>
          <Code>{`// Database: products.faqs JSONB DEFAULT '[]'
// Format: [{"question":"Is this organic?","answer":"Yes, 100% certified."},...]
// Admin: FAQs JSON textarea in AdminProductForm
// Web: collapsible accordion on product detail page
// Mobile: Q&A cards on product detail page
// SEO: FAQPage JSON-LD schema for Google rich snippets (auto-generated from faqs field)`}</Code>
          <H3>Newsletter + Email Campaign system</H3>
          <Code>{`// Database: newsletter_subscribers (email UNIQUE, is_active, subscribed_at)
// Email service: Brevo (sib-api-v3-sdk) via backend/src/config/mail.js
// Templates: backend/src/utils/emailTemplates.js
//   - newsletterWelcome({ email }) — sent on subscribe/re-subscribe
//   - flashSaleAnnouncement({ title, discountType, discountValue, endsAt, saleUrl })
//   - couponCampaign({ couponCode, discountType, discountValue, minOrder, validTo })
//   - customCampaign({ subject, heading, body, ctaText, ctaUrl })
//
// Public API:
//   POST /api/newsletter/subscribe — validates, inserts, sends welcome email
//   POST /api/newsletter/unsubscribe — soft-deactivate (is_active = false)
// Admin API:
//   GET    /api/newsletter/admin — paginated list with status filter
//   GET    /api/newsletter/admin/export — CSV download of active subscribers
//   POST   /api/newsletter/admin/send-campaign — broadcast to all active subscribers
//          Body (type=custom): { type, subject, heading, body, ctaText, ctaUrl }
//          Body (type=coupon): { type, couponCode, discountType, discountValue, minOrder, validTo }
//   DELETE /api/newsletter/admin/:id — hard delete
//
// Flash sale auto-notify: adminCreate in flash.controller.js calls broadcastFlashSale()
//   when notify_newsletter=true is passed in the request body
// Broadcast batches 50 emails per Brevo API call to stay within rate limits
// Admin UI: /admin/newsletter — stats, search, filter, export, delete + Send Campaign panel`}</Code>
          <H3>Policy pages (dynamic from company settings)</H3>
          <Code>{`// Database: company_settings columns:
//   privacy_policy TEXT, terms_conditions TEXT, shipping_policy TEXT, return_policy TEXT
// Admin: Company page → Policy Pages section with 4 HTML textareas
// Frontend pages:
//   /privacy — renders privacy_policy from company data
//   /terms — renders terms_conditions
//   /shipping — renders shipping_policy
//   /returns — renders return_policy
// All render HTML via dangerouslySetInnerHTML with "Coming soon" fallback`}</Code>
          <H3>Dynamic footer</H3>
          <Code>{`// Footer pulls all data from API (not hardcoded):
//   Categories: from auth context categoriesdata (top-level only, slug links)
//   Social links: from company_settings.social_links JSONB
//   Contact: from company_settings.email, phone, city, state, country
//   Company name: from company_settings.company_name
//   Newsletter: POST /api/newsletter/subscribe with email validation`}</Code>
          <H3>SEO implementation</H3>
          <Code>{`// Root layout (layout.tsx):
//   metadataBase, title template "%s | Oroganix", OG image, Twitter card
//   robots directive with googleBot max-image-preview
// Product layout:
//   generateMetadata with meta_title, meta_description, focus_keyword, canonical
// Product page:
//   JSON-LD: Product schema (brand, gtin, weight, offers, aggregateRating)
//   JSON-LD: BreadcrumbList
//   JSON-LD: FAQPage (from product.faqs)
// Homepage:
//   JSON-LD: Organization (name, logo, contactPoint)
//   JSON-LD: WebSite with SearchAction
// Category page:
//   JSON-LD: CollectionPage, dynamic document.title
// Blog post:
//   JSON-LD: Article (headline, author, publisher, dates)
// Sitemap (sitemap.ts):
//   Products (slug URLs), Categories (slug), Blog posts, Static pages
// robots.ts: disallow /admin/, /checkout, /api/, /account`}</Code>
        </Section>

        {/* ═══ DEPLOY ═══ */}
        <Section id="deploy" title="Deployment Notes" icon={Terminal}>
          <Table
            headers={['Service', 'Recommended Platform', 'Notes']}
            rows={[
              ['Backend API', 'Railway / Render / DigitalOcean App Platform', 'Set all env vars in platform dashboard. PORT is auto-set.'],
              ['PostgreSQL', 'Supabase / Railway PostgreSQL / DigitalOcean Managed DB', 'Use SSL connection string. Set DATABASE_URL env var.'],
              ['Redis (Bull)', 'Railway Redis / Upstash Redis', 'Set REDIS_URL env var.'],
              ['Frontend (Next.js)', 'Vercel (recommended)', 'Set NEXT_PUBLIC_API_URL + NEXT_PUBLIC_RAZORPAY_KEY_ID in Vercel dashboard.'],
              ['Mobile App', 'Expo EAS Build', 'Run: eas build --platform android (or ios). Submit to Play Store / App Store.'],
              ['File Uploads', 'Cloudinary / AWS S3', 'Update multer.js to use cloud storage instead of local disk in production.'],
            ]}
          />
          <H3>First-run database initialisation</H3>
          <Code>{`# Backend auto-creates all tables on first start
# Just run:
cd backend && npm start

# If you need to reset:
# Connect to your PostgreSQL DB and run:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
# Then restart the backend — all tables recreate automatically`}</Code>
          <H3>Razorpay webhook setup</H3>
          <Code>{`# In Razorpay Dashboard → Settings → Webhooks:
# URL: https://your-api-domain.com/api/payments/webhook
# Events to enable:
#   payment.captured
#   payment.failed
#   refund.processed`}</Code>
          <InfoBox type="warning">
            <strong>File uploads in production:</strong> The default multer config stores images on local disk. In production (where dynos restart), switch to Cloudinary or S3. Update <code>backend/src/config/multer.js</code> to use <code>multer-storage-cloudinary</code> or <code>multer-s3</code>.
          </InfoBox>
        </Section>

        {/* Footer */}
        <div className="mt-12 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
          <p>AyurVeda Desi Foods — Developer Documentation · Last updated 2026 · For end-user help see User Manual</p>
        </div>

      </main>
    </div>
  )
}
