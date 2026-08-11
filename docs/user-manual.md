# User Manual — Oroganix eCommerce

---

## What's Fixed (2026-07-29)

### Wishlist
- **Remove from wishlist** now works correctly — the button was previously hitting the wrong API endpoint and silently failing. Items can now be removed as expected.
- **Wishlist heart icons** on the website now correctly reflect your saved items. Previously they showed catalog products instead of your actual wishlist.

### Cart
- **Product links** in the cart page now correctly use the product's SEO-friendly URL (slug) when available, falling back to the product ID.
- **Delivery fee estimate** in the mobile cart now loads correctly from the server. Previously it was always showing the default value (₹0 / free over ₹500) because it was trying to load from an admin-only page.

### Checkout (Web & Mobile)
- **Default address** is now automatically pre-selected at checkout. Previously the "default" flag from your address list was not being read correctly.
- **Wallet balance** on the checkout page loads correctly — the API URL had a trailing slash that some servers handle differently.
- **Duplicate validation error** — on the web checkout, pressing Place Order would previously show the same error toast twice. Fixed to show it once.

### Admin Panel
- **Admin login** now correctly stores your admin session. Previously the wrong field from the login response was being used, so the session appeared to work but admin data wasn't loaded.
- **Admin panel security** — the admin dashboard now checks that you are logged in as an admin before showing the panel. Previously any URL visitor could see the admin UI layout (though API calls would still fail without credentials).

### Orders & Payments
- **COD orders** are now correctly marked as "Paid" when the admin marks an order as Delivered. Previously, COD orders stayed in "Pending" payment status indefinitely.
- **Order total** shown after placing an order now reflects the actual amount charged (after wallet and loyalty point deductions), not the pre-discount total.

### Returns (Admin)
- The **Returns management page** (`/admin/returns`) was always showing a server error (500). This is now fixed — the page loads and shows all return requests correctly.

### Coupon Limits
- **Per-user coupon limits** are now enforced when browsing available coupons. Previously, a coupon marked as "1 use per user" would still show as available even after you'd already used it.

### Mobile App — Product Page
- **Add to Cart / In Cart button** now correctly detects whether a product is already in your cart when you arrive at the product page via a product link (slug URL). Previously the button always showed "Add to Cart" even when the item was already there.

---

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

---

## Search (`/search`)

The Search page lets you find products with powerful filters and sorting.

- **Search bar**: Type any keyword — results update automatically after a short pause. The URL updates so you can share or bookmark your search.
- **Filters** (sliders icon): Click to expand the filter panel:
  - Category
  - Min and max price
  - In-stock only toggle
  - Discount only toggle
- **Sort**: Choose from Relevance, Price Low/High, Newest, Top Rated, or Most Popular.
- **Results**: Shown in a 12-item grid. Add items to cart or wishlist directly from the card.
- **Pagination**: Navigate pages at the bottom of the results.

---

## Adding a Delivery Address at Checkout (Web)

If you have no saved addresses when you reach checkout, the address form now appears **directly on the checkout page** — no redirect needed.

1. Go to Checkout — if no address is saved, a "+ Add Delivery Address" button appears.
2. Click it to expand the form: Address Type, PIN Code, Street, City, State, and Email.
3. Fill in the details and click **"Save Address & Continue"** — the address is saved to your account and auto-selected.
4. You can also add a new address anytime using the **"+ Add New Address"** button even if you already have saved addresses.

---

## Adding a Delivery Address at Checkout (Mobile App)

Same experience as on web — no screen redirect needed:

1. In Checkout, if no address is saved, a dashed **"Add New Address"** button appears.
2. Tap it to reveal the address form with street, city, state, pincode, and email fields.
3. Fill in all fields and tap **"Save & Continue"** — your address is saved and auto-selected for this order.

---

## Frequently Bought Together (Product Detail)

On any product detail page, scroll down to find the **"Frequently Bought Together"** section. This shows bundles that include the product you're viewing.

- Each bundle card shows the products included, the total price, and how much you save compared to buying separately.
- Click or tap **"Add Bundle to Cart"** to add all bundle items at once.
- The section only appears when active bundles exist for that product.

---

## Review Sort + Star Filter (Product Detail — Web)

On the Product Detail page, scroll to the **Reviews** tab to find sort and filter controls:

- **Sort**: Choose from Newest, Top Rated, Lowest Rated, or Most Helpful.
- **Star filter buttons** (★1 through ★5): Tap any star to show only reviews of that rating. Tap again to clear the filter.
- Filters and sorts can be combined (e.g. "4-star reviews, sorted by Most Helpful").

---

## Sign In Options (Mobile App)

The mobile app supports three sign-in methods:
- **Email + Password** — the standard login tab
- **Email OTP** — passwordless login by entering your email and a one-time code sent to your inbox
- **Google Sign-In** — tap "Continue with Google" on the Login tab

Mobile phone (SMS) OTP login has been removed from the UI as it is not yet available. Use email or Google to sign in.

---

## Product Comparison (Web)

You can compare up to 4 products side by side to help make a buying decision.

1. On any product detail page, click **"Add to Compare"** (bar-chart icon button below the trust badges).
2. The button turns green when the product is added. A **green bar** appears at the bottom of the screen showing all products queued for comparison.
3. Add a second product (minimum 2 required) and click **"Compare Now →"** in the bar.
4. The **/compare** page shows a side-by-side table with price, category, brand, weight, FSSAI, rating, ingredients, benefits, usage, and more.
5. The lowest price among compared products is highlighted with a **BEST** badge.
6. Click **"View Product"** on any column to go to that product's detail page.
7. Click **"Clear"** in the compare bar (or **"Clear & Go Back"** on the compare page) to reset the list.

---

## Expected Delivery Date (Web)

When checking delivery availability on a product page:
1. Enter your 6-digit PIN code in the **"Check Delivery"** box.
2. After clicking **Check**, the result now shows the **exact delivery date** (e.g., "Delivery by Mon, 28 Jul to Mumbai") along with the number of days.

---

## Social Sharing (Web)

On any product detail page, below the trust badges:
- **WhatsApp** — Opens a WhatsApp chat pre-filled with the product link.
- **Copy Link** — Copies the product URL to your clipboard.
- **Share** — (On supported browsers) Opens the native sharing dialog.

---

## Reorder (Web)

In **My Account → Orders**, each order now has a **"Reorder"** button. Clicking it adds all items from that order to your cart automatically (quantities are added to any existing cart items).

---

## Loyalty Tier (Web)

In **My Account → Wallet & Points**, a **tier card** is now shown above the "How it works" section:
- Your current tier (Bronze / Silver / Gold / Platinum) with an emoji badge.
- A progress bar showing how much more you need to spend to reach the next tier.
- Your current tier benefits listed as chips.

---

## Cart — Save for Later + Stock Warnings (Web)

### Save for Later
On the Cart page, each item now has a **"Save for Later"** button (bookmark icon):
- Tap it to move the item to your **Saved for Later** list (below the cart items).
- Items in the Saved for Later list can be moved back to your cart with the **"Move to Cart"** button.
- Out-of-stock saved items show a disabled "Move to Cart" button.

### Stock Warnings
- A red **"Out of stock"** badge appears on any cart item with no inventory.
- An orange **"⚠ Only X left!"** badge appears when stock is between 1 and 5 units.

---

## Return Request — Photo Upload (Web + Mobile)

When submitting a return request you can now attach photo evidence of the issue.

**Web** (Order Detail page):
1. Click **Return Order** and select your reason.
2. Click **"📁 Upload Photos"** to select images from your device (JPG, PNG, WEBP).
3. Alternatively, paste an image URL into the URL field and click **"Add"**.
4. Up to **5 photos** can be attached. Thumbnails appear with a ✕ button to remove.
5. Click **Submit** to send the request with your photos.

**Mobile App** (Order Detail screen):
1. Tap **Return** and pick a reason from the list.
2. Tap **"📁 Upload Photos"** to open your photo library.
3. Or paste an image URL into the "Or paste image URL..." field and tap **Add**.
4. Up to 5 photos total. Remove any thumbnail by tapping the red ✕.
5. Tap **"↩️ Submit Return Request"** — photos are uploaded automatically with your request.

---

## Bulk Order Status Update (Admin)

Admins can update the status of multiple orders at once:

1. Go to **Admin → Orders**.
2. Check the checkbox next to each order you want to update (or tick the header checkbox to select all visible orders).
3. A toolbar appears showing how many orders are selected.
4. Choose the new status from the dropdown (e.g. Confirmed, Shipped, Delivered).
5. Click **Apply to Selected** — all checked orders are updated instantly.
6. Customers receive email, push, and in-app notifications for each order.
7. Click **Clear selection** to deselect all without making changes.

---

## Product Image Viewer (Mobile App)

On any product detail screen, tap the main product image to open a full-screen viewer:
- Pinch to zoom in (up to 4x).
- Swipe left / right to see other product images.
- Dot indicators at the bottom show which image you are on.
- **Swipe down** to dismiss — the image follows your finger and fades out.
- An image count badge (e.g. 2/4) shows your position in the gallery.

---

## Rating Filter (Mobile Search)

When browsing products on mobile, tap the **Filter** icon and scroll to **Minimum Rating**:
- Choose **Any** (no filter), **3+**, **3.5+**, **4+**, or **4.5+**.
- Tap **Apply Filters** — only products at or above your chosen rating will appear.
- The active rating filter is shown in the "Filters applied" counter.

---

## Discover Your Dosha — Ayurvedic Body Type Quiz

Take a free 2-minute quiz to discover your Ayurvedic body type (Vata, Pitta, or Kapha):

**Web** (`/dosha-quiz`):
1. Click **"Take the Quiz →"** on the home page banner (or go to `/dosha-quiz` directly).
2. Answer 10 questions about your daily habits and physical traits.
3. Use the **Back** button to change a previous answer.
4. Your result shows: your dominant dosha, score breakdown (%), description, wellness tips, and recommended product categories to shop.

**Mobile App**:
1. Tap the **"🌿 Discover Your Dosha"** card on the home screen.
2. Answer the same 10 questions (animated transitions between questions).
3. Your result page shows the dosha header with score bars, tips, and a **Shop by Dosha** button.
4. Tap **Retake Quiz** to start over.

---

## Safety & Certification Tags (Product Page)

Some products carry safety and certification badges. These appear on the product detail page under a **"Safety & Certifications"** heading:
- Examples: **Vegan**, **Gluten Free**, **Pregnancy Safe**, **Cruelty Free**.
- Green badges with a ✓ checkmark indicate verified certifications.
- On mobile, badges scroll horizontally if there are many.

---

## Admin Dashboard — Real-time Stats

The admin dashboard at `/admin/dashboard` now updates KPI cards and the Recent Orders list in real time:
- **New orders**: stats and the recent orders list refresh automatically when a customer places an order.
- **Order status changes**: when any admin updates an order's status (single or bulk), the Pending Orders count and Recent Orders list refresh instantly on all open admin dashboard tabs — no manual page reload needed.

---

## Refund Status Tracking (Admin)

When a cancelled order triggers a Razorpay bank refund, the refund status is tracked automatically:

- **Admin → Orders → Order Detail**: a badge shows `REFUND: PROCESSED` (purple) or `REFUND: FAILED` (red) alongside the payment status. The refund amount is displayed next to the badge.
- **Admin → Returns → Return Detail**: a small badge appears next to the Refund Amount showing the Razorpay refund status (`PROCESSED` / `FAILED`).
- Razorpay sends a webhook when the refund status changes — no manual action needed.
- The customer also receives an in-app notification when their refund is processed or fails.

---

## New Features (2026-07-30)

### Mobile App — Settings Screen
A dedicated Settings screen is now accessible from **Account → Settings (⚙️)**:
- **Account**: Edit profile, manage addresses, wallet & credits
- **Notifications**: Toggle push notifications, order updates, promotional emails
- **Help & Support**: Quick links to support tickets, FAQ, and user manual
- **App**: Clear cache, rate the app, share the app, view version number
- **Account Actions**: Logout and Delete Account (with confirmation)

### Mobile App — Deals & Offers Screen
A new Deals screen is accessible from the Home page (red **⚡ Deals & Offers** banner):
- Shows all active **flash sales** with a live countdown timer
- Lists all products with active discounts (sorted by discount %)
- Each product card shows the discount badge and add-to-cart button
- Pull-to-refresh for live updates

### Mobile App — Notification Badge
- The Account tab in the bottom navigation now shows a **red badge** with the unread notification count
- Badge clears automatically when you open the Notifications screen

### Mobile App — Notify Me (Out of Stock)
- On any product page, if an item is **Out of Stock**, a **🔔 Notify Me When Available** button appears below the buy buttons
- Tap it to subscribe — you'll receive a push notification and email when the item is restocked
- Requires login

### Admin Panel — Live Server Health
A real-time **Server Health** indicator now appears in the admin header:
- Shows **number of connected users** (via Socket.io)
- Shows **CPU load %** with a color indicator (green/amber/red)
- Click to expand a panel showing CPU %, Memory %, and Server Uptime
- Updates automatically when any user connects or disconnects

### Admin Panel — 7-Day KPI Sparklines
The Revenue, Orders, and Users KPI cards on the admin dashboard now show a **mini sparkline chart** of the last 7 days of activity directly on each card.

### Admin Panel — Big Screen Layout Fix
Admin pages now use full-width layouts on large monitors (1080p+). Previously, content was centered within a narrow 1280px max-width, leaving large empty margins on both sides of big screens.

### Admin Panel — Table Empty States
Admin data tables now show a polished empty state with a dashed circle illustration and helpful hint text when no results are found.

## Refund Tracking
When your order is cancelled or refunded, the order detail page (Account → My Orders → Order) shows a **Refund Status** card with:
- Refund amount
- Status: Processed / Pending / COD Manual
- Razorpay reference ID (for online orders)
- Note that refunds are credited within 5–7 business days

## Brand Pages (Web)
Each brand now has a dedicated page at `/brand/[slug]`. On a product page, clicking the brand name takes you to that brand's page showing all their products, logo, description, product count, and average rating. Sort by Newest, Price, or Rating.

## Admin: Customer Segments
Admin → Customer Segments (sidebar or ⌘K search). Shows five customer cohorts:
- **New Users**: Registered in last 30 days, no orders yet
- **Loyal Customers**: 3+ delivered orders
- **High-Value Orders**: Any single order > ₹5,000
- **VIP Customers**: Lifetime spend > ₹10,000
- **At-Risk / Inactive**: No activity in 90+ days

Includes recommended actions (win-back, VIP rewards, conversion) and a Top 10 Spenders leaderboard.

## Admin: Real-time Alerts
The admin header now shows instant toast notifications for:
- ⚠️ Low stock: when any product inventory drops to ≤10 units
- 🛍️ New orders: immediately when a customer places an order
- 💬 Support tickets: when a user opens a new support ticket

All three also update the bell counter in real time without page refresh.

## Display on Large Monitors

The website now expands properly on large monitors and 2K/4K screens. Previously, the header and page content were limited to 1280px wide even on wide screens. The layout now expands to 1600px on 1600px+ monitors and up to 1920px on full-HD and larger displays, making full use of the available screen space.

## Display on Large Monitors — Extended (2026-07-30)

The layout expansion now covers all page sections (not just the header and footer). Product listings, category grids, hero section, offer strip, and all homepage sections now adapt their width on large screens:

- **1600px+ monitors**: Section content expands to ~1440px wide (previously 1280px).
- **1920px+ monitors**: Section content expands to ~1792px wide — filling the screen properly.

This update affects the homepage sections, products listing, search results, product detail, category pages, and brand pages.

## Security Note for Users

The checkout and account pages are fully secured — authentication tokens are only accepted via secure HTTP cookies and authorization headers. They are never transmitted through browser URLs.

File uploads (product images, return photos) are restricted to image files only (JPG, PNG, WEBP, GIF). Non-image files are automatically rejected.

---

## Admin — Departments & Role Management (Superadmin Only)

### What is the RBAC system?

The admin panel now supports multiple admin roles with granular permissions. A **superadmin** (role 1) has full access. Regular **admins** (role 2) can only access the areas their department gives them access to.

### How it works

1. **Departments** group related permissions (e.g. "Orders Team", "Finance Team", "Content Team").
2. **Permissions** are specific actions (e.g. view orders, create products, manage coupons).
3. **Admins** are assigned to a department — they can only see and use what their department allows.

### Managing Departments

Navigate to **Admin → Departments & Roles** (only visible for superadmins).

#### Create a department
1. Click **New Department**.
2. Enter a name (e.g. "Support Team") and optional description.
3. Press Enter or click **Create**.

#### Assign permissions to a department
1. Click on any department card.
2. The permission editor opens on the right.
3. Toggle individual permissions on/off, or use the group checkbox to enable/disable an entire category.
4. Click **Save Permissions**.

#### Assign an admin to a department
1. In the **Admin Users** table at the bottom, find the admin.
2. Click **Assign Department** → select a department → Save.
3. The admin will immediately see only their department's pages in the sidebar.

### Admin experience by role

| Feature | Superadmin (role 1) | Department admin (role 2) |
|---|---|---|
| Sees all sidebar items | ✅ | ❌ Only their department's items |
| Departments & Roles page | ✅ | ❌ Hidden |
| Create departments | ✅ | ❌ |
| Assign permissions | ✅ | ❌ |
| Assign users | ✅ | ❌ |

---

## Keyboard Shortcuts — Login & Register

All forms now support the **Enter key** for submission:

- **Login**: Fill email + password → press **Enter** → logs in immediately.
- **Register**: Fill all required fields → press **Enter** on the last field → creates account.
- **OTP Login**: Enter email → press **Enter** → sends OTP. Enter OTP code → press **Enter** → verifies.
- **Forgot Password**: Enter email → press **Enter** → sends reset link.

The Enter key only fires if all required fields for that action are filled. If a required field is empty, nothing happens (no error flash — just no action until the form is ready).

---

## Order Cancellation — Reason Modal

When cancelling an order from **My Account → Orders**, a modal now appears instead of a browser popup.

**How it works:**
1. Click **Cancel** on an order (only available for Pending or Confirmed orders).
2. A modal appears asking "Please tell us why you want to cancel this order".
3. Choose one of 6 preset reasons or select **Other** and type a custom reason.
4. Click **Confirm Cancel** — the order is cancelled and your reason is saved.

**Cancel reasons available:**
- Changed my mind
- Found a better price elsewhere
- Ordered by mistake
- Shipping takes too long
- Product not needed anymore
- Other (free text)

This applies to: **My Account orders list**, **Order detail page** (`/orders/[id]`), and **Mobile order detail**.

---

## Order Tracking — Cancelled / Refunded State

The order tracking panel now shows a clear visual state for cancelled or returned orders.

**When an order is Cancelled:**
- The progress stepper is replaced by a red **❌ Order Cancelled** banner.
- The cancellation reason is shown below the banner (if provided).
- If a refund was initiated, the refund status is shown: ⏳ Initiated / ✓ Processed / ✗ Failed.

**When an order is Returned/Refunded:**
- An amber (return) or green (refunded) banner replaces the progress stepper.
- Refund amount and status are shown.

This applies to: **My Account tracking panel**, **Order detail page** (`/orders/[id]`), and **Mobile order detail** (Special Status Banner).

---

## Return & Replacement Policy (Per-Product)

Each product can now have its own return policy configured by the admin. This affects all surfaces — product page, cart, checkout, order detail, My Account, and mobile app.

### How It Works for Customers

**Product Detail Page (web + mobile):**
- If a product is returnable, a green badge shows the return window (e.g. "7-Day Returns & Replacement").
- If a product is non-returnable, a red warning badge is shown.

**Cart:**
- If your cart contains any non-returnable items, a warning banner appears before checkout reminding you those items cannot be returned.

**Checkout:**
- Each item in the order summary shows its return policy — either "Xd return policy" (green) or "Non-Returnable" (red).

**Order Detail Page — Return Window Countdown:**
- After delivery, the "Request Return" button shows a countdown: "Return by [date] · X days left".
- If the window has expired, a red message explains why the return button is unavailable.
- If the product is non-returnable, the return button is never shown.

**My Account Orders List (web + mobile):**
- Delivered orders show a return window chip (e.g. "Return by 10 Aug · 3d left") if the window is still open.

### Requesting a Return: Refund vs Replacement

When you click "Request Return", you can choose:
- **💰 Refund** — get your money back to your wallet or original payment method.
- **🔄 Replacement** — receive a replacement product (only available if the product supports it).

After you choose, select your reason and optionally attach photos.

### Return Window Rules
- The return window is calculated from your delivery date.
- If your order contains products with different return windows, the shortest window applies to the entire order.
- Non-returnable products make return ineligible even if other products in the order are returnable.

---

## Replacement Dispatch (Admin)

When a customer requests a replacement:
1. The Returns Management page shows a **"Replacement"** chip on the request.
2. Admin approves using **"Send Replacement"** — the order moves to status 8 (Returned) with `return_type=replacement`.
3. Once the replacement is shipped, admin clicks **"Dispatch Replacement"**, optionally adds a tracking number.
4. Customer receives an email notification when the replacement is dispatched.

---

## What's Fixed — August 2026 (Calculation Audit)

### Orders & Payments
- **Free orders now checkout cleanly** — if your wallet, loyalty points, and gift card together cover the full order amount (₹0 remaining), your order is now placed immediately without going through the Razorpay payment screen. Previously this caused a checkout error.
- **Order confirmation email** (Cash on Delivery) now shows the correct amount you actually owe — the after-discount total — instead of the full pre-discount price.
- **Invoices now show the full discount** — all discounts (coupon, wallet, loyalty points, and gift card) are now summed correctly on your PDF invoice. Previously wallet and loyalty discounts were missing from the invoice total.

### Loyalty Points
- **Points earned from quizzes** now appear correctly in your Loyalty Points history. Previously quiz points were saved to a hidden table and didn't show up in your wallet history.
- **Loyalty point minimum enforced** — you must now have at least the minimum required points (set by the store, default 50) before you can redeem them at checkout. Previously the minimum setting had no effect.

### Refund Status
- **Refund status is now accurate** — when your refund is initiated, the status correctly shows "Pending" while Razorpay processes it, and updates to "Processed" when complete. Previously it always showed "Processed" immediately even before the money had moved.

### Gift Cards
- **Gift card security fix** — in rare cases where a gift card was used at exactly the same time by two devices, only one order would actually get the discount. Previously the other order could accidentally go through with the discount applied but the gift card balance not deducted. This is now fixed — the unsuccessful order will receive an error message instead.

---

## What's Fixed — Mobile App Audit (August 2026)

### Navigation & Session
- **Automatic logout redirect** — if your session expires while using the app, you are now automatically taken to the login screen. Previously the app silently logged you out but kept you on the current screen, causing confusing errors.
- **Support ticket deep-link** — tapping a "Support reply" notification now opens the correct ticket conversation directly, instead of just going to the Support list screen.

### Notifications (in-app)
- **Order status updates**, **support replies**, **refund notifications**, and **tracking updates** now appear as non-blocking toast banners at the top of the screen. Previously they used system alert dialogs that blocked the entire UI until dismissed. Tapping a banner navigates directly to the relevant order or support ticket.

### Home Screen
- **Offer banner "Apply" button** now pre-fills the coupon code when it takes you to checkout. Previously you had to type the code manually.

### Products
- **Add to Cart error feedback** — if adding a product to the cart fails (e.g. out of stock, server error), an error message now appears. Previously it failed silently.

### Account
- **Wishlist count** in the Account stats row now shows the correct number of wishlisted items. Previously it always showed "—".

### Settings
- **Notification preferences** (Order Updates, Promotional Emails toggles) are now saved and remembered across app restarts. Previously toggling them had no lasting effect.

### Blog
- **Infinite scroll** now correctly stops loading once all articles have been fetched, preventing unnecessary extra API requests.

### Order Detail
- **Invoice download** — the Invoice button is now visible for all completed orders. Tapping it fetches the latest invoice and opens it. Previously the button only appeared if the invoice PDF URL was already stored in the order.
- **Return eligibility error** — if the app can't check whether your order is eligible for return (e.g. network issue), a clear error message is shown instead of silent failure.

### Bottom Navigation
- **Cart tab added** — the cart is now directly accessible from the bottom navigation bar on every screen. The tab shows a live badge with the number of items in your cart.
