# Developer Notes — Oroganix eCommerce

---

## Bug-Fix Audit — Phase 3 (2026-07-29)

### Security fixes

#### SQL Injection — `company.controller.js` → `updateCompany`
- **Root cause**: `Object.keys(req.body)` was used directly as SQL column names with no allowlist.
- **Fix**: Added `ALLOWED_FIELDS` Set; only whitelisted columns can be used in the `SET` clause. Unknown keys are silently dropped.
- **File**: `backend/src/modules/companyDetails/company.controller.js` — `updateCompany`

#### SQL Injection — `subscription.controller.js` → `adminListSubscriptions`
- **Root cause**: The `status` query parameter was string-interpolated directly into the COUNT query via `.replace('$3', \`'${status}'\`)`, bypassing parameterization.
- **Fix**: Replaced with a separately parameterized count query using `$1` and `[status]` params.
- **File**: `backend/src/modules/subscriptions/subscription.controller.js` — `adminListSubscriptions`

---

### Backend — critical data bugs

#### COD orders never marked paid — `admin.controller.js` → `updateOrderStatus`
Two sub-bugs, both in the status-5 (Delivered) branch:
1. `pool.query()` was used inside an open transaction instead of `client.query()` — the SELECT ran outside the transaction, causing potential race conditions and isolation issues.
2. `payment_method` was not included in the SELECT columns, so `order.payment_method` was always `undefined` and the `if (order.payment_method === 'cod')` branch never triggered.
- **Fix**: Changed to `client.query`; added `payment_method` to SELECT.
- **File**: `backend/src/modules/admin/admin.controller.js` ~line 1354

#### Double `client.release()` crash — `order.controller.js` → `createOrder`
- **Root cause**: The pincode serviceability early-return path called `client.release()` manually before `BEGIN` had been issued. The outer `finally` block then called `client.release()` a second time, crashing the pg pool.
- **Fix**: Removed the premature `client.release()` and unnecessary `ROLLBACK` from the early-return path. The `finally` block handles cleanup in all cases.
- **File**: `backend/src/modules/orders/order.controller.js` ~line 181

#### `adminGetReturns` always 500 — `admin.controller.js`
- **Root cause**: The subquery referenced `oi.product_name` (column doesn't exist on `order_items`) and `p.thumbnail` (column doesn't exist on `products`).
- **Fix**: `oi.product_name` → `p.name`, `p.thumbnail` → `p.images->>0`
- **File**: `backend/src/modules/admin/admin.controller.js` — `adminGetReturns`

#### Per-user coupon limits never enforced — `coupon.controller.js`
- **Root cause**: `usage_per_user` was not included in the `SELECT` columns for the public coupon listing. `c.usage_per_user` was always `undefined`, so the per-user check always passed.
- **Fix**: Added `usage_per_user` to the SELECT column list.
- **File**: `backend/src/modules/coupons/coupon.controller.js`

---

### Backend — medium/low bugs

| File | Bug | Fix |
|---|---|---|
| `admin.controller.js` | `getLowStockProducts`: `status = TRUE` is a boolean comparison but `status` is a text column (`'active'`/`'inactive'`) | Changed to `status = 'active'` |
| `order.controller.js` | `createOrder` response returned `amount: total` and `grandTotal: total` (pre-wallet/loyalty) while Razorpay was charged `finalTotal` | Changed response to use `finalTotal` |
| `admin.controller.js` | `stats`, `recentOrders`, `topProducts` had no try/catch — any DB error would crash the server | Wrapped each in try/catch |
| `product.controller.js` | Legacy `addToCart` / `getCart` had no try/catch and accessed `req.user.id` without null-guard | Added try/catch and `req.user?.id` guard with 401 response |
| `product.controller.js` | Product not-found returned `res.status(204).json(...)` — HTTP 204 must not have a body | Changed to `res.status(404)` |
| `wallet.controller.js` | `adminDebitWallet` early-returned on insufficient balance without ROLLBACK after `BEGIN + FOR UPDATE` | Added `await client.query('ROLLBACK')` before early return |
| `routedapis.controler.js` | `getCategoryById` subcategory query passed raw URL param `id` (may be a slug string) as `parent_id` | Changed to `result.rows[0].id` (resolved numeric ID) |
| `auth.controller.js` | Admin login SELECT didn't include `name` column but response tried to send `user.name` | Added `name` to SELECT |

---

### Public settings endpoint — `wallet.controller.js` → `getSettings`
The `/api/wallet/settings` endpoint (public, no auth) now returns both loyalty settings and delivery settings:
```json
{
  "settings": { "loyalty_enabled": true, "loyalty_earn_rate": 0.1, ... },
  "delivery": { "free_delivery_limit": 500, "delivery_charge": 40, "platform_fee": 0 }
}
```
Mobile cart and checkout screens now use this endpoint instead of the admin-only `/admin/settings`.

---

### Mobile fixes

| File | Bug | Fix |
|---|---|---|
| `cart/index.tsx` | Called `/admin/settings` (admin-only, 403 for users) to get delivery charge | Changed to `/wallet/settings` public endpoint |
| `product/[id].tsx` | `inCart` check used `Number(slug)` = NaN — always `false` for slug-based navigation | Changed to `product?.id ?? Number(id)` |
| `checkout/index.tsx` | `/wallet/` trailing slash broke wallet balance fetch on some nginx configs | Removed trailing slash |
| `checkout/index.tsx` | Address interface used `isDefault` (camelCase) but backend returns `is_default` (snake_case) — default address never auto-selected | Changed to `is_default` |
| `checkout/index.tsx` | Also called `/admin/settings` | Changed to `/wallet/settings`; settings parsed from `delivery` field |
| `wishlist/index.tsx` | `useEffect` depended on full `user` object — spurious refetches on any `setUser()` call | Changed dep to `user?.id` |
| `_layout.tsx` | `account/notifications` registered twice as Stack.Screen | Removed duplicate |
| `product/[id].tsx` | Two `useEffect`s both fetched the reviews endpoint on mount — race on `is_mine` flag | Removed redundant `me: 1` effect; `fetchReviews` already detects `is_mine` |

---

### Web frontend fixes

| File | Bug | Fix |
|---|---|---|
| `wishlist/page.tsx` | `axios.delete('/shop/${productId}')` — wrong path, wishlist removal non-functional | Changed to `/shop/wishlist/${productId}` |
| `auth-context.tsx` | `axios.get('/shop', ...)` in `getwishlist()` — loaded product catalog instead of wishlist | Changed to `/shop/wishlist` |
| `admin/layout.tsx` | No auth/role check — any unauthenticated visitor could see the admin panel UI | Added `useEffect` to redirect to `/adminauth` if `loginuserdata?.role !== 'admin'` |
| `adminauth/page.tsx` | `login(res?.data?.data)` — wrong field; auth endpoint returns `{ admin: {...} }` | Changed to `login(res?.data?.admin)` |
| `checkout/page.tsx` | `validateShipping()` called twice consecutively — duplicate error toasts | Removed duplicate call |
| `checkout/page.tsx` | `axios.get('/wallet/')` trailing slash | Changed to `/wallet` |
| `product/[id]/page.tsx` | `require('@/lib/axios').default` inside component body — unsupported in `'use client'` | Changed to top-level `axios` reference |
| `product/[id]/page.tsx` | `toggleLike(product.id)` passed `number` to `(id: string)` function | Changed to `String(product.id)` |
| `product/[id]/page.tsx` | `useEffect` for reviews missing `id` in dependency array — stale reviews on navigation | Added `id` to dependency array |
| `category/[slug]/page.tsx` | `fetchCart()` only called when `res.status === 200` — missed 201 responses | Removed status check, call unconditionally |
| `auth/AuthSheet.tsx` | `router.refresh()` called unconditionally after `handlePostLogin`, causing a race | Removed unconditional call |
| `cart/page.tsx` | `slug` not in `CartItem` interface — always `undefined`, links always used numeric ID | Added `slug?: string` to interface |
| `cart controller` | `p.slug` not in cart SELECT — backend never returned slug for cart items | Added `p.slug` to cartSelect query |

---

## Mobile Payment Flow (Razorpay — Native SDK)

### Architecture
```
Mobile checkout
  → POST /api/orders/create  (paymentMethod: 'online')
  → backend creates Razorpay order, returns { orderId, razorpay: { id, amount }, razorpayKey }
  → RazorpayCheckout.open({ key, order_id, amount, ... })   ← native bottom sheet
  → user pays (UPI / card / netbanking) inside native sheet
  → SDK returns { razorpay_payment_id, razorpay_order_id, razorpay_signature }
  → POST /api/orders/verify   ← HMAC signature check
  → show success screen
```

### Key files
| File | Role |
|---|---|
| `ayurveda-app/src/app/checkout/index.tsx` | Mobile checkout — calls native Razorpay SDK |
| `backend/src/modules/orders/order.controller.js` | `createOrder` returns `razorpayKey` + `razorpay` object; `verifyPayment` validates HMAC |
| `backend/src/modules/orders/order.routes.js` | Routes: `/create`, `/verify` |

### Why switched from WebBrowser approach
The previous `WebBrowser.openBrowserAsync` + `Linking.addEventListener` approach was unreliable — the `oroganix://` deep link 302 redirect was returning 404 in production. The native SDK (`react-native-razorpay` v2.3.1) renders a native bottom sheet entirely within the app — no browser tab, no deep link, no 404 risk.

### Native SDK notes
- Package: `react-native-razorpay` (installed v2.3.1)
- **Requires a native build** — does NOT work in Expo Go. Run `npx expo run:android` or `eas build`.
- `expo-dev-client` is already in the project so a local dev build (`expo run:android`) is sufficient for testing.
- The Razorpay key (`RAZORPAY_KEY` from backend env) is returned by `createOrder` as `razorpayKey`. It is the **publishable key** (safe to return to clients).
- Error code `2` from the SDK = user dismissed the payment sheet (treat as cancellation, not failure).

### `req.protocol` on Render
`backend/src/app.js` sets `app.set('trust proxy', 1)` so that `req.protocol` returns `https` even behind Render's reverse proxy.

---

## UI Pages

### Product Detail (`frontend/src/app/product/[id]/page.tsx`)
Premium UI upgrade applied — all logic and state management unchanged. Key visual changes:
- Gradient page background, glass-morphism breadcrumb pill
- Emerald ring selection on thumbnail images
- Gradient price text via `WebkitBackgroundClip: text`
- Frosted-glass pill tab bar (Description / Reviews / Q&A)
- Coloured left-border accent per content section
- Gradient trust badge cards (Fast Delivery / Secure Payment / 100% Genuine)

### Cart Sheet (`frontend/src/components/cart/cart-sheet.tsx`)
Premium UI upgrade applied — all logic and state management unchanged. Key visual changes:
- Trigger button matches header `action-btn` style (38px rounded, hover glass lift, gold count badge with spring animation)
- Sheet panel: `linear-gradient(180deg, #f8fffb, #f0fdf4, #fafff8)` background, left border `rgba(16,185,129,0.10)`, `box-shadow: -8px 0 60px rgba(26,58,42,0.12)`
- Sticky header: `backdrop-filter: blur(20px)`, dark forest icon container, item count subtitle
- Item cards: glass `rgba(255,255,255,0.82)` with `backdrop-filter: blur(8px)`, hover lift, gradient price text, emerald quantity controls
- Exit animation: items slide right + scale down on removal (`AnimatePresence`)
- Empty state: emerald icon box with `box-shadow`, prominent "Shop Now" gradient button
- Footer: gradient total amount text, shimmer checkout button (`::after` sweep), trust chips

### Checkout (`frontend/src/app/checkout/page.tsx`)
Premium animation upgrade applied — all logic and state management unchanged. Key visual changes:
- 4th background orb added (green-tinted `#2d5a3d`) to match brand palette
- `card-header-luxury` now uses an animated 4-stop gradient (`hdr-shift` keyframe, 12s loop) blending ink + forest green
- Progress rail fill has a shimmer sweep animation (`shimmer-rail` keyframe) instead of static gradient
- Active step node pulses gently (`step-pulse` keyframe) to indicate current position
- CTA button has a `::after` shimmer sweep on hover (skewed pseudo-element sliding across)
- Payment cards: COD uses green gradient icon box (`#1a4a28 → #2d7a3d`) with "No extra charges" pill; Online uses indigo gradient (`#1a1a60 → #3d2a8a`) with UPI/Cards/Net mini-badges; selection state has spring-animated scale bounce on icon + pulsing gold ring (`ring-pulse` keyframe)
- CheckCircle badge on selected payment animates in/out via `AnimatePresence` with spring
- Order summary items now show product thumbnail images (`item.images?.[0]`) with staggered `x: 12→0` entrance
- Trust badges upgraded to pill-style with `var(--mist)` background and `motion.div` staggered entrance
- Success page: `FloatingParticles` component shows 9 emoji particles (`🌿 ✨ 🍃 ⭐ 🌱`) with `particle-float` keyframe; success icon replaced with animated SVG (circle draws in, then checkmark draws, both using `pathLength` motion values); success card top border now has a shimmer sweep matching the brand gradient

### Review Pre-fill Bug Fix

**Root cause**: `getProductReviews` SQL SELECT does not include `r.user_id` in its output columns. The frontend was matching `r.user_id == loginuserdata?.id`, which always resolved to `undefined == id` = `false`.

**Fix**:
- Order detail page (`orders/[id]/page.tsx`): `openReviewForm` now calls `GET /shop/reviews/product/:id?me=1` (filters to the current user's review on the backend). Takes `reviews[0]` as the pre-fill — no client-side user matching needed.
- Product detail page (`product/[id]/page.tsx`): Separate `useEffect([loginuserdata?.id, id])` calls `GET /shop/reviews/product/:id?me=1` independently of the paginated public review list. Fires whenever the user logs in and also re-runs after a successful review submit to sync server-stored image URLs.
- The `is_mine` boolean already returned by the API is reliable if the user is authenticated and the review is in the current page — the dedicated `me=1` fetch is preferred because it is pagination-independent.

### Flash Sale Banner (`frontend/src/components/sections/flash-sale-banner.tsx`)
Complete visual overhaul — data fetching (Socket.io events, REST polling) and all business logic unchanged. Key design changes:
- Background: layered radial gradients on a dark forest base (`#0f3d2e → #1a2e10 → #0f1f0a → #1a0a00`)
- Gold top accent line, Flame icon, monospace countdown digits with dark styled cells
- Product cards: dark glassmorphism (`rgba(255,255,255,0.08)` background, `rgba(255,255,255,0.12)` border, `backdrop-filter: blur(16px)`)
- Stock progress bar: green when <80% sold, red/orange gradient when ≥80%
- "View All Deals" navigation card appended after 3+ products

### Product Detail — Sticky ATC + Lightbox (`frontend/src/app/product/[id]/page.tsx`)
Two new UX features added — no logic or data changes.

**Sticky Add-to-Cart bar**:
- Uses `IntersectionObserver` on the main ATC button div (`atcBtnRef`) to detect scroll-off
- When `stickyAtc === true` (button is off-screen) and product in stock → fixed bottom bar slides in
- Bar: glassmorphism `rgba(250,248,243,0.96)`, `backdrop-filter: blur(24px)`, shows thumbnail + name + price + CTA
- `paddingBottom: 'calc(12px + env(safe-area-inset-bottom))'` for safe-area support
- Reuses the same `addToCart` function; shows "In Cart" state when already in cart

**Image lightbox click-to-zoom**:
- Main product image `onClick` → `setLightbox({ images: product.images, idx: activeImg })`
- Zoom cursor hint overlay appears on hover at bottom-right corner
- Wishlist heart button has `e.stopPropagation()` to prevent triggering the outer lightbox click
- Lightbox was already implemented (used by review images) — simply wired to the product images

### Offers Page (`frontend/src/app/offers/page.tsx`)
Complete visual overhaul — all API calls and business logic unchanged. Key design changes:
- Dark forest gradient background (`#061812 → #0b2018 → #0f1a0a`) extending through the whole page
- Hero: animated radial orbs, gold top accent line, animated stat pills (flash sale count, coupon count, bundle count)
- Flash Sales: dark glassmorphism sale cards; individual `FlashProductCard` with hover lift + stock progress bar
- Coupons: premium ticket-style cards with torn-edge circles, dashed separator, monospace code display in dark
- Bundles: glassmorphism cards with full image overlay, purple gradient CTA buttons
- Skeleton loaders on initial fetch; refined empty state with centered orb icon

### Account Hero Stats (`frontend/src/app/account/AccountContent.tsx`)
Added count-up animation to the three stat numbers (Total Orders, Delivered, Total Spent) in the hero banner:
- `useCountUp(end, duration)` hook uses `requestAnimationFrame` with cubic ease-out to count from 0 → target
- `CountUpStat` component wraps the hook and renders the animated value with optional prefix/suffix
- Stats re-animate on every mount (when user lands on account page)

### Order Detail Page (`frontend/src/app/orders/[id]/page.tsx`)
Complete visual overhaul + added missing `Header` and `Footer` components. Key changes:
- Dark forest gradient background matches the site's premium dark theme
- Glass-card style (`gc` variable: `rgba(255,255,255,0.05)` + blur + emerald border) applied to all content sections
- Order hero card: large order total (₹ amount), status badge with dynamic color from `STATUS_MAP`
- ETA/tracking banner: emerald accent with carrier info and direct Track Shipment CTA button
- Progress stepper: animated step nodes with emerald glow on active step, gradient connector lines
- Timeline: vertical connector lines, colored status icons in dark glass circles
- All item review forms, action buttons (Cancel/Return/Reorder), address card ported to dark theme
- Loading + not-found states also wrapped in Header/Footer/dark background

### Mobile Account Screen (`ayurveda-app/src/app/account/index.tsx`)
Premium UI upgrade applied — all logic, API calls, and state unchanged. Key visual changes:
- **Stats row**: three flat text stats replaced with individual glassmorphism pill cards (`rgba(255,255,255,0.1)` bg, rounded border) inside the dark header; each pill shows an emoji, bold number, and uppercase label
- **Order cards**: each card now has a 3px colored left border matching the order's status color (e.g. green for Delivered, blue for Confirmed); total amount text uses `Colors.gold` for premium feel
- **Profile info rows**: icon containers switched from plain mint to unique `LinearGradient` per row (forest→moss for name, blue for email, purple for phone, gold for status)
- **Quick access link rows**: icon containers switched from plain mint to unique `LinearGradient` per category (red for Wishlist, purple for Cart, amber for Wallet, teal for Notifications, etc.)
- **Section cards**: background tinted from pure `#fff` to `rgba(255,255,255,0.97)` with a soft `#d9eedf` border
- **Referral code card**: changed from light green `#f0fdf4` to a dark `LinearGradient(['#0a1f14','#0d2a1a'])` with gold title, muted white subtext, glass code box, and gold code text

### Mobile Cart Screen (`ayurveda-app/src/app/cart/index.tsx`)
Premium UI upgrade applied — all logic, API calls, and state unchanged. Key visual changes:
- **Cart item cards**: added 3px emerald left border (`Colors.emerald`) as a visual accent; border color changed from plain `Colors.border` to `#c8e6d0`; shadow upgraded from `Shadows.sm` to `Shadows.md`
- **Cart item price**: changed from `Colors.forest` (dark) to `Colors.emerald` (bright) for better visual pop
- **Delivery progress card**: background tinted from `#fff` to mint glass `rgba(240,253,244,0.9)` with a `#c8e6d0` border
- **Empty cart orb**: switched from plain `Colors.mint` background to a `LinearGradient([Colors.forest, Colors.moss])` for a premium dark look; added `overflow: 'hidden'` for gradient clip

### Old checkout note
Premium UI upgrade applied — all logic and state management unchanged. Key visual changes:
- Radial gradient page background
- More opaque glass cards with stronger shadows
- Payment option cards lift on hover/select (`translateY(-3px)` + gold ring)
- 56px icon circles per payment method
- Gradient gold total amount text
- Gradient divider lines

---

## Environment Variables

### Mobile (`ayurveda-app/.env`)
```
EXPO_PUBLIC_API_URL=https://api.oroganix.com/api
EXPO_PUBLIC_GOOGLE_CLIENT_ID=...
```
No Razorpay keys needed on mobile — Razorpay runs entirely in the backend-served HTML page.

### Backend (`backend/.env`)
```
RAZORPAY_KEY=rzp_live_...
RAZORPAY_SECRET=...
JWT_SECRET=...
```

### Deep link schemes (`ayurveda-app/app.json`)
```json
"scheme": ["ayurvedaapp", "oroganix"]
```
Both schemes are registered. The payment flow uses `oroganix://`.

---

## Invoice Generation
Uses `@sparticuz/chromium` + `puppeteer-core` to render `backend/src/template/invoice.html` to PDF, then uploads to AWS S3 via `uploadInvoiceToAWS`. The `pdf_url` is stored in the `invoices` table.

---

## New API Endpoints

### `GET /api/shop/trending`
Returns up to 20 products scored by engagement: `(reviewcount * 0.4 + averagerating * 20 * 0.6) DESC`.  
Controller: `backend/src/modules/products/product.controller.js` → `getTrending`  
Route: `backend/src/modules/products/product.routes.js`  
Auth: none (public). Query param: `?limit=N` (max 20, default 8).

### `GET /api/users/referral`
Returns referral code, full referrals list, totals and earnings for the current user.  
Controller: `backend/src/modules/users/userController.js` → `getReferralStats`  
Route: `backend/src/modules/users/userAuthRoutes.js`  
Auth: required (JWT).  
Response: `{ referral_code, referrals: [{status, created_at, referred_name, referred_email}], total, rewarded, earned }`.

### `GET /api/admin/revenue-chart`
Existing endpoint used by admin dashboard chart. Returns `{ success, data: [{label, revenue, orders}] }`.  
Query param: `?period=daily|weekly|monthly`.

---

## Admin Dashboard (`frontend/src/app/admin/dashboard/page.tsx`)
Complete rewrite. Key additions:
- **Recharts `AreaChart`** — dual-axis area chart showing revenue (left axis) and orders (right axis) from `/api/admin/revenue-chart`. Period selector (Daily / Weekly / Monthly) reloads chart data.
- **KPI Cards** — 6 cards (Revenue, Orders, Users, Products, Pending, Low Stock) with gradient icon containers, colored top accent bar, alert pulse dot when `pendingOrders > 0` or `lowStockItems > 0`.
- **Real-time toast** — Socket.io listener connects to admin namespace (`socket.emit('join_admin')`), listens for `new_order` event. Shows animated dark forest toast (bottom-right) with order ID for 6 seconds; clicking navigates to order detail. Silently refreshes stats + recent orders on each new order.
- **Low Stock panel** — spans full width, shows product chips with image thumbnail, name, and inventory count. Inline "Update" link to product edit.

---

## Web Header — Dark Mode Toggle (`frontend/src/components/layout/header.tsx`)
Added `Moon`/`Sun` toggle button in the actions bar:
- On mount: reads `localStorage.getItem('theme')`. Falls back to `prefers-color-scheme` media query.
- Toggle: flips `dark` class on `document.documentElement`, writes `'dark'/'light'` to localStorage.
- `tailwind.config.ts` already had `darkMode: 'class'` — no config change needed.
- Toggle button is visible on all screen sizes (between notification icons and the divider).

---

## Mobile Product Detail (`ayurveda-app/src/app/product/[id].tsx`)
UI enhancement applied — all logic and state unchanged. Key visual changes:
- **Price card**: the price row is now wrapped in a `LinearGradient` emerald-tinted glass card (`rgba(16,185,129,0.08)` → `rgba(5,150,105,0.04)`) with a subtle emerald border; price text uses `Colors.emerald`
- **Save % pill**: replaced flat mint pill with a gradient emerald pill (matching cart's style)
- **Bestseller pill**: replaced flat gold background with a `LinearGradient` gold pill with white text
- **Bottom CTA bar**: adds a `LinearGradient` background layer (`rgba(255,255,255,0.96)` → `rgba(240,253,244,0.98)`) for a mint-glass frosted effect; price text uses `Colors.emerald`

---

## Support Page — Header/Footer & Premium Theme

### Support List (`frontend/src/app/support/page.tsx`)
- Added `<Header />` and `<Footer />` imports (previously missing — page had no site navigation).
- Replaced plain `div.bg-gray-50` wrapper with dark-forest hero banner (`#0f2d1e → #1a3a2a` gradient) + `#f7f4eb` page background.
- Ticket cards: `background: #fff`, `borderLeft: 4px solid <status-dot>`, hover shadow, status + priority badges.
- New ticket form: animated `<AnimatePresence>` slide-in from `framer-motion`; forest-gradient Submit button.
- Status colour map: `open` = blue, `in_progress` = amber, `resolved` = emerald, `closed` = gray.

### Support Detail (`frontend/src/app/support/[id]/page.tsx`)
- Added `<Header />` and `<Footer />` (previously the page had no site header/footer).
- Replaced plain `bg-gray-50` wrapper with `#f7f4eb` page background.
- Added branded dark-forest ticket sub-header (back arrow + ticket status + close button) below site Header.
- Chat bubbles: user messages use `linear-gradient(135deg, #1a3a2a, #2d5a3d)` dark green; admin messages use white `#fff` with `#e8f5ee` border.
- Reply textarea has a mint-glass background; Send button uses the forest gradient.
- Loading state uses `<LeafLoader size={52} text="Loading ticket…" />`.

---

## Leaf Loader Component (`frontend/src/components/ui/leaf-loader.tsx`)
Brand-themed loading indicator replacing generic `animate-spin` circles.

**Design**: Animated SVG `strokeDasharray` arc on a circular track (emerald `#10b981`), with a static leaf SVG icon centred inside.

**Props**:
- `size` — diameter in px (default 48)
- `text` — optional caption below spinner
- `fullPage` — if true wraps in a centred `60vh` container

**Usage**:
```tsx
import { LeafLoader } from '@/components/ui/leaf-loader'
<LeafLoader size={52} text="Loading…" />
<LeafLoader fullPage text="Loading orders…" />
```

---

## Blog Page Premium Overhaul (`frontend/src/app/blog/page.tsx`)

Full visual redesign — all data fetching / pagination logic unchanged.
- **Hero**: dark-forest gradient (`#0a1f14 → #0f2d1e`) with ambient gold/emerald radial orbs. Search bar uses `rgba(255,255,255,0.08)` glass background with gold Submit button.
- **Featured post** (first result on page 1, no filter): full-width 50/50 card with cover image left + text right; only shown when not filtering/searching.
- **Post grid**: `repeat(auto-fill, minmax(300px, 1fr))`. Each card: white background, category overlay pill on the cover image using `categoryColor()`, hover lift effect (`translateY(-2px)`).
- **Category pills**: active pill uses `categoryColor()` (per-category colour map — Ayurveda = emerald, Wellness = gold, etc.); inactive = `#fff` with gray border.
- **CTA section**: dark-forest gradient with gold "wellness journey" accent and gold Shop Now button.
- **Loading**: `<LeafLoader size={52} text="Loading articles…" />` replaces `animate-spin`.

---

## Notifications Page Premium Overhaul (`frontend/src/app/notifications/page.tsx`)

Visual overhaul — all WebSocket, pagination and API logic unchanged.
- **Hero bar**: dark-forest gradient header with bell icon in emerald-tinted circle and gold unread badge. "Mark all read" button uses glass-white style.
- **Page background**: `#f7f4eb` (matches site theme) replacing `#f5f6fb`.
- **Tabs**: forest gradient for active tab, transparent for inactive.
- **Notification cards (`NotifCard`)**: unread state uses `rgba(16,185,129,0.04)` background + emerald border-left; icon colors updated from blue to theme palette (order = emerald, support = violet, ticket = amber, broadcast = gold).
- **Filter bar**: white card, grid layout, `#10b981` emerald active filter count badge.
- **Read chips**: forest gradient active, white inactive.
- **Loading**: `<LeafLoader size={48} text="Loading notifications…" />`.
- **Pagination**: forest gradient active page button, white inactive.

---

## Mobile — Coupon Field Name Fix

**Bug**: Mobile checkout and home screen OfferBanner used `c.type`, `c.value`, `c.min_order` to read coupon data from the API. After the backend change that added SQL aliases, the API now returns `discount_type`, `discount_value`, `min_order_amount` — so all coupon labels rendered as `undefined% OFF` / `₹undefined OFF`.

**Fix — Checkout** (`ayurveda-app/src/app/checkout/index.tsx`):
- Filter logic: `c.min_order` → `c.min_order_amount`
- Label render: `c.type === 'percent'`, `c.value` → `c.discount_type`, `c.discount_value`
- Locked hint: same fields updated

**Fix — Home OfferBanner** (`ayurveda-app/src/app/index.tsx`):
- `ActiveCoupon` interface: updated field names to `discount_type`, `discount_value`, `min_order_amount`
- `OfferBanner` component: updated all field reads to match

---

## Support System — Link Placement & Auth Guard Fix

### Where Support links were added
| Location | File | Condition |
|---|---|---|
| Desktop navbar | `frontend/src/components/layout/header.tsx` | Only shown when `loginuserdata?.id` is truthy |
| Mobile hamburger menu | `frontend/src/components/layout/header.tsx` | Same auth guard |
| Account sidebar | `frontend/src/app/account/AccountContent.tsx` | Part of `navItems` array (always visible to logged-in users) |
| Footer quick links | `frontend/src/components/layout/footer.tsx` | Public (no auth guard) |

### Auth loading race condition fix
**Problem**: On page refresh, `loginuserdata` is `null` during the async `fetchUser()` call. The support page's `useEffect` was firing immediately with `!loginuserdata === true`, causing `setOpenauth(true)` before auth resolved → login modal flash on every refresh.

**Fix pattern** (applied to `support/page.tsx` and `support/[id]/page.tsx`):
```ts
// Rename to avoid variable shadow with local loading state
const { loginuserdata, loading: authLoading, setOpenauth } = useAuth()
const [loading, setLoading] = useState(true)  // local ticket-fetch loading

useEffect(() => {
  if (authLoading) return          // wait for auth to resolve
  if (!loginuserdata) { setOpenauth(true); return }
  load()
}, [loginuserdata, authLoading, filterStatus])
```
The `loading: authLoading` alias is critical — without it, `const [loading, setLoading] = useState(true)` in the same scope silently shadows the context value, breaking the auth guard entirely.

---

## Support System — Real-time WebSocket (Bidirectional)

### Architecture
```
User browser / mobile app
  ↕  Socket.io  (ticket_${id} room)
Backend (support.controller.js)
  ↕  Socket.io  (admin_room + user_${userId} room)
Admin browser
```

### Backend events (no changes needed — already complete)
| Emitter | Event | Target |
|---|---|---|
| `createTicket` | `new_ticket` | `admin_room` |
| `replyTicket` (user) | `new_message` | `ticket_${id}` room |
| `adminReply` | `new_message` | `ticket_${id}` room |
| `adminReply` | `admin_replied` | `user_${user_id}` room |
| `adminUpdateTicket` | `ticket_status_updated` | `user_${user_id}` room |

### Frontend listeners
**`frontend/src/app/support/page.tsx`** (ticket list):
- Joins `user_${loginuserdata.id}` room via `socket.emit('join_user', id)`
- `admin_replied` → calls `load()` to refresh ticket list (shows unread reply)
- `ticket_status_updated` → patch single ticket status in state (no full reload)

**`frontend/src/app/support/[id]/page.tsx`** (ticket chat — user side):
- Joins `ticket_${id}` room
- `new_message` → adds all incoming messages (user's own messages also come via socket here — not duplicated via HTTP because `sendReply` does NOT add to state from the HTTP response)

**`frontend/src/app/admin/support/page.tsx`** (admin chat):
- Joins `ticket_${selected.id}` room when a ticket is selected
- `new_message` → only adds messages where `msg.sender_type === 'user'` (admin's own replies already added from HTTP response in `sendReply`)
- Leaves room and removes listener on ticket deselect

**`ayurveda-app/src/app/support/index.tsx`** (mobile chat):
- Dynamic import: `const { io } = await import('socket.io-client')` (matches existing mobile socket pattern)
- Joins `ticket_${selectedTicket.id}` room when `view === 'chat'`
- `new_message` → only adds messages where `msg.sender_type === 'admin'` (user's own messages already added from HTTP response)

### Duplicate-message prevention
| Side | Own messages | Other party's messages |
|---|---|---|
| User web | from HTTP response (no socket add) | from socket `new_message` |
| User mobile | from HTTP response (no socket add) | from socket `new_message` where `sender_type === 'admin'` |
| Admin | from HTTP response in `sendReply` | from socket `new_message` where `sender_type === 'user'` |

---

## Mobile — Current Location Detection (`expo-location`)

### Package
`expo-location` — installed via `npx expo install expo-location` (SDK-compatible version auto-selected). **Free** — uses device GPS and platform geocoder; no API key required.

### Permission config (`ayurveda-app/app.json`)
```json
[
  "expo-location",
  {
    "locationWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location to auto-fill delivery address.",
    "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location to auto-fill delivery address."
  }
]
```

### Implementation (`ayurveda-app/src/app/account/index.tsx`)
The `detectLocation` function is shared between the Add Address and Edit Address modals:
```ts
const detectLocation = async (setForm: (fn: (p: any) => any) => void) => {
  setLocating(true)
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Permission Required', '...'); return }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
    const results = await Location.reverseGeocodeAsync(pos.coords)
    if (results.length > 0) {
      const r = results[0]
      setForm(prev => ({
        ...prev,
        city: r.city || r.subregion || '',
        state: r.region || '',
        pincode: r.postalCode || '',
      }))
    }
  } catch { Alert.alert('Error', 'Failed to get location.') }
  finally { setLocating(false) }
}
```

**What it fills**: `city`, `state`, `pincode` — auto-populated from platform geocoder. User still types `street` manually (reverse geocoding street numbers is unreliable across devices).

**Requires native build**: `expo-location` is a native module and does not work in Expo Go. Use `npx expo run:android` or `eas build`.

---

## Mobile — LeafLoader Shared Component (`ayurveda-app/src/components/ui/LeafLoader.tsx`)
Shared mobile leaf loading indicator. Uses `react-native-reanimated` for a pulsing opacity + scale animation on the 🌿 emoji.

**Props**:
- `size`: `'sm'` (28px) | `'md'` (44px) | `'lg'` (64px) — default `'md'`
- `text`: optional caption
- `color`: accent color (unused in current impl, reserved for future ring version)

**Used in**: `blog/index.tsx`, `blog/[slug].tsx`, `account/notifications.tsx`

---

## Mobile — Notifications Premium Theme (`ayurveda-app/src/app/account/notifications.tsx`)

- **Header**: Changed from plain `Colors.cream` `View` to `LinearGradient colors={[Colors.forest, Colors.moss]}` header — matches other screens (Support, Blog, etc.)
- **Header buttons**: Back button, filter button, mark-all-read button now use `rgba(255,255,255,0.15)` glass style with white text/icons — consistent with gradient header
- **Unread card**: `backgroundColor` changed from `#eff6ff` (blue) to `rgba(16,185,129,0.06)` (emerald tint); `borderLeftColor` changed from `#3b82f6` (blue) to `Colors.emerald`
- **Type metadata**: `order_update` dot color changed from `#3b82f6` (blue) to `Colors.emerald`; `broadcast` dot changed to `Colors.gold`
- **Loading state**: Replaced `ActivityIndicator` with `<LeafLoader size="md" text="Loading notifications…" />`

---

## Mobile — Blog HTML Content Fix (`ayurveda-app/src/app/blog/[slug].tsx`)

**Bug**: Content was rendered with `post.content.replace(/<[^>]*>/g, '\n')` — stripped all HTML tags to plain text, losing headings, bullet points, blockquotes, and paragraph structure.

**Fix**: Added a custom `HtmlContent` component with:
- `parseHtml(html)` — regex extracts block elements (`h1`-`h6`, `p`, `li`, `blockquote`) with their inner text
- `stripInline(html)` — cleans inline tags (`<strong>`, `<em>`, `<a>`, etc.) and HTML entities from each block's text
- Each block type rendered with appropriate `Text` style (h1 = `Fonts.displayBold` 22px forest, h2 = `Fonts.bold` 18px, li = bullet prefix, blockquote = emerald left border card)
- Loading state replaced with `<LeafLoader size="lg" />`

---

## Web — FAQ Page: API-Driven Content

**File**: `frontend/src/app/faq/page.tsx`

The FAQ page now loads data from the API instead of hardcoded arrays:
- `useEffect` fetches `GET /api/faq` on mount
- Response shape: `{ faqs: { [category: string]: [{id, question, answer}][] } }`
- An `iconMap` maps category names to lucide icons (same categories as admin CRUD)
- `faqLoading` state prevents premature "no results" — shows 3 skeleton bars while loading
- Empty states differentiate between "loading", "no FAQs in DB yet", and "no search results"
- Legacy hardcoded data const removed

**Admin management**: `/admin/faq` — full CRUD with category grouping, sort order, active toggle, and create/edit modal.

**Backend migration**: Run `backend/src/migrations/001_create_faqs_table.sql` once to create the `faqs` table.

---

## Web + Mobile — Wishlist "Add All to Cart"

**Web** (`frontend/src/app/wishlist/page.tsx`):
- New `addingAll` state, new `addAllToCart` function
- Filters items by: `inventory > 0` AND not already in cart
- Uses `Promise.all` to add all eligible items simultaneously
- Button appears in the hero controls area (top right, next to search) only when wishlist is non-empty
- Shows "Add All to Cart" → "Adding…" while in progress; shows success with count of items added
- If all in-stock items are already in cart, shows toast "All in-stock items are already in your cart!"

**Mobile** (`ayurveda-app/src/app/wishlist/index.tsx`):
- Same `addingAll` state + `addAllToCart` function
- Same eligibility filter: in-stock AND not already in cart
- Button renders as a full-width gradient bar below the search box (only when items exist)
- Uses haptics: `Heavy` impact on tap, `Success`/`Error` notification on completion

---

## Web — Recently Viewed Section (Home Page)

**Component**: `frontend/src/components/sections/recently-viewed-section.tsx` (new file)
**Used in**: `frontend/src/app/page.tsx` — placed between `FeaturedProductsSection` and `FeaturesSection`

- Auth-gated: only fetches and renders for logged-in users
- Fetches `GET /api/shop/recently-viewed` (auth required, returns last 10 viewed active products)
- Returns `null` if: not logged in, still loading, or no products
- Horizontal scroll row of product cards (200px wide each), no pagination
- Each `RecentCard` supports: add to cart, wishlist toggle, out-of-stock state, discount badge

---

## Web — Subscriptions Tab in Account Page

**File**: `frontend/src/app/account/AccountContent.tsx`

New additions:
- Icons: `RotateCcw`, `Pause`, `Play` added to lucide-react imports
- States: `subscriptions: any[]`, `subLoading: boolean`
- `loadSubscriptions()` — fetches `GET /api/subscriptions/my`
- `pauseSubscription(id, currentStatus)` — calls `PUT /api/subscriptions/:id` with `{ status: 'paused' | 'active' }`, optimistic state update
- `cancelSubscription(id)` — calls `DELETE /api/subscriptions/:id`, removes from state after confirmation
- Nav item added: `{ href: '/account?tab=subscriptions', tab: 'subscriptions', icon: RotateCcw, label: 'Subscriptions' }` (between Wallet & Customer Support)
- `TabsTrigger value="subscriptions"` added to hidden TabsList
- `TabsContent value="subscriptions"` — renders subscription cards with status badge, frequency label, next-order date, pause/resume/cancel actions

**API used**:
- `GET /api/subscriptions/my` → `{ success, data: Subscription[] }`
- `PUT /api/subscriptions/:id` → `{ status: 'paused' | 'active' }`
- `DELETE /api/subscriptions/:id` → cancels subscription

---

## Mobile — Subscriptions Screen

**File**: `ayurveda-app/src/app/account/subscriptions.tsx` (new file, expo-router auto-registered)
**Route**: `/account/subscriptions`
**Entry point**: Account quick-access grid — "🔁 Subscriptions" button

Features:
- Fetches `GET /subscriptions/my` on mount
- Status badges: active (green), paused (yellow), cancelled (red)
- Frequency label from lookup: `{ 7: 'Weekly', 14: 'Every 2 weeks', 30: 'Monthly', 60: 'Every 2 months', 90: 'Every 3 months' }`
- Shows next order date for active subscriptions
- Pause/Resume button: calls `PUT /subscriptions/:id` with toggled status, updates state optimistically
- Cancel button: shows `Alert.alert` confirmation before calling `DELETE /subscriptions/:id`
- Cancelled subs show at 60% opacity with no action buttons
- Product image via `expo-image` with 🌿 fallback

---

## Mobile — FAQ Screen

**File**: `ayurveda-app/src/app/faq/index.tsx` (new file)
**Route**: `/faq`
**Entry point**: Account quick-access grid — "❓ FAQ" button

Features:
- Fetches `GET /faq` (public endpoint) on mount
- Groups into categories — shows horizontal scroll of category chips above the list
- Active category chip highlighted in `Colors.forest`; FAQ items filtered to selected category
- Search bar: debounce-free immediate filter across ALL categories when search is active (category chips hidden during search)
- Expand/collapse individual FAQ items with `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)` for smooth open/close
- Category emoji map: General ❓, Products & Quality 🌿, Orders & Shipping 📦, Payment 💳, Returns & Refunds ↩️, Account 👤, Other 💬
- Loading state: `ActivityIndicator`; empty-DB state: "No FAQs yet" message; no-results state: "No results, try different keywords"
- `UIManager.setLayoutAnimationEnabledExperimental(true)` enabled for Android layout animations

---

## Mobile — Recently Viewed (Home Screen)

Already implemented in `ayurveda-app/src/app/index.tsx`:
- For logged-in users: fetches `GET /shop/recently-viewed` on focus
- For guests: reads from AsyncStorage `recently_viewed` key (stored when visiting product detail pages)
- Horizontal scroll row rendered with shared `ProductCard` component
- Only shown when `recentlyViewed.length > 0`

---

## Bug Fix — Tracking Routes Uncommenting

**Problem**: Order timeline route (`GET /orders/:id/timeline`) was commented out in `backend/src/modules/orders/order.routes.js`, causing 404 on the tracking page.

**Fix**: Uncommented `router.get("/:id/timeline", auth, controller.getOrderTimeline)` in order routes.

---

## Order Confirmation Email (COD + Online)

**Service**: Brevo (SIB) — `backend/src/services/email/orderConfirmation.js` → `sendOrderConfirmationEmail({ user, order, items, paymentMethod })`

### COD flow
In `createOrder` (order.controller.js): after committing the transaction, fetch user + order + items and call `sendOrderConfirmationEmail({ paymentMethod: 'cod' })`.

### Online flow (verify)
In `verifyPayment`: after the COMMIT block, `Promise.all([fetchUser, fetchOrder, fetchItems])` then call `sendOrderConfirmationEmail({ paymentMethod: 'online' })`.

### Webhook flow
`razorpayWebhook` (see below) also calls `sendOrderConfirmationEmail({ paymentMethod: 'online' })` after marking the order paid.

---

## Razorpay Webhook Endpoint

**Problem**: Standard `express.json()` parses the body, destroying the raw bytes needed for HMAC signature verification.

**Solution in `backend/src/app.js`**: Register the webhook route BEFORE `express.json()`:
```js
app.post(
  '/api/orders/webhook',
  express.raw({ type: 'application/json' }),
  require('./modules/orders/order.controller').razorpayWebhook
);
```

**Environment variable**: `RAZORPAY_WEBHOOK_SECRET` (separate from `RAZORPAY_SECRET` — set in Razorpay dashboard → Webhooks).

**Handler** (`exports.razorpayWebhook`):
1. Verify `X-Razorpay-Signature` HMAC-SHA256 against `RAZORPAY_WEBHOOK_SECRET`
2. On `payment.captured` event: reduce variant-aware stock, mark order paid, clear cart, credit referral, send confirmation email, emit socket `order_status_change`

---

## Web — Search Page Rebuild (`frontend/src/app/search/page.tsx`)

Full rewrite replacing the old placeholder page.

**Features**:
- Debounced search input (350ms), syncs with `?q=` URL param
- Filters panel: category dropdown, min/max price, in-stock toggle, discount-only toggle — toggled via `SlidersHorizontal` button with active-filter count badge
- Sort dropdown: Relevance, Price low/high, Newest, Top Rated, Most Popular
- 12-per-page grid with 12 animated skeleton placeholders during load
- `ProductCard`: wishlist toggle, add-to-cart, OOS state, discount badge
- Pagination with ellipsis for large page counts
- Popular searches shown when query is empty

---

## Web — Inline Add Address at Checkout (`frontend/src/app/checkout/page.tsx`)

**Before**: when no address existed, redirected to `/account?tab=addresses`.

**After**: inline form appears directly in the checkout step:
- States: `showAddressForm`, `newAddr` (`{street, city, state, pincode, type, email}`), `addingAddr`
- `handleAddAddress()`: validates all fields + 6-digit pincode, POSTs to `/users/address`, reloads address list, auto-selects new address, closes form
- In `placeOrder()`: replaces redirect with `setShowAddressForm(true)` + scroll to step 1
- "Add New Address" / "+ Add Delivery Address" toggle button, inline form with Address Type / PIN / Street / City / State / Email + "Save Address & Continue" CTA

---

## Mobile — Inline Add Address at Checkout (`ayurveda-app/src/app/checkout/index.tsx`)

Same pattern as web:
- States: `showAddrForm`, `newAddr`, `addingAddr`
- Removed `Alert.alert` redirect → `setShowAddrForm(true)`
- `handleAddAddress()`: validates all fields + 6-digit pincode, POSTs to `/users/address`, reloads list, selects default
- "Add New Address" gold dashed-border `TouchableOpacity`, inline form with `FadeInDown` animation + TextInput fields for street, city, state, pincode, email

---

## Web + Mobile — Frequently Bought Together (PDP)

**New API endpoint**: `GET /api/bundles/by-product/:productId`
- Controller: `backend/src/modules/bundles/bundle.controller.js` → `getBundlesByProduct`
- Returns up to 4 active bundles that contain the given product (via EXISTS subquery on `bundle_products`)
- Route: `backend/src/modules/bundles/bundle.routes.js`

**Web** (`frontend/src/app/product/[id]/page.tsx`):
- States: `bundles`, `bundleLoading`, `bundleAdding`
- Fetches on mount; section inserted before Related Products
- Each bundle card: dark green header with name + save %, mini product image row with + separators, price row, "Add Bundle to Cart" button

**Mobile** (`ayurveda-app/src/app/product/[id].tsx`):
- Same fetch + state pattern
- Bundle cards rendered in a horizontal scroll row on the PDP

---

## Web — Review Sort + Star Filter (PDP)

**File**: `frontend/src/app/product/[id]/page.tsx`

- States: `reviewSort` (default `'created_at'`), `reviewRating` (default `0`), `filteredReviews`, `filterLoading`
- When sort/rating ≠ defaults: fetches `GET /shop/reviews/product/:id?sortBy=X&rating=Y` directly (bypasses auth-context paginated data)
- When at defaults: shows context data (`loadReviews` result)
- Review list: `(filteredReviews ?? reviewsData?.data)?.map(...)`
- UI: sort dropdown + 5 star-filter buttons above review write form; empty state text adapts when star filter is active

**Backend** (`GET /shop/reviews/product/:id`): already supports `sortBy` (created_at, rating_desc, rating_asc, helpful) and `rating` query params.

---

## Mobile OTP — Coming Soon State

**File**: `ayurveda-app/src/app/auth/index.tsx`

- `sendMobileOtp`: replaced API call with `toast.error('Mobile OTP login is coming soon. Please sign in with your email.')`
- `verifyMobileOtp`: same toast
- OTP info box changed to orange "🚧 Coming soon" banner (`color: '#c2410c'`, `backgroundColor: '#fff7ed'`)

No backend changes — SMS gateway not yet integrated.

---

## Web — Cart Save for Later + Stock Badges (`frontend/src/app/cart/page.tsx`)

**Save for Later**:
- `saveForLater(item)`: POSTs to `/shop/wishlist`, DELETEs `/cart/:productId`, updates local state
- `moveToCart(productId)`: POSTs to `/cart`, DELETEs `/shop/wishlist/:productId`
- "Saved for Later" section above Order Summary shows wishlist items with "Move to Cart" buttons (disabled when OOS)

**Stock badges** (per cart item):
- `inventory === 0`: red "Out of stock" badge
- `1 ≤ inventory ≤ 5`: orange "⚠ Only X left!" badge
- `inventory > 5`: no badge

---

## Product Comparison

### Hook (`frontend/src/hooks/useCompare.ts`)
- `useCompare()` — reads/writes compare list (max 4 items) from `localStorage` key `compare_list`
- Emits `compare-update` custom event so all hook instances stay in sync
- API: `{ list, add, remove, toggle, clear, has, count }`

### Floating Bar (`frontend/src/components/compare/CompareBar.tsx`)
- Client component added to root layout inside `<Suspense>`
- Renders fixed bar at `bottom: 0` when `count > 0`
- Shows product thumbnails + names; "Compare Now →" link to `/compare?ids=1,2,3`

### Compare Page (`frontend/src/app/compare/page.tsx`)
- Reads `ids` query param, fetches each product from `GET /shop/public/:id`
- Renders comparison table for fields: price, category, brand, weight, FSSAI, returnable, rating, reviews, ingredients, benefits, usage, storage, warnings
- Lowest price column gets a "BEST" badge

### Product Detail Page (`frontend/src/app/product/[id]/page.tsx`)
- "Add to Compare" button calls `compareToggle()` — turns green when product is in compare list

---

## Loyalty Tier System

### Backend (`backend/src/modules/wallet/wallet.controller.js`)
- `GET /wallet/tier` → queries sum of delivered order amounts for the user, maps to bronze/silver/gold/platinum tier
- Syncs stale `users.loyalty_tier` and `users.total_spent` columns on each call
- Returns `{ tier: { name, label, min_spend, total_spent, benefits }, next_tier, all_tiers }`

### Schema (`backend/src/database/init.js`)
- `ALTER TABLE users ADD COLUMN IF NOT EXISTS loyalty_tier VARCHAR(20) DEFAULT 'bronze'`
- `ALTER TABLE users ADD COLUMN IF NOT EXISTS total_spent NUMERIC(12,2) DEFAULT 0`

### Web (`frontend/src/app/account/AccountContent.tsx`)
- `WalletTab` component fetches `/wallet/tier` on mount
- Renders tier card with progress bar above "How it works" section

### Mobile (`ayurveda-app/src/app/account/wallet.tsx`)
- Fetches `/wallet/tier` on mount
- Renders tier card between balance card and "How it works"

---

## Subscription Auto-Billing

### Service (`backend/src/services/subscriptionBilling.js`)
- Runs daily at 6am via `node-cron` (`backend/src/jobs/index.js`)
- Queries subscriptions where `next_order_date <= CURRENT_DATE` and `status = 'active'`
- For each: checks stock, calculates pricing + expected delivery date from `serviceable_pincodes.delivery_days`, inserts order + items, deducts inventory, advances `next_order_date`
- Out-of-stock: pushes `next_order_date` +1 day, skips order silently

---

## SMS Service

### Service (`backend/src/services/sms.js`)
- ENV-gated: reads `FAST2SMS_API_KEY`. Without it, all functions log to console and return `{ sent: false }`
- `sendOTP(phone, otp)` — used in mobile OTP login
- `sendOrderStatusSMS(phone, orderNo, status)` — order status updates
- `sendDeliveryOTP(phone, otp, orderNo)` — COD delivery OTP

---

## Reorder Endpoint

### Backend (`backend/src/modules/orders/order.controller.js`)
- `POST /orders/:id/reorder` — copies items from an existing order into the user's cart
- Uses `ON CONFLICT (user_id, product_id, COALESCE(variant_id, -1)) DO UPDATE SET quantity = cart.quantity + EXCLUDED.quantity`

### Web (`frontend/src/app/account/AccountContent.tsx`)
- "Reorder" button in orders list calls `POST /orders/:id/reorder` then shows toast

### Mobile (`ayurveda-app/src/app/order/[id].tsx`)
- `handleReorder()` already implemented — calls same endpoint

---

## Admin Analytics

### Backend endpoints (`backend/src/modules/admin/admin.controller.js`)
- `GET /admin/analytics/products?sortBy=revenue|units|orders|returns&from=&to=` — aggregation join on order_items + products
- `GET /admin/analytics/funnel?from=&to=` — queries `analytics_events` and `orders` tables for 5-stage funnel with step conversion rates

### Web (`frontend/src/app/admin/analytics/page.tsx`)
- Product performance table: sortable by revenue/units/orders/returns, top 20 products
- Conversion funnel: horizontal progress bars with percentage of top-of-funnel + step conversion rate

---

## Bug Fixes — Audit Round (2026-07-23)

### Mobile Checkout: `toast.show()` → correct methods
- **File**: `ayurveda-app/src/app/checkout/index.tsx`
- `toast.show('msg', 'type')` doesn't exist on the Toast singleton. Fixed 4 calls:
  - `toast.show('All address fields are required', 'error')` → `toast.error('All address fields are required')`
  - `toast.show('Enter valid 6-digit pincode', 'error')` → `toast.error('Enter valid 6-digit pincode')`
  - `toast.show('Address added!', 'success')` → `toast.success('Address added!')`
  - `toast.show(e?.response?.data?.message || ..., 'error')` → `toast.error(...)`

### Backend: Global Error Handler + 404 Handler
- **File**: `backend/src/app.js`
- Added 404 handler (`app.use((req, res) => ...)`) before `module.exports`
- Added Express 4-arg error middleware (`app.use((err, req, res, next) => ...)`) so unhandled exceptions return JSON instead of HTML

### Backend: Login Rate Limiter
- **File**: `backend/src/modules/users/userAuthRoutes.js`
- Added `loginLimiter` (20 req / 15 min) applied to `POST /users/login`
- Previously `/users/login` had no rate limiting; only `/users/register` was protected

### Mobile Auth: Removed "Mobile OTP" Tab
- **File**: `ayurveda-app/src/app/auth/index.tsx`
- Removed `{ key: 'mobileOtp', label: 'Mobile OTP', icon: '📱' }` from `TAB_MODES`
- The feature is not implemented (was showing "coming soon" toast). The tab no longer appears in the auth screen.

### Mobile Layout: Registered Missing Screens
- **File**: `ayurveda-app/src/app/_layout.tsx`
- Added `Stack.Screen` registrations for `faq/index`, `account/subscriptions`, `account/notifications`
- These screens existed in the filesystem but lacked Stack config, so custom transitions were missing

---

## Return Request — Photo Upload

### Backend (`backend/src/modules/orders/order.controller.js` + `order.routes.js`)

- Route: `POST /:id/return` uses `upload.array("images", 5)` (multer)
- `returnOrder` controller: uploads `req.files` to S3 under `'returns'` folder via `uploadImageToAWS`, accepts `imageUrls` JSON string, runs `ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_images TEXT`, stores JSON array of S3 URLs

### Web (`frontend/src/app/orders/[id]/page.tsx`)

- States: `returnFiles`, `returnUrlInput`, `returnUrlImages`
- `submitReturn`: builds `FormData` with `reason`, `images[]` files, `imageUrls` JSON; sends `multipart/form-data`
- UI: image preview grid (files + URL images) with ✕ remove, "📁 Upload Photos" file input, URL paste + "Add" button, "Max 5 photos · JPG, PNG, WEBP" hint

### Mobile (`ayurveda-app/src/app/order/[id].tsx`)

- `handleReturn(reason, urlImages, fileImages)`: builds `FormData`, appends files as RN file objects, posts `multipart/form-data`
- `ReturnModal` updated: states `urlInput`, `urlImages`, `fileImages`; `pickImages` via `ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: remaining })`; image preview grid with ✕ remove; URL paste + Add button; max 5 total

---

## F14 — Bulk Order Status Update

### Backend (`backend/src/modules/admin/admin.controller.js`)
- `exports.adminBulkUpdateOrderStatus` — accepts `{ orderIds: number[], status: number }`
- Validates inputs, loads existing orders, runs each update in a loop (individual transactions for per-order logic)
- Special handling for status=5 (Delivered): sets `delivered_at`, marks COD as `payment_status='paid'`
- Inserts to `order_status_logs` with `note='bulk update'`
- Post-commit: sends email, push notification, Socket.io (`emitToUser`), and `emitToAdmin('order_status_changed')` for each order

### Route (`backend/src/modules/admin/admin.routes.js`)
- `PUT /admin/orders/bulk-status` registered BEFORE `GET /admin/orders/:id` to prevent Express matching `bulk-status` as an `:id` param

### Admin UI (`frontend/src/app/admin/orders/page.tsx`)
- Added select column with header checkbox (`toggleSelectAll`) and per-row checkbox (`toggleSelect`)
- Bulk action toolbar appears when `selectedIds.size > 0`: shows count, status dropdown, Apply button
- `bulkUpdateStatus()` calls `PUT /admin/orders/bulk-status`; resets selection after success

---

## F16 — Full-Screen Image Viewer with Pinch-Zoom (Mobile)

### Component (`ayurveda-app/src/app/product/[id].tsx`)
- `ImageViewerModal` replaces previous single-image `ImageZoomModal`
- `PanResponder` captures downward swipes: `onMoveShouldSetPanResponder` returns true only when `dy > 10 && |dy| > |dx| * 1.8` (prevents conflict with FlatList horizontal swipe and ScrollView pinch-zoom)
- Swipe-down dismiss: `translateY + bgOpacity` animated in parallel; threshold = `dy > 110 || vy > 0.8`
- Images laid out in a horizontal `FlatList` (multi-image support)
- Each image in a `ScrollView` with `maximumZoomScale={4}` and `minimumZoomScale={1}` (pinch-to-zoom)
- Dot indicators and image count badge rendered as overlays
- Swipe-up hint text appears at bottom

---

## F18 — Haptic Feedback (Mobile)

Uses `expo-haptics` via shared utility at `ayurveda-app/src/utils/haptics.ts`.

| Action | Haptic |
|---|---|
| Add to cart (new item) | `NotificationFeedbackType.Success` |
| Add to cart (quantity update) | `ImpactFeedbackStyle.Medium` |
| Wishlist toggle | `ImpactFeedbackStyle.Light` |
| COD order success | `NotificationFeedbackType.Success` |
| Online payment verified | `NotificationFeedbackType.Success` |

---

## F19 — Rating Filter (Mobile Product List)

### Mobile (`ayurveda-app/src/app/products/index.tsx`)
- `minRating` state (default `0`)
- Added to fetch params as `rating: minRating` when `minRating > 0`
- Cleared in both "Clear All" handlers and the empty-state clear button
- Filter sheet UI: `[0, 3, 3.5, 4, 4.5]` chips rendered as `TouchableOpacity` rows

### Backend
- `GET /shop/products` already supports `?rating=X` param (filters by `average_rating >= X`)

---

## F21 — Dosha Quiz

### Backend
- `backend/src/modules/quiz/quiz.controller.js`: `QUESTIONS` array (10 questions × 3 options), `DOSHA_INFO` object (description, tips, categories, color, emoji per dosha), `getQuestions` and `submitResult` exports
- `backend/src/modules/quiz/quiz.routes.js`: `GET /questions` (public), `POST /result` (public, no auth)
- `backend/src/app.js`: `app.use('/api/quiz', quizRoutes)`
- `backend/src/database/init.js`: `quiz_results` table created (`id, user_id, session_id, dosha, vata_score, pitta_score, kapha_score, answers JSONB, created_at`); indexes on `user_id` and `dosha`

### Web (`frontend/src/app/dosha-quiz/page.tsx`)
- Multi-step: intro → loading → questions (with progress bar + Back) → results
- Results: dosha score bars (%), description, ✓ tips, recommended category links, Retake/Shop buttons
- Entry point: `frontend/src/app/page.tsx` — `bg-linear-to-r` quiz banner section with `Link href="/dosha-quiz"`

### Mobile (`ayurveda-app/src/app/quiz/index.tsx`)
- Animated question transitions (`fadeAnim` + `slideAnim` via `Animated.parallel`)
- Results screen with `LinearGradient` header, score bars, tips with checkmarks, Retake/Shop CTAs
- Client-side fallback result computed locally if API call fails
- Entry point: `ayurveda-app/src/app/index.tsx` — `LinearGradient` quiz CTA card on home screen

---

## F22 — Safety Tags

### Backend
- `backend/src/database/init.js`: `ALTER TABLE products ADD COLUMN IF NOT EXISTS safety_tags TEXT[] DEFAULT '{}'`
- `admin.controller.js` `createProduct`: added `safety_tags` to destructure; converts via `safety_tags ? (Array.isArray(safety_tags) ? \`{\${safety_tags.map(t=>\`"${t}"\`).join(',')}}\` : \`{\${String(safety_tags).split(',').map(t=>t.trim()).filter(Boolean).map(t=>\`"${t}"\`).join(',')}}\`) : '{}'` for PostgreSQL `TEXT[]` syntax
- Same conversion in `updateProduct`

### Admin Form (`frontend/src/app/admin/products/AdminProductForm.tsx`)
- `safety_tags: ''` in initial state; prefill converts `TEXT[]` to comma-separated string
- Text input for comma-separated tags + live badge preview

### Web Product Page (`frontend/src/app/product/[id]/page.tsx`)
- `safety_tags?: string[]` added to Product interface
- Renders green ✓ badge row before the non-returnable notice

### Mobile Product Screen (`ayurveda-app/src/app/product/[id].tsx`)
- `safety_tags?: string[]` added to Product interface
- Horizontal `ScrollView` of green badge pills inserted before the non-returnable notice

---

## F23 — Dashboard Real-time Stats via Socket.io

### Backend
- `admin.controller.js` `updateOrderStatus`: added `emitToAdmin('order_status_changed', { order_id: id, new_status: status })` after user notifications
- `admin.controller.js` `adminBulkUpdateOrderStatus`: same emit inside per-order notification loop

### Admin Dashboard (`frontend/src/app/admin/dashboard/page.tsx`)
- Added `socket.on('order_status_changed', ...)` handler alongside existing `new_order` listener
- Both events silently call `GET /admin/stats` and `GET /admin/recent-orders` to refresh state

---

## F24 — Razorpay Refund Webhook Handling

### Backend (`backend/src/modules/orders/order.controller.js`)
- `razorpayWebhook` extended to handle `refund.processed` and `refund.failed` events (before the `payment.captured` check)
- Looks up order by `razorpay_payment_id = refund.payment_id`
- Updates `refund_id`, `refund_status` (`'processed'` or `'failed'`), `refund_amount` (converts paisa → rupees)
- Calls `createNotification` + `emitToUser` for both statuses

### Admin Orders (`frontend/src/app/admin/orders/page.tsx`)
- Refund badge added after payment_status badge in order detail panel:
  - Purple `REFUND: PROCESSED` + amount when `refund_status === 'processed'`
  - Red `REFUND: FAILED` when `refund_status === 'failed'`

### Admin Returns (`frontend/src/app/admin/returns/page.tsx`)
- Small inline badge next to Refund Amount in the return detail modal:
  - Purple `PROCESSED` or red `FAILED` from `selected.refund_status`

---

## Feature Additions (2026-07-30)

### MF04 — In-app notification badge count (mobile)
- **Store** (`store/index.ts`): Added `unreadNotificationCount: number` and `setUnreadNotificationCount(n)` to `AppState`.
- **`useBootstrap.ts`**: After user session is restored, calls `fetchUnreadNotifs()` → `GET /notifications?is_read=false&limit=1` → sets store count.
- **`account/notifications.tsx`**: Calls `setUnreadNotificationCount(0)` on mount to clear the badge.
- **`BottomNav.tsx`**: Reads `unreadNotificationCount` from store; shows red badge on Account tab when > 0.

### PG03 — Mobile settings screen
- New screen at `ayurveda-app/src/app/settings/index.tsx`.
- Registered in `_layout.tsx` as `settings/index`.
- Accessible from Account screen → "⚙️ Settings" row.
- Features: profile edit links, notification toggles, help links, clear cache, share app, logout, delete account.

### PG01 — Mobile deals/offers screen
- New screen at `ayurveda-app/src/app/deals/index.tsx`.
- Pulls from `GET /flash-sales/active` and `GET /shop?discount=true`.
- Shows live countdown timer for flash sales.
- Registered in `_layout.tsx` as `deals/index`.
- Linked from home screen as a red CTA banner.

### PG04 — Mobile notify-me on PDP (product detail page)
- `NotifyMeButton` component added to `product/[id].tsx`, shown when `effectiveInventory === 0`.
- Posts to `POST /products/notify-stock` with `product_id` and optional `variant_id`.
- Shows subscribed state after success.

### BE07 + UA02 — Admin sparklines endpoint + dashboard KPI sparklines
- **BE** (`admin.controller.js`): Added `exports.sparklines` — queries 7-day rolling data for revenue (from `payments`), orders, and users; returns arrays of 7 daily totals.
- **Route** (`admin.routes.js`): `GET /admin/sparklines` (auth + admin).
- **Frontend** (`admin/dashboard/page.tsx`): Added `Sparkline` SVG component; `KpiCard` accepts `sparkline` and `sparkColor` props; dashboard fetches `/admin/sparklines` on load.

### Admin live server stats
- **`socket.js`**: Added `connectedCount` counter; emits `server_stats` to `admin_room` on connect/disconnect; `getLiveStats()` returns `{ connectedUsers, cpu, memory, uptime }` using `os.loadavg()` and `os.freemem()`.
- **`admin.controller.js`**: Added `exports.serverStats` — returns `getLiveStats()`.
- **Route**: `GET /admin/server-stats`.
- **`admin/layout.tsx`**: Socket subscribes to `server_stats` event; shows live badge in header with CPU % and online user count; click to expand full metrics panel.

### Admin responsive layout (big screens)
- Removed `max-w-7xl mx-auto` / `max-w-6xl mx-auto` from: `dashboard`, `invoices`, `banners`, `categories`, `coupons`, `settings`, `stock-notifications`, `faq` admin pages.
- Pages now use `w-full` so content fills the available main area on any monitor width.

### UA09 — Admin table empty states
- Updated `frontend/src/components/table/table.tsx` `DynamicTable` empty state: now shows a dashed circle illustration (CSS-drawn), bold title, and helpful subtitle text.

### Real-time admin alerts (low-stock, new order, new ticket)
- **`admin.controller.js`**: After product inventory update, if `newInventory <= 10`, emits `low_stock_alert` to `admin_room` with `{ productId, productName, inventory }`.
- **`admin/layout.tsx`**: Socket listens for `low_stock_alert`, `new_order`, `new_ticket` events — each shows a styled toast and increments the respective bell counter in real-time.

### SMS order status notifications (F7)
- **`admin.controller.js`**: Imported `sendOrderStatusSMS`; calls it after order status update for statuses 2, 3, 4, 5, 6, 9 using the customer's phone number.
- **`services/sms.js`**: `sendOrderStatusSMS(phone, orderNo, status)` already implemented with Fast2SMS; requires `FAST2SMS_API_KEY` env var.

### Refund tracking (F24)
- **`order.controller.js`** (`getOrderById`): Added `o.refund_id`, `o.refund_amount`, `o.refund_status` to the SELECT query.
- **`frontend/src/app/orders/[id]/page.tsx`**: Shows "Refund Status" card with amount, status badge, Razorpay ref ID, and credit timeline note.
- **`ayurveda-app/src/app/order/[id].tsx`**: Shows refund info inside the special status banner (for statuses 6, 7, 8, 9) with amount, status, and ref ID.

### Brand pages (PG07)
- **BE**: Added `GET /brands/:slug` → `getPublicBrandBySlug`: returns brand details + product count + avg rating.
- **Frontend**: Created `frontend/src/app/brand/[slug]/page.tsx` — shows brand hero with logo, description, stats; paginated product grid with sort; links from product page brand name.

### Customer Segments dashboard (PG08)
- **BE**: Added `GET /admin/customer-segments` → `exports.customerSegments`: queries 5 cohort counts (new users, loyal, high-value, VIP, inactive) + top 10 spenders.
- **Frontend**: Created `frontend/src/app/admin/segments/page.tsx` — KPI cards per segment, recommended action cards, top spenders table.
- Added "Customer Segments" to admin sidebar and command palette.

### PG05 — Mobile product compare
- **`store/index.ts`**: Added `compareIds: number[]`, `toggleCompare(id)` (max 3), `clearCompare()` to AppState.
- **`app/compare/index.tsx`** (NEW): Compare screen; fetches product details for all compareIds in parallel; renders horizontal scrollable table with FIELDS row labels on left and product columns on right; best price highlighted in green.
- **`app/_layout.tsx`**: Registered `compare/index` route with `slide_from_bottom` animation.
- **`app/product/[id].tsx`**: Added Compare button below CTAs; toggles `compareIds` in store; shows "View (N)" link to navigate to compare screen.

### UA08 — Drag-and-drop product image reorder (admin)
- **`frontend/src/app/admin/products/AdminProductForm.tsx`**: Imported `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
- Added `SortableImageItem` component using `useSortable`; shows drag handle (GripVertical icon), "MAIN" badge on first image, remove button on hover.
- Added `SortableImageGrid` component with `DndContext` + `SortableContext` + `rectSortingStrategy`; reorders the `form.images` array via `arrayMove` on `DragEnd`.
- Image order determines upload order; first image becomes the main product image.

### Wide-screen responsive layout fix
- **Problem**: Header and footer had `max-width: 1280px` on content wrappers. On 1920px+ monitors this left ~320px dead space on each side, making the site look narrow.
- **Header fix** (`frontend/src/components/layout/header.tsx`): Changed `.header-inner` and `.top-bar-inner` from `max-width: 1280px` → `1600px`. Added `@media (min-width: 1920px)` breakpoint setting both to `1920px` with `padding: 0 48px`.
- **Footer fix** (`frontend/src/components/layout/footer.tsx`): Changed all three inner wrappers (newsletter, body, bottom) from `max-width: 1280px` → `1600px`.
- **Tailwind config** (`frontend/tailwind.config.ts`): Added `3xl: '1920px'` to `screens`.
- **Global CSS** (`frontend/src/app/globals.css`): Added `@media (min-width: 1600px)` rule capping `.container` at `1600px`, and `@media (min-width: 1920px)` at `1920px`.
