# 🌿 Ayurvedic & Organic eCommerce Platform

A modern full-stack Ayurvedic & Organic eCommerce platform built with **Next.js**, focused on delivering a fast, scalable, and user-friendly shopping experience for natural wellness and organic lifestyle products.

---

# 🚀 Project Overview

This platform is designed to provide users with a trusted online marketplace for:

- Ayurvedic Products
- Organic Foods
- Herbal Supplements
- Natural Skincare
- Haircare Products
- Wellness Essentials
- Chemical-Free Lifestyle Products

The project combines modern web technologies with the growing demand for natural and healthy living.

---

# ✨ Features

## 🛍️ Customer Features

- Modern Responsive UI
- User Authentication & Authorization
- Product Categories & Filters
- Smart Product Search
- Product Reviews & Ratings
- Add to Cart
- Wishlist Functionality
- Secure Checkout
- Online Payment Integration
- Order Tracking
- Coupon & Discount System
- User Profile Management

---

## 🛠️ Admin Features

- Admin Dashboard
- Product Management
- Inventory Management
- Order Management
- User Management
- Sales Analytics
- Banner & Content Management
- Coupon System
- Push Notification Broadcasting (with Expo push token management)
- Support Ticket Management (reply, change status)
- Wallet & Loyalty Point Management (credit/debit per user, bulk view)
- Dynamic Loyalty Settings (earn rate, redeem rate, min points, max % — all configurable from admin)

---

## 🔔 Notification System

All notifications (order updates, support replies, admin broadcasts) are delivered via:
1. **WebSocket** (Socket.io) — real-time bell badge and notification center updates
2. **Database** (`user_notifications` table) — persistent history per user
3. **Expo Push Notifications** — mobile push (requires production/EAS build, not Expo Go)

Both web and mobile have a unified **Notification Center** with tabs for personal notifications and admin announcements.

---

## 💰 Wallet & Loyalty Points

### How it works
- **Store Wallet**: Admin credits funds; users can apply wallet balance at checkout.
- **Loyalty Points**: Earned automatically on delivered orders (rate is configurable). Redeemed at checkout as a discount.

### Admin Configuration (`/admin/wallet` → Settings)
All rates are dynamic and stored in the `app_settings` table:

| Setting | Default | Meaning |
|---|---|---|
| `loyalty_earn_rate` | 0.1 | Points earned per ₹1 spent (0.1 = 1 pt per ₹10) |
| `loyalty_redeem_rate` | 0.1 | ₹ value of each point (0.1 = 10 pts = ₹1) |
| `loyalty_min_redeem_points` | 50 | Minimum points before redemption is allowed |
| `loyalty_max_redeem_percent` | 20 | Max % of order value that can be paid via points |
| `loyalty_enabled` | true | Toggle loyalty points program on/off |
| `wallet_enabled` | true | Toggle store wallet on/off |

Rate changes take effect on the next order (60-second cache).

---

# ⚡ Tech Stack

## Frontend
- Next.js
- React.js
- Tailwind CSS
- Axios

## Backend
- Next.js API Routes
- Node.js
- Express.js (Optional Scalable Backend)

## Database
- PostgreSQL

## Authentication
- JWT Authentication
- Protected Routes
- Role-Based Access

## Additional Services
- AWS (Image Uploads)
- Razorpay / Stripe
- REST APIs

---

