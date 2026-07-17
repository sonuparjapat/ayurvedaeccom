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
