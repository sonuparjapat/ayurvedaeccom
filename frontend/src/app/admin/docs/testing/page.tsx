'use client'

import { useState } from 'react'
import {
  FlaskConical, ShoppingCart, Package, Users, BarChart3, Tag, Zap, Image,
  MessageSquare, Bell, Wallet, Star, MapPin, CreditCard, Truck,
  Settings, Shield, Search, Heart, RotateCcw, Download, ChevronRight,
  CheckCircle, AlertCircle, Info, BookOpen, Smartphone, Monitor,
  Globe, Lock, RefreshCw, Mail, Eye, Code2, FileText, Database,
  Home, Filter, ToggleLeft, Upload, Layers, PenTool, Percent,
  UserCheck, ClipboardList, XCircle, PhoneCall
} from 'lucide-react'

/* ═══════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════ */

type Platform = 'admin' | 'web' | 'mobile' | 'all'
type Severity = 'critical' | 'high' | 'medium' | 'low'

interface TestCase {
  id: string
  title: string
  steps: string[]
  expected: string
  where?: string
  severity: Severity
}

interface TestSection {
  id: string
  label: string
  icon: any
  platform: Platform[]
  color: string
  cases: TestCase[]
}

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */

const platformLabel: Record<Platform, { label: string; color: string }> = {
  admin:  { label: 'Admin',  color: '#6366f1' },
  web:    { label: 'Web App',color: '#0ea5e9' },
  mobile: { label: 'Mobile', color: '#10b981' },
  all:    { label: 'All',    color: '#f59e0b' },
}

const severityLabel: Record<Severity, { label: string; bg: string; text: string }> = {
  critical: { label: 'Critical', bg: '#fef2f2', text: '#dc2626' },
  high:     { label: 'High',     bg: '#fff7ed', text: '#ea580c' },
  medium:   { label: 'Medium',   bg: '#fefce8', text: '#ca8a04' },
  low:      { label: 'Low',      bg: '#f0fdf4', text: '#16a34a' },
}

/* ═══════════════════════════════════════════════
   ALL TEST SECTIONS
═══════════════════════════════════════════════ */

const SECTIONS: TestSection[] = [

  /* ── 1. AUTH ── */
  {
    id: 'auth', label: 'Authentication & Login', icon: Lock,
    platform: ['web', 'mobile'], color: '#6366f1',
    cases: [
      {
        id: 'auth-1', title: 'Email + Password Registration', severity: 'critical',
        steps: [
          'Go to web app → click Login button (top-right)',
          'Auth slide-in sheet opens from the right side',
          'Click "Sign Up" tab → fill Name, Email, Password',
          'Submit → OTP sent to email',
          'Enter OTP → account created',
        ],
        expected: 'Account created, user logged in, header shows user name/avatar. Auth sheet closes automatically.',
        where: 'Web: top-right header. Mobile: Profile tab.',
      },
      {
        id: 'auth-2', title: 'Email + Password Login', severity: 'critical',
        steps: [
          'Click Login → slide-in sheet opens',
          'Enter registered email + password',
          'Click Login',
        ],
        expected: 'User is logged in. Header updates (avatar, name). Wishlist, cart count refresh.',
        where: 'Web header & Mobile Profile tab.',
      },
      {
        id: 'auth-3', title: 'Auth Sheet Trigger from Wishlist', severity: 'high',
        steps: [
          'Logout → go to any category page',
          'Click heart icon on any product without logging in',
        ],
        expected: 'Auth slide-in sheet opens from the right. Does NOT navigate to /auth page.',
        where: 'Web: category/product pages.',
      },
      {
        id: 'auth-4', title: 'Auth Sheet Trigger from Support', severity: 'high',
        steps: ['Logout → go to /support page'],
        expected: 'Auth slide-in sheet opens automatically. Does NOT redirect to /login.',
        where: 'Web: /support page.',
      },
      {
        id: 'auth-5', title: 'Logout', severity: 'critical',
        steps: [
          'Mobile: Account tab → scroll down → Sign Out → confirm',
          'Web: Header → Logout button',
          'After logout: verify you land on HOME page — NOT on a login/auth screen',
          'Verify bottom nav Account tab now shows 👤 icon with orange "Login" badge',
          'Verify cart count is cleared',
        ],
        expected: 'Session cleared. Redirected to home page. Cart cleared. No old login screen shown. Mobile: Account tab avatar disappears, replaced with 👤 + Login badge.',
        where: 'Web & Mobile.',
      },
      {
        id: 'auth-5b', title: 'Mobile Bottom Nav Login State', severity: 'high',
        steps: [
          'Open app while NOT logged in',
          'Check bottom nav Account tab — should show 👤 with orange "Login" badge above it',
          'Login → check Account tab again — should show your initials in a circle avatar with green dot',
          'Account tab label should show your first name when logged in',
          'Active tab should show green pill indicator at the top of the tab',
        ],
        expected: 'Clear visual difference between logged-in (avatar + initials + green dot + first name) and logged-out (👤 + orange Login badge) states in the bottom nav.',
        where: 'Mobile: bottom nav bar.',
      },
      {
        id: 'auth-5c', title: 'Google OAuth Login — New User', severity: 'critical',
        steps: [
          'Web: Open /auth → click "Continue with Google" → pick a Gmail account NOT previously registered',
          'Mobile: Open auth screen → tap "Continue with Google" → pick a Gmail account NOT previously registered',
          'Verify login succeeds without any extra steps or email prompts',
        ],
        expected: 'Account auto-created. User logged in immediately. No "email is required" error. JWT stored. Profile shows Google account name.',
        where: 'Web & Mobile.',
      },
      {
        id: 'auth-5d', title: 'Google OAuth Login — Existing User', severity: 'high',
        steps: [
          'Register a user via email+password first',
          'Log out → click "Continue with Google" using the SAME email as that account',
          'Verify login merges to the existing account (same user ID, same orders)',
        ],
        expected: 'Existing account found and logged in. No duplicate user created. is_verified set to true.',
        where: 'Web & Mobile.',
      },
      {
        id: 'auth-5e', title: 'Add Address — All Type Values', severity: 'high',
        steps: [
          'Login → Account → Addresses → Add New Address',
          'Try type = "Home", "Work", "Other" (Title Case from dropdown)',
          'Save each',
        ],
        expected: 'All three types save successfully. No user_addresses_type_check constraint error. Backend lowercases type before insert.',
        where: 'Web & Mobile: Account → Addresses.',
      },
      {
        id: 'auth-5g', title: 'Keyboard Does Not Cover Input Fields', severity: 'critical',
        steps: [
          'Open any screen with a text input (Auth, Checkout, Support, Account modals, Review form, Filter modal)',
          'Tap a text input near the bottom of the screen',
          'Keyboard opens',
          'Verify the focused input is visible above the keyboard',
          'Type text — verify you can see what you are typing',
          'Test on both Android and iOS',
        ],
        expected: 'Focused input is always visible above the keyboard on both platforms. Content scrolls to keep the active input in view. No need to close keyboard to see what was typed.',
        where: 'Mobile: All screens with text inputs.',
      },
      {
        id: 'auth-5f', title: 'Mobile Navbar Shows Default Address', severity: 'high',
        steps: [
          'Login on mobile',
          'Note the address row under the logo in the top bar',
          'If no address: should show "Select address ›"',
          'Add an address and mark it default (or first address auto-used)',
          'Go back to home — address row should show "{City} {Pincode}"',
          'Tap the address row → should open Account screen on the Addresses tab directly',
        ],
        expected: 'Default address city+pincode shown in navbar (truncated). Tap navigates to /account?tab=Addresses.',
        where: 'Mobile: Home screen top bar.',
      },
      {
        id: 'auth-5h', title: 'Product Detail — In Cart State & Qty Update', severity: 'high',
        steps: [
          'Add any product to cart (e.g. qty 2)',
          'Navigate away, then open the same product\'s detail page',
          'Verify: qty stepper shows 2, a green "✓ IN CART (2)" pill appears next to "Quantity" label',
          'Verify: bottom CTA button is green and says "✓ In Cart"',
          'Tap the "✓ In Cart" button — should navigate to /cart (not add again)',
          'Go back to product detail, change qty to 3 with the + button',
          'Verify: hint text appears "Cart qty: 2 → Tap \'Update Cart\' to change to 3"',
          'Verify: bottom CTA turns amber and says "↻ Update Cart"',
          'Tap "↻ Update Cart" — success toast "Quantity updated!" should show',
          'Open cart and verify the product now shows qty 3',
        ],
        expected: 'Product detail clearly shows when item is in cart. Changing qty shows update hint + amber CTA. Tapping Update Cart changes quantity in cart without adding a duplicate.',
        where: 'Mobile: Product detail screen.',
      },
      {
        id: 'auth-5i', title: 'Mobile Order Review Modal', severity: 'high',
        steps: [
          'Place an order and mark it as Delivered (or use an existing delivered order)',
          'Open the order detail screen on mobile',
          'Tap the amber "Rate This Order" button',
          'Verify: modal opens showing all products from the order, each with star selector and comment field',
          'Select 4 stars for the first product, write a comment',
          'Tap "Add Photos" — verify gallery opens, select 1-2 photos',
          'Verify: photo thumbnails appear with ✕ remove button',
          'Tap "Submit Review" — verify spinner → "Review submitted!" toast → green "✅ Review submitted!" confirmation in card',
          'Close modal, open product detail for that product — verify review appears with your name and photos',
          'Reopen the review modal — existing rating and comment should be pre-filled',
        ],
        expected: 'Users can rate each product individually with star rating, comment, and optional photos directly from the order detail screen. Existing reviews pre-filled on reopen. Submitted reviews visible on product page with reviewer name.',
        where: 'Mobile: Order detail screen → Rate This Order button.',
      },
      {
        id: 'auth-5j', title: 'Order Timeline Events and Timestamps', severity: 'medium',
        steps: [
          'Open any non-cancelled order detail on mobile',
          'Look at the "Order Progress" section',
          'Verify: completed steps show a date and time (e.g., "15 Jul · 03:45 PM")',
          'Verify: timestamps are clearly readable (not too faint)',
          'Verify: current active step shows "Current Status" text in gold',
        ],
        expected: 'Each completed timeline step shows its timestamp. Text is visible at 60% white opacity on the dark background.',
        where: 'Mobile: Order detail screen → Order Progress card.',
      },
      {
        id: 'auth-5k', title: 'Web Order Review Modal — Selected Order Only', severity: 'high',
        steps: [
          'Log in on web, go to Account → Orders',
          'Find a delivered order with 2+ items, click "Review"',
          'Verify: modal shows ONLY the items from that specific order, not items from other orders',
          'Rate each product and submit',
          'Click Review on a different delivered order',
          'Verify: modal shows only that order\'s items with its own pre-existing reviews loaded',
        ],
        expected: 'Review modal shows exactly the items from the selected order. No bleed-through from other orders.',
        where: 'Web: Account → Orders tab → Review button.',
      },
      {
        id: 'auth-5l', title: 'Mobile WriteReviewModal — Sticky Header/Footer', severity: 'high',
        steps: [
          'Open mobile app, go to a delivered order with 3+ products',
          'Tap "Rate This Order" — review sheet opens',
          'Scroll down: verify X close button in header stays visible at top',
          'Scroll down: verify "Skip for Now" stays visible at bottom',
          'Tap X button: sheet closes',
          'Tap "Rate This Order" again: previously rated items should show pre-filled stars/comments',
          'Previously uploaded images should show in each item card with ✕ remove buttons',
        ],
        expected: 'Header (X button) and footer (Skip for Now) always visible regardless of scroll. Data pre-fills from existing reviews.',
        where: 'Mobile: Order detail → Rate This Order button.',
      },
      {
        id: 'auth-5m', title: 'Mobile Product Q&A Tab — No Review Bleed', severity: 'high',
        steps: [
          'Open any product detail page',
          'Tap "Reviews" tab → only review content visible',
          'Tap "Q&A" tab → only Q&A content visible (no reviews)',
          'Tap "Description" tab → only description visible',
        ],
        expected: 'Each tab shows exclusively its own content. Selecting Q&A does not show the reviews section.',
        where: 'Mobile: Product detail → tab bar.',
      },
      {
        id: 'auth-5n', title: 'Invoice Download (Mobile)', severity: 'high',
        steps: [
          'Open an order where admin has generated invoice → pdf_url is set',
          'Verify: "📄 Invoice" button visible in order header',
          'Tap Invoice: opens PDF in browser/viewer',
          'Open an order without pdf_url → Invoice button should NOT appear',
        ],
        expected: 'Invoice button appears only when admin has generated the PDF. Tapping opens Linking.openURL to the S3 PDF.',
        where: 'Mobile: Order detail screen header.',
      },
      {
        id: 'auth-5p', title: 'Product Detail Review — Image Upload + Fullscreen', severity: 'high',
        steps: [
          'Open any product detail page → tap Reviews tab',
          'If already reviewed: stars/comment/images pre-filled; title shows "Edit Your Review"',
          'Tap "📷 Add Photos" → select 1–5 images from gallery',
          'Images appear as thumbnails; tap thumbnail → opens fullscreen viewer (pinch to zoom)',
          'Tap ✕ on thumbnail → removes image',
          'Submit review → images uploaded to S3 alongside rating/comment',
          'In the reviews list below: tap any review image → opens fullscreen viewer',
        ],
        expected: 'Review form supports image upload and editing. All review images viewable fullscreen. Pre-fills from existing review on page load.',
        where: 'Mobile: Product detail → Reviews tab.',
      },
      {
        id: 'auth-5q', title: 'Product Detail — Related Products', severity: 'medium',
        steps: [
          'Open any product detail page',
          'Scroll to bottom (past FAQ / Q&A section)',
          'Verify "You May Also Like" horizontal scroll section appears',
          'Tap a related product card → navigates to that product\'s detail page',
        ],
        expected: 'Related products shown as horizontal cards with image, name, price, rating. Empty if no related products exist.',
        where: 'Mobile: Product detail → scroll to bottom.',
      },
      {
        id: 'auth-5o', title: 'Razorpay Mobile Payment — No Page Not Found', severity: 'critical',
        steps: [
          'Add product → checkout → select Online Payment',
          'Razorpay sheet opens in Chrome Custom Tab',
          'Complete payment with test card (4111 1111 1111 1111)',
          'Verify: app returns to checkout/orders screen (NOT "page not found")',
          'Check order status → payment_status: paid',
        ],
        expected: 'After payment, Chrome follows the backend HTTP 302 redirect back to the app. No "page not found" error.',
        where: 'Mobile: Checkout → Online Payment.',
      },
      {
        id: 'auth-6', title: 'Admin Login', severity: 'critical',
        steps: [
          'Go to /auth → enter admin email + password',
          'Click Login',
        ],
        expected: 'Redirected to /admin/dashboard.',
        where: 'Admin panel.',
      },
    ],
  },

  /* ── 2. CATEGORIES ── */
  {
    id: 'categories', label: 'Category Management', icon: Layers,
    platform: ['admin', 'web', 'mobile'], color: '#0ea5e9',
    cases: [
      {
        id: 'cat-1', title: 'Create Parent Category', severity: 'critical',
        steps: [
          'Admin → Categories → Add Category',
          'Fill Name, Slug, Description',
          'Leave Parent Category empty (top-level)',
          'Set GST Rate (e.g. 18%)',
          'Upload image → Save',
        ],
        expected: 'Category appears in listing with no parent. Shows in web header nav and mobile home screen categories.',
        where: 'Admin: /admin/categories | Web: header nav | Mobile: Home screen.',
      },
      {
        id: 'cat-2', title: 'Create Sub-Category', severity: 'high',
        steps: [
          'Admin → Categories → Add Category',
          'Fill Name, select a Parent Category from dropdown',
          'Save',
        ],
        expected: 'Sub-category created. Visible under parent. Not shown in web header (only parent categories shown there).',
        where: 'Admin: category list.',
      },
      {
        id: 'cat-3', title: 'Category Page (Web)', severity: 'critical',
        steps: [
          'Click any category in web header or footer',
          'URL should be /category/[slug]',
        ],
        expected: 'Products listed. Includes products from ALL child categories (recursive). Filters work.',
        where: 'Web: /category/[slug].',
      },
      {
        id: 'cat-4', title: 'Category Page (Mobile)', severity: 'high',
        steps: [
          'Open mobile app → tap a category on Home',
          'Or tap filter on product list',
        ],
        expected: 'Products from that category load. Sub-category products included.',
        where: 'Mobile: Product list screen.',
      },
      {
        id: 'cat-5', title: 'Edit / Delete Category', severity: 'medium',
        steps: [
          'Admin → Categories → Edit button',
          'Change name/slug → Save',
          'Try Delete on a category with no products',
        ],
        expected: 'Changes reflect on web & mobile after save.',
        where: 'Admin only.',
      },
    ],
  },

  /* ── 3. BRANDS ── */
  {
    id: 'brands', label: 'Brand Management', icon: Tag,
    platform: ['admin', 'web'], color: '#8b5cf6',
    cases: [
      {
        id: 'brand-1', title: 'Create Brand with Logo', severity: 'high',
        steps: [
          'Admin → Brands → Add Brand',
          'Fill Name, Description',
          'Upload logo image from local file',
          'Set Sort Order → Save',
        ],
        expected: 'Brand created. Logo visible in brand list. Brand available in product creation dropdown.',
        where: 'Admin: /admin/brands.',
      },
      {
        id: 'brand-2', title: 'Brand Listing & Search', severity: 'medium',
        steps: [
          'Admin → Brands',
          'Type in search box',
        ],
        expected: 'List filters in real time. Pagination works.',
        where: 'Admin: /admin/brands.',
      },
      {
        id: 'brand-3', title: 'Brand on Product', severity: 'medium',
        steps: [
          'Create/edit a product → select Brand from dropdown',
          'Save → view product on web app',
        ],
        expected: 'Brand name visible on product detail page.',
        where: 'Web: product detail page.',
      },
    ],
  },

  /* ── 4. PRODUCTS ── */
  {
    id: 'products', label: 'Product Management', icon: Package,
    platform: ['admin', 'web', 'mobile'], color: '#f59e0b',
    cases: [
      {
        id: 'prod-1', title: 'Create Full Product', severity: 'critical',
        steps: [
          'Admin → Products → Add Product',
          'Fill: Name, Slug, Description, Price, Compare Price, SKU',
          'Select Category (with child allowed), Brand',
          'Set Stock Qty, Unit (e.g. 500g)',
          'Add Tags (comma separated), Highlights, Ingredients, Benefits',
          'Add Usage Instructions, Storage, Warnings',
          'Fill SEO: Meta Title, Meta Description, Focus Keyword',
          'Add FAQs (JSON or WYSIWYG)',
          'Set Min/Max Order Qty',
          'Upload product images',
          'Set Status = Active → Save',
        ],
        expected: 'Product visible in admin list AND on web app product page AND mobile app.',
        where: 'Admin: /admin/products | Web: /product/[slug] | Mobile: Product screen.',
      },
      {
        id: 'prod-2', title: 'Product Page URL (Slug)', severity: 'critical',
        steps: [
          'After creating product, note the slug',
          'Navigate to /product/[slug] on web',
          'Also try /product/[numeric-id] on web',
        ],
        expected: 'Both slug and numeric ID URLs work. Canonical URL shows slug-based URL.',
        where: 'Web: /product/[slug] and /product/[id].',
      },
      {
        id: 'prod-3', title: 'Product Images', severity: 'high',
        steps: [
          'Admin → Edit product → upload 3+ images from local',
          'Check the product page on web',
        ],
        expected: 'All images shown in gallery. Thumbnails clickable. Main image swaps. S3 URLs working.',
        where: 'Web & Mobile: product detail.',
      },
      {
        id: 'prod-4', title: 'Product Status (Active/Inactive)', severity: 'high',
        steps: [
          'Admin → set product Status = Inactive → Save',
          'Try accessing product URL on web',
        ],
        expected: 'Inactive product NOT visible in product listing. Direct URL may show 404 or redirect.',
        where: 'Web & Mobile.',
      },
      {
        id: 'prod-5', title: 'Deactivate / Soft-Delete Product', severity: 'high',
        steps: [
          'Admin → Products → click Delete icon on a product',
          'Confirm deletion',
        ],
        expected: 'Product status set to "inactive" (NOT deleted from DB). Product disappears from listing.',
        where: 'Admin: /admin/products.',
      },
      {
        id: 'prod-6', title: 'Product Search', severity: 'critical',
        steps: [
          'Web: type at least 2 characters in header search bar',
          'Verify: dropdown shows matching products AND matching categories',
          'Click a product result → should land on correct product page',
          'Click a category result → should land on correct category page',
          'Mobile: tap search icon → type keyword → verify suggestions appear',
          'Mobile: tap a product → verify navigation to product screen',
          'Test with product name, category name, and a tag keyword',
        ],
        expected: 'Matching products (up to 8) and categories (up to 4) appear within 400 ms. Images, names, and prices display correctly. Navigation works for both product and category results.',
        where: 'Web: header search dropdown | Mobile: Search screen (search icon in bottom nav).',
      },
      {
        id: 'prod-7', title: 'Product Tags Display', severity: 'medium',
        steps: [
          'Admin: add tags "ashwagandha, organic, vegan" → Save',
          'View product on web app',
        ],
        expected: 'Tags displayed as pills on product page. No double quotes or brackets visible.',
        where: 'Web: /product/[slug].',
      },
      {
        id: 'prod-8', title: 'FAQs on Product Page', severity: 'medium',
        steps: [
          'Admin → Edit product → add FAQs in JSON format or WYSIWYG',
          'Save → open product on web',
          'Open same product on mobile app',
        ],
        expected: 'Web: FAQ accordion visible in Description tab. Mobile: FAQs shown inside Description tab (NOT outside any tab). Structured data (JSON-LD FAQPage) in web page source.',
        where: 'Web: /product/[slug] | Mobile: Product Detail → Description tab.',
      },
      {
        id: 'prod-10', title: 'Product Dimensions Display', severity: 'medium',
        steps: [
          'Admin → Edit product → fill length_cm=10, width_cm=8, height_cm=12 → Save',
          'Open product on web',
          'Open product on mobile app',
        ],
        expected: 'Web: dimensions shown as "10 × 8 × 12 cm" next to the weight line with a package icon. Mobile: same "📦 10 × 8 × 12 cm" displayed in the weight row. If dimensions are empty, neither platform shows the field.',
        where: 'Web: /product/[slug] (right side info panel) | Mobile: Product Detail screen.',
      },
      {
        id: 'prod-11', title: 'Safety Tags as Certification Badges', severity: 'medium',
        steps: [
          'Admin → Edit product → add safety_tags: ["Vegan", "Gluten Free", "Lab Tested"] → Save',
          'Open product on web and mobile',
        ],
        expected: 'Web: green badge chips with tick mark in the safety section. Mobile: same green pill chips under "Safety & Certifications" label.',
        where: 'Web: /product/[slug] | Mobile: Product Detail.',
      },
      {
        id: 'prod-12', title: 'Bulk Upload CSV — Dimensions + Specs + FAQs', severity: 'high',
        steps: [
          'Admin → Products → Bulk Upload → Download Template',
          'Fill length_cm=10, width_cm=8, height_cm=12 for a product row',
          'Fill specifications as JSON: [{"key":"Shelf Life","value":"24 months"}]',
          'Fill faqs as JSON: [{"question":"Is it organic?","answer":"Yes."}]',
          'Fill safety_tags as pipe-separated: Vegan|Gluten Free',
          'Upload CSV → Validate → Import',
        ],
        expected: 'Product created with all fields. Dimensions visible on product page. Specs table populated. FAQ accordion shows. Safety badges show.',
        where: 'Admin: /admin/products/bulk-upload → Web: /product/[slug].',
      },
      {
        id: 'prod-9', title: 'Related Products', severity: 'low',
        steps: [
          'View any product that has related products set in admin',
        ],
        expected: '"Related Products" section visible at bottom of product page.',
        where: 'Web & Mobile: product detail.',
      },
    ],
  },

  /* ── 5. VARIANTS ── */
  {
    id: 'variants', label: 'Product Variants', icon: ToggleLeft,
    platform: ['admin', 'web', 'mobile'], color: '#06b6d4',
    cases: [
      {
        id: 'var-1', title: 'Create Variant for Product', severity: 'high',
        steps: [
          'Admin → Variants → Add Variant',
          'Select Product, set Variant Name (e.g. "500g"), Price, Stock',
          'Save',
        ],
        expected: 'Variant appears on product page as a selectable option.',
        where: 'Web & Mobile: product detail.',
      },
      {
        id: 'var-2', title: 'Price Changes on Variant Select', severity: 'high',
        steps: [
          'Web: open product page → click a variant option',
        ],
        expected: 'Price on page updates to variant price. Cart adds the selected variant.',
        where: 'Web & Mobile: product page.',
      },
    ],
  },

  /* ── 6. CART ── */
  {
    id: 'cart', label: 'Cart & Quantity', icon: ShoppingCart,
    platform: ['web', 'mobile'], color: '#f97316',
    cases: [
      {
        id: 'cart-1', title: 'Add to Cart', severity: 'critical',
        steps: [
          'Open any active product → click "Add to Cart"',
          'Go to /cart (web) or Cart tab (mobile)',
        ],
        expected: 'Product appears in cart. Qty = 1. Price shown correctly.',
        where: 'Web: /cart | Mobile: Cart tab.',
      },
      {
        id: 'cart-2', title: 'Update Cart Quantity', severity: 'critical',
        steps: [
          'Cart page → click + button to increase qty',
          'Click − to decrease',
        ],
        expected: 'Qty updates. Total price recalculates. No server error. No "updated_at" column error in backend.',
        where: 'Web & Mobile: Cart page.',
      },
      {
        id: 'cart-3', title: 'Flash Sale Price in Cart', severity: 'critical',
        steps: [
          'Create a flash sale on a product (Admin)',
          'Add that product to cart',
          'Check cart',
        ],
        expected: 'Cart shows flash sale price (lower price). "⚡ Flash Sale" badge visible. Original price struck through.',
        where: 'Web: /cart | Mobile: Cart tab.',
      },
      {
        id: 'cart-4', title: 'Min/Max Order Quantity', severity: 'medium',
        steps: [
          'Set min_order_qty=2, max_order_qty=5 on a product (Admin)',
          'Try to add 1 qty → cart should enforce min',
          'Try to set qty to 10 → cart should enforce max',
        ],
        expected: 'Qty cannot go below min or above max.',
        where: 'Web & Mobile: Cart.',
      },
      {
        id: 'cart-5', title: 'Remove Item from Cart', severity: 'high',
        steps: [
          'Cart page → click Remove/Trash icon',
        ],
        expected: 'Item removed instantly. Cart total updates.',
        where: 'Web & Mobile: Cart.',
      },
      {
        id: 'cart-6', title: 'Apply Coupon', severity: 'critical',
        steps: [
          'Admin → Coupons → create a coupon (e.g. SAVE10, 10% off, min order 200)',
          'Web → go to cart → enter coupon code → Apply',
        ],
        expected: 'Discount applied to cart total. Coupon name + discount amount shown.',
        where: 'Web & Mobile: Cart/Checkout.',
      },
    ],
  },

  /* ── 7. CHECKOUT & ORDERS ── */
  {
    id: 'checkout', label: 'Checkout & Order Placement', icon: CreditCard,
    platform: ['web', 'mobile'], color: '#dc2626',
    cases: [
      {
        id: 'ord-0a', title: 'Reorder — Must Add Items to Cart (not 500)', severity: 'critical',
        steps: [
          'Login as customer who has past orders',
          'Go to My Account → Orders',
          'Click "Reorder" on any completed/cancelled order',
          'Check toast: should say "X item(s) added to cart"',
          'Open cart: verify items appear with correct quantities (capped at max_order_qty)',
          'If item already in cart: verify quantity MERGES (adds) up to max_order_qty, does not reset',
        ],
        expected: 'No 500 error. Items added. Existing cart items not wiped. Quantities respect max_order_qty.',
        where: 'Web: My Account → Orders → Reorder button.',
      },
      {
        id: 'ord-0', title: 'Checkout UI — Full Width & Payment Cards', severity: 'medium',
        steps: [
          'Open /checkout on a wide desktop (1400px+)',
          'Verify layout stretches to full width (no narrow 960px constraint)',
          'Step 2 (Payment): verify COD and Online cards appear as tall horizontal rows (icon left, text center, check right) — not small vertical squares',
          'Click COD card: confirm gold selection ring animates and gold check appears',
          'Click Online card: confirm smooth card switch',
          'Resize to < 1100px: verify layout collapses to single column',
        ],
        expected: 'Full-width 2-column grid (max 1440px). Horizontal payment cards with animated selection. Responsive collapse below 1100px.',
        where: 'Web: /checkout (Step 2 — Payment Method).',
      },
      {
        id: 'ord-1', title: 'Place COD Order', severity: 'critical',
        steps: [
          'Add product to cart → Proceed to Checkout',
          'Fill/Select delivery address',
          'Choose "Cash on Delivery"',
          'Confirm order',
          'Check order in Admin → Orders',
        ],
        expected: 'Order created with payment_status = "pending" (NOT "paid"). Invoice number generated. Order visible in /orders and Admin.',
        where: 'Web & Mobile: Checkout → Order success. Admin: /admin/orders.',
      },
      {
        id: 'ord-1b', title: 'COD → Delivered → payment_status auto-paid', severity: 'critical',
        steps: [
          'Place a COD order (payment_status should be "pending")',
          'Admin → Orders → update status to "Delivered" (status 5)',
          'Check the order payment_status in Admin',
        ],
        expected: 'payment_status auto-changes from "pending" to "paid" when COD order is marked Delivered.',
        where: 'Admin: /admin/orders.',
      },
      {
        id: 'ord-1c', title: 'COD Order Cancellation restores inventory', severity: 'high',
        steps: [
          'Place a COD order',
          'Note product inventory count before',
          'Admin → cancel the order',
          'Check product inventory after',
        ],
        expected: 'Inventory restored even though payment_status was "pending". Stock should be back to pre-order count.',
        where: 'Admin: /admin/orders (cancel action).',
      },
      {
        id: 'ord-2', title: 'Place Razorpay Order', severity: 'critical',
        steps: [
          'Add product → Checkout → choose "Online Payment"',
          'Razorpay modal opens',
          'Use test card: 4111 1111 1111 1111, CVV 123, any future date',
          'Complete payment',
        ],
        expected: 'Payment successful. Order created with payment_status = paid. Redirected to order success.',
        where: 'Web & Mobile: Checkout.',
      },
      {
        id: 'ord-3', title: 'Flash Price Applied to Order', severity: 'critical',
        steps: [
          'Active flash sale on product',
          'Add to cart → checkout → place order',
          'Check order in Admin',
        ],
        expected: 'Order total uses flash sale price (NOT regular price). Discount visible on invoice.',
        where: 'Admin: /admin/orders/[id] | Web: /orders.',
      },
      {
        id: 'ord-4', title: 'Pincode Serviceability Check', severity: 'high',
        steps: [
          'Admin → Pincodes → add/remove a pincode',
          'Web checkout → enter that pincode in address',
          'Also test: Admin → Pincodes search with ?search=rewari (or any city name)',
        ],
        expected: 'Serviceable pincode: delivery option shows. Non-serviceable: error message shown. Search returns filtered results without 500 error.',
        where: 'Web & Mobile: Checkout address step. Admin: /admin/pincodes.',
      },
      {
        id: 'ord-5', title: 'Order Listing (User)', severity: 'high',
        steps: [
          'Login → go to /orders (web) or Profile → Orders (mobile)',
        ],
        expected: 'All user orders listed with status, amount, date. Clickable to see details.',
        where: 'Web: /orders | Mobile: Profile → Orders.',
      },
    ],
  },

  /* ── 8. ADMIN ORDERS ── */
  {
    id: 'admin-orders', label: 'Admin: Order Management', icon: Truck,
    platform: ['admin'], color: '#7c3aed',
    cases: [
      {
        id: 'adord-1', title: 'View All Orders', severity: 'critical',
        steps: [
          'Admin → Orders',
          'Check listing: invoice no, customer name, amount, status',
        ],
        expected: 'Orders listed with filters (status, date). Pagination works.',
        where: 'Admin: /admin/orders.',
      },
      {
        id: 'adord-2', title: 'Update Order Status', severity: 'critical',
        steps: [
          'Admin → Orders → click an order',
          'Change status to "Processing" → "Shipped" → "Delivered"',
        ],
        expected: 'Status updated. Customer gets push notification on mobile (if token registered). Status log entry created.',
        where: 'Admin: order detail.',
      },
      {
        id: 'adord-3', title: 'Add Tracking — Correct Flow + Real-time Notification', severity: 'high',
        steps: [
          'Admin: move order to "Shipped" (status 3)',
          'Click the Truck 🚚 icon → enter Courier Name + Tracking Number → Save',
          'Then try to move to "Out for Delivery" — should succeed',
          'Try "Out for Delivery" WITHOUT tracking → should fail with clear error',
          'Web: My Orders → Track Order button → should expand inline panel with courier + tracking (API: GET /orders/:id/timeline)',
          'Mobile: order detail → Progress section + tracking info card (same API)',
          'Verify Network tab shows /api/orders/:id/timeline — NOT /api/shop/orders/:id/timeline',
          'Real-time check (web): open Account → Orders in another tab while logged in as the customer. When admin saves tracking, a toast notification should appear immediately (no refresh)',
          'Real-time check (mobile): keep order detail open on device. Admin saves tracking → Alert.alert should appear with courier name + "Track Order" button within seconds',
        ],
        expected: 'Tracking saved at status 3. Status 3→4 blocked without tracking. Customer sees tracking inline. Real-time socket event fires to customer on both web and mobile without any page refresh.',
        where: 'Admin: /admin/orders. Web: Account → My Orders. Mobile: order detail.',
      },
      {
        id: 'adord-3b', title: 'Tracking Lookup by Tracking Number', severity: 'medium',
        steps: [
          'Admin → Orders page → "Tracking Number Lookup" card at top',
          'Enter a tracking number (partial or full) → press Enter or Search',
        ],
        expected: 'Matching orders appear with customer name, status, courier, and amount. Empty state shows error toast.',
        where: 'Admin: /admin/orders.',
      },
      {
        id: 'adord-4', title: 'Invoice Generate + Download (GST Compliant)', severity: 'high',
        steps: [
          'Admin → Invoices → find an eligible order → click Generate',
          'After generation, click Download PDF',
          'Verify: delivery charge and platform fee appear correctly in the PDF (not 0 or blank)',
          'Verify: seller GSTIN shown in PDF header',
          'Verify: each product line has HSN/SAC code',
          'For intra-state order (buyer state = seller state): PDF shows CGST% + CGST Amt AND SGST% + SGST Amt columns',
          'For inter-state order (buyer state ≠ seller state): PDF shows IGST% + IGST Amt column',
          'Verify: tax summary at bottom shows correct CGST+SGST or IGST totals',
          'Verify: Amount in Words shows Indian format (e.g., "One Thousand Two Hundred Fifty Rupees Only")',
          'Verify: bank details appear in PDF (if set in Company Settings)',
          'Verify: FSSAI licence number appears in PDF footer (if set in Company Settings)',
          'Customer: /orders/[id] → "Download Invoice" button (only appears after admin generates)',
        ],
        expected: 'PDF is fully GST Rule 46 compliant — shows CGST+SGST or IGST breakdown per line, seller GSTIN, HSN codes, amount in words, bank details, FSSAI. Download works without 500 error.',
        where: 'Admin: /admin/invoices. Web: /orders/[id].',
      },
      {
        id: 'adord-4b', title: 'B2B Invoice — Buyer GSTIN on PDF', severity: 'high',
        steps: [
          'Create/find an order that has buyer_gstin set (e.g. "27ABCDE1234F1Z5")',
          'Admin → Invoices → Generate invoice for that order',
          'Download PDF',
          'Check the buyer address section of the PDF',
          'Also verify orders.is_igst is stamped: same state = false, different state = true',
        ],
        expected: 'PDF shows buyer GSTIN in teal/green below the shipping address. is_igst column on orders table is set correctly (intra-state = false, inter-state = true). Voided invoices still show GSTIN if present.',
        where: 'Admin: /admin/invoices | DB: orders.is_igst.',
      },
      {
        id: 'adord-5', title: 'Filter Orders by Status/Date', severity: 'medium',
        steps: [
          'Admin → Orders → use status filter dropdown',
          'Use date range filter',
        ],
        expected: 'List updates correctly. Count matches filter.',
        where: 'Admin: /admin/orders.',
      },
    ],
  },

  /* ── 9. RETURNS & REFUNDS ── */
  {
    id: 'returns', label: 'Returns & Refunds', icon: RotateCcw,
    platform: ['admin', 'web', 'mobile'], color: '#ef4444',
    cases: [
      {
        id: 'ret-1', title: 'User Initiates Return (7-day window)', severity: 'high',
        steps: [
          'Login → go to a delivered order (must be within 7 days of delivery)',
          'Click "Return" → fill reason → submit',
          'Try on an order older than 7 days → should be blocked',
        ],
        expected: 'Return request created within window. Request blocked if >7 days since delivered_at. Visible in Admin → Returns.',
        where: 'Web & Mobile: Order detail.',
      },
      {
        id: 'ret-2', title: 'Admin Approve Return → Wallet Refund', severity: 'high',
        steps: [
          'Admin → Returns → find a Return Requested order',
          'Click Approve (with wallet credit enabled)',
          'Check customer wallet balance increased',
          'Then click "Complete Refund" → order goes to Refunded (status 9)',
        ],
        expected: 'Wallet credited on approval. Razorpay refund triggered on Complete Refund for online orders. COD: marked cod_manual.',
        where: 'Admin: /admin/returns.',
      },
      {
        id: 'ret-3', title: 'Admin Reject Return', severity: 'medium',
        steps: [
          'Admin → Returns → find a Return Requested order',
          'Click Reject → provide reason',
        ],
        expected: 'Order reverts to Delivered (status 5). Reason stored in return_reject_reason (not cancel_reason). Customer sees rejection.',
        where: 'Admin: /admin/returns.',
      },
      {
        id: 'ret-4', title: 'Cancel Online Paid Order → Auto Refund', severity: 'critical',
        steps: [
          'Place an online order and complete Razorpay payment',
          'Before it ships → cancel the order from My Orders',
          'Check: does refund appear in Razorpay dashboard?',
          'Check: payment_status → "refunded" on the order',
        ],
        expected: 'Auto Razorpay refund triggered at cancellation. If Razorpay call fails → refund_status="failed" (admin manual action needed).',
        where: 'Web: Account → My Orders → Cancel. Admin: /admin/orders (check refund_status).',
      },
    ],
  },

  /* ── 10. FLASH SALES ── */
  {
    id: 'flash', label: 'Flash Sales', icon: Zap,
    platform: ['admin', 'web', 'mobile'], color: '#f59e0b',
    cases: [
      {
        id: 'flash-1', title: 'Create Flash Sale', severity: 'critical',
        steps: [
          'Admin → Flash Sales → Add Flash Sale',
          'Set Name, Start Date, End Date',
          'Upload banner image (file OR URL)',
          'Add products with Discount Type (% or flat) + Discount Value',
          'Set Status = Active → Save',
        ],
        expected: 'Flash sale active. Banner appears on web home page. Flash price shown on product pages.',
        where: 'Web: home page banner | Mobile: Home → Flash Sale section.',
      },
      {
        id: 'flash-2', title: 'Flash Sale Price on Product Page', severity: 'critical',
        steps: [
          'Open a product that is in an active flash sale',
        ],
        expected: '⚡ "Flash Sale" badge visible. Flash price shown. Original price struck-through. Countdown timer if applicable.',
        where: 'Web: /product/[slug] | Mobile: Product screen.',
      },
      {
        id: 'flash-3', title: 'Flash Sale Banner Image', severity: 'high',
        steps: [
          'Admin → Flash Sales → edit a sale → upload banner image',
          'Check web home page',
        ],
        expected: 'Banner image shows correctly. Clicking banner takes to flash sale product.',
        where: 'Web: home page.',
      },
      {
        id: 'flash-4', title: 'Offers Page', severity: 'medium',
        steps: [
          'Web → navigate to /offers',
        ],
        expected: 'Shows all active flash sales with countdown timers. Shows all active coupons (copyable). Shows bundles.',
        where: 'Web: /offers.',
      },
      {
        id: 'flash-5', title: 'Expired Flash Sale', severity: 'medium',
        steps: [
          'Set end date to past → check product page',
        ],
        expected: 'Flash price no longer applied. Regular price shown. No "⚡" badge.',
        where: 'Web & Mobile: product detail.',
      },
      {
        id: 'flash-6', title: 'Max Uses Enforcement', severity: 'critical',
        steps: [
          'Admin → Flash Sales → Create sale with Max Uses = 2',
          'Add a product with Stock Limit = 3',
          'Place 2 orders with that product at flash price',
          'Try placing a 3rd order',
        ],
        expected: 'First 2 orders get flash sale price. After 2 orders, flash sale no longer applies — 3rd order charged at regular price. Admin shows "Used: 2 / 2".',
        where: 'Web & Mobile: Cart → Checkout. Admin: /admin/flash-sales.',
      },
      {
        id: 'flash-7', title: 'Per-Product Stock Limit', severity: 'high',
        steps: [
          'Create flash sale with product Stock Limit = 1',
          'Place an order for 1 unit at flash price',
          'Add same product to cart again → checkout',
        ],
        expected: 'First order gets flash price. Second order: flash price not applied (stock_limit reached). Progress bar in admin shows 1/1 sold.',
        where: 'Web & Mobile: Cart → Checkout. Admin: flash sale product row.',
      },
      {
        id: 'flash-8', title: 'Flash Sale used_count increments', severity: 'high',
        steps: [
          'Admin → Flash Sales → note current "Used:" count',
          'Place one order that uses the flash sale',
          'Refresh Admin → Flash Sales',
        ],
        expected: '"Used:" count increases by 1 after each order. sold_count on each product increases by qty ordered.',
        where: 'Admin: /admin/flash-sales.',
      },
    ],
  },

  /* ── 11. COUPONS ── */
  {
    id: 'coupons', label: 'Coupons', icon: Percent,
    platform: ['admin', 'web', 'mobile'], color: '#10b981',
    cases: [
      {
        id: 'coup-1', title: 'Create Global Percentage Coupon', severity: 'critical',
        steps: [
          'Admin → Coupons → Add Coupon',
          'Leave "For User" empty (global coupon)',
          'Type = Percentage, Value = 15, Min Order = 500',
          'Set code = SAVE15, expiry date in future, Status = Active → Save',
          'Go to checkout with cart < ₹500 → verify locked chip shows "Add ₹X more to unlock"',
          'Add items to reach ₹500 → verify chip becomes clickable → click chip → verify 15% discount',
        ],
        expected: 'Chip state changes as cart total crosses min_order threshold. Discount applied correctly.',
        where: 'Admin: /admin/coupons | Web & Mobile: Checkout.',
      },
      {
        id: 'coup-2', title: 'User-Specific Coupon', severity: 'critical',
        steps: [
          'Admin → Coupons → Add Coupon → search a specific user by email in "For User" field',
          'Create coupon VIPUSER50, flat ₹50 off, assign to that user',
          'Log in as that user → checkout → verify VIPUSER50 chip appears and applies',
          'Log in as a different user → verify VIPUSER50 chip does NOT appear',
          'Try typing VIPUSER50 as another user → verify error "not valid for your account"',
        ],
        expected: 'User-specific coupons are visible and usable only by the assigned user.',
        where: 'Admin: /admin/coupons | Web & Mobile: Checkout.',
      },
      {
        id: 'coup-3', title: 'Create Flat Discount Coupon', severity: 'high',
        steps: [
          'Admin → Coupons → flat discount ₹50 off, min order ₹200',
        ],
        expected: 'At checkout with cart > ₹200 → ₹50 deducted from total.',
        where: 'Web & Mobile: Checkout.',
      },
      {
        id: 'coup-4', title: 'Invalid / Expired Coupon', severity: 'high',
        steps: [
          'Set coupon expiry to past',
          'Try applying at checkout',
        ],
        expected: 'Error message: "Coupon expired" or "Invalid coupon code". Discount NOT applied.',
        where: 'Web & Mobile: Checkout.',
      },
      {
        id: 'coup-5', title: 'One Coupon Per Order', severity: 'high',
        steps: [
          'Apply one coupon at checkout',
          'Try to apply another coupon before the first is removed',
        ],
        expected: 'Only one coupon can be active at a time. Must remove current coupon before applying another.',
        where: 'Web & Mobile: Checkout.',
      },
    ],
  },

  /* ── 12. BUNDLES ── */
  {
    id: 'bundles', label: 'Product Bundles', icon: Package,
    platform: ['admin', 'web'], color: '#8b5cf6',
    cases: [
      {
        id: 'bun-1', title: 'Create Bundle', severity: 'medium',
        steps: [
          'Admin → Bundles → Add Bundle',
          'Select 2+ products, set bundle price (lower than sum)',
          'Save',
        ],
        expected: 'Bundle appears on /offers page and optionally on product pages.',
        where: 'Web: /offers.',
      },
    ],
  },

  /* ── 13. BANNERS ── */
  {
    id: 'banners', label: 'Banners', icon: Image,
    platform: ['admin', 'web'], color: '#0ea5e9',
    cases: [
      {
        id: 'ban-1', title: 'Create Banner (File Upload)', severity: 'high',
        steps: [
          'Admin → Banners → Add Banner',
          'Toggle to "Upload File" mode → select image from local',
          'Set link URL, position, sort order → Save',
        ],
        expected: 'Banner uploaded to S3. Image visible in banner list. Shows on home page in correct position.',
        where: 'Web: home page.',
      },
      {
        id: 'ban-2', title: 'Create Banner (URL)', severity: 'medium',
        steps: [
          'Admin → Banners → Add Banner',
          'Toggle to "URL" mode → paste image URL → Save',
        ],
        expected: 'Banner created with URL. Displays on home page.',
        where: 'Web: home page.',
      },
      {
        id: 'ban-3', title: 'Banner Order / Visibility', severity: 'medium',
        steps: [
          'Set sort_order on multiple banners',
          'Toggle active/inactive on a banner',
        ],
        expected: 'Banners show in correct order. Inactive banners not shown on home.',
        where: 'Web: home page.',
      },
    ],
  },

  /* ── 14. BLOG ── */
  {
    id: 'blog', label: 'Blog', icon: PenTool,
    platform: ['admin', 'web', 'mobile'], color: '#14b8a6',
    cases: [
      {
        id: 'blog-1', title: 'Create Blog Post (WYSIWYG)', severity: 'high',
        steps: [
          'Admin → Blog → Add Post',
          'Enter Title, Slug, Cover Image URL',
          'Use rich text editor: add H2, bold, bullet list, image',
          'Set Category, Tags, Published = true → Save',
        ],
        expected: 'Post saved. Visible at /blog (web) and Blog tab (mobile).',
        where: 'Web: /blog | Mobile: Blog screen.',
      },
      {
        id: 'blog-2', title: 'Blog Post Detail', severity: 'high',
        steps: [
          'Web → /blog → click a post',
          'Mobile → Blog → tap a post',
        ],
        expected: 'Full content rendered. Rich text formatting visible (bold, headings, lists). Share button (mobile).',
        where: 'Web: /blog/[slug] | Mobile: Blog detail.',
      },
      {
        id: 'blog-3', title: 'Blog SEO', severity: 'medium',
        steps: [
          'View source of /blog/[slug]',
          'Check for: title, meta description, OG image, canonical',
        ],
        expected: 'All SEO meta tags present.',
        where: 'Web: page source.',
      },
    ],
  },

  /* ── 15. REVIEWS & RATINGS ── */
  {
    id: 'reviews', label: 'Reviews & Ratings', icon: Star,
    platform: ['admin', 'web', 'mobile'], color: '#f59e0b',
    cases: [
      {
        id: 'rev-1', title: 'Logged-In User Submits Review (Quick)', severity: 'critical',
        steps: [
          'Login → go to any product page',
          'Scroll to Reviews section → "Write a Review" form should be visible',
          'Select star rating, write review text, click Submit Review',
          'Check DB: INSERT into reviews with user_id + product_id (order_id NULL). ON CONFLICT upserts on second submit.',
        ],
        expected: 'Review saved without error. Rating average on product updates. No "ON CONFLICT" DB error.',
        where: 'Web & Mobile: product detail.',
      },
      {
        id: 'rev-1b', title: 'Guest Cannot See Review Form', severity: 'high',
        steps: [
          'Logout → go to any product page → scroll to Reviews section',
        ],
        expected: 'Web: "Login to write a review" prompt with link. Mobile: "Login to write a review" tappable box that opens auth modal. No form shown.',
        where: 'Web & Mobile: product detail.',
      },
      {
        id: 'rev-2', title: 'Admin Approves Review', severity: 'high',
        steps: [
          'Admin → Reviews → find pending review → Approve',
        ],
        expected: 'Review now visible on product page. Rating average updates.',
        where: 'Admin: /admin/reviews.',
      },
      {
        id: 'rev-3', title: 'Rating Breakdown Display', severity: 'medium',
        steps: [
          'Web → product page → scroll to Ratings section',
        ],
        expected: '5-star breakdown bars shown (5★ 4★ 3★ 2★ 1★). Average rating number. Total review count.',
        where: 'Web: product detail.',
      },
      {
        id: 'rev-4', title: 'Review on Mobile (Login Gate)', severity: 'high',
        steps: [
          'Mobile logged in → product detail → scroll to reviews → "Write Review" form shown',
          'Rate and submit → success toast',
          'Mobile logged OUT → product detail → see "Login to write a review" box → tap → auth modal opens',
        ],
        expected: 'Logged-in: review submitted. Logged-out: auth prompt, no form.',
        where: 'Mobile: Product screen.',
      },
    ],
  },

  /* ── 16. Q&A ── */
  {
    id: 'qa', label: 'Q&A (Questions & Answers)', icon: MessageSquare,
    platform: ['admin', 'web'], color: '#6366f1',
    cases: [
      {
        id: 'qa-1', title: 'User Asks a Question', severity: 'medium',
        steps: [
          'Web → product page → Q&A section → type question → submit',
        ],
        expected: 'Question submitted. Pending in admin.',
        where: 'Web: product detail.',
      },
      {
        id: 'qa-2', title: 'Admin Answers / Moderates Q&A', severity: 'medium',
        steps: [
          'Admin → Q&A Moderation → find question → type answer → Approve',
        ],
        expected: 'Q&A visible on product page with admin answer.',
        where: 'Admin: /admin/qa | Web: product detail.',
      },
    ],
  },

  /* ── 17. WISHLIST ── */
  {
    id: 'wishlist', label: 'Wishlist', icon: Heart,
    platform: ['web', 'mobile'], color: '#ec4899',
    cases: [
      {
        id: 'wish-1', title: 'Add to Wishlist (Logged In)', severity: 'high',
        steps: [
          'Login → product page → click heart icon',
        ],
        expected: 'Heart turns filled/red. Product added to /wishlist.',
        where: 'Web: /wishlist | Mobile: Wishlist tab.',
      },
      {
        id: 'wish-2', title: 'Add to Wishlist (Guest)', severity: 'high',
        steps: [
          'Logout → click heart on any product',
        ],
        expected: 'Auth slide-in sheet opens (NOT redirect to /auth page).',
        where: 'Web: any product/category page.',
      },
      {
        id: 'wish-3', title: 'Remove from Wishlist', severity: 'medium',
        steps: [
          'Wishlist page → click heart again or Remove button',
        ],
        expected: 'Product removed from wishlist. List updates.',
        where: 'Web & Mobile: Wishlist page/tab.',
      },
    ],
  },

  /* ── 18. WALLET ── */
  {
    id: 'wallet', label: 'Wallet & Loyalty Points', icon: Wallet,
    platform: ['admin', 'web', 'mobile'], color: '#10b981',
    cases: [
      {
        id: 'wal-1', title: 'Admin Credits Wallet', severity: 'high',
        steps: [
          'Admin → Wallet & Credits → select user → Add Credits',
          'Enter amount + reason → Confirm',
        ],
        expected: 'Wallet balance updated for user. Transaction logged.',
        where: 'Admin: /admin/wallet.',
      },
      {
        id: 'wal-2', title: 'User Sees Wallet Balance', severity: 'high',
        steps: [
          'Login → go to /wallet (web) or Profile → Wallet (mobile)',
        ],
        expected: 'Current balance shown. Transaction history visible.',
        where: 'Web & Mobile: Wallet.',
      },
      {
        id: 'wal-3', title: 'Apply Wallet at Checkout', severity: 'high',
        steps: [
          'Cart with items → Checkout → toggle "Use Wallet Balance"',
        ],
        expected: 'Wallet amount deducted from order total. Order created with correct total.',
        where: 'Web & Mobile: Checkout.',
      },
      {
        id: 'wal-4', title: 'Referral Code Visible in Profile', severity: 'critical',
        steps: [
          'Login as any user → Web: Account → Profile tab | Mobile: Account screen',
          'Look for referral code card',
        ],
        expected: 'Unique 8-char code displayed (e.g. A1B2C3D4). Copy button copies code to clipboard. Share Link (web) copies full URL with ?ref= param.',
        where: 'Web: /account | Mobile: Account screen.',
      },
      {
        id: 'wal-5', title: 'Referral Code at Registration (Web)', severity: 'critical',
        steps: [
          'Copy User A\'s referral code from their profile',
          'Open auth sheet as a new/incognito user → Register tab',
          'Fill name, email, password → paste code in "Referral code (optional)" field → Create Account',
          'Verify email → Login',
          'Place first order (COD or online)',
        ],
        expected: 'User A\'s wallet balance increases by ₹50. Referral status in DB becomes "rewarded". Wallet transaction logged with source="referral".',
        where: 'Web: Auth sheet → Register | Admin: DB / wallet transactions.',
      },
      {
        id: 'wal-6', title: 'Referral Code at Registration (Mobile)', severity: 'critical',
        steps: [
          'Mobile → Auth → Register',
          'Fill fields → enter referral code in "Referral Code (optional)" field → Create Account',
          'Verify email → Login → place first order',
        ],
        expected: 'Same as wal-5: referrer gets ₹50 wallet credit after first order.',
        where: 'Mobile: Auth screen → Register.',
      },
      {
        id: 'wal-7', title: 'Referral via ?ref= URL (Web)', severity: 'high',
        steps: [
          'Paste User A\'s share link into browser: https://yourdomain.com/?ref=USERCODE',
          'Open auth sheet → Register — referral code field should be pre-filled',
          'Complete registration → place first order',
        ],
        expected: 'Referral code auto-filled from URL param. After first order, referrer earns ₹50.',
        where: 'Web: Any page with ?ref= param.',
      },
      {
        id: 'wal-8', title: 'Edge Cases — Invalid / Self Referral', severity: 'high',
        steps: [
          'Register with a made-up referral code (e.g. INVALID1) — registration should succeed normally',
          'Try to use your OWN referral code at registration (self-referral) — should be silently ignored',
          'Try to place a second order after referral already rewarded — referrer wallet should NOT be credited again',
        ],
        expected: 'Invalid code: registration succeeds, no referral tracked. Self-referral: silently skipped. Double reward: blocked by UNIQUE(referred_id) + status=\'rewarded\' check.',
        where: 'Web & Mobile: Registration + Checkout.',
      },
    ],
  },

  /* ── 19. SUPPORT TICKETS ── */
  {
    id: 'support', label: 'Support Tickets', icon: PhoneCall,
    platform: ['admin', 'web', 'mobile'], color: '#0ea5e9',
    cases: [
      {
        id: 'sup-1', title: 'Create Support Ticket', severity: 'high',
        steps: [
          'Web → /support → New Ticket',
          'Fill Subject, Category (General/Order/Payment etc.), Priority, Message',
          'Submit',
        ],
        expected: 'Ticket created. Redirected to ticket detail page with real-time chat.',
        where: 'Web: /support.',
      },
      {
        id: 'sup-2', title: 'Real-time Chat in Ticket', severity: 'high',
        steps: [
          'Open a ticket on web → type reply → send',
          'Admin → Support → open same ticket → reply',
        ],
        expected: 'Messages appear in real-time on both sides (Socket.io). No page refresh needed.',
        where: 'Web: /support/[id] | Admin: /admin/support.',
      },
      {
        id: 'sup-3', title: 'Close Ticket', severity: 'medium',
        steps: [
          'Web → ticket detail → click "Close" button',
        ],
        expected: 'Ticket status = closed. Reply box disabled. "This ticket is closed" message shown.',
        where: 'Web: /support/[id].',
      },
      {
        id: 'sup-4', title: 'Admin Views All Tickets', severity: 'high',
        steps: [
          'Admin → Support → view all tickets with filters',
        ],
        expected: 'All tickets listed. Status filter works. Can reply and change status.',
        where: 'Admin: /admin/support.',
      },
    ],
  },

  /* ── 20. PUSH NOTIFICATIONS ── */
  {
    id: 'push', label: 'Push Notifications', icon: Bell,
    platform: ['admin', 'mobile'], color: '#f97316',
    cases: [
      {
        id: 'push-1', title: 'Device Token Registration', severity: 'critical',
        steps: [
          '⚠️ Push tokens DO NOT register in Expo Go — must use a development or production build',
          'Build with: eas build --profile development (dev) or eas build --profile production',
          'Or run locally: npx expo run:android / npx expo run:ios',
          'Login to account → allow notification permission when prompted',
          'Admin → Push Notifications → check stats',
        ],
        expected: 'Admin shows 1 device, 1 user. Token saved to push_tokens table. If using Expo Go, 0 devices is expected (not a bug).',
        where: 'Admin: /admin/push-notifications. Requires native build.',
      },
      {
        id: 'push-2', title: 'Admin Broadcasts Push Notification', severity: 'high',
        steps: [
          'Admin → Push Notifications → Broadcast',
          'Enter Title, Body → Send',
          'On Android: notification must appear as heads-up banner (slides in from top)',
        ],
        expected: 'All registered devices receive push notification as a high-priority heads-up banner (like Flipkart). Channel ID is "default", priority is "high". Notification shows even when app is in foreground.',
        where: 'Mobile: device notification tray + heads-up banner.',
      },
      {
        id: 'push-3', title: 'Order Status Push Notification', severity: 'high',
        steps: [
          'Admin → update an order status (e.g. to Shipped)',
        ],
        expected: 'Customer gets push notification on mobile as heads-up banner with order status update.',
        where: 'Mobile: notification tray.',
      },
      {
        id: 'push-5', title: 'Push Notification Permission Prompt', severity: 'high',
        steps: [
          'Fresh install (or clear app data) → open app → login',
          'Watch for OS permission dialog',
        ],
        expected: 'Android shows notification permission dialog (Android 13+) after login. Android channel "Oroganix Notifications" is created at app boot (even before login) with IMPORTANCE_MAX so heads-up banners work.',
        where: 'Mobile: OS permission dialog on first login.',
      },
      {
        id: 'push-4', title: 'User Notifications Inbox (Web)', severity: 'medium',
        steps: [
          'Login → web → click bell icon or /notifications',
        ],
        expected: 'Last 50 order status updates shown as notification list.',
        where: 'Web: notifications page.',
      },
    ],
  },

  /* ── 21. NEWSLETTER ── */
  {
    id: 'newsletter', label: 'Newsletter', icon: Mail,
    platform: ['admin', 'web'], color: '#8b5cf6',
    cases: [
      {
        id: 'news-1', title: 'Subscribe via Footer', severity: 'high',
        steps: [
          'Web → scroll to footer → enter a NEW email → click Subscribe',
        ],
        expected: 'Success toast shown. Email added to newsletter_subscribers. Welcome email received in inbox.',
        where: 'Web: footer.',
      },
      {
        id: 'news-2', title: 'Duplicate Email Subscription', severity: 'medium',
        steps: [
          'Subscribe with an already-subscribed email',
        ],
        expected: 'Message: "Already subscribed". No duplicate created.',
        where: 'Web: footer.',
      },
      {
        id: 'news-3', title: 'Re-subscribe after Unsubscribe', severity: 'medium',
        steps: [
          'POST /api/newsletter/unsubscribe with email',
          'Subscribe again with same email from footer',
        ],
        expected: 'is_active set back to TRUE. Welcome back email received.',
        where: 'Web: footer.',
      },
      {
        id: 'news-4', title: 'Send Custom Campaign', severity: 'critical',
        steps: [
          'Admin → Newsletter → Send Campaign → select Custom Message',
          'Fill Subject, Message Body, optional CTA → click Send',
        ],
        expected: 'Campaign email received by all active subscribers. Success toast shows count sent.',
        where: 'Admin: /admin/newsletter.',
      },
      {
        id: 'news-5', title: 'Send Coupon Campaign', severity: 'critical',
        steps: [
          'Admin → Newsletter → Send Campaign → select Coupon Campaign',
          'Enter a valid coupon code (e.g. SAVE20), set discount type and value → Send',
        ],
        expected: 'Email with coupon code card received. Discount and expiry shown correctly.',
        where: 'Admin: /admin/newsletter.',
      },
      {
        id: 'news-6', title: 'Flash Sale Auto-Notify', severity: 'high',
        steps: [
          'Admin → Flash Sales → Create new sale',
          'Check "Notify newsletter subscribers" → Save',
        ],
        expected: 'Flash sale announcement email sent to all active subscribers. Subject shows discount % and sale title.',
        where: 'Admin: /admin/flash-sales.',
      },
    ],
  },

  /* ── 22. ANALYTICS & VISITORS ── */
  {
    id: 'analytics', label: 'Analytics & Visitors', icon: BarChart3,
    platform: ['admin'], color: '#0ea5e9',
    cases: [
      {
        id: 'ana-1', title: 'Dashboard Stats', severity: 'high',
        steps: [
          'Admin → Dashboard',
          'Check: Total Orders, Revenue, Users, Products, Pending Orders',
        ],
        expected: 'Numbers match real data. Charts render. No "NaN" or broken values.',
        where: 'Admin: /admin/dashboard.',
      },
      {
        id: 'ana-2', title: 'Analytics Charts', severity: 'medium',
        steps: [
          'Admin → Analytics',
          'Check revenue over time, order counts, top products',
        ],
        expected: 'Charts load. Date range filter works.',
        where: 'Admin: /admin/analytics.',
      },
      {
        id: 'ana-3', title: 'Page Visitors Tracking', severity: 'low',
        steps: [
          'Visit several web pages',
          'Admin → Visitors → check page view counts',
        ],
        expected: 'Page views recorded. Top visited pages shown.',
        where: 'Admin: /admin/visitors.',
      },
      {
        id: 'ana-4', title: 'Live Visitor Count — Real-time (Socket)', severity: 'medium',
        steps: [
          'Open Admin → Visitors in browser A',
          'Open the storefront in browser B (or incognito tab)',
          'Watch the "Live Now" counter and green badge in the Visitors page header',
          'Open a third tab on the storefront → counter should increment',
          'Close one storefront tab → counter should decrement',
          'Verify no full page reload occurs — only the number updates',
        ],
        expected: 'Live Now count updates within 1–2 seconds of connect/disconnect via WebSocket server_stats event. No polling interval, no full reload.',
        where: 'Admin: /admin/visitors.',
      },
    ],
  },

  /* ── 23. SEO ── */
  {
    id: 'seo', label: 'SEO & Meta Tags', icon: Globe,
    platform: ['web'], color: '#14b8a6',
    cases: [
      {
        id: 'seo-1', title: 'Product Page Meta Tags', severity: 'high',
        steps: [
          'Open any product page on web',
          'Right-click → View Source OR use browser DevTools → Elements → <head>',
          'Check: <title>, meta description, og:title, og:image, canonical',
        ],
        expected: 'Title = product meta_title or name. Description = meta_description. Canonical = /product/[slug]. OG image = product image.',
        where: 'Web: /product/[slug].',
      },
      {
        id: 'seo-2', title: 'Sitemap', severity: 'medium',
        steps: [
          'Visit /sitemap.xml on web app',
        ],
        expected: 'All active products listed with slug URLs. Blog posts listed. Categories listed.',
        where: 'Web: /sitemap.xml.',
      },
      {
        id: 'seo-3', title: 'Product JSON-LD Schema', severity: 'medium',
        steps: [
          'View source of product page → search for "application/ld+json"',
        ],
        expected: 'Product schema with name, price, availability, rating. FAQPage schema if FAQs exist.',
        where: 'Web: product detail source.',
      },
    ],
  },

  /* ── 24. USERS ADMIN ── */
  {
    id: 'users-admin', label: 'Admin: User Management', icon: Users,
    platform: ['admin'], color: '#6366f1',
    cases: [
      {
        id: 'usr-1', title: 'View User List', severity: 'high',
        steps: [
          'Admin → Users',
        ],
        expected: 'All registered users listed. Search/filter works. Email verified status shown.',
        where: 'Admin: /admin/users.',
      },
      {
        id: 'usr-2', title: 'View User Details / Orders', severity: 'medium',
        steps: [
          'Admin → Users → click a user',
        ],
        expected: 'User profile, order history, wallet balance visible.',
        where: 'Admin: /admin/users.',
      },
      {
        id: 'usr-3', title: 'Block / Unblock User', severity: 'medium',
        steps: [
          'Admin → Users → toggle block on a user',
          'That user tries to login',
        ],
        expected: 'Blocked user cannot login. Gets "Account blocked" error.',
        where: 'Admin: /admin/users.',
      },
    ],
  },

  /* ── 25. COMPANY SETTINGS ── */
  {
    id: 'company', label: 'Company Settings', icon: Settings,
    platform: ['admin', 'web'], color: '#64748b',
    cases: [
      {
        id: 'comp-1', title: 'Update Company Info', severity: 'high',
        steps: [
          'Admin → Company → fill: Name, Email, Phone, Address, GST No, PAN No',
          'Add Social Links (Facebook, Instagram, Twitter, YouTube)',
          'Save',
        ],
        expected: 'Footer on web shows updated contact info and social links. Invoices show updated company name, GST, and PAN.',
        where: 'Web: footer | Admin: invoices.',
      },
      {
        id: 'comp-2', title: 'Social Links in Footer', severity: 'medium',
        steps: [
          'After saving company social links',
          'Web → scroll to footer',
        ],
        expected: 'Social icons (FB, IG, Twitter, YouTube) appear in footer. Only filled ones show.',
        where: 'Web: footer.',
      },
      {
        id: 'comp-3', title: 'Compliance & Banking Fields on Invoice', severity: 'high',
        steps: [
          'Admin → Company → fill FSSAI Licence Number (e.g., 12345678901234)',
          'Fill Bank Name, Bank Branch, Account Number, IFSC Code',
          'Save',
          'Admin → Invoices → Generate invoice for any order',
          'Download PDF',
        ],
        expected: 'Invoice PDF shows FSSAI licence number in footer compliance card. Bank details (name, account, IFSC) appear in a "Payment Details" section of the PDF. If FSSAI or bank fields are empty, those sections are hidden from the PDF.',
        where: 'Admin: /admin/company | Admin: /admin/invoices.',
      },
      {
        id: 'comp-4', title: 'Platform Config — Hero Section', severity: 'high',
        steps: [
          'Admin → Company → click "Platform Config" tab',
          'Change Headline Line 1 to "Experience" and Headline Line 2 to "Pure Nature"',
          'Change Primary CTA to "Buy Now"',
          'Save → open web homepage',
        ],
        expected: 'Hero headline now reads "Experience / Pure Nature / of Ayurveda". Primary button reads "Buy Now". Changes apply immediately without rebuild on both web and mobile (mobile uses cached config — may need app restart or 10-min cache expiry).',
        where: 'Web: homepage hero | Mobile: home screen carousel (after cache refresh).',
      },
      {
        id: 'comp-5', title: 'Platform Config — Trust Strip & Stats', severity: 'medium',
        steps: [
          'Admin → Company → Platform Config tab',
          'Edit Hero Stats (e.g., change "10,000+" to "15,000+")',
          'Edit a Trust Item (change emoji or label)',
          'Save → refresh homepage',
        ],
        expected: 'Web hero stat row and trust strip update. Mobile Trust Strip (dark green stats row on home screen) updates after cache refresh.',
        where: 'Web: hero bottom | Mobile: home screen trust strip.',
      },
      {
        id: 'comp-6', title: 'Platform Config — Promotional Banners', severity: 'medium',
        steps: [
          'Admin → Company → Platform Config tab',
          'Click "Add Banner" → paste an image URL, set link to /products, alt to "Summer Sale"',
          'Save → open mobile app (after cache clears)',
        ],
        expected: 'Mobile hero carousel shows the banner image instead of text-only fallback slides. Web homepage shows banners in hero carousel (if banner carousel section is present).',
        where: 'Mobile: home screen hero carousel.',
      },
    ],
  },

  /* ── PROFILE PICTURE ── */
  {
    id: 'avatar', label: 'Profile Picture Upload', icon: Users,
    platform: ['web', 'mobile'], color: '#7c3aed',
    cases: [
      {
        id: 'avatar-1', title: 'Web — Upload Profile Photo', severity: 'high',
        steps: [
          'Log in as customer → Account → click "Edit Profile"',
          'Click "Change Photo" → select a JPG/PNG under 5MB',
          'Verify preview appears in the avatar circle',
          'Click "Save Changes"',
        ],
        expected: 'Profile photo updates in header avatar and in edit form preview. Refreshing the page shows the saved photo.',
        where: 'Web: /account profile tab.',
      },
      {
        id: 'avatar-2', title: 'Web — Invalid File Rejection', severity: 'medium',
        steps: [
          'Edit Profile → try uploading a PDF or GIF file',
          'Try uploading an image over 5MB',
        ],
        expected: 'Error toast: "Only JPG, PNG, or WEBP images allowed" or "Image must be under 5MB". Form does not submit.',
        where: 'Web: /account profile tab.',
      },
      {
        id: 'avatar-3', title: 'Mobile — Camera Photo', severity: 'high',
        steps: [
          'Open mobile app → Account tab',
          'Tap the avatar circle in the header → tap "Camera"',
          'Allow camera permission if prompted',
          'Take a photo, confirm crop, then tap "Save Changes"',
        ],
        expected: 'Avatar updates immediately in the header after save. Re-opening the account screen shows the new photo.',
        where: 'Mobile: Account screen header.',
      },
      {
        id: 'avatar-4', title: 'Mobile — Gallery Photo', severity: 'high',
        steps: [
          'Account tab → tap avatar → "Photo Library"',
          'Allow library permission if prompted → select a photo → crop → save',
        ],
        expected: 'Avatar saves and displays in header. No permission prompt shown on subsequent opens (permission is remembered).',
        where: 'Mobile: Account screen.',
      },
      {
        id: 'avatar-5', title: 'Mobile — Permission Denied', severity: 'medium',
        steps: [
          'Deny camera/library permission when prompted',
        ],
        expected: 'Alert appears: "Permission Required" with explanation. Avatar is not changed. No crash.',
        where: 'Mobile: Account screen.',
      },
    ],
  },

  /* ── 26. BULK OPERATIONS ── */
  {
    id: 'bulk', label: 'Bulk Product Operations', icon: Upload,
    platform: ['admin'], color: '#0ea5e9',
    cases: [
      {
        id: 'bulk-1', title: 'Bulk Upload Products (CSV)', severity: 'high',
        steps: [
          'Admin → Bulk Upload → download template',
          'Fill CSV with product data',
          'Upload CSV → submit',
        ],
        expected: 'Products imported. Import history shows success/failure counts.',
        where: 'Admin: /admin/products/bulk-upload.',
      },
      {
        id: 'bulk-2', title: 'Bulk Price Update', severity: 'high',
        steps: [
          'Admin → Bulk Price → select multiple products → set new price',
        ],
        expected: 'Prices updated for selected products. Changes visible on product pages.',
        where: 'Admin: /admin/products/bulk-price.',
      },
      {
        id: 'bulk-3', title: 'Bulk Stock Update', severity: 'high',
        steps: [
          'Admin → Bulk Stock → update stock qty for multiple products',
        ],
        expected: 'Stock values updated. Out-of-stock products show appropriate status.',
        where: 'Admin: /admin/products/bulk-stock.',
      },
      {
        id: 'bulk-4', title: 'Bulk Status Change', severity: 'medium',
        steps: [
          'Admin → Bulk Status → select products → set to Inactive',
        ],
        expected: 'Selected products become inactive. Disappear from storefront.',
        where: 'Admin: /admin/products/bulk-status.',
      },
    ],
  },

  /* ── 27. MOBILE APP SPECIFIC ── */
  {
    id: 'mobile', label: 'Mobile App Specific', icon: Smartphone,
    platform: ['mobile'], color: '#10b981',
    cases: [
      {
        id: 'mob-1', title: 'App Launch & Home Screen', severity: 'critical',
        steps: [
          'Install production APK on device',
          'Open app',
        ],
        expected: 'Home screen loads: featured products, categories, flash sale section. No blank screen. No crash.',
        where: 'Mobile: Home screen.',
      },
      {
        id: 'mob-2', title: 'Slow Server Recovery', severity: 'high',
        steps: [
          'Open app while backend is starting (slow server)',
          'Home page shows loading',
          'Wait or pull-to-refresh',
        ],
        expected: 'Data loads eventually. Pull-to-refresh works. No permanent blank screen.',
        where: 'Mobile: Home screen.',
      },
      {
        id: 'mob-3', title: 'Product Navigation via Slug', severity: 'high',
        steps: [
          'Mobile: tap any product (from home, search, category)',
        ],
        expected: 'Product screen loads using slug or ID. Flash price shown if active. Wishlist heart uses correct product ID.',
        where: 'Mobile: Product screen.',
      },
      {
        id: 'mob-4', title: 'Recently Viewed Products', severity: 'medium',
        steps: [
          'View 3+ products on mobile',
          'Go to Home or Profile',
        ],
        expected: '"Recently Viewed" section shows last viewed products.',
        where: 'Mobile: Home.',
      },
      {
        id: 'mob-5', title: 'Haptic Feedback', severity: 'low',
        steps: [
          'Tap buttons in the app on a real device',
        ],
        expected: 'Subtle haptic vibration on button taps. No crash on web/Expo Go.',
        where: 'Mobile: throughout app.',
      },
      {
        id: 'mob-6', title: 'Razorpay Payment (Mobile)', severity: 'critical',
        steps: [
          'Add product → checkout → online payment',
          'Razorpay native sheet opens',
          'Complete payment with test card',
        ],
        expected: 'Payment processed. Order created. Success screen shown.',
        where: 'Mobile: Checkout.',
      },
      {
        id: 'mob-7', title: 'Custom Toast Notifications', severity: 'medium',
        steps: [
          'Mobile: trigger a validation error (e.g. tap Add to Cart with no variant selected)',
          'Trigger a success (e.g. add item to cart from wishlist)',
          'Trigger an info (e.g. submit product review)',
          'Trigger 3+ notifications quickly to test stacking',
          'Tap a toast while visible',
        ],
        expected: 'Animated toast slides in from top with correct color/icon. Auto-dismisses after 3.5s. Tap dismisses immediately. Max 3 stacked, oldest drops when exceeded.',
        where: 'Mobile: throughout app.',
      },
    ],
  },

  /* ── 28. ABANDONED CARTS ── */
  {
    id: 'abandoned', label: 'Abandoned Carts', icon: ShoppingCart,
    platform: ['admin'], color: '#f97316',
    cases: [
      {
        id: 'abn-1', title: 'View Abandoned Carts', severity: 'medium',
        steps: [
          'User adds items to cart → does NOT checkout → leaves',
          'Admin → Abandoned Carts',
        ],
        expected: 'Cart shown in abandoned list with user details and items.',
        where: 'Admin: /admin/abandoned-carts.',
      },
      {
        id: 'abn-2', title: 'Abandoned Cart Recovery Email', severity: 'medium',
        steps: [
          'Admin → Abandoned Carts → trigger recovery email',
        ],
        expected: 'Recovery email sent to user with cart items.',
        where: 'Admin: /admin/abandoned-carts.',
      },
    ],
  },

  /* ── 29. EXPORT ── */
  {
    id: 'export', label: 'Data Export', icon: Download,
    platform: ['admin'], color: '#64748b',
    cases: [
      {
        id: 'exp-1', title: 'Export Orders CSV', severity: 'medium',
        steps: [
          'Admin → Export → select Orders → choose date range → Export',
        ],
        expected: 'CSV file downloaded with all order data in the date range.',
        where: 'Admin: /admin/export.',
      },
      {
        id: 'exp-2', title: 'Export Products CSV', severity: 'medium',
        steps: [
          'Admin → Export → select Products → Export',
        ],
        expected: 'CSV with all product fields downloaded.',
        where: 'Admin: /admin/export.',
      },
    ],
  },

  /* ── 30. STOCK ALERTS ── */
  {
    id: 'stock', label: 'Stock Notifications', icon: Bell,
    platform: ['admin', 'web'], color: '#ef4444',
    cases: [
      {
        id: 'stk-1', title: 'User Requests Stock Alert', severity: 'medium',
        steps: [
          'Web → product that is out of stock',
          'Click "Notify Me" → enter email',
        ],
        expected: 'Email registered for stock alert. Appears in Admin → Stock Alerts.',
        where: 'Web: product detail | Admin: /admin/stock-notifications.',
      },
      {
        id: 'stk-2', title: 'Admin Restocks & Alerts Send', severity: 'medium',
        steps: [
          'Admin → update stock of out-of-stock product to > 0',
        ],
        expected: 'Email notification sent to all registered users for that product.',
        where: 'Admin: /admin/stock-notifications.',
      },
    ],
  },

  /* ── SHIPMENT TRACKING ── */
  {
    id: 'tracking', label: 'Shipment Tracking', icon: Truck,
    platform: ['admin', 'web', 'mobile'], color: '#0891b2',
    cases: [
      {
        id: 'track-1', title: 'Mark order as Shipped (admin)', severity: 'critical',
        steps: [
          'Admin → Orders → find a Confirmed/Processing order → click Truck icon',
          'Select courier from dropdown (e.g. Delhivery)',
          'Enter AWB/tracking number',
          'Set expected delivery date',
          'Click Save Shipment',
        ],
        expected: 'Order status changes to Shipped (3). Tracking URL auto-generated and shown. System event "Order Shipped" added to timeline. Customer gets push notification on mobile.',
        where: 'Admin: /admin/orders.',
      },
      {
        id: 'track-2', title: 'Add manual tracking event (admin)', severity: 'high',
        steps: [
          'Admin → Shipment Tracking → find in-transit order → View Events',
          'Click Add Event',
          'Choose preset: "Out for Delivery"',
          'Enter optional location and description',
          'Submit',
        ],
        expected: 'Event stored in DB with source=manual. Customer sees event immediately in order detail. out_for_delivery_at column stamped. Customer gets "Out for Delivery!" push notification.',
        where: 'Admin: /admin/tracking.',
      },
      {
        id: 'track-3', title: 'Add Delivery Attempted event', severity: 'high',
        steps: [
          'Admin → Tracking → add event → select DELIVERY_ATTEMPTED',
          'Submit',
          'Check order detail — verify delivery_attempts count incremented',
          'Verify customer push notification sent',
        ],
        expected: 'delivery_attempts column incremented. Customer sees "Delivery Attempted" in timeline with attempt number. Push notification sent.',
        where: 'Admin: /admin/tracking.',
      },
      {
        id: 'track-4', title: 'RTO Initiated event', severity: 'medium',
        steps: [
          'Admin → Tracking → add event → select RTO_INITIATED',
          'Submit',
          'Open mobile app → go to that order',
        ],
        expected: 'rto_initiated_at column stamped. Mobile order detail shows a red "Return to Origin" banner. Event visible in timeline.',
        where: 'Admin: /admin/tracking. Mobile: order detail.',
      },
      {
        id: 'track-5', title: 'Customer sees tracking timeline (web)', severity: 'critical',
        steps: [
          'Mark an order as shipped + add 2-3 events (admin)',
          'Log in as customer on web → Account → Orders → expand order',
          'Click tracking panel',
        ],
        expected: 'Full event timeline shown: each event has icon, status label, description, location, and timestamp. EDD shown. Tracking URL link present. Most recent event highlighted.',
        where: 'Web: Account → Orders.',
      },
      {
        id: 'track-6', title: 'Customer sees tracking timeline (mobile)', severity: 'critical',
        steps: [
          'Mark an order as shipped + add events (admin)',
          'Log in on mobile → tap order in Order History',
          'Scroll to Shipment Tracking section',
        ],
        expected: 'Events timeline shows all events newest-first. EDD displayed. "Track on courier website" button links to correct carrier URL. RTO banner appears if RTO event present.',
        where: 'Mobile: Order detail screen.',
      },
      {
        id: 'track-7', title: 'Webhook receiver (simulated)', severity: 'high',
        steps: [
          'Send POST to /api/courier/webhook/shiprocket with body: { "awb": "<valid tracking number>", "current_status_id": 3, "current_status": "Out for Delivery", "location": "Mumbai", "current_timestamp": "2026-08-06 10:00:00" }',
          'Check DB: shipment_events should have a new row with source=webhook',
          'Check mobile app — customer should see new event in timeline',
        ],
        expected: 'HTTP 200 returned immediately. Event inserted asynchronously. order status and tracking columns updated. Push notification sent to user.',
        where: 'Backend: POST /api/courier/webhook/shiprocket (no auth required).',
      },
      {
        id: 'track-8', title: 'In-transit orders list', severity: 'medium',
        steps: [
          'Admin → Shipment Tracking page',
          'Verify all orders with status=Shipped and a tracking number appear in the table',
          'Search by order ID or customer name',
        ],
        expected: 'Table lists in-transit orders with courier, AWB, last event, EDD. Search filters correctly.',
        where: 'Admin: /admin/tracking.',
      },
    ],
  },

  /* ── GST REPORTS & INVOICE VOID ── */
  {
    id: 'gst', label: 'GST Reports & Invoice Void', icon: FileText,
    platform: ['admin'], color: '#dc2626',
    cases: [
      {
        id: 'gst-1', title: 'GST Dashboard loads', severity: 'high',
        steps: [
          'Admin → Compliance → GST Reports',
          'Page loads with FY selector (default: current financial year)',
          'Verify 8 summary cards: Total Taxable Value, CGST, SGST, IGST, Total GST, Total Invoice Value, Invoice Count, Avg Invoice Value',
          'Verify monthly breakdown table (Apr–Mar)',
          'Verify HSN summary table',
        ],
        expected: 'All data populated from invoices table. FY change updates all cards + tables.',
        where: 'Admin: /admin/gst.',
      },
      {
        id: 'gst-2', title: 'GSTR-1 Summary tab', severity: 'high',
        steps: [
          'Admin → GST Reports → GSTR-1 tab',
          'Set from/to date range covering some invoices',
          'Click Fetch',
        ],
        expected: 'Table lists each invoice with: invoice no, date, customer, HSN, taxable value, CGST, SGST, IGST, total. Voided invoices NOT shown.',
        where: 'Admin: /admin/gst → GSTR-1 tab.',
      },
      {
        id: 'gst-3', title: 'Export Invoices CSV', severity: 'critical',
        steps: [
          'Admin → GST Reports → Export section',
          'Set from/to dates, select Type = Invoices',
          'Click Download CSV',
        ],
        expected: 'CSV file downloads with correct filename (gstr1-invoices-from-to.csv). Contains: Invoice No, Date, Customer Name, Taxable Value, CGST, SGST, IGST, Invoice Total, HSN Codes. No voided invoices.',
        where: 'Admin: /admin/gst → Export.',
      },
      {
        id: 'gst-4', title: 'Export HSN Summary CSV', severity: 'critical',
        steps: [
          'Admin → GST Reports → Export section',
          'Set from/to dates, select Type = HSN Summary',
          'Click Download CSV',
        ],
        expected: 'CSV downloads in GSTR-1 Table 12 format: HSN Code, Description, UQC, Quantity, Taxable Value, CGST Rate, CGST Amount, SGST Rate, SGST Amount, IGST Rate, IGST Amount, Total Tax.',
        where: 'Admin: /admin/gst → Export.',
      },
      {
        id: 'gst-5', title: 'Void an invoice', severity: 'critical',
        steps: [
          'Admin → Invoices → find a non-voided invoice → click red ⊗ icon',
          'Void dialog opens with GST law warning',
          'Enter reason (at least 5 characters)',
          'Click Confirm Void',
          'Verify invoice now shows "VOIDED" badge',
          'Check GST Reports — voided invoice should NOT appear in GSTR-1 export',
        ],
        expected: 'Invoice marked is_voided=true. credit_note_number auto-set to CN-{invoice_no}. Void button hidden on already-voided invoices. Invoice excluded from all GST exports.',
        where: 'Admin: /admin/invoices.',
      },
      {
        id: 'gst-6', title: 'Void reason validation', severity: 'medium',
        steps: [
          'Admin → Invoices → void → enter reason with 3 characters → try to submit',
        ],
        expected: 'Error: "Reason must be at least 5 characters". Form does not submit.',
        where: 'Admin: /admin/invoices → void modal.',
      },
      {
        id: 'gst-7', title: 'Invoice NOT deleted — only voided', severity: 'critical',
        steps: [
          'Void an invoice',
          'Check DB: SELECT is_voided, voided_at, void_reason, credit_note_number FROM invoices WHERE id = X',
        ],
        expected: 'Row still exists. is_voided=true. voided_at is a timestamp. void_reason is the entered text. credit_note_number = "CN-" + invoice_number. Invoice number still sequential — no gaps.',
        where: 'Database: invoices table.',
      },
    ],
  },

  /* ── PERMISSION PRIMING ── */
  {
    id: 'permissions', label: 'Permission Priming (Mobile)', icon: Bell,
    platform: ['mobile'], color: '#7c3aed',
    cases: [
      {
        id: 'perm-1', title: 'First-launch permissions screen appears', severity: 'critical',
        steps: [
          'Fresh install of app (or clear AsyncStorage key permissions_requested_v1)',
          'Open app',
          'Wait for bootstrap to complete',
        ],
        expected: 'Full-screen permission priming screen appears after home screen loads. Shows 3 permission cards: Order Notifications, Camera, Photo Library — each with icon, title, description, and "why" badge.',
        where: 'Mobile: first launch.',
      },
      {
        id: 'perm-2', title: 'Allow Permissions flow', severity: 'critical',
        steps: [
          'On permissions screen → tap "Allow Permissions"',
          'Verify each OS permission dialog appears one at a time (Notifications → Camera → Photos)',
          'Grant all three',
        ],
        expected: 'All three dialogs appear sequentially with 500ms gap. Done screen shows all three as "✓ Granted" in green. "Start Shopping" button redirects to home page.',
        where: 'Mobile: permissions screen.',
      },
      {
        id: 'perm-3', title: 'Skip for Now', severity: 'high',
        steps: [
          'On permissions screen → tap "Skip for Now"',
        ],
        expected: 'AsyncStorage key permissions_requested_v1 set to "true". User goes directly to home page. Screen never appears again on subsequent launches.',
        where: 'Mobile: permissions screen.',
      },
      {
        id: 'perm-4', title: 'Denied permission — settings link shown', severity: 'high',
        steps: [
          'On permissions screen → tap "Allow Permissions"',
          'Deny at least one OS permission dialog',
          'Reach Done screen',
        ],
        expected: 'Denied permissions shown as "✗ Denied" in red. "Open Settings to Change Permissions" button appears. Tapping it opens device Settings app.',
        where: 'Mobile: permissions done screen.',
      },
      {
        id: 'perm-5', title: 'Screen only appears once', severity: 'critical',
        steps: [
          'Go through permissions flow (allow or skip)',
          'Close and reopen app',
        ],
        expected: 'Permission priming screen does NOT appear on second launch. User goes straight to home.',
        where: 'Mobile: second and subsequent launches.',
      },
      {
        id: 'perm-6', title: 'Back gesture disabled on permissions screen', severity: 'high',
        steps: [
          'On permissions screen during requesting phase',
          'Try to swipe back or press hardware back button (Android)',
        ],
        expected: 'Back gesture and hardware back button do nothing — gestureEnabled: false on the Stack.Screen. User cannot bypass the screen mid-flow.',
        where: 'Mobile: permissions screen (requesting step).',
      },
    ],
  },

  /* ── GIFT CARDS ── */
  {
    id: 'gift-cards', label: 'Gift Cards', icon: Tag,
    platform: ['admin', 'web'], color: '#16a34a',
    cases: [
      {
        id: 'gc-1', title: 'Admin creates a gift card', severity: 'critical',
        steps: [
          'Admin → Gift Cards → click "Create Gift Card"',
          'Enter amount: 500, recipient email (optional), no expiry',
          'Click Create',
        ],
        expected: 'Card appears in table with a unique code (e.g., A1B2C3-D4E5F6), balance = 500, status = Active.',
        where: 'Admin: /admin/gift-cards.',
      },
      {
        id: 'gc-2', title: 'Customer applies gift card at checkout', severity: 'critical',
        steps: [
          'Add items to cart (total ~₹800)',
          'Go to checkout Step 2',
          'Enter the gift card code in the Gift Card section',
          'Click Apply',
        ],
        expected: 'Gift card applied: discount of ₹500 shown. Final total = ₹300. "Gift Card Applied" row visible in order summary.',
        where: 'Web: /checkout.',
      },
      {
        id: 'gc-3', title: 'Gift card balance deducted after order', severity: 'critical',
        steps: [
          'Place order with gift card applied',
          'Admin → Gift Cards → find the card',
        ],
        expected: 'Card balance reduced by amount used. If fully used, balance shows ₹0. gift_card_uses table has a new row for this order.',
        where: 'Admin: /admin/gift-cards.',
      },
      {
        id: 'gc-4', title: 'Invalid / expired gift card rejected', severity: 'high',
        steps: [
          'At checkout, enter an invalid or expired gift card code',
          'Click Apply',
        ],
        expected: 'Error message shown under the input: "Gift card not found" or "Gift card has expired". Order total unchanged.',
        where: 'Web: /checkout.',
      },
      {
        id: 'gc-5', title: 'Admin deactivates gift card', severity: 'medium',
        steps: [
          'Admin → Gift Cards → find an active card → click Deactivate',
          'Try to apply that code at checkout',
        ],
        expected: 'Card status changes to Inactive. At checkout: "This gift card has been deactivated".',
        where: 'Admin: /admin/gift-cards and Web: /checkout.',
      },
    ],
  },

  /* ── COD CAP ── */
  {
    id: 'cod-cap', label: 'COD Order Value Cap', icon: CreditCard,
    platform: ['web', 'mobile'], color: '#ea580c',
    cases: [
      {
        id: 'cod-1', title: 'COD blocked for orders above ₹5,000', severity: 'critical',
        steps: [
          'Add items totalling ₹6,000 to cart',
          'Go to checkout → choose Cash on Delivery',
        ],
        expected: 'Warning banner visible: "COD available only for orders up to ₹5,000". Place Order button is disabled.',
        where: 'Web: /checkout.',
      },
      {
        id: 'cod-2', title: 'COD allowed for orders at or below ₹5,000', severity: 'critical',
        steps: [
          'Cart total ≤ ₹5,000 → checkout → choose COD',
          'Click Place Order',
        ],
        expected: 'Order placed successfully. No warning shown.',
        where: 'Web: /checkout.',
      },
    ],
  },

  /* ── HELPFUL VOTING ── */
  {
    id: 'helpful-vote', label: 'Review Helpful Voting', icon: Star,
    platform: ['web'], color: '#d97706',
    cases: [
      {
        id: 'hv-1', title: 'Vote a review as helpful', severity: 'high',
        steps: [
          'Go to any product page with approved reviews',
          'Log in, then click the 👍 button on a review',
        ],
        expected: 'Count increments by 1. Button turns filled/highlighted to indicate your vote.',
        where: 'Web: product page → reviews section.',
      },
      {
        id: 'hv-2', title: 'Toggle helpful vote off', severity: 'medium',
        steps: [
          'Click 👍 on a review you already voted helpful',
        ],
        expected: 'Vote removed. Count decrements. Button returns to unfilled state.',
        where: 'Web: product page → reviews section.',
      },
      {
        id: 'hv-3', title: 'Sort by Most Helpful', severity: 'high',
        steps: [
          'Product page → reviews section → change sort dropdown to "Most Helpful"',
        ],
        expected: 'Reviews reorder: highest helpful_count first. Previously this sort was broken — verify it now works correctly.',
        where: 'Web: product page → reviews sort.',
      },
    ],
  },

  /* ── PUBLIC ORDER TRACKING ── */
  {
    id: 'public-tracking', label: 'Public Order Tracking', icon: Truck,
    platform: ['web'], color: '#0891b2',
    cases: [
      {
        id: 'pt-1', title: 'Share tracking link generated', severity: 'critical',
        steps: [
          'Log in → My Account → Orders → open an order',
          'Click the "Share Tracking" button',
        ],
        expected: 'On mobile/share-enabled browser: native share sheet opens. On desktop: URL copied to clipboard. Toast confirms copy.',
        where: 'Web: /account or /orders/:id.',
      },
      {
        id: 'pt-2', title: 'Public tracking page accessible without login', severity: 'critical',
        steps: [
          'Copy the tracking URL (/track/[uuid])',
          'Open it in an incognito window (not logged in)',
        ],
        expected: 'Page loads with order status, items, courier info, progress steps. No login prompt.',
        where: 'Web: /track/[token].',
      },
      {
        id: 'pt-3', title: 'Invalid tracking token shows error', severity: 'medium',
        steps: [
          'Navigate to /track/not-a-valid-uuid',
        ],
        expected: '"Order not found" state shown. No server error.',
        where: 'Web: /track/[token].',
      },
    ],
  },

  /* ── WISHLIST SHARING ── */
  {
    id: 'wishlist-share', label: 'Wishlist Sharing', icon: Heart,
    platform: ['web'], color: '#ec4899',
    cases: [
      {
        id: 'ws-1', title: 'Generate wishlist share link', severity: 'high',
        steps: [
          'Log in → add 2+ items to wishlist',
          'Go to /wishlist → click "Share Wishlist"',
        ],
        expected: 'Share link generated. On share-enabled browser: share sheet opens. On desktop: URL copied to clipboard.',
        where: 'Web: /wishlist.',
      },
      {
        id: 'ws-2', title: 'Shared wishlist page accessible without login', severity: 'critical',
        steps: [
          'Paste the /wishlist/share/[token] URL in incognito',
        ],
        expected: 'Page loads with the owner\'s name and all their in-stock wishlisted products. "Add to Cart" button works for logged-in users.',
        where: 'Web: /wishlist/share/[token].',
      },
      {
        id: 'ws-3', title: 'Invalid wishlist token shows error', severity: 'medium',
        steps: [
          'Navigate to /wishlist/share/invalid-token',
        ],
        expected: '"Wishlist not found or link expired" message shown.',
        where: 'Web: /wishlist/share/[token].',
      },
    ],
  },

  /* ── ADMIN SALES REPORTS ── */
  {
    id: 'sales-reports', label: 'Admin Sales Reports', icon: BarChart3,
    platform: ['admin'], color: '#2563eb',
    cases: [
      {
        id: 'sr-1', title: 'Sales Reports page loads', severity: 'high',
        steps: [
          'Admin → Sales Reports (left sidebar)',
        ],
        expected: 'Page loads with date filter, monthly trend chart, top products table, category revenue, state revenue, profit margins, and coupon usage.',
        where: 'Admin: /admin/reports.',
      },
      {
        id: 'sr-2', title: 'Date range filter works', severity: 'medium',
        steps: [
          'Admin → Sales Reports → set "From" and "To" dates → click Apply',
        ],
        expected: 'All tables and the chart update to reflect only orders in that date range.',
        where: 'Admin: /admin/reports.',
      },
      {
        id: 'sr-3', title: 'Monthly trend chart renders', severity: 'medium',
        steps: [
          'Admin → Sales Reports → scroll to Monthly Revenue Trend',
        ],
        expected: 'SVG bar chart visible with correct month labels and revenue bars.',
        where: 'Admin: /admin/reports.',
      },
    ],
  },

  /* ── GAMIFICATION: QUIZ ── */
  {
    id: 'quiz-dynamic', label: 'Dynamic Quiz System', icon: Zap,
    platform: ['admin', 'web', 'mobile'], color: '#7c3aed',
    cases: [
      {
        id: 'qd-1', title: 'Admin creates quiz with reward', severity: 'critical',
        steps: [
          'Admin → Quiz Manager → Create Quiz',
          'Set title, pass score = 5, reward = Wallet ₹50, max_attempts = 1, expires_at = tomorrow',
          'Add 3 questions, each with 2 options; mark 1 correct (1 point each)',
          'Set active = true → Save',
        ],
        expected: 'Quiz appears in list. questions_count = 3, attempts_count = 0.',
        where: 'Admin: /admin/quiz',
      },
      {
        id: 'qd-2', title: 'User plays and earns reward on pass', severity: 'critical',
        steps: [
          'Log in as customer',
          'Navigate to /games or quiz play page',
          'Select all correct answers → Submit',
          'Check wallet balance in account page',
        ],
        expected: 'Score ≥ pass_score → reward_given = true. Wallet balance increased by ₹50. Reward log created.',
        where: 'Web: /games | Admin: Reward Logs',
      },
      {
        id: 'qd-3', title: 'Attempt limit enforced', severity: 'high',
        steps: [
          'Complete quiz (max_attempts = 1)',
          'Try to submit quiz again',
        ],
        expected: 'Error: "You have used all allowed attempts for this quiz."',
        where: 'Web quiz play endpoint.',
      },
      {
        id: 'qd-4', title: 'Quiz expiry respected', severity: 'high',
        steps: [
          'Set expires_at = yesterday on an existing quiz',
          'Try to submit answers via POST /api/quiz/play/:id/submit',
        ],
        expected: '403 error: "This quiz has expired."',
        where: 'Backend: quiz.controller.js submitDynamicQuiz.',
      },
    ],
  },

  /* ── GAMIFICATION: SCRATCH CARDS ── */
  {
    id: 'scratch', label: 'Scratch Card Games', icon: Tag,
    platform: ['admin', 'web', 'mobile'], color: '#f97316',
    cases: [
      {
        id: 'sc-1', title: 'Admin creates scratch card campaign', severity: 'critical',
        steps: [
          'Admin → Games & Rewards → Scratch Cards → New Campaign',
          'Set title, reward_type = wallet, reward_value = 30, max_claims = 10, per_user_limit = 1',
          'Set is_active = true → Save',
        ],
        expected: 'Card appears in admin list with claims_count = 0.',
        where: 'Admin: /admin/games',
      },
      {
        id: 'sc-2', title: 'User scratches and claims reward', severity: 'critical',
        steps: [
          'Go to /games → Scratch Cards tab',
          'Drag/scratch over the card until 50% revealed',
          'Check wallet balance',
        ],
        expected: 'Prize revealed. Wallet balance +₹30. claims_count incremented to 1.',
        where: 'Web: /games | DB: scratch_card_claims',
      },
      {
        id: 'sc-3', title: 'Per-user limit prevents double claim', severity: 'critical',
        steps: [
          'Same user tries to claim same card twice',
        ],
        expected: '403: "You have already claimed this scratch card."',
        where: 'Backend: games.controller.js claimScratchCard.',
      },
      {
        id: 'sc-4', title: 'Mobile scratch card tap-to-reveal works', severity: 'high',
        steps: [
          'Open mobile app → Games → Scratch Cards',
          'Tap the scratch area button',
          'Confirm alert appears with prize or "better luck" message',
        ],
        expected: 'Alert shown with correct reward text. Reward credited.',
        where: 'Mobile: /games screen',
      },
    ],
  },

  /* ── GAMIFICATION: SPIN WHEEL ── */
  {
    id: 'spin', label: 'Spin Wheel Games', icon: RotateCcw,
    platform: ['admin', 'web', 'mobile'], color: '#10b981',
    cases: [
      {
        id: 'sw-1', title: 'Admin creates spin wheel with segments', severity: 'critical',
        steps: [
          'Admin → Games & Rewards → Spin Wheel tab → New Wheel',
          'Add 4 segments totalling weight = 100 (e.g., 40/30/20/10)',
          'Set daily_spin_limit = 2, is_active = true → Save Wheel',
        ],
        expected: 'Wheel created. Segment probability weights sum = 100 check passes.',
        where: 'Admin: /admin/games',
      },
      {
        id: 'sw-2', title: 'Invalid weights rejected', severity: 'high',
        steps: [
          'Create wheel with segments totalling 80 (not 100)',
          'Click Save Wheel',
        ],
        expected: 'Toast error: "Weights must total 100 (currently 80)"',
        where: 'Admin: /admin/games frontend validation.',
      },
      {
        id: 'sw-3', title: 'User spins and receives reward', severity: 'critical',
        steps: [
          'Go to /games → Spin Wheel tab',
          'Click Spin Now',
          'Wait for animation to complete',
          'Check wallet/points balance',
        ],
        expected: 'Spin result displayed. If reward_type ≠ none, balance updated. spin_wheel_plays row inserted.',
        where: 'Web: /games | DB: spin_wheel_plays',
      },
      {
        id: 'sw-4', title: 'Daily spin limit enforced', severity: 'critical',
        steps: [
          'Spin until daily_spin_limit reached',
          'Try to spin again',
        ],
        expected: 'Button disabled. API returns 429: "Daily spin limit reached."',
        where: 'Web: /games | Backend: games.controller.js spinWheel.',
      },
    ],
  },

  /* ── REWARD LOGS ── */
  {
    id: 'reward-logs', label: 'Reward Audit Logs', icon: BarChart3,
    platform: ['admin'], color: '#6366f1',
    cases: [
      {
        id: 'rl-1', title: 'Every reward creates a log entry', severity: 'critical',
        steps: [
          'Complete a quiz, scratch a card, spin a wheel (3 separate actions)',
          'Admin → Reward Logs',
        ],
        expected: '3 new rows visible, each with correct source_type, reward_type, value, user, and timestamp.',
        where: 'Admin: /admin/reward-logs | DB: reward_logs',
      },
      {
        id: 'rl-2', title: 'Source type filter works', severity: 'high',
        steps: [
          'Admin → Reward Logs → filter by source_type = spin_wheel',
        ],
        expected: 'Only spin wheel rewards shown.',
        where: 'Admin: /admin/reward-logs',
      },
      {
        id: 'rl-3', title: 'Coupon code logged in reward_ref', severity: 'high',
        steps: [
          'Set a quiz reward_type = coupon. User passes quiz.',
          'Check reward_logs → reward_ref column',
        ],
        expected: 'reward_ref = generated coupon code (RWD-xxxxxxxx format). Coupon also exists in coupons table.',
        where: 'DB: reward_logs.reward_ref | DB: coupons',
      },
    ],
  },

]

/* ═══════════════════════════════════════════════
   SIDEBAR NAV DATA
═══════════════════════════════════════════════ */

const NAV_SECTIONS = SECTIONS.map(s => ({ id: s.id, label: s.label, icon: s.icon, color: s.color }))

/* ═══════════════════════════════════════════════
   PLANNED / NOT YET IMPLEMENTED FEATURES
═══════════════════════════════════════════════ */

interface PlannedFeature {
  title: string
  description: string
  platforms: string[]
  priority: 'high' | 'medium' | 'low'
}

const PLANNED_FEATURES: PlannedFeature[] = [
  {
    title: 'Mobile App: Biometric / PIN Login',
    description: 'After first login, allow users to authenticate on mobile using fingerprint, Face ID, or a 4-digit PIN for faster re-login without typing password.',
    platforms: ['Mobile App'],
    priority: 'medium',
  },
  {
    title: 'Product Comparison',
    description: 'Allow users to select 2–4 products and compare them side-by-side (price, specifications, ingredients, ratings).',
    platforms: ['Web App'],
    priority: 'medium',
  },
  {
    title: 'Loyalty / Reward Points System',
    description: 'Earn points on every purchase, review written, or referral. Points redeemable as wallet balance on next order. Admin controls earn rate and redemption value.',
    platforms: ['Web App', 'Mobile App', 'Admin'],
    priority: 'high',
  },
  {
    title: 'Product Q&A on Mobile',
    description: 'Currently Q&A is only on web product pages. Mobile app should also allow users to ask and view answered questions on the product detail screen.',
    platforms: ['Mobile App'],
    priority: 'medium',
  },
  {
    title: 'Order Cancellation by User',
    description: 'Allow users to cancel their own order within a configurable time window (e.g., 30 minutes or before "Processing" status). Admin can configure the cancellation window.',
    platforms: ['Web App', 'Mobile App'],
    priority: 'high',
  },
  {
    title: 'Live Order Tracking (Map)',
    description: 'Real-time delivery tracking on a map using the courier partner\'s tracking API. Show delivery person location on the user\'s order detail page.',
    platforms: ['Web App', 'Mobile App'],
    priority: 'low',
  },
  {
    title: 'Product Subscription / Auto-Refill',
    description: 'Let users subscribe to a product (e.g., order every 30 days). Auto-create orders on schedule. Admin can view and manage all subscriptions.',
    platforms: ['Web App', 'Mobile App', 'Admin'],
    priority: 'medium',
  },
  {
    title: 'Admin: Scheduled Email Campaigns + Open/Click Tracking',
    description: 'Schedule campaigns for future dates (e.g., send on Friday at 10am). Track open rates and click rates per campaign using Brevo webhooks. Currently campaigns send immediately — scheduling and analytics are the remaining enhancements.',
    platforms: ['Admin'],
    priority: 'medium',
  },
  {
    title: 'Multi-Currency / Multi-Language',
    description: 'Support for USD, EUR alongside INR. Interface language switching (English, Hindi). Price display based on user location.',
    platforms: ['Web App', 'Mobile App'],
    priority: 'low',
  },
  {
    title: 'WhatsApp Order Notifications',
    description: 'Send order confirmation and status update messages via WhatsApp Business API in addition to email and push notifications.',
    platforms: ['Backend'],
    priority: 'high',
  },
]

/* ═══════════════════════════════════════════════
   COMPONENTS
═══════════════════════════════════════════════ */

function PlatformBadge({ p }: { p: Platform }) {
  const info = platformLabel[p]
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: info.color + '18', color: info.color }}>
      {p === 'admin' && <Shield size={10} className="mr-1" />}
      {p === 'web' && <Monitor size={10} className="mr-1" />}
      {p === 'mobile' && <Smartphone size={10} className="mr-1" />}
      {p === 'all' && <Globe size={10} className="mr-1" />}
      {info.label}
    </span>
  )
}

function SeverityBadge({ s }: { s: Severity }) {
  const info = severityLabel[s]
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: info.bg, color: info.text }}>
      {s === 'critical' && <XCircle size={10} className="mr-1" />}
      {s === 'high' && <AlertCircle size={10} className="mr-1" />}
      {s === 'medium' && <Info size={10} className="mr-1" />}
      {s === 'low' && <CheckCircle size={10} className="mr-1" />}
      {info.label}
    </span>
  )
}

function TestCard({ tc }: { tc: TestCase }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition text-left"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 shrink-0">
            <span className="text-xs font-bold text-gray-500">{tc.id.split('-')[1]}</span>
          </div>
          <span className="font-medium text-gray-800 text-sm truncate">{tc.title}</span>
          <SeverityBadge s={tc.severity} />
        </div>
        <ChevronRight size={16} className={`text-gray-400 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 bg-gray-50 border-t border-gray-100 space-y-3">
          {tc.where && (
            <div className="flex items-start gap-2">
              <MapPin size={13} className="text-indigo-500 mt-0.5 shrink-0" />
              <span className="text-xs text-indigo-700 font-medium">{tc.where}</span>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Steps to Test</p>
            <ol className="space-y-1.5">
              {tc.steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex items-start gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
            <CheckCircle size={14} className="text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-emerald-700 mb-0.5">Expected Result</p>
              <p className="text-sm text-emerald-800">{tc.expected}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SectionBlock({ sec }: { sec: TestSection }) {
  const Icon = sec.icon
  const total = sec.cases.length
  const critical = sec.cases.filter(c => c.severity === 'critical').length
  return (
    <section id={sec.id} className="mb-12 scroll-mt-6">
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b-2"
        style={{ borderColor: sec.color + '30' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: sec.color + '18' }}>
            <Icon size={18} style={{ color: sec.color }} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{sec.label}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              {sec.platform.map(p => <PlatformBadge key={p} p={p} />)}
            </div>
          </div>
        </div>
        <div className="flex gap-3 text-xs text-right">
          <div className="bg-gray-100 px-2.5 py-1 rounded-lg">
            <span className="font-bold text-gray-700">{total}</span>
            <span className="text-gray-500 ml-1">tests</span>
          </div>
          {critical > 0 && (
            <div className="bg-red-50 px-2.5 py-1 rounded-lg">
              <span className="font-bold text-red-600">{critical}</span>
              <span className="text-red-400 ml-1">critical</span>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {sec.cases.map(tc => <TestCard key={tc.id} tc={tc} />)}
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════ */

export default function TestingGuidePage() {
  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all')
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all')
  const [activeSection, setActiveSection] = useState('')

  const totalTests = SECTIONS.reduce((a, s) => a + s.cases.length, 0)
  const totalCritical = SECTIONS.reduce((a, s) => a + s.cases.filter(c => c.severity === 'critical').length, 0)

  const filteredSections = SECTIONS.map(sec => ({
    ...sec,
    cases: sec.cases.filter(tc => {
      const matchSearch = !search || tc.title.toLowerCase().includes(search.toLowerCase()) ||
        tc.steps.some(s => s.toLowerCase().includes(search.toLowerCase())) ||
        tc.expected.toLowerCase().includes(search.toLowerCase())
      const matchPlatform = platformFilter === 'all' || sec.platform.includes(platformFilter as Platform)
      const matchSeverity = severityFilter === 'all' || tc.severity === severityFilter
      return matchSearch && matchPlatform && matchSeverity
    }),
  })).filter(sec => sec.cases.length > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-linear-to-r from-rose-600 via-pink-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <FlaskConical size={24} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Full System Testing Guide</h1>
            <p className="text-white/80 text-sm mt-1">
              End-to-end test cases for Admin Panel · Web App · Mobile App
            </p>
            <div className="flex gap-4 mt-3">
              <div className="bg-white/15 rounded-xl px-3 py-1.5 text-sm">
                <span className="font-bold">{totalTests}</span> Total Test Cases
              </div>
              <div className="bg-white/15 rounded-xl px-3 py-1.5 text-sm">
                <span className="font-bold">{totalCritical}</span> Critical
              </div>
              <div className="bg-white/15 rounded-xl px-3 py-1.5 text-sm">
                <span className="font-bold">{SECTIONS.length}</span> Modules
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Priority Levels</p>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-sm text-gray-700"><strong>Critical</strong> — Must work before any release</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-sm text-gray-700"><strong>High</strong> — Core functionality, test every sprint</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-sm text-gray-700"><strong>Medium</strong> — Important but not blocking</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-gray-700"><strong>Low</strong> — Nice-to-have, test when time allows</span>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Nav */}
        <aside className="hidden xl:block w-56 shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sticky top-4">
            <p className="text-xs font-semibold text-gray-400 uppercase px-2 mb-2">Jump To</p>
            <nav className="space-y-0.5">
              {NAV_SECTIONS.map(n => {
                const Icon = n.icon
                return (
                  <a
                    key={n.id}
                    href={`#${n.id}`}
                    onClick={() => setActiveSection(n.id)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition ${activeSection === n.id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Icon size={13} style={{ color: n.color }} />
                    <span className="truncate">{n.label}</span>
                  </a>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
            <div className="flex flex-wrap gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Search test cases..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {/* Platform filter */}
              <div className="flex gap-1">
                {(['all', 'admin', 'web', 'mobile'] as const).map(p => (
                  <button key={p}
                    onClick={() => setPlatformFilter(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${platformFilter === p ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                    {p === 'all' ? 'All Platforms' : p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>

              {/* Severity filter */}
              <div className="flex gap-1">
                {(['all', 'critical', 'high', 'medium', 'low'] as const).map(s => (
                  <button key={s}
                    onClick={() => setSeverityFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${severityFilter === s ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300'}`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {(search || platformFilter !== 'all' || severityFilter !== 'all') && (
              <p className="text-xs text-gray-500 mt-2">
                Showing {filteredSections.reduce((a, s) => a + s.cases.length, 0)} test cases
                {search && ` matching "${search}"`}
              </p>
            )}
          </div>

          {/* Test Sections */}
          {filteredSections.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
              <FlaskConical size={36} className="mx-auto mb-3 opacity-30" />
              <p>No test cases match your filter.</p>
            </div>
          ) : (
            filteredSections.map(sec => <SectionBlock key={sec.id} sec={sec} />)
          )}

          {/* ── Planned Features ── */}
          {!search && platformFilter === 'all' && severityFilter === 'all' && (
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-dashed border-amber-200">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50">
                  <AlertCircle size={18} className="text-amber-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Planned / Not Yet Implemented</h2>
                  <p className="text-xs text-gray-500 mt-0.5">These features are not built yet — listed here for future development reference</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PLANNED_FEATURES.map((f, i) => (
                  <div key={i} className="border border-dashed border-amber-200 rounded-xl p-4 bg-amber-50/40">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-semibold text-gray-800 text-sm">{f.title}</p>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        f.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        f.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {f.priority.charAt(0).toUpperCase() + f.priority.slice(1)} priority
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed mb-2">{f.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {f.platforms.map(p => (
                        <span key={p} className="px-2 py-0.5 rounded-full text-xs bg-white border border-amber-200 text-amber-700 font-medium">{p}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
