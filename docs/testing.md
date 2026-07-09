# Testing Guide — Oroganix eCommerce

## Mobile — Razorpay Payment

### Prerequisites
- A standalone Expo build (EAS build) or Expo Dev Client. **Expo Go will not work** because `oroganix://` deep link scheme is not registered in Expo Go.
- The `oroganix` scheme must be registered in `app.json` under `"scheme"`.

### Test steps
1. Log in with a test account.
2. Add any product to cart and go to Checkout.
3. Select **Online Payment**.
4. Tap **Place Order**.
5. Verify: the Razorpay payment page opens inside an in-app browser tab.
6. Complete payment with a Razorpay test card (use test mode key during development).
7. Verify: after payment, the browser closes automatically and the Order Confirmation screen (step 3) is shown.
8. Go to **My Orders** and verify the order status is `Paid` / `Processing`.

### Edge cases
| Scenario | Expected behaviour |
|---|---|
| User closes browser mid-payment | Toast: "Payment not completed. Your order is pending." |
| Payment fails (card declined) | Razorpay shows error; user can retry. Status stays Pending. |
| Network drops after payment but before redirect | Verify endpoint called on re-open; if signature valid, order confirms. |
| JWT older than 2h at payment time | 401 response from `/payment-page` — user sees auth error; re-login required. |

### Android-specific check
On Android, after payment confirm, the `Linking` event must fire and the browser must dismiss automatically. If the browser stays open after payment, the `Linking.addEventListener` is not receiving the `oroganix://` URL — check that the EAS build's intent filters include the scheme.

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
