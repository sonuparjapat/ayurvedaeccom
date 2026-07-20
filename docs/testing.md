# Testing Guide — Oroganix eCommerce

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
