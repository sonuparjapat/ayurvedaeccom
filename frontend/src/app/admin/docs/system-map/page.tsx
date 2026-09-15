'use client'

import { useState } from 'react'
import {
  Layers, Lock, ShoppingCart, Shield, Clock, Globe,
  ChevronRight,
} from 'lucide-react'

/* ─── Tab definitions ─── */
const TABS = [
  { id: 'arch',     label: 'Architecture',       icon: Layers },
  { id: 'auth',     label: 'Auth Flow',           icon: Lock },
  { id: 'shop',     label: 'Shopping Flow',       icon: ShoppingCart },
  { id: 'security', label: 'Security Stack',      icon: Shield },
  { id: 'workers',  label: 'Background Workers',  icon: Clock },
  { id: 'api',      label: 'API Reference',       icon: Globe },
]

/* ─── Colour tokens (matches admin dark sidebar palette) ─── */
const C = {
  green:        '#15803d',
  greenBg:      '#dcfce7',
  blue:         '#1d4ed8',
  blueBg:       '#dbeafe',
  violet:       '#7c3aed',
  violetBg:     '#ede9fe',
  amber:        '#b45309',
  amberBg:      '#fef3c7',
  slate:        '#374151',
  slateBg:      '#f3f4f6',
  red:          '#b91c1c',
  redBg:        '#fee2e2',
  border:       '#e5e7eb',
  surface:      '#ffffff',
  surface2:     '#f9fafb',
  text:         '#111827',
  muted:        '#6b7280',
  faint:        '#d1d5db',
}

/* ─── Shared primitives ─── */
function Node({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 5, fontSize: 12, fontWeight: 500,
      fontFamily: 'ui-monospace,SFMono-Regular,monospace',
      color, background: bg, border: `1px solid ${color}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: color, flexShrink: 0 }} />
      {label}
    </span>
  )
}

function Layer({
  title, color, bg, children,
}: { title: string; color: string; bg: string; children: React.ReactNode }) {
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 6 }}>
      <div style={{ background: bg, color, padding: '7px 14px', fontSize: 11, fontWeight: 700,
        letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: 'ui-monospace,SFMono-Regular,monospace' }}>
        {title}
      </div>
      <div style={{ background: C.surface, padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {children}
      </div>
    </div>
  )
}

function ArrowDown() {
  return <div style={{ textAlign: 'center', color: C.faint, fontSize: 20, lineHeight: 1, margin: '1px 0' }}>↓</div>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700,
      color: C.text, paddingBottom: 10, borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>
      <span style={{ width: 3, height: 14, background: C.green, borderRadius: 2, display: 'inline-block' }} />
      {children}
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, color: C.muted, padding: '9px 13px', background: C.surface2,
      borderRadius: 6, marginBottom: 16, borderLeft: `3px solid ${C.green}` }}>
      {children}
    </div>
  )
}

/* Swimlane */
function Lane({
  label, color, bg, children,
}: { label: string; color: string; bg: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ background: bg, color, padding: '10px 12px', fontSize: 11, fontWeight: 700,
        letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'ui-monospace,SFMono-Regular,monospace',
        borderRight: `1px solid ${C.border}`, display: 'flex', alignItems: 'flex-start' }}>
        {label}
      </div>
      <div style={{ background: C.surface, padding: '9px 12px', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        {children}
      </div>
    </div>
  )
}

function LaneGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 18 }}>
      <div style={{ background: C.surface2, padding: '7px 14px', fontSize: 11, fontWeight: 700,
        color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Step({ label, variant = 'default' }: { label: string; variant?: 'default' | 'primary' | 'info' | 'warn' | 'err' }) {
  const map: Record<string, [string, string]> = {
    default:  [C.text,   C.surface2],
    primary:  [C.green,  C.greenBg],
    info:     [C.blue,   C.blueBg],
    warn:     [C.amber,  C.amberBg],
    err:      [C.red,    C.redBg],
  }
  const [color, bg] = map[variant]
  return (
    <span style={{ padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 500, color, background: bg,
      border: `1px solid ${color === C.text ? C.border : color}`,
      fontFamily: 'ui-monospace,SFMono-Regular,monospace', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

function Arrow() {
  return <span style={{ color: C.faint, fontSize: 14, flexShrink: 0 }}>→</span>
}

/* ─── Tab content ─── */

function ArchTab() {
  return (
    <div>
      <SectionTitle>System Architecture Overview</SectionTitle>
      <Note>Layers are applied top-to-bottom. Every request originates at a client, passes through security perimeter and middleware, reaches a controller, and persists to the data layer. External services are called from controllers.</Note>

      <Layer title="▲ Client Layer" color={C.blue} bg={C.blueBg}>
        <Node label="Next.js 14 (Web)" color={C.blue} bg={C.blueBg} />
        <Node label="React Native Expo 56 (Mobile)" color={C.blue} bg={C.blueBg} />
        <Node label="Admin Panel (Next.js)" color={C.blue} bg={C.blueBg} />
        <Node label="Axios HTTP Client" color={C.slate} bg={C.slateBg} />
        <Node label="Socket.IO Client" color={C.slate} bg={C.slateBg} />
      </Layer>
      <ArrowDown />

      <Layer title="▲ Network / Security Perimeter" color={C.red} bg={C.redBg}>
        <Node label="CORS (origin whitelist)" color={C.red} bg={C.redBg} />
        <Node label="Helmet.js (security headers)" color={C.red} bg={C.redBg} />
        <Node label="express-rate-limit (global 100/15min)" color={C.red} bg={C.redBg} />
        <Node label="IP Block Middleware" color={C.red} bg={C.redBg} />
        <Node label="Request Size Limit" color={C.red} bg={C.redBg} />
      </Layer>
      <ArrowDown />

      <Layer title="▲ Middleware Layer" color={C.violet} bg={C.violetBg}>
        <Node label="auth (JWT required)" color={C.violet} bg={C.violetBg} />
        <Node label="optionalAuth" color={C.violet} bg={C.violetBg} />
        <Node label="adminAuth" color={C.violet} bg={C.violetBg} />
        <Node label="reviewLimiter (5/hr)" color={C.violet} bg={C.violetBg} />
        <Node label="multer (file upload)" color={C.violet} bg={C.violetBg} />
        <Node label="securityEventLogger" color={C.violet} bg={C.violetBg} />
      </Layer>
      <ArrowDown />

      <Layer title="▲ Controller Layer (Express.js)" color={C.green} bg={C.greenBg}>
        <Node label="productController" color={C.green} bg={C.greenBg} />
        <Node label="userController" color={C.green} bg={C.greenBg} />
        <Node label="orderController" color={C.green} bg={C.greenBg} />
        <Node label="cartController" color={C.green} bg={C.greenBg} />
        <Node label="authController" color={C.green} bg={C.greenBg} />
        <Node label="reviewController" color={C.green} bg={C.greenBg} />
        <Node label="supportController" color={C.green} bg={C.greenBg} />
        <Node label="adminController" color={C.green} bg={C.greenBg} />
        <Node label="wishlistController" color={C.green} bg={C.greenBg} />
        <Node label="couponController" color={C.green} bg={C.greenBg} />
      </Layer>
      <ArrowDown />

      <Layer title="▲ Data Layer" color={C.amber} bg={C.amberBg}>
        <Node label="PostgreSQL (pg pool)" color={C.amber} bg={C.amberBg} />
        <Node label="users" color={C.amber} bg={C.amberBg} />
        <Node label="products" color={C.amber} bg={C.amberBg} />
        <Node label="orders / order_items" color={C.amber} bg={C.amberBg} />
        <Node label="cart_items" color={C.amber} bg={C.amberBg} />
        <Node label="wishlist_items" color={C.amber} bg={C.amberBg} />
        <Node label="reviews" color={C.amber} bg={C.amberBg} />
        <Node label="support_tickets" color={C.amber} bg={C.amberBg} />
        <Node label="price_alerts" color={C.amber} bg={C.amberBg} />
        <Node label="security_events" color={C.amber} bg={C.amberBg} />
        <Node label="user_addresses" color={C.amber} bg={C.amberBg} />
        <Node label="ip_blocks" color={C.amber} bg={C.amberBg} />
      </Layer>
      <ArrowDown />

      <Layer title="▲ External Services" color={C.slate} bg={C.slateBg}>
        <Node label="Brevo (transactional email)" color={C.slate} bg={C.slateBg} />
        <Node label="Cloudinary (image CDN)" color={C.slate} bg={C.slateBg} />
        <Node label="Google OAuth 2.0" color={C.slate} bg={C.slateBg} />
        <Node label="SMS Gateway (OTP)" color={C.slate} bg={C.slateBg} />
        <Node label="AWS S3 (assets)" color={C.slate} bg={C.slateBg} />
        <Node label="Socket.IO (real-time)" color={C.slate} bg={C.slateBg} />
      </Layer>
    </div>
  )
}

function AuthTab() {
  return (
    <div>
      <SectionTitle>Authentication &amp; Session Flow</SectionTitle>
      <Note>All auth routes are under /api/auth. JWT stored in httpOnly cookie + Authorization header. Soft lock after 5 failures, hard lock after 10. 2FA OTP via email or SMS.</Note>

      <LaneGroup title="Registration Flow">
        <Lane label="Client" color={C.blue} bg={C.blueBg}>
          <Step label="POST /api/auth/register" variant="info" />
          <Arrow />
          <Step label="name, email, password, phone" />
        </Lane>
        <Lane label="Server" color={C.violet} bg={C.violetBg}>
          <Step label="Validate input" />
          <Arrow />
          <Step label="Hash password (bcrypt)" />
          <Arrow />
          <Step label="INSERT users" />
          <Arrow />
          <Step label="Sign JWT" variant="primary" />
        </Lane>
        <Lane label="Email" color={C.slate} bg={C.slateBg}>
          <Step label="Send welcome email (Brevo)" variant="warn" />
          <Arrow />
          <Step label="Verify email link" />
        </Lane>
      </LaneGroup>

      <LaneGroup title="Login Flow (Email + Password + 2FA)">
        <Lane label="Client" color={C.blue} bg={C.blueBg}>
          <Step label="POST /api/auth/login" variant="info" />
          <Arrow />
          <Step label="email + password" />
        </Lane>
        <Lane label="Server" color={C.violet} bg={C.violetBg}>
          <Step label="Find user" />
          <Arrow />
          <Step label="Check lock status" />
          <Arrow />
          <Step label="bcrypt.compare" />
          <Arrow />
          <Step label="Generate OTP" variant="warn" />
          <Arrow />
          <Step label="Log security_event" />
        </Lane>
        <Lane label="2FA" color={C.amber} bg={C.amberBg}>
          <Step label="Send OTP (email or SMS)" variant="warn" />
          <Arrow />
          <Step label="POST /api/auth/verify-otp" variant="info" />
          <Arrow />
          <Step label="JWT issued + cookie set" variant="primary" />
        </Lane>
      </LaneGroup>

      <LaneGroup title="Google OAuth Flow">
        <Lane label="Client" color={C.blue} bg={C.blueBg}>
          <Step label="GET /api/auth/google" variant="info" />
          <Arrow />
          <Step label="Google consent screen" />
        </Lane>
        <Lane label="Server" color={C.violet} bg={C.violetBg}>
          <Step label="Passport.js Google strategy" />
          <Arrow />
          <Step label="Upsert user record" />
          <Arrow />
          <Step label="JWT issued" variant="primary" />
          <Arrow />
          <Step label="Redirect to frontend" />
        </Lane>
      </LaneGroup>

      <LaneGroup title="Brute Force Protection">
        <Lane label="Failure 1–4" color={C.red} bg={C.redBg}>
          <Step label="Log failed_attempt" />
          <Arrow />
          <Step label="Increment failure count" variant="warn" />
        </Lane>
        <Lane label="Failure 5–9" color={C.red} bg={C.redBg}>
          <Step label="Soft lock (5 min)" variant="warn" />
          <Arrow />
          <Step label="Log account_locked event" />
        </Lane>
        <Lane label="Failure 10+" color={C.red} bg={C.redBg}>
          <Step label="Hard lock" variant="err" />
          <Arrow />
          <Step label="alertAdminOnHardLock()" />
          <Arrow />
          <Step label="Admin email alert" variant="warn" />
        </Lane>
      </LaneGroup>

      <LaneGroup title="JWT Middleware Decision Tree">
        <Lane label="auth" color={C.violet} bg={C.violetBg}>
          <Step label="Extract Bearer token" />
          <Arrow />
          <Step label="jwt.verify()" />
          <Arrow />
          <Step label="set req.user" variant="primary" />
          <Arrow />
          <Step label="401 if missing/invalid" variant="err" />
        </Lane>
        <Lane label="optionalAuth" color={C.amber} bg={C.amberBg}>
          <Step label="Extract Bearer token" />
          <Arrow />
          <Step label="jwt.verify() if present" />
          <Arrow />
          <Step label="set req.user or null" variant="warn" />
          <Arrow />
          <Step label="always next()" variant="primary" />
        </Lane>
      </LaneGroup>
    </div>
  )
}

function ShopTab() {
  return (
    <div>
      <SectionTitle>Shopping &amp; Order Flow</SectionTitle>
      <Note>Full funnel from product discovery to post-purchase interactions. All product IDs resolved by resolveProductId() — supports both numeric IDs and slugs.</Note>

      <LaneGroup title="Product Discovery">
        <Lane label="Browse" color={C.blue} bg={C.blueBg}>
          <Step label="GET /products/public" variant="info" />
          <Arrow />
          <Step label="filter, sort, paginate" />
        </Lane>
        <Lane label="Search" color={C.blue} bg={C.blueBg}>
          <Step label="GET /search/suggestions" variant="info" />
          <Arrow />
          <Step label="ILIKE fulltext" />
          <Arrow />
          <Step label="GET /products/trending" variant="info" />
        </Lane>
        <Lane label="Product Page" color={C.blue} bg={C.blueBg}>
          <Step label="GET /products/public/:id" variant="info" />
          <Arrow />
          <Step label="GET /products/related/:id" variant="info" />
          <Arrow />
          <Step label="GET /products/:id/bought-together" variant="info" />
          <Arrow />
          <Step label="GET /products/:id/price-alert" variant="info" />
        </Lane>
        <Lane label="FBT Logic" color={C.violet} bg={C.violetBg}>
          <Step label="JOIN order_items a, b ON same order" />
          <Arrow />
          <Step label="COUNT pairs DESC" />
          <Arrow />
          <Step label="Top 4 co-purchased" variant="primary" />
        </Lane>
      </LaneGroup>

      <LaneGroup title="Cart &amp; Wishlist">
        <Lane label="Cart" color={C.green} bg={C.greenBg}>
          <Step label="POST /cart" variant="info" />
          <Arrow />
          <Step label="UPSERT cart_items" />
          <Arrow />
          <Step label="GET /cart" variant="info" />
          <Arrow />
          <Step label="JOIN products price" />
        </Lane>
        <Lane label="Wishlist" color={C.green} bg={C.greenBg}>
          <Step label="POST /wishlist (toggle)" variant="info" />
          <Arrow />
          <Step label="GET /wishlist/share/:token" variant="info" />
          <Arrow />
          <Step label="Public shared view" />
        </Lane>
      </LaneGroup>

      <LaneGroup title="Checkout &amp; Orders">
        <Lane label="Checkout" color={C.amber} bg={C.amberBg}>
          <Step label="POST /orders" variant="info" />
          <Arrow />
          <Step label="Validate cart + stock" />
          <Arrow />
          <Step label="Apply coupon" />
          <Arrow />
          <Step label="Deduct inventory" />
          <Arrow />
          <Step label="Create order record" variant="primary" />
        </Lane>
        <Lane label="Address" color={C.amber} bg={C.amberBg}>
          <Step label="POST /users/addresses" variant="info" />
          <Arrow />
          <Step label="street, city, state, pincode, type" />
          <Arrow />
          <Step label="delivery_instructions (optional)" variant="warn" />
        </Lane>
        <Lane label="Notify" color={C.slate} bg={C.slateBg}>
          <Step label="Order confirmation email (Brevo)" />
          <Arrow />
          <Step label="Socket.IO emit order_update" />
        </Lane>
      </LaneGroup>

      <LaneGroup title="Post-Purchase">
        <Lane label="Review" color={C.green} bg={C.greenBg}>
          <Step label="POST /reviews/order/:orderId/product/:productId" variant="info" />
          <Arrow />
          <Step label="1–5 stars + text + images" />
          <Arrow />
          <Step label="Cloudinary upload" />
        </Lane>
        <Lane label="Review UX" color={C.green} bg={C.greenBg}>
          <Step label="POST /reviews/:id/helpful" variant="info" />
          <Arrow />
          <Step label="POST /reviews/:id/flag" variant="info" />
          <Arrow />
          <Step label="GET /products/rating/:id" variant="info" />
        </Lane>
        <Lane label="Price Alert" color={C.violet} bg={C.violetBg}>
          <Step label="POST /products/:id/price-alert" variant="info" />
          <Arrow />
          <Step label="Store price_at_alert = current price" />
          <Arrow />
          <Step label="Cron checks every 6h" variant="warn" />
          <Arrow />
          <Step label="Email when price drops" variant="primary" />
        </Lane>
      </LaneGroup>
    </div>
  )
}

const SECURITY_LAYERS = [
  { name: '1. CORS',             color: C.red,    bg: C.redBg,    type: 'Network',    desc: 'Origin whitelist from ALLOWED_ORIGINS env var. Credentials allowed.' },
  { name: '2. Helmet.js',        color: C.red,    bg: C.redBg,    type: 'Headers',    desc: 'Sets 14 security headers: X-Frame-Options, CSP, HSTS, nosniff, etc.' },
  { name: '3. Global Rate Limit',color: C.red,    bg: C.redBg,    type: 'Rate',       desc: '100 req / 15 min per IP. Returns 429 with Retry-After header.' },
  { name: '4. IP Block Check',   color: C.red,    bg: C.redBg,    type: 'Access',     desc: 'Checks ip_blocks table. Blocked IPs get 403 immediately.' },
  { name: '5. Auth Middleware',  color: C.amber,  bg: C.amberBg,  type: 'Identity',   desc: 'Verifies JWT. auth = required (401 if missing). optionalAuth = populates req.user if present, never blocks.' },
  { name: '6. Account Lock',     color: C.amber,  bg: C.amberBg,  type: 'Brute Force',desc: 'Checked inside login controller. Soft lock (5 min) after 5 failures. Hard lock after 10 — triggers admin alert email.' },
  { name: '7. Route-Level Limits',color:C.amber,  bg: C.amberBg,  type: 'Rate',       desc: 'reviewLimiter: 5 reviews/hour. Auth route limiter: 10 attempts/15 min.' },
  { name: '8. Security Event Log',color:C.slate,  bg: C.slateBg,  type: 'Audit',      desc: 'Every auth event (login_success, login_failed, account_locked, new_ip_login, ip_blocked, logout) written to security_events table.' },
  { name: '9. New IP Detection', color: C.slate,  bg: C.slateBg,  type: 'Anomaly',    desc: 'On login, compares IP to known IPs for that user. Sends new_ip_login alert email to user.' },
  { name: '10. Weekly Digest',   color: C.green,  bg: C.greenBg,  type: 'Reporting',  desc: 'Every Monday 8 AM: aggregated security stats for past 7 days sent to admin email.' },
  { name: '11. Event Retention', color: C.green,  bg: C.greenBg,  type: 'Cleanup',    desc: 'security_events older than 90 days pruned daily to keep table lean.' },
]

function SecurityTab() {
  return (
    <div>
      <SectionTitle>Security Stack (Request Pipeline Order)</SectionTitle>
      <Note>Layers run top-to-bottom on every request. A higher layer can block before lower layers ever run.</Note>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {SECURITY_LAYERS.map(l => (
          <div key={l.name} style={{ display: 'grid', gridTemplateColumns: '200px 1fr 100px',
            border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden', background: l.bg + '55' }}>
            <div style={{ padding: '10px 13px', fontFamily: 'ui-monospace,SFMono-Regular,monospace',
              fontSize: 12, fontWeight: 700, color: l.color, borderRight: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center' }}>
              {l.name}
            </div>
            <div style={{ padding: '10px 13px', fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center' }}>
              {l.desc}
            </div>
            <div style={{ padding: '10px 13px', fontFamily: 'ui-monospace,SFMono-Regular,monospace',
              fontSize: 11, color: l.color, borderLeft: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              {l.type}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const WORKERS = [
  {
    name: 'Security Event Cleanup',
    color: C.red, bg: C.redBg,
    schedule: 'Every 24h', firstRun: 'On server boot', table: 'security_events', extra: '90-day retention',
    steps: [
      'DELETE WHERE created_at < NOW() - 90 days',
      'Log rowCount to console',
    ],
  },
  {
    name: 'Price Drop Alert Cron',
    color: C.violet, bg: C.violetBg,
    schedule: 'Every 6 hours', firstRun: 'On server boot', table: 'price_alerts × products', extra: 'Batch 200/run',
    steps: [
      'Query: p.price < pa.price_at_alert AND notified_at IS NULL',
      'Send price drop email per user (Brevo)',
      'UPDATE price_alerts SET notified_at = NOW()',
    ],
  },
  {
    name: 'Weekly Security Digest',
    color: C.green, bg: C.greenBg,
    schedule: 'Monday 8 AM (server TZ)', firstRun: 'Scheduled at boot', table: 'security_events', extra: 'Last 7 days',
    steps: [
      'Aggregate 8 metrics from security_events',
      'Logins, failures, lockouts, new IPs, blocked IPs, distributed BF',
      'Render HTML email → send via Brevo to ADMIN_ALERT_EMAIL',
    ],
  },
  {
    name: 'Admin Hard-Lock Alert',
    color: C.amber, bg: C.amberBg,
    schedule: 'Event-driven (not cron)', firstRun: 'On hard lock event', table: 'users (failure_count)', extra: 'Threshold: 10 failures',
    steps: [
      'Called from authController when failure_count ≥ 10',
      'Sends userId, email, attacking IP to admin',
    ],
  },
]

function WorkersTab() {
  return (
    <div>
      <SectionTitle>Background Workers &amp; Cron Jobs</SectionTitle>
      <Note>All workers live in securityCleanupWorker.js and start via startSecurityCleanupWorker() at server boot.</Note>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14, marginBottom: 24 }}>
        {WORKERS.map(w => (
          <div key={w.name} style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', background: C.surface }}>
            <div style={{ background: w.bg, color: w.color, padding: '10px 13px',
              fontSize: 12, fontWeight: 700, fontFamily: 'ui-monospace,SFMono-Regular,monospace' }}>
              {w.name}
            </div>
            <div style={{ padding: '12px 13px' }}>
              {[['Schedule', w.schedule], ['First run', w.firstRun], ['Table', w.table], ['Note', w.extra]].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                  <span style={{ fontFamily: 'ui-monospace,SFMono-Regular,monospace', fontSize: 11,
                    color: C.muted, minWidth: 72 }}>{k}</span>
                  <span style={{ fontFamily: 'ui-monospace,SFMono-Regular,monospace', fontSize: 11,
                    color: C.text }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {w.steps.map((s, i) => (
                  <div key={i} style={{ fontSize: 12, padding: '4px 9px', background: C.surface2,
                    borderRadius: 4, color: C.muted }}>
                    <span style={{ fontFamily: 'ui-monospace,SFMono-Regular,monospace', color: C.faint }}>→ </span>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <SectionTitle>Database Migrations (runSafeColumnMigrations)</SectionTitle>
      <Note>Each migration runs in its own pool connection so a failure doesn't affect others. Applied at every server boot with IF NOT EXISTS guards.</Note>
      <LaneGroup title="Schema Migrations">
        <Lane label="009" color={C.amber} bg={C.amberBg}>
          <Step label="ALTER TABLE user_addresses ADD COLUMN IF NOT EXISTS delivery_instructions TEXT" variant="warn" />
        </Lane>
        <Lane label="010" color={C.amber} bg={C.amberBg}>
          <Step label="CREATE TABLE IF NOT EXISTS price_alerts (id, user_id, product_id, price_at_alert, created_at, notified_at)" variant="warn" />
        </Lane>
        <Lane label="Indexes" color={C.amber} bg={C.amberBg}>
          <Step label="idx_price_alerts_product ON price_alerts(product_id)" variant="warn" />
          <Step label="idx_price_alerts_user ON price_alerts(user_id)" variant="warn" />
        </Lane>
      </LaneGroup>
    </div>
  )
}

/* ─── API Reference ─── */
type Endpoint = [string, string, string, string, string]

const ENDPOINTS: Endpoint[] = [
  ['POST','/api/auth/register','pub','auth','Register new user account'],
  ['POST','/api/auth/login','pub','auth','Login with email + password → sends OTP'],
  ['POST','/api/auth/verify-otp','pub','auth','Verify 2FA OTP → returns JWT'],
  ['GET','/api/auth/google','pub','auth','Google OAuth redirect'],
  ['GET','/api/auth/google/callback','pub','auth','Google OAuth callback → JWT'],
  ['POST','/api/auth/logout','auth','auth','Logout, invalidate session'],
  ['POST','/api/auth/forgot-password','pub','auth','Send password reset email'],
  ['POST','/api/auth/reset-password','pub','auth','Reset password with token'],
  ['POST','/api/auth/send-mobile-otp','pub','auth','Send OTP to mobile number'],
  ['POST','/api/auth/verify-mobile-otp','pub','auth','Login with mobile OTP'],
  ['GET','/api/shop/products/public','pub','product','List all active products with filters'],
  ['GET','/api/shop/products/public/:id','pub','product','Get single product by ID or slug'],
  ['GET','/api/shop/products/categories','pub','product','List all product categories'],
  ['GET','/api/shop/products/trending','pub','product','Get trending products'],
  ['GET','/api/shop/products/search/suggestions','pub','product','Autocomplete search suggestions'],
  ['GET','/api/shop/products/related/:id','pub','product','Get related products'],
  ['GET','/api/shop/products/variants/:id','pub','product','Get product variants'],
  ['GET','/api/shop/products/rating/:id','pub','product','Star rating breakdown'],
  ['GET','/api/shop/products/pincode-check','pub','product','Check delivery pincode'],
  ['GET','/api/shop/products/:id/bought-together','pub','product','Frequently bought together'],
  ['GET','/api/shop/products/:id/price-alert','opt','product','Get price alert status'],
  ['POST','/api/shop/products/:id/price-alert','auth','product','Set price drop alert'],
  ['DELETE','/api/shop/products/:id/price-alert','auth','product','Remove price drop alert'],
  ['POST','/api/shop/products/notify-me','opt','product','Notify when back in stock'],
  ['POST','/api/shop/products/recently-viewed','auth','product','Log product as recently viewed'],
  ['GET','/api/shop/products/recently-viewed','auth','product','Get recently viewed products'],
  ['POST','/api/shop/products/wishlist','auth','product','Toggle wishlist item'],
  ['GET','/api/shop/products/','auth','product','Get wishlist items'],
  ['DELETE','/api/shop/products/:productId','auth','product','Remove from wishlist'],
  ['POST','/api/shop/products/wishlist/share','auth','product','Generate shareable wishlist link'],
  ['DELETE','/api/shop/products/wishlist/share','auth','product','Revoke wishlist share link'],
  ['GET','/api/shop/products/wishlist/share/:token','pub','product','View shared wishlist'],
  ['POST','/api/shop/products/cart','auth','product','Add item to cart'],
  ['GET','/api/shop/products/cart','auth','product','Get cart with current prices'],
  ['POST','/api/shop/products/reviews/order/:orderId/product/:productId','auth','product','Submit review for purchased product'],
  ['GET','/api/shop/products/reviews/product/:productId','opt','product','Get reviews for product'],
  ['POST','/api/shop/products/reviews/product','auth','product','Submit general review (5/hr limit)'],
  ['GET','/api/shop/products/reviews','pub','product','Get all reviews'],
  ['DELETE','/api/shop/products/review/:id','auth','product','Delete own review'],
  ['POST','/api/shop/products/reviews/:id/helpful','auth','product','Vote review as helpful'],
  ['GET','/api/shop/products/reviews/helpful-votes/:productId','auth','product','Get helpful vote state'],
  ['POST','/api/shop/products/reviews/:id/flag','auth','product','Flag/report a review'],
  ['GET','/api/shop/users/profile','auth','user','Get current user profile'],
  ['PUT','/api/shop/users/profile','auth','user','Update profile (with avatar)'],
  ['GET','/api/shop/users/addresses','auth','user','List saved addresses'],
  ['POST','/api/shop/users/addresses','auth','user','Add address (with delivery_instructions)'],
  ['PUT','/api/shop/users/addresses/:id','auth','user','Update address'],
  ['DELETE','/api/shop/users/addresses/:id','auth','user','Delete address'],
  ['POST','/api/shop/orders','auth','order','Place new order'],
  ['GET','/api/shop/orders','auth','order','Get user order history'],
  ['GET','/api/shop/orders/:id','auth','order','Get order detail'],
  ['POST','/api/shop/orders/:id/cancel','auth','order','Cancel order'],
  ['POST','/api/shop/support/tickets','auth','support','Create support ticket'],
  ['GET','/api/shop/support/tickets','auth','support','List user support tickets'],
  ['GET','/api/shop/support/tickets/:id','auth','support','Get ticket detail'],
  ['POST','/api/shop/support/tickets/:id/messages','auth','support','Reply to support ticket'],
  ['GET','/api/admin/products','admin','admin','List all products (admin)'],
  ['POST','/api/admin/products','admin','admin','Create new product'],
  ['PUT','/api/admin/products/:id','admin','admin','Update product'],
  ['DELETE','/api/admin/products/:id','admin','admin','Delete product'],
  ['GET','/api/admin/orders','admin','admin','List all orders'],
  ['PATCH','/api/admin/orders/:id/status','admin','admin','Update order status'],
  ['GET','/api/admin/users','admin','admin','List all users'],
  ['PATCH','/api/admin/users/:id/block','admin','admin','Block or unblock user'],
  ['GET','/api/admin/security/events','admin','admin','View security event log'],
  ['POST','/api/admin/security/ip-block','admin','admin','Block an IP address'],
  ['DELETE','/api/admin/security/ip-block/:ip','admin','admin','Unblock an IP address'],
  ['GET','/api/admin/support/tickets','admin','admin','List all support tickets'],
  ['POST','/api/admin/support/tickets/:id/messages','admin','admin','Admin reply to ticket'],
  ['PATCH','/api/admin/support/tickets/:id/status','admin','admin','Update ticket status'],
  ['GET','/api/admin/coupons','admin','admin','List all coupons'],
  ['POST','/api/admin/coupons','admin','admin','Create coupon'],
  ['DELETE','/api/admin/coupons/:id','admin','admin','Delete coupon'],
]

const METHOD_STYLE: Record<string, [string, string]> = {
  GET:    [C.green,  C.greenBg],
  POST:   [C.blue,   C.blueBg],
  PUT:    [C.amber,  C.amberBg],
  PATCH:  [C.amber,  C.amberBg],
  DELETE: [C.red,    C.redBg],
}
const AUTH_STYLE: Record<string, [string, string, string]> = {
  pub:   [C.slate,  C.slateBg, 'Public'],
  auth:  [C.violet, C.violetBg,'Auth'],
  opt:   [C.amber,  C.amberBg, 'Optional'],
  admin: [C.red,    C.redBg,   'Admin'],
}

function ApiTab() {
  const [search, setSearch] = useState('')
  const [method, setMethod] = useState('')
  const [authF, setAuthF] = useState('')
  const [module_, setModule] = useState('')

  const filtered = ENDPOINTS.filter(([m, path, auth, mod, desc]) => {
    const q = search.toLowerCase()
    return (
      (!q || path.toLowerCase().includes(q) || desc.toLowerCase().includes(q)) &&
      (!method || m === method) &&
      (!authF || auth === authF) &&
      (!module_ || mod === module_)
    )
  })

  const inputStyle = {
    fontFamily: 'ui-monospace,SFMono-Regular,monospace',
    fontSize: 12, padding: '7px 10px', borderRadius: 6,
    border: `1px solid ${C.border}`, background: C.surface,
    color: C.text, outline: 'none',
  }

  return (
    <div>
      <SectionTitle>API Reference</SectionTitle>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input
          style={{ ...inputStyle, flex: 1, minWidth: 160 }}
          placeholder="Search path or description…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select style={inputStyle} value={method} onChange={e => setMethod(e.target.value)}>
          <option value="">All methods</option>
          {['GET','POST','PUT','PATCH','DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select style={inputStyle} value={authF} onChange={e => setAuthF(e.target.value)}>
          <option value="">All auth</option>
          <option value="pub">Public</option>
          <option value="auth">Auth required</option>
          <option value="opt">Optional auth</option>
          <option value="admin">Admin</option>
        </select>
        <select style={inputStyle} value={module_} onChange={e => setModule(e.target.value)}>
          <option value="">All modules</option>
          {['auth','product','user','order','support','admin'].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse',
          fontFamily: 'ui-monospace,SFMono-Regular,monospace', fontSize: 12 }}>
          <thead>
            <tr style={{ background: C.surface2 }}>
              {['Method','Path','Auth','Module','Description'].map(h => (
                <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11,
                  letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted,
                  borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(([m, path, auth, mod, desc], i) => {
              const [mc, mb] = METHOD_STYLE[m] || [C.slate, C.slateBg]
              const [ac, ab, al] = AUTH_STYLE[auth] || [C.slate, C.slateBg, auth]
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.surface2)}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ padding: '2px 7px', borderRadius: 3, fontSize: 11,
                      fontWeight: 700, color: mc, background: mb, display: 'inline-block' }}>
                      {m}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', wordBreak: 'break-all', color: C.text }}>{path}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ padding: '2px 6px', borderRadius: 3, fontSize: 10, fontWeight: 600,
                      color: ac, background: ab }}>{al}</span>
                  </td>
                  <td style={{ padding: '8px 12px', color: C.muted }}>{mod}</td>
                  <td style={{ padding: '8px 12px', color: C.muted, fontFamily: 'inherit' }}>{desc}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div style={{ fontFamily: 'ui-monospace,SFMono-Regular,monospace', fontSize: 11, color: C.muted, marginTop: 10 }}>
        {filtered.length} of {ENDPOINTS.length} endpoints
      </div>
    </div>
  )
}

const TAB_CONTENT: Record<string, React.ReactNode> = {
  arch:     <ArchTab />,
  auth:     <AuthTab />,
  shop:     <ShopTab />,
  security: <SecurityTab />,
  workers:  <WorkersTab />,
  api:      <ApiTab />,
}

/* ─── Page ─── */
export default function SystemMapPage() {
  const [activeTab, setActiveTab] = useState('arch')

  return (
    <div style={{ minHeight: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>System Map</h1>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
          Complete architecture overview — layers, flows, security, workers and all API endpoints.
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 24,
        overflowX: 'auto', gap: 0 }}>
        {TABS.map(t => {
          const Icon = t.icon
          const active = activeTab === t.id
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px',
              border: 'none', background: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              fontSize: 13, fontWeight: active ? 600 : 400,
              color: active ? C.green : C.muted,
              borderBottom: `2px solid ${active ? C.green : 'transparent'}`,
              transition: 'color 0.12s, border-color 0.12s',
            }}>
              <Icon size={15} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960 }}>
        {TAB_CONTENT[activeTab]}
      </div>
    </div>
  )
}
