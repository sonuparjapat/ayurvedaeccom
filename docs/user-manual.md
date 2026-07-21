# User Manual — Oroganix eCommerce

## My Account (Mobile App)

The Account screen shows your profile and order history in a premium dark-themed header:
- **Stats row** — Your Order count, saved Address count, and Wishlist are displayed as individual glass pill cards in the green header
- **Quick Access** — Each shortcut (Orders, Wishlist, Cart, Wallet, etc.) has a unique colored icon
- **Referral Code** — If you have a referral code, it appears on a dark card with your code in gold text. Tap **Copy** to copy it or **Share** to send it to friends
- **Orders tab** — Each order card has a colored left bar matching the order status, and the total is highlighted in gold

## My Cart (Mobile App)

- Each cart item shows a green left accent border for easy scanning
- The price is highlighted in emerald green
- The delivery progress bar shows how close you are to free delivery on a mint-tinted glass card
- If your cart is empty, the cart icon displays on a dark forest gradient orb

---

## Making a Payment (Mobile App)

### Online Payment (Razorpay)
1. Add items to your cart and proceed to **Checkout**.
2. Select **Online Payment**.
3. Tap **Place Order** — a Razorpay payment page will open inside the app.
4. Complete the payment in the Razorpay window.
5. On success you will be returned automatically to the order confirmation screen.
6. If you close the payment window before completing, your order remains in **Pending** status. You can retry payment from **My Orders**.

> **Android note:** The payment window opens as an in-app browser tab. Do not use the back button while payment is processing — wait for Razorpay to return you to the app.

### Cash on Delivery (COD)
1. Select **Cash on Delivery** at checkout.
2. Tap **Place Order** — your order is confirmed immediately.
3. Pay the delivery person when the order arrives.

---

## Checkout Page
The checkout page shows:
- Your saved delivery address (or a form to enter one)
- Order summary with itemised prices, GST, delivery fee, platform fee, and grand total
- Coupon / wallet / loyalty point fields
- Payment method selector (COD / Online)

---

## Product Detail Page
- Tap any thumbnail to switch the main image. **Click the main image** to open a full-screen lightbox with zoom.
- Use the **Description / Reviews / Q&A** tabs to read product details, customer reviews, and frequently asked questions.
- The stock badge shows real-time inventory. If a product has variants, select a variant before adding to cart.
- Scroll down past the "Add to Cart" button — a **sticky bar** slides in from the bottom with a quick-add button so you can always add to cart without scrolling back up.

---

## Offers & Deals Page (`/offers`)
View all active promotions in one place:
- **Flash Sales** — Limited-time deals with a live countdown timer and stock progress bar
- **Coupon Codes** — Click the copy icon next to any code to copy it to your clipboard, then paste at checkout
- **Bundle Deals** — Pre-selected product bundles at a discounted price; click "Add Bundle to Cart" to add all items at once

---

## My Orders (`/orders`)
- Each order row in your account shows the current status, date, and total.
- Click any order to view the full **Order Detail** page with:
  - A live progress stepper showing your order's journey
  - Tracking information and carrier link (when available)
  - Per-item review buttons (available after delivery)
  - Re-order, Cancel, and Return options

---

## Dark Mode (Web)

Click the **Moon / Sun icon** in the site header to toggle between light and dark themes. Your preference is saved in the browser and remembered across sessions.

---

## Product Detail Page (Mobile App)

- The price is displayed inside an **emerald-tinted card** for easy reading.
- If the product is on sale, a **gradient green "Save X%" pill** shows the discount.
- Bestseller products show a **gold gradient Bestseller badge**.
- The sticky bottom bar shows the price in green and a color-coded "Add to Cart" button that changes state (In Cart / Update Cart / Out of Stock) automatically.

---

## Admin Dashboard

Admins can access `/admin/dashboard` for a live operational overview:
- **KPI Cards** — Revenue, total orders, users, products, pending orders, and low-stock items. Cards with open issues (pending orders, low stock) show a red pulse indicator.
- **Revenue Chart** — Interactive area chart showing revenue and order volume over time. Switch between Daily, Weekly, and Monthly views.
- **Real-time Order Alerts** — When a new order is placed anywhere on the site, a toast notification pops up in the bottom-right corner of the dashboard automatically. Click the toast to jump straight to that order.
- **Recent Orders** — The 10 most recent orders with status badges and amounts.
- **Top Products** — Best-selling products by revenue, with rank numbers.
- **Low Stock Alert** — Products below the stock threshold are listed with current inventory counts and a direct "Update" link.

---

## Customer Support (`/support`)

The support page now matches the full site design with the header, navigation, and footer visible at all times.

- **View your tickets**: All your support requests are listed with colour-coded status badges (blue = Open, amber = In Progress, green = Resolved, gray = Closed).
- **Create a ticket**: Click the **New Ticket** button (top-right) to open the form. Fill in the subject, category, priority, and message, then click **Submit Ticket**.
- **Filter tickets**: Use the status pills at the top to filter by Open, In Progress, Resolved, or Closed.
- **Chat with support**: Click any ticket to open the conversation thread. Messages from the support team appear on the left (white bubble) and your messages on the right (dark green bubble). Type your reply at the bottom and press Enter or click the Send button.
- **Close a ticket**: Inside a ticket, click the **Close** button in the header if you consider your issue resolved.

---

## Blog (`/blog`)

The blog has been redesigned with a premium look to match the rest of the Oroganix experience.

- **Search**: Type keywords into the search bar at the top of the page and click **Search**.
- **Browse by category**: Click any category pill below the featured post to filter articles (e.g. Ayurveda, Wellness, Herbs).
- **Featured post**: The most recent article is highlighted in a large card at the top of the page.
- **Read an article**: Click on any card's title or the **Read →** link to open the full article.

---

## Notifications (`/notifications`)

The notifications page has been updated with a premium green-themed design.

- **Activity tab**: Shows all personal notifications — order updates, support replies, and ticket status changes. Unread items are highlighted with a green-tinted background and an emerald left border.
- **Announcements tab**: Shows store-wide announcements from the Oroganix team.
- **Mark all read**: Click **Mark all read** (top-right of the page) to clear all unread indicators at once.
- **Filter**: Expand the **Filters** panel to filter by type, read status, or date range.
- **Real-time updates**: New notifications arrive automatically while you're on the page — no refresh needed.

---

## Loading Indicator

Throughout the site, loading states now show a **leaf spinner** — a rotating emerald arc with an Ayurvedic leaf icon in the centre — consistent with the Oroganix brand and the mobile app's leaf animation.

---

## Managing Addresses (Mobile App)

Go to **Account → Manage Addresses** to view, add, edit, or delete delivery addresses.

### Auto-detect your location
When adding or editing an address, a green **"Use my current location"** button appears at the top of the form (with a 📍 pin icon). Tapping it:
1. Asks for location permission the first time (tap **Allow**).
2. Detects your GPS position and automatically fills in **City**, **State**, and **PIN Code**.
3. You only need to type your **Street / House No.** — everything else is filled for you.

> If location detection fails (poor GPS signal or permission denied), fill in the fields manually as usual.

---

## Customer Support (Mobile App)

The Support section is available in the mobile app the same way as on the web:

- Go to **Account** and tap **Customer Support** (listed in the quick access section).
- View all your tickets, filter by status, and open any ticket to chat.
- **Real-time replies**: When the support team sends you a reply, it appears in the chat instantly — no need to close and reopen the ticket.

---

## Customer Support — How to Find It (Web)

- **Navbar**: The "Support" link appears in the top navigation bar when you are logged in.
- **Account sidebar**: Go to **My Account** — "Customer Support" is listed in the left sidebar, between Wallet & Points and Settings.
- **Footer**: The Support link is always visible in the site footer under Quick Links (even when not logged in, clicking it will prompt you to log in).

### Real-time ticket updates (Web)
- When the support team replies to your ticket, the reply appears in the chat **instantly** without refreshing.
- If you are on the support ticket list page, your ticket's status updates live when the team changes it.

---

## Mobile App — Coupons & Checkout

Coupon discount labels in checkout and the home screen offer banner now display correctly (e.g. **20% OFF** or **₹50 OFF**). Previously these showed "undefined% OFF" due to a field name mismatch.

- **Home screen banner**: Shows the best available coupon at the top of the home screen. Tap the banner to go to checkout.
- **Checkout coupon chips**: Usable coupons appear as tappable chips above the coupon code input. Tap a chip to auto-fill the code.
- **Locked coupons**: Coupons you haven't yet qualified for (minimum order not met) appear below, showing exactly how much more you need to add.

---

## Mobile App — Notifications

The Notifications screen now matches the app's dark forest theme:
- Header uses the same dark gradient as other screens.
- Unread notifications are highlighted with a green left border instead of blue.
- The 🌿 leaf animation plays while notifications load.

---

## Mobile App — Blog

- Blog articles now render with proper formatting: headings appear larger and bolder, bullet lists have `•` markers, and blockquotes appear in a styled card.
- The 🌿 leaf animation plays while articles load.

---

## FAQ Page (Web)

The FAQ page at `/faq` is now fully managed by the admin team — questions and answers are updated in real-time without any code changes.

- **Browse by category**: Use the category filter at the top of the page to view questions by topic (e.g. Orders & Shipping, Payment, Returns).
- **Search**: Type any keyword in the search bar to find relevant questions across all categories.
- **Expand answers**: Click any question to see the full answer. Click again to collapse it.

---

## Wishlist — Add All to Cart

On the Wishlist page (web and mobile app), you can now add all available products to your cart in one tap:

**Web (`/wishlist`)**:
- Click the **"Add All to Cart"** button in the top-right area of the page.
- Only in-stock items that are not already in your cart will be added.
- A confirmation toast tells you how many items were added.

**Mobile App (Wishlist screen)**:
- Tap the **"🛍️ Add All to Cart"** bar that appears below the search box.
- Same logic applies: only in-stock items not already in your cart.

---

## Recently Viewed (Web Home Page)

When you're logged in and have browsed product pages, a **"Recently Viewed"** section appears on the home page (between Featured Products and Features).

- Shows up to 10 products you visited most recently.
- You can add items to cart or wishlist directly from this section.
- The section only appears when logged in and disappears if you haven't viewed any products yet.

---

## Subscriptions (Web)

If you have active subscriptions for any products, you can manage them from your account page:

1. Go to **My Account** (top-right menu or `/account`).
2. Click **Subscriptions** in the left sidebar.
3. Each subscription card shows:
   - Product name and image
   - Delivery frequency (e.g. Monthly, Weekly)
   - Status: **Active**, **Paused**, or **Cancelled**
   - Next order date (for active subscriptions)
4. **Pause**: Temporarily stop automatic orders. You can resume anytime.
5. **Resume**: Restart a paused subscription — the next order date recalculates from today.
6. **Cancel**: Permanently stops the subscription.

---

## Subscriptions (Mobile App)

1. Go to **Account** in the bottom navigation.
2. Tap **"🔁 Subscriptions"** in the Quick Access grid.
3. All your subscriptions are listed with their current status.
4. **Pause / Resume**: Tap the Pause or Resume button on any active/paused subscription.
5. **Cancel**: Tap the ✕ Cancel button — you'll be asked to confirm before it's cancelled.

---

## FAQ (Mobile App)

1. Go to **Account** in the bottom navigation.
2. Tap **"❓ FAQ"** in the Quick Access grid.
3. Browse questions by category using the chips at the top, or use the search bar to find a specific question.
4. Tap any question to see the answer. Tap again to close it.
