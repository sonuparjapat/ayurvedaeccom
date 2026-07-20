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

### Web — Product Detail Review Pre-fill

1. Navigate to `/product/:id` while logged in.
2. Scroll to the Reviews tab — if the user has already reviewed, the "Write a Review" form should auto-fill with their existing stars, comment, and photos.
3. Pre-fill triggers via `GET /shop/reviews/product/:id?me=1` (fires when `loginuserdata` becomes available).
4. Verify the pre-fill works even if the user's review is buried on page 2+ of the public review list (the `me=1` fetch is independent of the paginated list).
5. Submit an edited review — verify the form immediately reflects the new server-stored image URLs (re-fetched after submit).

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
