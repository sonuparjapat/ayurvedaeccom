# Testing Guide — Oroganix eCommerce

---

## Phase 3 Bug-Fix Verification (2026-07-29)

### Security: SQL injection — company settings update
```bash
# Should NOT crash or execute injected SQL
curl -X PUT http://localhost:5000/api/admin/company/1 \
  -H "Content-Type: application/json" \
  -H "Cookie: token=<admin_token>" \
  -d '{"company_name":"Test","__proto__":"injected","email":"safe@test.com"}'
# Expected: 200 OK, only allowed fields updated; injected key ignored
```

### Security: subscription status filter
```bash
curl "http://localhost:5000/api/admin/subscriptions?status=active%27%20OR%201%3D1--" \
  -H "Cookie: token=<admin_token>"
# Expected: returns 0 or normal rows — SQL not injected; no 500 error
```

### Backend: COD marked paid on delivery
1. Place a COD order (logged-in user).
2. In admin panel → Orders → find the order → advance status to "Delivered" (status 5).
3. Check the order's `payment_status` in the DB or admin order detail.
4. **Expected**: `payment_status = 'paid'`.

### Backend: createOrder response amount
```bash
# Place an order using wallet discount
# Wallet deducts ₹50, original total ₹300 → finalTotal ₹250
# Expected: response.amount = 250, response.breakup.grandTotal = 250
# Bug was: response returned 300 instead of 250
```

### Backend: adminGetReturns no longer 500
```bash
curl http://localhost:5000/api/admin/returns \
  -H "Cookie: token=<admin_token>"
# Expected: HTTP 200, JSON with { data: [...], meta: { total, page, limit } }
# Bug was: always HTTP 500
```

### Backend: per-user coupon limits
1. Create a coupon with `usage_per_user = 1`.
2. Apply and use the coupon on an order (logged-in user).
3. Go to Coupons page (web or mobile).
4. **Expected**: the coupon no longer appears in the list for that user.

### Backend: stats / recentOrders / topProducts don't crash on DB error
- These three admin dashboard endpoints now have try/catch. A DB error returns HTTP 500 with a JSON message instead of an unhandled crash.

### Backend: getLowStockProducts returns correct products
```bash
curl "http://localhost:5000/api/admin/products/low-stock" \
  -H "Cookie: token=<admin_token>"
# Expected: returns active products with inventory <= 10
# Bug was: status = TRUE type mismatch — returned no products
```

### Backend: product not-found returns 404
```bash
curl http://localhost:5000/api/shop/public/nonexistent-slug-xyz
# Expected: HTTP 404 {"msg":"Product not found"}
# Bug was: HTTP 204 with body (invalid per spec)
```

### Backend: wallet ROLLBACK on insufficient balance
- Calling `POST /api/admin/wallet/debit` with an amount exceeding the user's balance should return 400 and leave the wallet unchanged. No transaction should remain open.

### Backend: category subcategories by slug
```bash
curl http://localhost:5000/api/categories/ayurveda
# Expected: { ...category, subcategories: [...] } — subcategories match the category
# Bug was: raw slug string used as parent_id — subcategories always empty for slug lookups
```

### Mobile: cart delivery fee loads from public endpoint
1. Open the mobile app (logged out or as regular user).
2. Add an item to cart and open the Cart screen.
3. **Expected**: delivery fee and free-delivery threshold load correctly (not always ₹0/₹500).

### Mobile: "Add to Cart" / "In Cart" button — slug navigation
1. From any list screen, tap a product to open its detail page (navigation uses slug URL).
2. If the product is already in your cart: **Expected**: button shows "In Cart" (green).
3. **Bug was**: button always showed "Add to Cart" because `Number("some-slug")` = NaN.

### Mobile: wallet trailing slash
1. Go to Checkout in the mobile app.
2. **Expected**: wallet balance displays correctly.
3. **Bug was**: `/wallet/` with trailing slash would fail on some nginx configs — balance showed ₹0.

### Mobile: default address auto-selected at checkout
1. Set an address as default in your profile.
2. Open Checkout.
3. **Expected**: the default address is pre-selected automatically.
4. **Bug was**: `isDefault` (camelCase) vs `is_default` (snake_case) mismatch — no address was pre-selected.

### Mobile: wishlist useEffect dependency
1. Open the Wishlist screen.
2. Navigate to Account screen (which refreshes user data) and come back.
3. **Expected**: wishlist does NOT reload unnecessarily.
4. **Bug was**: any `setUser()` call triggered a full wishlist refetch.

### Web: wishlist remove works
1. Go to Wishlist page, click the remove button on any item.
2. **Expected**: item disappears from the list.
3. **Bug was**: the delete request hit `/shop/${productId}` instead of `/shop/wishlist/${productId}` — silent failure.

### Web: wishlist icons reflect actual wishlist
1. Browse the site while logged in with items in your wishlist.
2. **Expected**: heart icons are filled/highlighted for items in your wishlist.
3. **Bug was**: `getwishlist()` called `/shop` (product catalog) instead of `/shop/wishlist`.

### Web: admin panel requires login
1. Log out of the admin panel.
2. Navigate directly to `http://localhost:3000/admin/dashboard` in the browser.
3. **Expected**: redirected to `/adminauth` login page.
4. **Bug was**: admin panel layout was visible to anyone with the URL.

### Web: admin login stores session correctly
1. Go to `/adminauth`, enter correct admin credentials.
2. **Expected**: redirected to `/admin/dashboard` and panel shows admin name.
3. **Bug was**: `res.data.data` (undefined) used instead of `res.data.admin`.

### Web: checkout Place Order — no duplicate toast
1. On the Checkout page, click Place Order without filling in required shipping fields.
2. **Expected**: one error toast appears.
3. **Bug was**: `validateShipping()` called twice — two identical toasts appeared.

### Web: category page cart badge updates after add
1. On a Category page, click "Add to Cart" on any product.
2. **Expected**: the cart badge in the header increments.
3. **Bug was**: `fetchCart()` only called on HTTP 200 — 201 Created responses were ignored.

### Web: product page Q&A section loads
1. Open any product detail page, scroll to the Q&A section.
2. Submit a question or view existing ones.
3. **Expected**: Q&A loads and submits correctly.
4. **Bug was**: `require('@/lib/axios')` inside a `'use client'` component body failed in Next.js bundler.

### Web: wishlist toggle uses correct type
- `toggleLike` now receives `String(product.id)` instead of the raw number, matching the expected function signature.

### Web: product reviews reload on navigation
1. View reviews on Product A, then navigate to Product B (client-side navigation).
2. **Expected**: Product B's reviews load, not Product A's stale reviews.
3. **Bug was**: `id` was missing from the reviews `useEffect` dependency array.

---

## Bug-Fix Verification (2026-07-23)

### 1. Mobile checkout — toast validation feedback
1. Open mobile app, add a product to cart, go to checkout.
2. Tap **"+ Add New Address"**, leave fields blank, tap **"Save Address & Continue"**.
3. Expected: red "All address fields are required" toast appears.
4. Enter an invalid pincode (e.g. "123"), tap Save.
5. Expected: red "Enter valid 6-digit pincode" toast appears.
6. Fill all fields correctly, tap Save.
7. Expected: green "Address added!" toast appears.

### 2. Backend — 404 handler
```bash
curl http://localhost:5000/api/nonexistent-route
# Expected: {"success":false,"message":"Route not found"}  HTTP 404
```

### 3. Backend — global error handler
- Any unhandled throw inside a route should now return `{"success":false,"message":"..."}` HTTP 500 instead of an HTML error page.

### 4. Backend — login rate limiter
```bash
for i in $(seq 1 25); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5000/api/users/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
# After 20 attempts: HTTP 429 with {"success":false,"message":"Too many login attempts..."}
```

### 5. Mobile auth — no Mobile OTP tab
1. Open mobile app → tap Sign In.
2. Verify only 3 tabs show: **Login**, **Register**, **Email OTP**.
3. "Mobile OTP" tab must NOT appear.

### 6. Mobile navigation — subscriptions, notifications, faq screens
1. From Account screen, tap Subscriptions — screen opens with slide animation.
2. From Account screen, tap Notifications — screen opens.
3. From bottom nav, navigate to FAQ — screen opens.

---

## Mobile — Razorpay Payment (Native SDK)

### Prerequisites
- **Expo Go will not work** — `react-native-razorpay` is a native module.
- Build with `npx expo run:android` (local dev build using `expo-dev-client`) or `eas build`.
- Backend `.env` must have `RAZORPAY_KEY` and `RAZORPAY_SECRET` set.

### Test steps
1. Build the app with `npx expo run:android`.
2. Log in with a test account.
3. Add any product to cart and go to Checkout.
4. Select **Online Payment**.
5. Tap **Pay ₹X Securely**.
6. Verify: the Razorpay native payment sheet opens (bottom sheet, not a browser tab).
7. Complete payment with a Razorpay test card / UPI (use test mode key during development).
8. Verify: sheet closes automatically and the Order Confirmation screen is shown.
9. Go to **My Orders** and verify the order status is `Paid` / `Processing`.

### Edge cases
| Scenario | Expected behaviour |
|---|---|
| User dismisses payment sheet | Toast: "Payment cancelled. Your order is pending." |
| Payment fails (card declined) | Razorpay shows error in sheet; user can retry. Status stays Pending. |
| Network drops after payment but before `/orders/verify` | Order stays `payment_status = unpaid`. User can retry from My Orders. |
| `razorpayKey` missing in backend response | `RazorpayCheckout.open` will throw — check `RAZORPAY_KEY` env var on backend. |

---

## Web — Order Detail Review Form

1. Go to `/orders/<delivered-order-id>` (order with status = Delivered).
2. Verify each item row has an "⭐ Review" button.
3. Click "⭐ Review" on an item — verify it expands an inline review form for that specific product.
4. If the user already reviewed this product, verify the form is pre-filled (stars, comment, existing photos). Pre-fill uses `GET /shop/reviews/product/:id?me=1` which returns only the current user's own review regardless of pagination.
5. Select stars, write a comment, upload a photo via file picker — verify image thumbnail appears.
6. Paste an image URL into the URL field and click "Add" — verify it appears as a thumbnail.
7. Remove a photo (hover → ✕) — verify it disappears from the form.
8. Submit — verify toast "Review saved!" and form collapses.
9. Re-open the review form for the same item — verify the updated review pre-fills.
10. Click "✕ Close" — verify form collapses without submitting.

### Web — Account Orders Modal Review Pre-fill

1. Go to `/account` → Orders tab, find a delivered order.
2. Click the **Review** button — the Order Details modal opens.
3. If the user already reviewed any item, verify the stars and comment are pre-filled.
4. Pre-fill works even if the review was submitted from the product detail page (no `order_id` stored on that path).
5. Submit an edited review — verify toast "Review submitted" appears.
6. Close and re-open the same order — verify the updated data pre-fills again.

### Web — Offers Page

1. Navigate to `/offers`.
2. Verify page loads with a dark forest gradient background (not the old white/gray).
3. If flash sales exist: each sale should show a dark glassmorphism card with the large countdown timer (HH:MM:SS), product cards with stock progress bars, and a "View All Deals" end card.
4. If coupons exist: each coupon card should show the ticket-style design with torn-edge circles and a monospace code field. Click **Copy** — verify the code is copied and a toast appears.
5. If bundles exist: each bundle card should show the purple glassmorphism card with an image overlay. Click **Add Bundle to Cart** — verify toast "Bundle added to cart!".
6. If no offers exist: verify the empty state orb icon and "Browse Products" CTA appear on the dark background.

### Web — Account Hero Count-up

1. Navigate to `/account`.
2. On page load, verify the three stat numbers (Total Orders, Delivered, Total Spent) animate from 0 to their real values over ~1.2 seconds with cubic ease-out.
3. Navigate away and back — verify the animation replays.

### Web — Order Detail Page

1. Navigate to `/orders/<id>` from My Orders.
2. Verify a **Header** and **Footer** are visible (they were previously missing).
3. Verify the page has a dark forest gradient background (not plain white).
4. Verify all cards (order hero, tracking, progress stepper, timeline, items, address) use the glassmorphism dark style.
5. If the order is not cancelled: the progress stepper should show colored step nodes with an emerald glow on the active step and gradient connector lines between completed steps.
6. The "← My Orders" back link should be visible and navigate to `/account?tab=orders`.
7. Review, Re-order, Cancel, Return — all functions should work identically to before the redesign.

### Web — Product Detail — Sticky ATC + Lightbox

1. Navigate to `/product/<id>` on a desktop browser.
2. Scroll down past the "Add to Cart" button — verify a sticky bar slides in from the bottom showing the product thumbnail, name, price, and an "Add to Cart" button.
3. Scroll back up until the main ATC button is visible — verify the sticky bar slides away.
4. Click the main product image — verify a full-screen lightbox opens.
5. If the product has multiple images, verify the prev/next arrows and dot indicators work.
6. Click the ✕ or outside the image — verify the lightbox closes.
7. Click the wishlist heart button — verify it does NOT open the lightbox (event propagation stopped).

### Web — Flash Sale Banner

1. Navigate to the home page (requires active flash sales in the database).
2. Verify the banner has a dark forest gradient background with animated gold countdown cells.
3. Each product card should have a glassmorphism dark style, stock progress bar (green or red depending on sold %).
4. Verify the "View All Deals" card navigates to `/products`.

### Web — Product Detail Review Pre-fill

1. Navigate to `/product/:id` while logged in.
2. Scroll to the Reviews tab — if the user has already reviewed, the "Write a Review" form should auto-fill with their existing stars, comment, and photos.
3. Pre-fill triggers via `GET /shop/reviews/product/:id?me=1` (fires when `loginuserdata` becomes available).
4. Verify the pre-fill works even if the user's review is buried on page 2+ of the public review list (the `me=1` fetch is independent of the paginated list).
5. Submit an edited review — verify the form immediately reflects the new server-stored image URLs (re-fetched after submit).

---

## Mobile — Account Screen UI

1. Log in and navigate to the **Account** tab.
2. Verify the three stats (Orders, Addresses, Wishlist) each appear as a **glass pill** inside the dark header — individual rounded boxes with emoji, number, and label, not flat text.
3. Switch to the **Orders** tab — verify each order card has a **colored left border** matching its status (e.g. emerald for Delivered, blue for Confirmed, red for Cancelled).
4. Verify the total amount on each order card is displayed in **gold** (`Colors.gold`) rather than dark green.
5. Switch back to **Profile** tab — verify each info row (Name, Email, Phone, Status) has a **colored gradient icon container** (forest-green, blue, purple, gold respectively).
6. In the **Quick Access** section, verify each link row icon has a **unique gradient color** (red for Wishlist, purple for Cart, amber for Wallet, etc.).
7. If the user has a referral code, verify the referral card shows a **dark forest gradient** background with gold title and gold code text (not the old light-green card).
8. Verify all logic (edit profile, change password, add/edit/delete address, logout) works exactly as before.

## Mobile — Cart Screen UI

1. Add items to cart and open the **Cart** screen.
2. Verify each cart item card has a **3px emerald left border** accent.
3. Verify the item price text is displayed in **emerald** (`Colors.emerald`) rather than dark forest.
4. Verify the delivery progress bar card has a **mint-tinted glass background** (`rgba(240,253,244,0.9)`) with a soft green border.
5. Remove all items and verify the **empty cart orb** shows a dark `forest→moss` gradient background instead of the old plain mint.
6. Verify all cart functions (update quantity, remove item, checkout CTA) work exactly as before.

---

## Web — Cart Sheet

1. Open any page; click the cart icon in the header.
2. Verify the cart drawer slides in from the right with a glass panel (light green tint).
3. Verify the count badge on the trigger animates in/out with a spring effect.
4. Add items to cart and verify each shows image, name, gradient price, and quantity controls.
5. Increment/decrement quantity — verify API is called and subtotal updates.
6. Remove an item — verify the card slides out with the exit animation.
7. When cart is empty, verify the empty state icon and "Shop Now" button appear.
8. Click "Checkout" when not logged in — verify login modal opens (no redirect yet).
9. Click "Checkout" when logged in — verify redirect to `/checkout`.
10. Test at 375px — verify the drawer is full-width and items are readable.

---

## Web — Checkout Page

1. Add items to cart, go to `/checkout`.
2. Verify the page renders correctly on mobile (375px) and desktop (1280px).
3. Test COD: place order → confirm order screen shown.
4. Test Online: place order → Razorpay modal opens → complete with test card → success screen shown.
5. Verify order appears in `/profile/orders` with correct status and amount.

---

## Web — Product Detail Page

1. Navigate to any product at `/product/:id`.
2. Verify thumbnail images switch the main image on click.
3. Verify active thumbnail shows emerald ring.
4. Verify tabs (Description / Reviews / Q&A) switch content without page reload.
5. Verify Add to Cart button is disabled when out-of-stock or variant not selected.
6. Verify gradient price and trust badges render on both light and dark OS themes.

---

## Backend — Payment Redirect

Manual test with curl (replace values):
```bash
# 1. Get auth token
TOKEN=$(curl -s -X POST https://api.oroganix.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"test123"}' | jq -r '.token')

# 2. Create order (use an existing cart) to get ORDER_ID

# 3. Fetch payment page — should return HTML with Razorpay script
curl -s "https://api.oroganix.com/api/orders/${ORDER_ID}/payment-page?returnUrl=oroganix://payment&token=${TOKEN}" | grep -i razorpay
```

Expected: HTML containing `src="https://checkout.razorpay.com/v1/checkout.js"` and the order amount.

---

## Backend — Trending Endpoint

```bash
curl https://api.oroganix.com/api/shop/trending?limit=8
```
Expected: `{ success: true, products: [...] }` — at least 1 product in descending score order.

---

## Backend — Referral Stats Endpoint

```bash
curl -H "Authorization: Bearer $TOKEN" https://api.oroganix.com/api/users/referral
```
Expected: `{ success: true, referral_code: "XXXX", referrals: [...], total: N, rewarded: N, earned: N }`.

---

## Web — Admin Dashboard

1. Log in as admin, navigate to `/admin/dashboard`.
2. Verify the 6 KPI cards render (Revenue, Orders, Users, Products, Pending, Low Stock).
3. Pending and Low Stock cards should show a red pulse dot if their count > 0.
4. Verify the Revenue & Orders area chart renders with data (try all 3 period buttons: Daily / Weekly / Monthly).
5. In the Overview tab verify Recent Orders list shows order number, customer name, status badge, and amount.
6. Verify Low Stock alert panel appears at bottom of Overview if any products are low-stock.
7. **Real-time toast test**: place a new order from a different browser tab as a regular user. Within a few seconds an animated toast should pop in the bottom-right corner of the admin dashboard with the new order ID.

---

## Web — Dark Mode Toggle

1. Open any page with the site header.
2. Click the Moon/Sun icon in the header actions bar.
3. Verify the `dark` class is added to `<html>` and the page switches to dark mode.
4. Refresh the page — verify dark mode persists (localStorage key `theme = 'dark'`).
5. Click the icon again — verify the page returns to light mode and `localStorage.theme = 'light'`.
6. Clear localStorage, change OS to dark mode — verify the site opens in dark mode automatically.

---

## Mobile — Account Screen UI

1. Log in on the mobile app, go to **Account**.
2. Verify the stats row shows 3 glass pill cards in the dark header (Orders, Addresses, Wishlist count).
3. Verify each quick-link icon has a unique gradient color.
4. Verify order cards have a colored left border matching status (green = Delivered, blue = Confirmed, etc).
5. If a referral code is present, verify it appears on a dark card with gold text.

---

## Mobile — Cart Screen UI

1. Add items to cart on the mobile app.
2. Open cart — verify each item card has a green left accent border.
3. Verify item price text is emerald green.
4. Verify delivery progress bar shows inside a mint-glass card.
5. Remove all items — verify the empty cart shows a dark gradient orb with a cart emoji.

---

## Mobile — Product Detail UI

1. Navigate to any product on mobile.
2. Verify the price area is wrapped in an emerald-tinted glass card.
3. If there is a discount, verify the "Save X%" pill uses a gradient emerald background.
4. If the product is a bestseller, verify the Bestseller pill uses a gradient gold background.
5. Verify the bottom sticky CTA bar has a mint-glass gradient background.
6. Verify the price in the bottom CTA bar is in emerald green.

---

## Support Page — Header/Footer Fix

### List page (`/support`)
1. Visit https://oroganix.com/support.
2. Verify the site Header (with logo, nav links, cart) is visible at the top.
3. Verify the site Footer is visible at the bottom.
4. Verify the dark-forest hero banner with "Customer Support" heading renders.
5. While logged in, verify the ticket list loads with status-coloured left borders.
6. Click "New Ticket" — verify the form slides in with subject, category, priority, message fields.
7. Submit the form — verify it redirects to the ticket detail page.
8. Filter by status pill (Open, In Progress, Resolved, Closed) — verify the list updates.

### Ticket detail (`/support/:id`)
1. Click any ticket from the support list.
2. Verify the site Header is present at the top.
3. Verify the dark-forest sub-header shows the ticket subject, status badge, and Close button.
4. Verify chat messages render — user messages are dark green (right-aligned), admin messages are white (left-aligned).
5. Type a reply and press Enter or click Send — verify the message appears in the chat.
6. Click Close — verify the ticket status updates to "closed" and the reply box shows "This ticket is closed".
7. Verify the site Footer is visible below the reply box.

---

## Leaf Loader Component

1. Trigger a page that uses `<LeafLoader>` (support detail loading, blog, notifications).
2. Verify the loading indicator shows a spinning arc ring with a leaf icon in the center — NOT a plain circle.
3. Verify the ring color is emerald green (`#10b981`).
4. When `fullPage` prop is passed, verify it centres in 60vh of space.
5. When `text` prop is passed, verify the caption appears below the spinner.

---

## Blog Page — Premium Overhaul

1. Navigate to https://oroganix.com/blog.
2. Verify the dark-forest hero (not light emerald-50) with white headline "Wisdom of Ancient Ayurveda".
3. Verify the search bar has a glass-dark input with a gold Submit button.
4. Verify the featured post (first result, no filters) shows a large 50/50 card at the top.
5. Verify the category pills appear below the featured card.
6. Click a category pill — verify posts filter and the pill turns the category's colour.
7. Verify each card has a cover image overlay badge with the category name.
8. Hover a card — verify it lifts slightly (`translateY(-2px)`).
9. Verify the CTA section at the bottom has a dark-forest background (not plain `bg-emerald-600`).
10. Verify the `<LeafLoader>` appears while fetching (not a `animate-spin` circle).

---

## Notifications Page — Premium Overhaul

1. Navigate to https://oroganix.com/notifications (logged in).
2. Verify the dark-forest hero bar at the top (not plain white `text-gray-900` heading).
3. Verify unread count badge on the Bell icon uses gold colour (`#c9a84c`).
4. Verify active tab uses forest gradient (not `bg-blue-500`).
5. Verify unread notification cards use `rgba(16,185,129,0.04)` green tint and emerald border-left (not `bg-blue-50`).
6. Verify the order notification icon is emerald/green (not blue).
7. Verify filter bar shows a `#10b981` badge for active filter count.
8. Verify "Mark all read" button appears in hero bar when unread count > 0.
9. Verify the loading state shows the leaf spinner (not a plain spinner).
10. Verify the announcements tab works — switch tab and verify broadcasts display.

---

## Mobile — Coupon Field Name Fix

### Checkout screen
1. Add items to cart on the mobile app.
2. Proceed to checkout.
3. If any coupons are available, verify they render as e.g. `20% OFF` or `₹50 OFF` — NOT `undefined% OFF` or `₹undefined OFF`.
4. Verify "Add ₹X more" locked coupon hint shows a correct rupee amount — not `₹NaN more`.
5. Tap a usable coupon chip — verify the code is auto-filled into the coupon input.

### Home screen OfferBanner
1. Open the app home screen.
2. If a coupon is active, verify the offer banner shows a readable label (e.g. `10% OFF`) and a correct min-order sub-line (e.g. `On orders above ₹500`).
3. Verify the code text is not `undefined`.

---

## Mobile — LeafLoader Component

1. Open the Blog list screen — verify a pulsing 🌿 emoji appears while posts load (not a circular spinner).
2. Open a blog post detail — verify 🌿 loading animation appears while the article loads.
3. Open Notifications screen — verify 🌿 loading animation appears while notifications load.
4. Verify the animation pulses in opacity and scale (not just opacity alone).

---

## Mobile — Notifications Theme Fix

1. Open the Notifications screen on mobile.
2. Verify the header has a dark forest/moss gradient (not plain cream background).
3. Verify header buttons (back arrow, filter, mark-all-read) use white/glass style — not dark buttons on a cream background.
4. Verify unread notification cards have an emerald green left border and green-tinted background — NOT a blue left border and blue background.
5. Verify the 📦 Order notification icon badge background is emerald green — not blue.
6. Verify the 📢 Announcement icon badge uses a gold dot.
7. Switch to the Announcements tab — verify it still loads broadcast notifications correctly.

---

## Mobile — Blog HTML Content

1. Open any blog post in the mobile app.
2. If the post has headings (`<h1>`, `<h2>`), verify they render in larger/bolder text in forest green — not as plain body text.
3. If the post has bullet lists (`<li>`), verify each item has a `•` prefix.
4. If the post has blockquotes, verify they render with an emerald left border and a mint card background.
5. Verify paragraph text renders at 15px with 26px line height.
6. Verify HTML entities (`&amp;`, `&nbsp;`, `&#39;`) are decoded correctly (e.g. `&amp;` renders as `&`).

---

## Web — Support Link Placement & Auth Guard

1. Log out completely, then visit the home page.
   - Verify **no "Support" link** appears in the desktop navbar or mobile hamburger menu (hidden for logged-out users).
   - Verify "Support" IS visible in the site footer under Quick Links.
2. Log in, then reload.
   - Verify the **login modal does NOT flash** on page load (auth loading race condition fixed).
   - Verify "Support" now appears in the desktop navbar.
   - Verify "Support" appears in the mobile hamburger menu's Pages section with a chat icon.
3. Navigate to `/account` → verify "Customer Support" appears in the left sidebar nav between Wallet & Points and Settings.
4. Click the Support link from each location and verify it navigates to `/support`.

---

## Web & Mobile — Support Real-time WebSocket

**Prerequisites**: Backend running with Socket.io. Have two browsers open — one as a logged-in user, one as admin at `/admin/support`.

### User → Admin (user sends message)
1. User opens a support ticket at `/support/<id>`.
2. Admin opens the same ticket in the admin panel.
3. User types a message and sends.
4. **Expected (admin)**: The message appears in the admin chat pane **instantly**, without refreshing.

### Admin → User (admin replies)
1. Admin types a reply and sends.
2. **Expected (user web)**: The reply appears in the user's ticket chat **instantly**.
3. **Expected (user list page)**: If the user is on `/support` (ticket list), the ticket card updates to reflect the new reply (triggered by `admin_replied` event).

### Status update
1. Admin changes ticket status to "Resolved" and clicks Update.
2. **Expected (user list)**: The status badge on that ticket updates to "Resolved" **without a page refresh**.

### No duplicate messages
1. Admin sends a reply.
2. **Expected**: The message appears exactly **once** in the admin chat (not twice — not duplicated by both HTTP response and socket).
3. User sends a reply.
4. **Expected**: The message appears exactly **once** in the user chat.

### Mobile — Admin reply reaches mobile user
1. User has a ticket open in the mobile app chat view.
2. Admin sends a reply from the web admin panel.
3. **Expected**: Reply appears in the mobile chat **without the user pulling to refresh**.

---

## Mobile — Current Location Detection

**Prerequisites**: Requires a native build (`npx expo run:android` or `eas build`) — does not work in Expo Go.

### Add Address modal
1. Log in on the mobile app, go to **Account → Addresses → Add New Address**.
2. Verify a green **"Use my current location"** button (with a 📍 icon) appears above the form fields.
3. Tap the button — verify the OS location permission dialog appears.
4. **Grant permission**: verify the button shows "Detecting location…" with a spinner, then disappears and the City, State, and PIN Code fields are auto-filled.
5. **Deny permission**: verify an alert says "Permission Required — Please allow location access to auto-fill your address."
6. Verify the Street field remains blank (user must type street manually).
7. Complete the street and tap **Save Address** — verify the address is saved with the auto-detected city/state/pincode.

### Edit Address modal
1. Open any existing address for editing.
2. Verify the same "Use my current location" button appears.
3. Tap it — verify City, State, PIN are overwritten with detected values.
4. Verify the Save button uses the new values.

### Edge cases
| Scenario | Expected |
|---|---|
| Location permission already granted (second tap) | Skips dialog, detects immediately |
| GPS timeout / no signal | Alert: "Failed to get location. Please fill in manually." |
| Reverse geocode returns empty results | Alert: "Could not detect address. Please fill in manually." |
| Both modals open at the same time (impossible — only one modal shown) | N/A |

---

## Web — FAQ Page (API-Driven)

1. Navigate to `/faq` while the page loads — verify **3 animated skeleton bars** appear (not "No results found").
2. Once loaded, verify FAQ questions are grouped by category and the first category's accordion is shown.
3. Click a question — verify the answer expands. Click again — verify it collapses.
4. Type in the search box — verify questions filter across all categories.
5. Clear search — verify category grouping returns.
6. **Empty DB case**: If no FAQs exist in the database, verify the empty state reads "No FAQs available yet" (not "No results found").
7. **Search no-results case**: Search for a term that doesn't match anything — verify "No results found" and a "Clear Search" button appear.

---

## Web — Admin FAQ Management

1. Go to `/admin/faq` — verify the list loads grouped by category.
2. Click **Add FAQ** — fill in Question, Answer, select a Category, set Sort Order 1, check Active → click Create. Verify it appears in the list.
3. Reload `/faq` — verify the new FAQ appears in the correct category.
4. Toggle the FAQ inactive — reload `/faq` — verify it no longer appears.
5. Toggle active again, then click Edit — change the answer — verify the update appears immediately.
6. Click Delete → confirm — verify it disappears from the list and from `/faq`.

---

## Web + Mobile — Wishlist "Add All to Cart"

### Web (`/wishlist`)
1. Add 3+ products to wishlist, ensuring at least 1 is in-stock and not already in cart.
2. Open `/wishlist` — verify the **"Add All to Cart"** button appears in the top-right controls area.
3. Click the button — verify it shows "Adding…" while in progress, then shows a toast like "3 items added to cart!".
4. Open the cart — verify all in-stock non-cart items were added.
5. Click "Add All to Cart" again — verify toast says "All in-stock items are already in your cart!".
6. If all items are out of stock — verify the same "already in cart" toast appears (no items added, no error).
7. Verify the button is disabled during the adding process.

### Mobile (Wishlist screen)
1. Add 2+ in-stock products to wishlist via the mobile app.
2. Open the Wishlist screen — verify a green **"🛍️ Add All to Cart"** bar appears below the search box.
3. Tap it — verify haptic feedback fires, toast shows count of items added.
4. Tap again — verify "All in-stock items already in cart!" toast appears.
5. Verify the button shows "⏳ Adding all..." while in progress.

---

## Web — Recently Viewed Section (Home Page)

**Prerequisites**: Must be logged in.

1. Browse 3+ product detail pages while logged in.
2. Return to the home page (`/`).
3. Scroll down to the section between Featured Products and Features — verify **"Recently Viewed"** section appears.
4. Verify the products shown match the ones you just viewed, most recent first (up to 10).
5. Log out — reload the home page — verify the section disappears.
6. Add a viewed product to cart from the Recently Viewed section and verify it's added.
7. Toggle wishlist heart on a recently viewed product and verify it updates.

---

## Web — Subscriptions Tab (Account Page)

**Prerequisites**: Must have at least one active subscription created via the product detail page.

1. Go to `/account` — verify **"Subscriptions"** appears in the left sidebar between Wallet & Points and Customer Support.
2. Click Subscriptions — verify the tab content loads with your subscription(s).
3. Each card should show: product image, name, status badge (ACTIVE/PAUSED/CANCELLED), frequency, quantity, price, next order date.
4. Click **Pause** on an active subscription — verify status badge changes to PAUSED and "Next order" date disappears.
5. Click **Resume** — verify status changes back to ACTIVE and next order date reappears.
6. Click **Cancel** → confirm — verify the subscription disappears from the list.
7. If no subscriptions exist: verify empty state shows "No subscriptions yet" message.

---

## Mobile — Subscriptions Screen

1. Go to **Account** — verify **"🔁 Subscriptions"** tile appears in the Quick Access grid.
2. Tap it — verify the Subscriptions screen opens with a back arrow.
3. Verify subscriptions list with product image, name, status badge, frequency, price, and next order date.
4. Tap **⏸ Pause** — verify status badge changes to PAUSED.
5. Tap **▶ Resume** — verify status badge changes back to ACTIVE.
6. Tap **✕ Cancel** — verify an alert appears asking for confirmation. Tap "Cancel" → verify subscription disappears.
7. Tap "Keep it" on the alert — verify subscription remains.
8. Empty state: if no subscriptions, verify emoji + "No subscriptions yet" message + "Browse Products" button.

---

## Mobile — FAQ Screen

1. Go to **Account** — verify **"❓ FAQ"** tile appears in the Quick Access grid.
2. Tap it — verify FAQ screen opens with a loading indicator then FAQ content.
3. Verify category chips appear as a horizontal scroll row at the top.
4. Tap each category chip — verify the FAQ list filters to that category.
5. Tap a question — verify the answer expands with animation. Tap again — verify it collapses.
6. Type in the search box — verify results filter across ALL categories (category chips disappear during search).
7. Clear search — verify category chips and full list return.
8. Search for a term with no matches — verify "No results, try different keywords" message.
9. Empty DB case: if no FAQs exist, verify "No FAQs yet" message appears.

---

## Bug Fix — Order Tracking Timeline

1. Go to `/orders/<id>` for any order.
2. Click/scroll to the **Order Timeline** section.
3. Verify it loads correctly — timeline events should appear (e.g. Order Placed, Confirmed, Shipped).
4. Verify no 404 error in the browser console for `GET /api/orders/:id/timeline`.

---

## Order Confirmation Email

### COD order
1. Log in, add an item to cart, and place a COD order.
2. Check the registered email inbox — verify an order confirmation email arrives within ~30 seconds.
3. Verify the email contains: order number, item list, total, and delivery address.

### Online order (via payment verify)
1. Complete an online payment (Razorpay test mode).
2. Check the registered email — verify the order confirmation email arrives.
3. Verify `paymentMethod` shows "online" context in the email body.

### Razorpay webhook (async confirmation)
1. Simulate a webhook `payment.captured` event from the Razorpay dashboard (test mode).
2. Verify the order status updates to `paid` in the database.
3. Verify stock is reduced correctly.
4. Verify a confirmation email is sent.
5. `RAZORPAY_WEBHOOK_SECRET` must match the secret configured in the Razorpay dashboard webhook settings.

---

## Web — Search Page (`/search`)

1. Navigate to `/search` — verify popular searches are displayed (no query yet).
2. Type a query (e.g. "ashwagandha") — verify results appear after ~350ms debounce; URL updates to `?q=ashwagandha`.
3. Verify the result count and page indicator show above the grid.
4. Click the **Filters** button (sliders icon) — verify the filter panel expands with category, min price, max price, in-stock, discount-only controls.
5. Apply a category filter — verify results update and the filter button shows an active count badge.
6. Use the Sort dropdown — switch to "Price: Low to High" — verify results re-sort.
7. Scroll to the bottom — verify pagination controls appear; click page 2 — verify next set loads.
8. Clear the search bar — verify popular searches return.
9. Verify 12 skeleton placeholder cards appear during loading.
10. Click Add to Cart on a product card — verify it's added to cart.
11. Click the wishlist heart — verify it toggles.

---

## Web — Inline Add Address at Checkout

1. Log in with a new account (no saved addresses).
2. Add an item to cart and go to `/checkout`.
3. Verify the page does NOT redirect to `/account?tab=addresses`.
4. Verify a "+ Add Delivery Address" button appears in Step 1.
5. Click it — verify an inline form expands with fields: Address Type, PIN Code, Street, City, State, Email.
6. Fill in valid data and click "Save Address & Continue" — verify the address is saved and auto-selected.
7. Verify the form collapses and the new address appears in the saved addresses list.
8. With a saved address: click "+ Add New Address" — verify the form works again.
9. Enter an invalid pincode (< 6 digits) — verify validation error appears.
10. Click Place Order without an address — verify it scrolls to Step 1 and opens the form instead of redirecting.

---

## Mobile — Inline Add Address at Checkout

1. Log in on mobile with a new account (no saved addresses).
2. Add an item to cart and go to Checkout.
3. Verify no `Alert` redirect appears.
4. Verify a dashed gold "+ Add New Address" button appears.
5. Tap it — verify the form slides in with street, city, state, pincode, email fields.
6. Fill in all fields with valid data and tap "Save & Continue" — verify address is saved and auto-selected.
7. Tap the dashed button again while form is visible — verify the form collapses (toggle).
8. Enter a 5-digit pincode — verify validation error toast.

---

## Web + Mobile — Frequently Bought Together

### Backend
```bash
curl https://api.oroganix.com/api/bundles/by-product/<productId>
```
Expected: `{ success: true, bundles: [...] }` — only active bundles containing the given product, max 4.

### Web (Product Detail Page)
1. Navigate to `/product/:id` for a product that belongs to an active bundle.
2. Scroll down — verify a **"Frequently Bought Together"** section appears before Related Products.
3. Each bundle card should show: bundle name, save %, mini product thumbnails with `+` separators, bundle price, and "Add Bundle to Cart" button.
4. Click "Add Bundle to Cart" — verify all items in the bundle are added to cart (success toast).
5. If no bundles exist for that product — verify the section is hidden entirely.

### Mobile
1. Open any product that belongs to an active bundle.
2. Scroll to the Frequently Bought Together section — verify bundle cards appear in a horizontal scroll row.
3. Tap "Add Bundle to Cart" — verify success toast and cart count updates.

---

## Web — Review Sort + Star Filter (Product Detail)

1. Navigate to `/product/:id` with at least 5+ reviews of mixed ratings.
2. Scroll to the Reviews tab.
3. Open the **Sort** dropdown — switch to "Top Rated" — verify reviews re-sort by descending rating.
4. Switch to "Most Helpful" — verify reviews re-sort.
5. Switch back to "Newest" (default) — verify context data is restored (no extra API call).
6. Click the **★ 5** filter button — verify only 5-star reviews appear; a "No 5-star reviews yet" message appears if none.
7. Click **★ 3** — verify only 3-star reviews appear.
8. Click the active star button again — verify filter is cleared and all reviews show.
9. Combine: select "Top Rated" sort AND "★ 4" filter — verify only 4-star reviews in descending-rating order.

---

## Mobile OTP — Coming Soon

1. Open the mobile app login screen.
2. Tap "Login with OTP" (or the mobile OTP tab).
3. Verify an orange "🚧 Coming soon" banner appears below the input.
4. Enter a phone number and tap "Send OTP" — verify a toast appears: "Mobile OTP login is coming soon. Please sign in with your email."
5. Verify no API call is made (check network tab / no server error).
6. If an OTP code is entered and submitted — verify the same "coming soon" toast fires.

---

## Web — Cart Save for Later + Stock Badges

### Save for Later
1. Add 2 items to cart and go to `/cart`.
2. Click **"Save for Later"** (bookmark icon) on one item — verify it disappears from the cart and reappears in a **"Saved for Later"** section below the cart items.
3. In the Saved for Later section, click **"Move to Cart"** — verify it moves back to the cart items.
4. For an OOS item in Saved for Later, verify "Move to Cart" button is disabled.

### Stock Badges
1. Cart an item with `inventory = 0` — verify a red **"Out of stock"** badge appears.
2. Cart an item with `inventory` between 1 and 5 — verify an orange **"⚠ Only X left!"** badge appears.
3. Cart an item with `inventory > 5` — verify no stock badge appears.

---

## Return Request — Photo Upload

### Web (`/orders/:id`)
1. Navigate to a delivered order.
2. Click **"Return Order"** — verify the return modal / form opens.
3. Enter a reason.
4. Click **"📁 Upload Photos"** — verify file picker opens; select up to 5 images (JPG/PNG/WEBP).
5. Verify selected image thumbnails appear in a grid with ✕ remove buttons.
6. Click ✕ on a thumbnail — verify it is removed.
7. Paste an image URL into the URL field and click **"Add"** — verify the URL image thumbnail appears.
8. Try adding a 6th photo — verify an error toast "Maximum 5 photos allowed" appears.
9. Click **Submit** — verify a multipart/form-data request is sent, `reason`, `images[]` files, and `imageUrls` JSON are included.
10. Verify success toast "Return request submitted. We will contact you within 24 hours."
11. Verify the order status updates (refresh the page — status should be "Return Requested").

### Mobile (`/order/:id`)
1. Open a delivered order on mobile.
2. Tap **Return** — verify `ReturnModal` opens.
3. Select a reason from the radio list.
4. Tap **"📁 Upload Photos"** — verify the image picker opens (requires native build).
5. Select images — verify thumbnails appear in the modal with ✕ remove buttons.
6. Paste an image URL into "Or paste image URL..." field and tap **Add** — verify URL thumbnail appears.
7. Try to exceed 5 total images — verify error toast.
8. Tap **Submit Return Request** — verify multipart request is sent and success toast appears.
9. Verify the Upload Photos button and URL input are hidden once 5 images are selected.

### Backend
```bash
curl -X POST https://api.oroganix.com/api/orders/<id>/return \
  -H "Authorization: Bearer $TOKEN" \
  -F "reason=Product damaged" \
  -F "images=@/path/to/photo.jpg" \
  -F 'imageUrls=["https://example.com/photo.jpg"]'
```

---

## Product Comparison (Web)

### Web
1. Open any product detail page.
2. Click **"Add to Compare"** — verify button turns green and the green compare bar appears at bottom.
3. Navigate to another product, click "Add to Compare" again.
4. Verify the compare bar shows both product thumbnails.
5. Click **"Compare Now →"** — verify redirect to `/compare?ids=X,Y`.
6. On the compare page, verify both products appear in columns with all field rows.
7. Verify the lower-priced product has a **BEST** badge.
8. Click **"Clear"** — verify bar disappears and compare list resets.
9. Try adding 5 products — verify it stops at 4.

### Backend
```bash
curl https://api.oroganix.com/api/shop/public/1
curl https://api.oroganix.com/api/shop/public/2
# Both should return full product data for rendering the compare page
```

---

## Loyalty Tier (Web + Mobile)

### Web
1. Log in, go to **My Account → Wallet & Points**.
2. Verify the tier card appears (Bronze/Silver/Gold/Platinum based on total delivered spend).
3. Verify progress bar fills toward the next tier.
4. Verify tier benefits are shown as chips.

### Mobile
1. Log in, go to **Wallet** screen.
2. Verify tier card appears between balance card and "How it works" section.
3. Verify progress bar and next tier info.

### Backend
```bash
curl https://api.oroganix.com/api/wallet/tier \
  -H "Authorization: Bearer $TOKEN"
# Should return { tier: { name, label, ... }, next_tier, all_tiers }
```

---

## Reorder (Web + Mobile)

### Web
1. Go to **My Account → Orders**.
2. Find any order with items.
3. Click **"Reorder"** — verify toast "Items added to cart!" appears.
4. Open cart — verify items from that order are in the cart (quantities added).

### Mobile
1. Open any order detail screen.
2. Tap **Reorder** — verify success toast and cart updates.

### Backend
```bash
curl -X POST https://api.oroganix.com/api/orders/123/reorder \
  -H "Authorization: Bearer $TOKEN"
# Should return { success: true }
```

---

## Admin Analytics (Product Performance + Funnel)

1. Log in as admin, go to **Analytics** page.
2. Scroll past the revenue chart.
3. **Product Performance table** — verify top products appear sorted by Revenue by default.
4. Click **Units Sold**, **Orders**, **Returns** — verify table re-sorts.
5. **Conversion Funnel** — verify 5 stages appear with progress bars and conversion percentages.
6. Apply a date range filter (From/To) and click Apply — verify both tables refresh.

### Backend
```bash
curl "https://api.oroganix.com/api/admin/analytics/products?sortBy=revenue" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
curl "https://api.oroganix.com/api/admin/analytics/funnel" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## Social Sharing + Expected Delivery Date (Web)

### Social Sharing
1. Open any product detail page.
2. Verify **WhatsApp**, **Copy Link**, and (on Chrome/mobile) **Share** buttons are visible below the trust badges.
3. Click WhatsApp — verify it opens WhatsApp web with pre-filled product link.
4. Click Copy Link — verify "Link copied!" toast appears.

### Expected Delivery Date
1. On a product detail page, enter a serviceable 6-digit PIN code.
2. Click **Check** — verify the result shows "Delivery by [Day, Date Month] to [City] (X days)".

---

## Subscription Auto-Billing (Backend)

1. Create a test subscription with `next_order_date = CURRENT_DATE`.
2. Trigger the cron manually:
   ```bash
   node -e "require('./backend/src/services/subscriptionBilling.js')()"
   ```
3. Verify a new order is created for that subscription.
4. Verify `subscriptions.next_order_date` advanced by `frequency_days`.
5. Test out-of-stock: set product inventory to 0, verify subscription skips (+1 day) instead of ordering.

---

## SMS Service (Backend)

1. Without `FAST2SMS_API_KEY` set: trigger mobile OTP login — verify OTP is logged to console (not sent via API).
2. With a test `FAST2SMS_API_KEY`: trigger OTP — verify SMS is delivered to the test number.
3. Trigger COD delivery OTP from admin panel — verify `console.log` output (or real SMS with API key).
Expected: `{ success: true }` — images uploaded to S3 under `returns/` folder, `return_images` column updated on the order row.

---

## F14 — Bulk Order Status Update (Admin)

1. Log in as admin, go to `/admin/orders`.
2. Check any 2–3 order checkboxes — verify the bulk action toolbar appears showing count.
3. Check the header checkbox — verify all rows are selected.
4. Uncheck one — verify header checkbox becomes indeterminate.
5. Select status "Shipped" from the dropdown and click **Apply to Selected**.
6. Verify a success toast appears and the selected orders' status badges update.
7. Check the DB or order detail: each updated order should have a new row in `order_status_logs` with `note='bulk update'`.
8. For a COD order, bulk-update to "Delivered" (status 5) — verify `payment_status` becomes `paid`.
9. Click **Clear selection** — verify checkboxes are cleared and toolbar disappears.
10. Verify affected customers received notifications (push/in-app).

---

## F16 — Full-Screen Image Viewer (Mobile)

1. Open any product with multiple images on the mobile app.
2. Tap the main product image — verify the full-screen viewer opens.
3. Verify the image is centred with a dark background and an image count badge (e.g. 1/3).
4. Swipe left/right — verify you can navigate between images and dot indicators update.
5. Pinch to zoom in (up to 4×) — verify the image zooms smoothly.
6. Pinch out to zoom back to 1× — verify it resets.
7. Swipe slowly downward — verify the image follows your finger and the background fades.
8. Release while still close to origin — verify the image snaps back.
9. Swipe quickly down (or far enough) — verify the viewer closes with a dismiss animation.

---

## F18 — Haptic Feedback (Mobile)

Requires a physical Android/iOS device (haptics not available in emulators).

1. Open any product detail page, tap **"Add to Cart"** for an item not in cart — verify a subtle success vibration.
2. Tap **"Update Cart"** (item already in cart) — verify a medium impact vibration.
3. Tap the heart (wishlist) icon — verify a light impact vibration before the animation.
4. Place a COD order — verify a success vibration when the confirmation screen appears.
5. Complete an online payment — verify a success vibration after the payment is verified.

---

## F19 — Rating Filter (Mobile Search)

1. Open the Products / Search screen on mobile, tap the filter icon.
2. Scroll to **Minimum Rating** chips: Any / 3+ / 3.5+ / 4+ / 4.5+.
3. Tap **4+** — verify the chip highlights.
4. Tap **Apply Filters** — verify only products with rating ≥ 4.0 appear in results.
5. Open filters again, tap **Any** — verify the filter is cleared.
6. Tap **Clear All** — verify all filters including rating reset.

---

## F21 — Dosha Quiz (Web + Mobile)

### Web
1. Navigate to the home page — verify the `🌿 Discover Your Dosha` banner exists below the hero.
2. Click **Take the Quiz →** — verify redirect to `/dosha-quiz`.
3. Verify 10 questions appear one at a time with a progress bar.
4. Click **Back** on question 3 — verify you return to question 2 with the previous answer retained.
5. Complete all 10 questions — verify the results page shows:
   - Dominant dosha name (Vata, Pitta, or Kapha)
   - Score bars for all three doshas (sum ≈ 100%)
   - Description text + wellness tips
   - Recommended category chips that link to product pages
   - Retake and Shop buttons
6. Click **Retake Quiz** — verify you return to question 1.

### Mobile
1. Open the app home screen — verify the `🌿 Discover Your Dosha` card.
2. Tap it — verify the quiz intro screen opens with a LinearGradient background.
3. Tap **Start Quiz** — verify question 1 appears with an animated transition.
4. Answer all questions — verify the results screen shows score bars + tips.
5. Disable network (airplane mode) and retake — verify a client-side result still appears (no crash).

---

## F22 — Safety Tags (Web + Mobile)

### Admin
1. Go to `/admin/products`, open or create a product.
2. In the **Safety & Certifications** field, type: `Vegan, Gluten Free, Pregnancy Safe`.
3. Verify live badge preview appears below the input.
4. Save — verify the tags persist (prefilled correctly on re-open).

### Web Product Page
1. Navigate to a product that has safety tags.
2. Verify green ✓ badges appear above the non-returnable notice.
3. Verify a product without safety tags shows no badge row.

### Mobile Product Screen
1. Open the same product on mobile.
2. Verify green horizontal badge pills appear (scroll if many).
3. Verify a product without safety tags shows no badge row.

---

## F23 — Dashboard Real-time Stats (Admin)

1. Open `/admin/dashboard` in two separate browser tabs (both logged in as admin).
2. In Tab A, go to Orders and change an order's status to "Shipped".
3. Verify Tab B's Recent Orders list and Pending Orders KPI card update within ~2 seconds — no page refresh.
4. In a third window, place a new order as a regular user.
5. Verify Tab A and Tab B both show the new order in Recent Orders and updated counts — and the toast notification fires on both.

---

## F24 — Refund Status Tracking (Admin)

### Webhook simulation
```bash
# Simulate a refund.processed webhook (replace values)
curl -X POST http://localhost:5000/api/orders/webhook \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: <valid_hmac>" \
  -d '{
    "event": "refund.processed",
    "payload": {
      "refund": {
        "entity": {
          "id": "rfnd_test123",
          "payment_id": "<razorpay_payment_id>",
          "amount": 50000,
          "status": "processed"
        }
      }
    }
  }'
# Expected: 200 OK; DB: refund_status='processed', refund_amount=500, refund_id='rfnd_test123'
```

### Admin Orders page
1. Find a cancelled order with a Razorpay payment that has been refunded.
2. Click the order — verify a purple `REFUND: PROCESSED — ₹500` badge appears next to the payment status.
3. For a failed refund: verify a red `REFUND: FAILED` badge appears.

### Admin Returns page
1. Open any return request (status 8 or 9) where the refund was via Razorpay.
2. Verify the refund amount card shows a small `Razorpay: PROCESSED` badge.

### User notification
1. After the webhook fires, log in as the affected customer.
2. Check notifications — verify "Refund Processed 💚 — Your refund of ₹500 has been processed" appears.

---

## Feature Testing (2026-07-30)

### MF04 — Notification badge
1. Log in on mobile app.
2. Post a test notification via admin `POST /notifications/broadcast`.
3. Navigate to the home screen.
4. **Expected**: Account tab in bottom nav shows a red badge with the unread count.
5. Open Notifications screen.
6. **Expected**: Badge disappears.

### PG03 — Settings screen
1. Open mobile app → Account tab → tap "Settings ⚙️".
2. **Expected**: Settings screen opens with sections: Account, Notifications, Help & Support, App, Account Actions.
3. Toggle "Push Notifications" switch.
4. Tap "Clear Cache" → **Expected**: toast "Cache cleared".
5. Tap "Logout" → **Expected**: confirmation dialog → logs out and redirects to home.

### PG01 — Deals screen
1. On home screen tap the red "⚡ Deals & Offers" banner.
2. **Expected**: Deals screen opens; shows discounted products.
3. If a flash sale is active → **Expected**: flash sale card appears with countdown timer.
4. Pull to refresh → list reloads.

### PG04 — Notify Me
1. Find a product with inventory = 0 (or set inventory to 0 in admin).
2. Open the product page on mobile.
3. **Expected**: "🔔 Notify Me When Available" button appears below the Buy Now button.
4. Tap it while logged in → **Expected**: "You'll be notified!" confirmation.
5. Verify `stock_notifications` table has a row for the product + user.

### Admin — Live Server Health
1. Open admin panel → look at the header.
2. **Expected**: A small badge showing "N online" and "CPU X%" appears.
3. Click the badge → **Expected**: dropdown with CPU %, Memory %, and Uptime bars.
4. Open a new browser tab to the site → **Expected**: the online count increases by 1.

### Admin — Sparklines
1. Open admin dashboard.
2. **Expected**: Revenue, Orders, and Users KPI cards show a small sparkline chart below the value.
3. Hover over the chart to confirm the data represents 7 days.

### Admin — Responsive layout
1. Open admin dashboard on a large monitor (1440px+ width).
2. **Expected**: Content fills the full available width (no narrow 1280px-wide centered box with large blank margins).
3. Verify sidebar is still correctly positioned.

### Admin — Table empty states
1. In Admin → Orders, filter by a status that has no orders.
2. **Expected**: Table body shows a dashed circle illustration with "No data found" and a helpful subtitle.

## Refund Tracking
- Place an order (online payment), admin cancels with status 6 → admin sets refund status 9 → customer order page shows Refund Status card with amount and ref ID
- COD order refunded: shows "COD Manual" status badge

## Brand Pages
- Admin → Brands: create a brand with slug `test-brand`
- Visit `/brand/test-brand` → should show hero, product grid
- On product page, brand name should link to `/brand/[brand-slug]`

## Customer Segments
- Admin → Customer Segments: all 5 cohort cards load with numbers
- Top Spenders table shows customer names, order counts, total spent
- Recommended Actions links navigate correctly

## Real-time Admin Alerts
- Product: update inventory to 5 → admin layout shows orange toast "Low stock: X — only 5 left"
- Place a new order → admin shows green toast "New order #X received!"
- Submit support ticket → admin shows purple toast "New support ticket: Y from Z"
- Bell counter increments for each event type

## SMS Notifications
- Set FAST2SMS_API_KEY in .env
- Update order status to Shipped (3) → user's registered phone receives SMS
- Without API key, message is logged to console only (dev mode)

## Wide-screen Layout Test
- Open the website on a 1920px+ width monitor or set browser window to full width on a large screen.
- **Verify**: Header (navbar), footer, and page content all expand to fill more of the screen — no 300+ px empty gutters on both sides.
- **Check breakpoints**: At 1600px the content expands to ~1600px wide; at 1920px it expands to 1920px.
- **Mobile/laptop unchanged**: On screens below 1600px the layout should look identical to before.

## Phase 4 Tests (2026-07-30)

### Security

#### JWT query token removed
- Open any protected API endpoint directly in browser address bar with `?token=<jwt>` appended.
- **Expected**: 401 Unauthorized — query param tokens are no longer accepted.
- **Test via**: `curl http://localhost:5000/api/wallet?token=<valid_jwt>` → must return `{"message":"Unauthorized"}`.

#### File upload type filter
- Try uploading a `.php`, `.html`, or `.exe` file via any admin image upload field.
- **Expected**: Upload rejected with "Only JPG, PNG, WEBP, GIF images are allowed" error.
- Only JPG/PNG/WEBP/GIF files should be accepted.

### Calculations

#### Coupon discount preview matches checkout deduction
- Add products totalling ₹500 to cart. Apply a 10% coupon (`min_order=0`).
- **Coupon preview** at coupon apply step should show ₹50 discount (10% of ₹500 subtotal).
- **Order total** at checkout should also reflect exactly ₹50 coupon deduction.
- Previously the preview was calculated on `subtotal + GST` (slightly higher), now both use `subtotal` only — they should match.

### SEO

#### Sitemap includes brands and dosha-quiz
- Visit `/sitemap.xml` on the deployed site.
- **Verify**: Brand URLs (`/brand/<slug>`) appear in the sitemap.
- **Verify**: `/dosha-quiz` appears as a static route.

#### Brand page Open Graph
- Paste any brand page URL (e.g. `/brand/himalaya`) into https://www.opengraph.xyz or Facebook Debugger.
- **Expected**: Brand name as title, brand description, brand logo image — not the generic site OG fallback.

#### LocalBusiness schema on homepage
- Visit homepage source or use https://validator.schema.org/.
- **Expected**: Three JSON-LD blocks — `Organization`, `WebSite`, and `OnlineStore`.

### Responsive layout

#### Wide-screen content expansion (all pages)
- Open browser at full width on a 1920px+ screen (or set devtools viewport to 1920px).
- **Verify**: Category section, products section, features section, offer strip, and hero section all use wider content (not stuck at 1280px).
- At 1600px viewport: `max-w-7xl` sections should expand to ~1440px wide.
- At 1920px viewport: `max-w-7xl` sections should expand to ~1792px wide.

### Category endpoints now require admin auth
- Try `POST /api/categories` without being logged in as admin → must return 401.
- Try `DELETE /api/categories/1` without admin cookie → must return 401.
- **GET** routes remain public: `GET /api/categories` must still return data without auth.

### Test-mail endpoint removed
- `GET /api/test-mail` must return 404 (route no longer exists).

---

## Phase 5 — RBAC, Loading, Enter Key (2026-07-30)

### Admin route protection

#### Unauthenticated access blocked
- Log out completely, then navigate to `/admin/dashboard` directly → must redirect to `/adminauth`.
- Navigate to `/admin/orders` → must redirect to `/adminauth`.
- Any `/admin/*` route without a valid admin session → redirect to `/adminauth`.

#### Already-logged-in redirect
- While logged in as admin (role 1 or 2), navigate to `/adminauth` → must auto-redirect to `/admin/dashboard`.

### RBAC — Superadmin

#### Full access
- Log in as superadmin (role 1).
- **Verify**: All sidebar items visible, including "Departments & Roles".
- Navigate to `/admin/departments` → page loads normally.
- `GET /admin/my-permissions` must return `{ isSuperAdmin: true, permissions: [...all 43 keys] }`.

### RBAC — Department admin

#### No department assigned
- Log in as role-2 admin with no department assigned.
- `GET /admin/my-permissions` returns `{ isSuperAdmin: false, permissions: [] }`.
- Any permission-gated route (e.g. `/admin/orders`) in sidebar must be hidden.

#### Department with permissions
1. As superadmin: create department "Orders Team", assign `orders.view` + `orders.update` permissions.
2. Assign a role-2 admin to "Orders Team".
3. Log in as that admin.
4. Sidebar must show: Dashboard + Orders + Returns + Abandoned Carts (all need `orders.view`).
5. Sidebar must NOT show: Products, Categories, Users, Settings, etc.
6. Direct API: `GET /admin/orders` → 200. `GET /admin/products` → 403.

### Departments management page (`/admin/departments`)

#### Create department
1. Click "New Department" → modal opens.
2. Enter name "Finance" → click Create (or press Enter).
3. New card appears in the grid.

#### Assign permissions
1. Click a department card → permission editor panel opens.
2. Toggle individual permissions on/off.
3. Toggle group checkbox → all permissions in group toggle.
4. Click "Save Permissions" → toast shows success; permission_count on card updates.

#### Assign user to department
1. In the Admin Users table, click "Assign Department" next to a role-2 user.
2. Select department from dropdown → Save.
3. Department badge shows for that user in the table.

#### Delete department
1. Click trash icon on a department card → confirm dialog.
2. Department deleted; users in that department become "Unassigned".

### Enter key support (auth forms)

#### Login form
1. Open auth sheet → Login tab.
2. Fill email and password → press Enter → login fires.
3. Fill only email → press Enter → nothing happens (password is required).

#### Register form
1. Fill all required fields (name, email, phone, password) → press Enter on last field → register fires.
2. Leave any required field empty → Enter does nothing.

#### OTP form
1. Enter email → press Enter → OTP sent.
2. After OTP sent: enter code → press Enter → verification fires.

#### Forgot password form
1. Enter email → press Enter → reset link sent.

### Ayurvedic loading component

#### Account page load
- Navigate to `/account` while logged in.
- **Expected**: Ayurvedic loader (lotus, rings, floating leaves, wellness tips) instead of plain spinner.
- Tips cycle every ~2.4s with a fade transition.
- Wallet tab: smaller `AyurvedaLoader` shows while wallet data loads.

---

## Cancel Order Reason Modal

### My Account Orders List (`/account?tab=orders`)
1. Log in as a user with a Pending or Confirmed order.
2. Click the **Cancel** button on the order card.
3. **Expected**: A modal appears with "Cancel Order" heading and 6 preset reasons + "Other".
4. Select any reason → **Confirm Cancel** button becomes active.
5. Select "Other" → a textarea appears for free text input.
6. Click **Confirm Cancel** → order is cancelled, toast "Order cancelled successfully" appears, orders list refreshes.
7. Click **Keep Order** or outside the modal → modal closes, order unchanged.
8. If no reason is selected → Confirm Cancel button stays disabled.

### Order Detail Page (`/orders/[id]`)
- Same modal behavior. Already tested in previous session.

### Mobile (Order Detail)
- Tap Cancel Order → CancelModal sheet appears with same preset reasons.
- Selecting reason + confirming cancels the order.

---

## Tracking Stepper — Cancelled / Refunded State

### My Account Tracking Panel
1. Log in as user with a Cancelled order.
2. Click **Track Order** on the cancelled order card.
3. **Expected**: Instead of a 6-step progress bar, a red **❌ Order Cancelled** banner shows.
4. If the order had a `cancel_reason`, it appears below the banner heading.
5. If a refund was initiated, refund amount + status (⏳ Initiated / ✓ Processed / ✗ Failed) shows below.

For a Refunded order: green banner with ↩️ heading + refund amount.
For a Return Requested / Returned order: amber banner.

### Order Detail Page (`/orders/[id]`)
1. Navigate to a cancelled order's detail page.
2. **Expected**: A coloured banner (red for cancelled) shows with emoji, status label, and cancel reason if present.
3. The 6-step progress stepper does NOT appear for cancelled/returned/refunded orders.

### Mobile (Order Detail)
- Status 6/7/8/9: "SPECIAL STATUS BANNER" shows with emoji, label, cancel reason, and refund info.
- Progress stepper (`StatusTimeline`) is hidden for these statuses.
