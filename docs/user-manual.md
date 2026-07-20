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
