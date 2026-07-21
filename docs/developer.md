# Developer Notes — Oroganix eCommerce

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
