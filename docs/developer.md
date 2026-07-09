# Developer Notes — Oroganix eCommerce

## Mobile Payment Flow (Razorpay)

### Architecture
```
Mobile checkout → GET /api/orders/:id/payment-page?returnUrl=oroganix://payment&token=<jwt>
  → backend renders Razorpay checkout HTML
  → user pays in browser tab
  → Razorpay JS: window.location = /api/orders/payment-redirect?...
  → backend 302 → oroganix://payment?status=success&...
  → Linking listener fires → app processes result
```

### Key files
| File | Role |
|---|---|
| `ayurveda-app/src/app/checkout/index.tsx` | Mobile checkout — opens payment page, listens for deep link |
| `backend/src/modules/orders/order.controller.js` | `getPaymentPage` + `paymentRedirect` |
| `backend/src/modules/orders/order.routes.js` | Routes: `/payment-page` (auth) + `/payment-redirect` (no auth) |
| `backend/src/middlewares/auth.js` | Reads JWT from cookie → Authorization header → `?token=` query param |

### Why `Linking` + `openBrowserAsync` instead of `openAuthSessionAsync`
`WebBrowser.openAuthSessionAsync` on Android uses Chrome Custom Tabs. When the Razorpay JS redirects to the backend (`/payment-redirect`) and the backend responds with HTTP 302 to `oroganix://`, Chrome Custom Tabs does **not** reliably fire the intent back to the Expo app — it may show ERR_UNKNOWN_URL_SCHEME instead.

The fix (`ayurveda-app/src/app/checkout/index.tsx`):
- Register a `Linking.addEventListener('url', ...)` listener **before** opening the browser.
- Open with `WebBrowser.openBrowserAsync` (standard in-app browser).
- When the deep link fires (the `oroganix://payment?...` URL), the listener resolves the promise with the URL, calls `WebBrowser.dismissBrowser()`, and the app processes the payment result.
- If the user closes the browser (`.then()` resolves with no URL), the promise resolves `null` and a warning toast is shown.

### Auth token in payment URL
The mobile app passes the JWT as `?token=<encoded>` in the payment page URL because the in-app browser has no access to the app's cookie jar. The auth middleware checks cookies → Authorization header → `req.query.token` in that order.

### `req.protocol` on Render
`backend/src/app.js` sets `app.set('trust proxy', 1)` so that `req.protocol` returns `https` even behind Render's reverse proxy. This is required for building the correct `callbackUrl` inside `getPaymentPage`.

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
