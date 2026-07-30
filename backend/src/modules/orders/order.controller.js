const pool = require("../../config/db");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { emitToAdmin, emitToUser } = require('../../socket');
const { createNotification } = require('../../services/notification.service');
const { getLoyaltySettings } = require('../../services/loyaltySettings.service');
const sendOrderConfirmationEmail = require('../../services/email/orderConfirmation');
const { sendOrderCancelledEmail, sendReturnRequestedEmail } = require('../../services/email/orderStatusEmail');
const { sendDeliveryOTP: sendDeliveryOTPSms } = require('../../services/sms')
const { logPayment } = require('../../services/paymentLogger');

/* ── Loyalty tier helper ── */
async function updateLoyaltyTier(userId) {
  try {
    const r = await pool.query(
      `SELECT COALESCE(SUM(total_amount),0) AS spent FROM orders WHERE user_id=$1 AND status=5`,
      [userId]
    )
    const spent = Number(r.rows[0]?.spent || 0)
    const tier = spent >= 50000 ? 'platinum' : spent >= 20000 ? 'gold' : spent >= 5000 ? 'silver' : 'bronze'
    await pool.query(`UPDATE users SET total_spent=$1, loyalty_tier=$2 WHERE id=$3`, [spent, tier, userId])
  } catch (e) { console.error('[Tier]', e.message) }
}

/* ================= RAZORPAY ================= */

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

/* ================= UTILS ================= */

const getAppSettings = async (client) => {

  const config = {
    delivery_charge: 0,
    platform_fee: 0,
    free_delivery_limit: 500,
  };

  const { rows } = await client.query(`
    SELECT key, value, type
    FROM app_settings
    WHERE is_active = true
  `);

  rows.forEach(row => {

    let val = row.value;

    if (row.type === "number") val = Number(val);
    if (row.type === "boolean") val = val === "true";

    if (config.hasOwnProperty(row.key)) {
      config[row.key] = val;
    }

  });

  return config;
};


/* ================= REFERRAL REWARD HELPER ================= */
// Call inside an open transaction (client). Credits the referrer ₹50 on the
// referred user's FIRST ever order. Marks referral as rewarded to prevent double credit.
const REFERRAL_REWARD = 50;

async function creditReferralReward(client, userId, orderId) {
  try {
    // Only fire on the user's very first order
    const countRes = await client.query(
      `SELECT COUNT(*) FROM orders WHERE user_id = $1 AND payment_status IN ('paid','unpaid','pending')`,
      [userId]
    );
    if (Number(countRes.rows[0].count) !== 1) return;

    // Find a pending referral where this user is the referred party
    const refRes = await client.query(
      `SELECT id, referrer_id FROM referrals WHERE referred_id = $1 AND status = 'pending' LIMIT 1`,
      [userId]
    );
    if (!refRes.rows.length) return;

    const { id: referralId, referrer_id: referrerId } = refRes.rows[0];

    // Credit referrer wallet
    await client.query(
      `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`,
      [REFERRAL_REWARD, referrerId]
    );
    await client.query(
      `INSERT INTO wallet_transactions (user_id, amount, type, source, order_id, description)
       VALUES ($1, $2, 'credit', 'referral', $3, $4)`,
      [referrerId, REFERRAL_REWARD, orderId, `Referral reward — your friend placed their first order (#${orderId})`]
    );

    // Mark referral rewarded
    await client.query(
      `UPDATE referrals SET status = 'rewarded', reward_amount = $1, rewarded_at = NOW() WHERE id = $2`,
      [REFERRAL_REWARD, referralId]
    );
  } catch (refErr) {
    console.error('[Referral reward]', refErr.message);
    // Non-fatal — don't break the order flow
  }
}

/* ================= CREATE ORDER ================= */

const STATUS_PENDING = 0;

/* ================= CREATE ORDER ================= */

exports.createOrder = async (req, res) => {

  const client = await pool.connect();

  try {

    /* ================= AUTH ================= */

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    /* ================= INPUT ================= */

    const { shipping, paymentMethod, addressId, couponCode, walletDiscount: requestedWalletDiscount, loyaltyDiscount: requestedLoyaltyDiscount, loyaltyPointsUsed } = req.body;
if (!addressId) {
  return res.status(400).json({
    success: false,
    message: "Address is required"
  });
}
/* ================= USER ADDRESS EXIST ================= */

const chk = await client.query(
  "SELECT id FROM user_addresses WHERE user_id=$1",
  [userId]
);

if (!chk.rows.length) {
  return res.status(400).json({
    success: false,
    message: "Please add address before ordering"
  });
}
 const addrRes = await client.query(
  `
  SELECT
    id,
    type,
    street,
    city,
    state,
    pincode
  FROM user_addresses
  WHERE id=$1 AND user_id=$2
  `,
  [addressId, userId]
);

if (!addrRes.rows.length) {
  throw new Error("Invalid address selected");
}

const addr = addrRes.rows[0];

/* ================= PINCODE SERVICEABILITY CHECK ================= */
let deliveryDays = 5
if (addr.pincode) {
  const pincodeCheck = await client.query(
    `SELECT delivery_days FROM serviceable_pincodes WHERE pincode=$1 AND is_active=TRUE LIMIT 1`,
    [addr.pincode]
  );
  if (!pincodeCheck.rows.length) {
    return res.status(400).json({
      success: false,
      message: `Sorry, we don't deliver to pincode ${addr.pincode} yet. Please use a different delivery address.`
    });
  }
  deliveryDays = pincodeCheck.rows[0].delivery_days || 5
}

/* ================= ADDRESS SNAPSHOT ================= */

    if (!["cod", "online"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method"
      });
    }

    await client.query("BEGIN");

    /* ================= SETTINGS ================= */

    const settings = await getAppSettings(client);

    const DELIVERY = Number(settings.delivery_charge || 0);
    const PLATFORM = Number(settings.platform_fee || 0);
    const FREE_LIMIT = Number(settings.free_delivery_limit || 0);

    /* ================= LOCK CART (with variant data) ================= */

    const cartRes = await client.query(`
      SELECT
        c.product_id,
        c.variant_id,
        c.quantity,
        p.name                                AS product_name,
        p.gst_percent,
        p.status,
        COALESCE(pv.price, p.price)           AS effective_price,
        COALESCE(pv.inventory, p.inventory)   AS effective_inventory,
        pv.label                              AS variant_label

      FROM cart c
      JOIN products p ON p.id = c.product_id
      LEFT JOIN product_variants pv ON pv.id = c.variant_id

      WHERE c.user_id = $1
      FOR UPDATE OF c
    `, [userId]);

    const cart = cartRes.rows;

    if (!cart.length) {
      throw new Error("Cart is empty");
    }

    /* ================= FLASH SALE PRICE MAP ================= */

    let flashPriceMap = {}
    let flashSaleIdMap = {}  // product_id → flash_sale_id (for tracking)
    try {
      const flashRes = await client.query(`
        SELECT fsp.product_id, fs.id AS flash_sale_id,
          COALESCE(fsp.special_price,
            CASE WHEN fs.discount_type = 'percent'
              THEN p.price * (1 - fs.discount_value/100)
              ELSE p.price - fs.discount_value
            END
          ) AS flash_price
        FROM flash_sale_products fsp
        JOIN flash_sales fs ON fs.id = fsp.flash_sale_id
        JOIN products p ON p.id = fsp.product_id
        WHERE fs.is_active = TRUE AND fs.starts_at <= NOW() AND fs.ends_at > NOW()
          AND (fs.max_uses IS NULL OR fs.uses_count < fs.max_uses)
          AND (fsp.stock_limit IS NULL OR fsp.sold_count < fsp.stock_limit)
      `)
      flashRes.rows.forEach(r => {
        flashPriceMap[r.product_id] = parseFloat(r.flash_price)
        flashSaleIdMap[r.product_id] = r.flash_sale_id
      })
    } catch {}

    /* ================= CALCULATION ================= */

    let subtotal = 0;
    let totalTax = 0;

    for (const item of cart) {

      if (item.status !== "active") {
        throw new Error("Some products are unavailable");
      }

      if (Number(item.effective_inventory) < Number(item.quantity)) {
        throw new Error("Some items are out of stock");
      }

      const regularPrice = Number(item.effective_price);
      const flashPrice = flashPriceMap[item.product_id];
      const price = flashPrice != null && flashPrice < regularPrice ? flashPrice : regularPrice;
      const qty = Number(item.quantity);
      const gst = Number(item.gst_percent || 0);

      const itemSubtotal = price * qty;
      const itemTax = (itemSubtotal * gst) / 100;

      subtotal += itemSubtotal;
      totalTax += itemTax;
    }

    /* ================= DELIVERY ================= */

    const delivery =
      subtotal >= FREE_LIMIT ? 0 : DELIVERY;

    /* ================= TOTAL ================= */

    let total =
      subtotal +
      totalTax +
      delivery +
      PLATFORM;

    /* ================= ROUNDING ================= */

    subtotal = Number(subtotal.toFixed(2));
    totalTax = Number(totalTax.toFixed(2));
    total = Number(total.toFixed(2));

    if (total <= 0) {
      throw new Error("Invalid order amount");
    }

    /* ================= COUPON ================= */

    let discountAmount = 0;
    let appliedCouponId = null;
    let appliedCouponCode = null;

    if (couponCode) {
      const couponRes = await client.query(`
        SELECT * FROM coupons
        WHERE UPPER(code) = UPPER($1)
          AND is_active = TRUE
          AND (valid_from IS NULL OR valid_from <= NOW())
          AND (valid_to IS NULL OR valid_to >= NOW())
        FOR UPDATE
      `, [couponCode]);

      if (!couponRes.rows.length) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, message: "Coupon is expired or no longer valid." });
      }

      const c = couponRes.rows[0];
      const usageOk = Number(c.usage_limit) === 0 || c.used_count < Number(c.usage_limit);
      const minOk = subtotal >= Number(c.min_order);
      const userOk = !c.user_id || c.user_id === userId;

      if (!userOk) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, message: "This coupon is not valid for your account." });
      }
      if (!usageOk) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, message: "Coupon usage limit has been reached." });
      }
      if (!minOk) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, message: `Minimum order value of ₹${c.min_order} required for this coupon.` });
      }

      discountAmount = c.type === 'percent'
        ? (subtotal * Number(c.value)) / 100
        : Number(c.value);
      if (Number(c.max_discount) > 0) discountAmount = Math.min(discountAmount, Number(c.max_discount));
      discountAmount = +Math.min(discountAmount, subtotal).toFixed(2);
      total = +(total - discountAmount).toFixed(2);
      if (total < 0) total = 0;
      appliedCouponId = c.id;
      appliedCouponCode = c.code;
      await client.query('UPDATE coupons SET used_count = used_count + 1, updated_at = NOW() WHERE id = $1', [c.id]);
    }

    /* ================= LOYALTY / WALLET SETTINGS ================= */
    const loyaltyConfig = await getLoyaltySettings();

    /* ================= WALLET DISCOUNT ================= */
    let walletDiscountApplied = 0;
    let loyaltyDiscountApplied = 0;
    let loyaltyPointsDeducted = 0;

    if (loyaltyConfig.wallet_enabled && requestedWalletDiscount && Number(requestedWalletDiscount) > 0) {
      const walletRes = await client.query(`SELECT wallet_balance FROM users WHERE id=$1 FOR UPDATE`, [userId]);
      const currentBalance = Number(walletRes.rows[0]?.wallet_balance || 0);
      walletDiscountApplied = Math.min(Number(requestedWalletDiscount), currentBalance, total);
    }

    if (loyaltyConfig.loyalty_enabled && requestedLoyaltyDiscount && Number(requestedLoyaltyDiscount) > 0) {
      const loyaltyRes = await client.query(`SELECT loyalty_points_balance FROM users WHERE id=$1 FOR UPDATE`, [userId]);
      const pts = Number(loyaltyRes.rows[0]?.loyalty_points_balance || 0);
      // redeemRate = ₹ per point; maxRedeemPercent limits how much of the order can be covered
      const redeemRate = loyaltyConfig.loyalty_redeem_rate;
      const maxByPercent = +(total * loyaltyConfig.loyalty_max_redeem_percent / 100).toFixed(2);
      const maxByPoints = +(pts * redeemRate).toFixed(2);
      const maxDiscount = Math.min(maxByPoints, maxByPercent);
      loyaltyDiscountApplied = Math.min(Number(requestedLoyaltyDiscount), maxDiscount, total - walletDiscountApplied);
      // points to deduct = discount / redeemRate (rounded up)
      loyaltyPointsDeducted = Math.ceil(loyaltyDiscountApplied / redeemRate);
    }

    const finalTotal = Math.max(0, total - walletDiscountApplied - loyaltyDiscountApplied);

    /* ================= CREATE ORDER ================= */

  const expectedDeliveryDate = new Date()
  expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + deliveryDays)

   const orderRes = await client.query(`
  INSERT INTO orders
  (
    user_id,
    total_amount,
    payment_method,
    shipping_address,
    address_id,
    status,
    payment_status,
    expires_at,
    coupon_code,
    discount_amount,
    wallet_discount,
    expected_delivery_date
  )
  VALUES
  ($1,$2,$3,$4,$5,$6,$7,NOW() + INTERVAL '15 minutes',$8,$9,$10,$11)
  RETURNING id
`, [
  userId,
  finalTotal,
  paymentMethod,

  /* Address snapshot (safe copy) */
  JSON.stringify({
    name: shipping?.name || "",
    phone: shipping?.phone || "",
    address: `${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}`,
    address_id: addr.id,
    type: addr.type,

    /* Price breakup */
    price_breakup: {
      subtotal,
      gst: totalTax,
      delivery,
      platform_fee: PLATFORM,
      discount: discountAmount,
      wallet_discount: walletDiscountApplied,
      coupon_code: appliedCouponCode,
      grand_total: finalTotal
    }
  }),

  /* FK reference */
  addr.id,

  STATUS_PENDING,

  paymentMethod === "cod" ? "pending" : "unpaid",

  appliedCouponCode,
  discountAmount,
  walletDiscountApplied,
  expectedDeliveryDate.toISOString().slice(0, 10),
]);

    const orderId = orderRes.rows[0].id;

    /* ================= DEDUCT WALLET BALANCE ================= */
    if (walletDiscountApplied > 0) {
      await client.query(
        `UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id=$2`,
        [walletDiscountApplied, userId]
      );
      await client.query(
        `INSERT INTO wallet_transactions (user_id, amount, type, source, order_id, description)
         VALUES ($1, $2, 'debit', 'order', $3, $4)`,
        [userId, walletDiscountApplied, orderId, `Used on order #${orderId}`]
      );
    }

    /* ================= DEDUCT LOYALTY POINTS ================= */
    if (loyaltyPointsDeducted > 0) {
      await client.query(
        `UPDATE users SET loyalty_points_balance = loyalty_points_balance - $1 WHERE id=$2`,
        [loyaltyPointsDeducted, userId]
      );
      await client.query(
        `INSERT INTO loyalty_points (user_id, points, type, source, order_id, description)
         VALUES ($1, $2, 'redeem', 'order', $3, $4)`,
        [userId, loyaltyPointsDeducted, orderId, `Redeemed on order #${orderId}`]
      );
    }

    /* ================= RECORD COUPON USE ================= */

    if (appliedCouponId) {
      await client.query(
        'INSERT INTO coupon_uses (coupon_id, user_id, order_id) VALUES ($1,$2,$3)',
        [appliedCouponId, userId, orderId]
      );
    }

    /* ================= CREATE ITEMS ================= */

    for (const item of cart) {

      const regularPrice = Number(item.effective_price);
      const flashPrice = flashPriceMap[item.product_id]
      // Use flash price when it's cheaper (flash sale applies to this product)
      const price = (flashPrice != null && flashPrice < regularPrice) ? flashPrice : regularPrice
      const qty = Number(item.quantity);

      await client.query(`
        INSERT INTO order_items
        (order_id, product_id, variant_id, variant_label, quantity, price)
        VALUES ($1,$2,$3,$4,$5,$6)
      `, [
        orderId,
        item.product_id,
        item.variant_id || null,
        item.variant_label || null,
        qty,
        price,
      ]);
    }

    /* ================= PRICE AUDIT LOG ================= */
    try {
      const userRow = await client.query(
        `SELECT name, email, phone FROM users WHERE id=$1`, [userId]
      )
      const u = userRow.rows[0] || {}

      // One log row per item that received a flash sale discount
      for (const item of cart) {
        const regularPrice = Number(item.effective_price)
        const flashPrice   = flashPriceMap[item.product_id]
        if (flashPrice != null && flashPrice < regularPrice) {
          const savingsPerItem = +(regularPrice - flashPrice).toFixed(2)
          const qty            = Number(item.quantity)
          const fsId           = flashSaleIdMap[item.product_id] || null
          await client.query(
            `INSERT INTO price_logs
               (order_id, user_id, user_name, user_email, user_phone,
                product_id, product_name, original_price, paid_price, quantity,
                savings_per_item, total_savings, reason_type, reason_detail, flash_sale_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'flash_sale',$13,$14)`,
            [
              orderId, userId, u.name || null, u.email || null, u.phone || null,
              item.product_id, item.product_name || null,
              regularPrice, flashPrice, qty,
              savingsPerItem, +(savingsPerItem * qty).toFixed(2),
              `Flash Sale ID:${fsId}`, fsId
            ]
          )
        }
      }

      // Coupon discount — one row per order
      if (appliedCouponId && discountAmount > 0) {
        await client.query(
          `INSERT INTO price_logs
             (order_id, user_id, user_name, user_email, user_phone,
              total_savings, reason_type, reason_detail, coupon_code)
           VALUES ($1,$2,$3,$4,$5,$6,'coupon',$7,$8)`,
          [orderId, userId, u.name || null, u.email || null, u.phone || null,
           discountAmount, `Coupon: ${appliedCouponCode}`, appliedCouponCode]
        )
      }

      // Wallet discount — one row per order
      if (walletDiscountApplied > 0) {
        await client.query(
          `INSERT INTO price_logs
             (order_id, user_id, user_name, user_email, user_phone,
              total_savings, reason_type, reason_detail)
           VALUES ($1,$2,$3,$4,$5,$6,'wallet',$7)`,
          [orderId, userId, u.name || null, u.email || null, u.phone || null,
           walletDiscountApplied, `Wallet credit applied on order #${orderId}`]
        )
      }

      // Loyalty points discount — one row per order
      if (loyaltyDiscountApplied > 0) {
        await client.query(
          `INSERT INTO price_logs
             (order_id, user_id, user_name, user_email, user_phone,
              total_savings, reason_type, reason_detail)
           VALUES ($1,$2,$3,$4,$5,$6,'loyalty_points',$7)`,
          [orderId, userId, u.name || null, u.email || null, u.phone || null,
           loyaltyDiscountApplied,
           `Loyalty points redeemed (${loyaltyPointsDeducted} pts) on order #${orderId}`]
        )
      }
    } catch (logErr) {
      console.error('Price log write failed (non-fatal):', logErr.message)
    }

    /* ================= UPDATE FLASH SALE COUNTS (DB only — emit AFTER commit) ================= */

    // Collect socket events to fire after COMMIT so clients never see pre-commit state
    const pendingSocketEvents = []

    try {
      const flashSaleIdsUsed = new Set()

      for (const item of cart) {
        const flashSaleId = flashSaleIdMap[item.product_id]
        if (!flashSaleId) continue
        flashSaleIdsUsed.add(flashSaleId)

        const updProd = await client.query(
          `UPDATE flash_sale_products SET sold_count = sold_count + $1
           WHERE flash_sale_id = $2 AND product_id = $3
           RETURNING sold_count, stock_limit`,
          [item.quantity, flashSaleId, item.product_id]
        )
        const pr = updProd.rows[0]
        if (pr) {
          pendingSocketEvents.push(['flash_product_update', {
            saleId: flashSaleId,
            productId: item.product_id,
            soldCount: pr.sold_count,
            stockLimit: pr.stock_limit,
          }])
          if (pr.stock_limit && pr.sold_count >= pr.stock_limit) {
            pendingSocketEvents.push(['flash_product_sold_out', {
              saleId: flashSaleId,
              productId: item.product_id,
            }])
          }
        }
      }

      for (const saleId of flashSaleIdsUsed) {
        const updSale = await client.query(
          `UPDATE flash_sales SET uses_count = uses_count + 1 WHERE id = $1
           RETURNING uses_count, max_uses, title`,
          [saleId]
        )
        const sr = updSale.rows[0]
        if (sr && sr.max_uses && sr.uses_count >= sr.max_uses) {
          pendingSocketEvents.push(['flash_sale_exhausted', {
            saleId,
            title: sr.title,
          }])
        }
      }
    } catch (flashErr) {
      console.error('Flash sale count update failed (non-fatal):', flashErr.message)
    }

    /* ================= COD STOCK DEDUCTION ================= */

    if (paymentMethod === "cod") {

      for (const item of cart) {

        if (item.variant_id) {
          /* deduct from variant */
          const rv = await client.query(`
            UPDATE product_variants
            SET inventory = inventory - $1
            WHERE id = $2 AND inventory >= $1
            RETURNING id
          `, [item.quantity, item.variant_id]);

          if (!rv.rows.length) throw new Error("Variant stock update failed");
        } else {
          /* deduct from product */
          const rp = await client.query(`
            UPDATE products
            SET inventory = inventory - $1
            WHERE id = $2 AND inventory >= $1
            RETURNING id
          `, [item.quantity, item.product_id]);

          if (!rp.rows.length) throw new Error("Stock update failed");
        }
      }

      await client.query(
        "DELETE FROM cart WHERE user_id=$1",
        [userId]
      );
    }

    /* ================= ONLINE ================= */

    let razorpayOrder = null;

    if (paymentMethod === "online") {

      razorpayOrder = await razorpay.orders.create({

        amount: Math.round(finalTotal * 100),

        currency: "INR",

        receipt: `ORD_${orderId}`,

        payment_capture: 1
      });

      await client.query(`
        UPDATE orders
        SET razorpay_order_id=$1
        WHERE id=$2
      `, [
        razorpayOrder.id,
        orderId
      ]);
    }

    /* ================= REFERRAL REWARD (COD — payment committed immediately) ================= */
    if (paymentMethod === 'cod') {
      await creditReferralReward(client, userId, orderId);
    }

    await client.query("COMMIT");

    // ── Payment log ──
    if (paymentMethod === 'cod') {
      logPayment(orderId, 'order_placed', { amount: finalTotal, status: 'pending', initiatedBy: 'customer', metadata: { payment_method: 'cod' } });
    } else if (razorpayOrder) {
      logPayment(orderId, 'razorpay_order_created', { amount: finalTotal, status: 'initiated', gatewayOrderId: razorpayOrder.id, initiatedBy: 'customer', metadata: { payment_method: 'online' } });
    }

    /* ================= FIRE SOCKET EVENTS (after commit — data is now visible) ================= */
    try {
      const { emitToAll } = require('../../socket')
      for (const [event, payload] of pendingSocketEvents) {
        emitToAll(event, payload)
      }
    } catch (_) {}

    /* ================= NOTIFY ADMIN (real-time) ================= */
    try {
      emitToAdmin('new_order', { order_id: orderId, user_id: userId });
    } catch (_) {}

    /* ================= ORDER CONFIRMATION EMAIL ================= */
    if (paymentMethod === 'cod') {
      try {
        const [uRes, invRes] = await Promise.all([
          pool.query(`SELECT name, email FROM users WHERE id=$1`, [userId]),
          pool.query(`SELECT invoice_no, shipping_address FROM orders WHERE id=$1`, [orderId]),
        ])
        const uRow = uRes.rows[0] || {}
        const invRow = invRes.rows[0] || {}
        if (uRow.email) {
          sendOrderConfirmationEmail({
            email: uRow.email,
            name: uRow.name,
            orderId,
            invoiceNo: invRow.invoice_no,
            items: cart.map(i => ({ name: i.product_name, quantity: i.quantity, price: i.effective_price, variant_label: i.variant_label || null })),
            total,
            paymentMethod: 'cod',
            address: invRow.shipping_address?.address || '',
          })
        }
      } catch (_) {}
    }

    /* ================= RESPONSE ================= */

    res.json({
      success: true,

      orderId,

      amount: finalTotal,

      breakup: {
        subtotal,
        gst: totalTax,
        delivery,
        platformFee: PLATFORM,
        grandTotal: finalTotal
      },

      razorpay: razorpayOrder,
      razorpayKey: razorpayOrder ? process.env.RAZORPAY_KEY : undefined,
    });

  } catch (err) {

    await client.query("ROLLBACK");

    console.error("[CREATE ORDER]", err);

    res.status(400).json({
      success: false,
      message: err.message || "Order failed"
    });

  } finally {

    client.release();

  }
}

/* ================= VERIFY PAYMENT ================= */

exports.verifyPayment = async (req, res) => {

  const client = await pool.connect();

  try {

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !orderId
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment payload"
      });
    }

    /* ================= VERIFY SIGNATURE ================= */

    const body =
      razorpay_order_id + "|" + razorpay_payment_id;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid signature"
      });
    }

    await client.query("BEGIN");

    /* ================= LOCK ORDER ================= */

    const order = await client.query(`
      SELECT *
      FROM orders
      WHERE id=$1 AND user_id=$2
      FOR UPDATE
    `, [orderId, userId]);

    if (!order.rows.length) {
      throw new Error("Order not found");
    }

    const orderData = order.rows[0];

    if (orderData.payment_status === "paid") {
      return res.json({ success: true });
    }

    if (!orderData.razorpay_order_id) {
      throw new Error("Invalid order");
    }

    /* ================= CHECK EXPIRY ================= */

    if (orderData.expires_at && new Date() > orderData.expires_at) {
      throw new Error("Order expired");
    }

    /* ================= REDUCE STOCK (variant-aware) ================= */

    const items = await client.query(`
      SELECT product_id, variant_id, quantity FROM order_items WHERE order_id=$1
    `, [orderId]);

    for (const item of items.rows) {

      if (item.variant_id) {
        const rv = await client.query(`
          UPDATE product_variants
          SET inventory = inventory - $1
          WHERE id=$2 AND inventory >= $1
          RETURNING id
        `, [item.quantity, item.variant_id]);

        if (!rv.rows.length) throw new Error("Variant stock mismatch");
      } else {
        const rp = await client.query(`
          UPDATE products
          SET inventory = inventory - $1
          WHERE id=$2 AND inventory >= $1
          RETURNING id
        `, [item.quantity, item.product_id]);

        if (!rp.rows.length) throw new Error("Stock mismatch");
      }
    }

    /* ================= UPDATE ORDER ================= */

    await client.query(`
      UPDATE orders
      SET
        payment_status='paid',
        status=1,
        razorpay_payment_id=$1,
        razorpay_signature=$2
      WHERE id=$3
    `, [
      razorpay_payment_id,
      razorpay_signature,
      orderId
    ]);

    /* ================= CLEAR CART ================= */

    await client.query(
      "DELETE FROM cart WHERE user_id=$1",
      [userId]
    );

    /* ================= REFERRAL REWARD (online — fire after payment verified) ================= */
    await creditReferralReward(client, userId, orderId);

    await client.query("COMMIT");

    // ── Payment log ──
    logPayment(orderId, 'payment_captured', {
      amount: orderData.total_amount,
      status: 'success',
      gatewayPaymentId: razorpay_payment_id,
      gatewayOrderId: razorpay_order_id,
      initiatedBy: 'customer',
    });

    /* ================= ORDER CONFIRMATION EMAIL (online payment) ================= */
    try {
      const [userRow, orderRow, itemsRow] = await Promise.all([
        pool.query(`SELECT name, email FROM users WHERE id=$1`, [userId]),
        pool.query(`SELECT invoice_no, shipping_address, total_amount FROM orders WHERE id=$1`, [orderId]),
        pool.query(`SELECT oi.quantity, oi.price, oi.variant_label, p.name as product_name FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id=$1`, [orderId]),
      ])
      const userInfo = userRow.rows[0]
      const orderInfo = orderRow.rows[0]
      if (userInfo?.email) {
        sendOrderConfirmationEmail({
          email: userInfo.email,
          name: userInfo.name,
          orderId,
          invoiceNo: orderInfo?.invoice_no,
          items: itemsRow.rows,
          total: orderInfo?.total_amount,
          paymentMethod: 'online',
          address: orderInfo?.shipping_address?.address || '',
        })
      }
    } catch (_) {}

    res.json({ success: true });

  } catch (err) {

    await client.query("ROLLBACK");

    console.error("[VERIFY PAYMENT]", err);

    res.status(500).json({
      success: false,
      message: err.message || "Payment verification failed"
    });

  } finally {

    client.release();
  }
};

/* ================= GET SINGLE ORDER ================= */

exports.getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        o.id,
        o.invoice_no,
        o.status,
        o.payment_method,
        o.payment_status,
        o.total_amount,
        o.created_at,
        o.tracking_number,
        o.courier_name,
        o.shipped_at,
        o.shipping_address,
        o.razorpay_order_id,
        o.razorpay_payment_id,
        o.cancel_reason,
        o.return_reason,
        o.refund_id,
        o.refund_amount,
        o.refund_status,

        i.id           AS invoice_id,
        i.invoice_no   AS invoice_number,
        i.invoice_date,
        i.pdf_url,

        json_agg(
          json_build_object(
            'product_id', p.id,
            'name',       p.name,
            'quantity',   oi.quantity,
            'price',      oi.price,
            'image',      p.images->>0
          )
        ) AS items

      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN products p     ON p.id = oi.product_id
      LEFT JOIN invoices i ON i.order_id = o.id

      WHERE o.id = $1 AND o.user_id = $2
      GROUP BY o.id, i.id
      `,
      [id, userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("[GET ORDER BY ID]", err);
    res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
};

/* ================= GET USER INVOICE ================= */
exports.getUserInvoice = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await pool.query(
      `SELECT i.pdf_url FROM orders o LEFT JOIN invoices i ON i.order_id=o.id WHERE o.id=$1 AND o.user_id=$2`,
      [id, userId]
    );
    if (!result.rowCount) return res.status(404).json({ success: false, message: 'Order not found' });
    const pdf_url = result.rows[0].pdf_url;
    if (!pdf_url) return res.status(404).json({ success: false, message: 'Invoice not yet generated' });
    res.json({ success: true, pdf_url });
  } catch (err) {
    console.error('[GET USER INVOICE]', err);
    res.status(500).json({ success: false, message: 'Failed to get invoice' });
  }
};

/* ================= CANCEL ORDER ================= */

exports.cancelOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { reason } = req.body;

    await client.query("BEGIN");

    const orderRes = await client.query(
      `SELECT * FROM orders WHERE id=$1 AND user_id=$2 FOR UPDATE`,
      [id, userId]
    );

    if (!orderRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const order = orderRes.rows[0];

    if (order.status === 6) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Order already cancelled" });
    }

    if (![0, 1].includes(order.status)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled at this stage"
      });
    }

    // Restore inventory (variant-aware)
    const items = await client.query(
      `SELECT product_id, variant_id, quantity FROM order_items WHERE order_id=$1`,
      [id]
    );

    // Restore inventory if:
    // - Online order that was actually paid (stock was deducted at payment time)
    // - COD order (stock is always deducted at creation, regardless of payment_status)
    if (order.payment_status === "paid" || order.payment_method === "cod") {
      for (const item of items.rows) {
        if (item.variant_id) {
          await client.query(
            `UPDATE product_variants SET inventory = inventory + $1 WHERE id = $2`,
            [item.quantity, item.variant_id]
          );
        } else {
          await client.query(
            `UPDATE products SET inventory = inventory + $1 WHERE id = $2`,
            [item.quantity, item.product_id]
          );
        }
      }
    }

    await client.query(
      `UPDATE orders SET status=6, cancel_reason=$1, updated_at=NOW() WHERE id=$2`,
      [reason || "Cancelled by customer", id]
    );

    await client.query("COMMIT");

    // Send cancellation email (fire-and-forget)
    try {
      const uRow = await pool.query(`SELECT u.name, u.email, o.invoice_no FROM users u JOIN orders o ON o.user_id=u.id WHERE o.id=$1`, [id])
      if (uRow.rows[0]?.email) {
        const refundDue = order.payment_method !== 'cod' && order.payment_status === 'paid'
        sendOrderCancelledEmail({
          email: uRow.rows[0].email, name: uRow.rows[0].name,
          orderId: id, invoiceNo: uRow.rows[0].invoice_no,
          reason: reason || 'Cancelled by customer',
          refundAmount: refundDue ? order.total_amount : null,
          refundTo: refundDue ? 'bank' : null,
        })
      }
    } catch (_) {}

    // Auto-refund for online orders that were already paid (runs after commit so cancellation always succeeds)
    if (order.payment_method !== 'cod' && order.payment_status === 'paid' && order.razorpay_payment_id) {
      try {
        const refundAmount = Math.round(Number(order.total_amount) * 100);
        const refund = await razorpay.payments.refund(order.razorpay_payment_id, {
          amount: refundAmount,
          speed: 'normal',
          notes: { order_id: id, reason: 'Order cancelled by customer' }
        });
        // Use Razorpay's actual refund status ('pending' | 'processed')
        const rzpStatus = refund.status === 'processed' ? 'processed' : 'pending';
        await pool.query(
          `UPDATE orders SET refund_id=$1, refund_amount=$2, refund_status=$3, payment_status='refunded', updated_at=NOW() WHERE id=$4`,
          [refund.id, Number(order.total_amount), rzpStatus, id]
        );
        logPayment(id, 'refund_initiated', {
          amount: order.total_amount,
          status: rzpStatus,
          gatewayPaymentId: order.razorpay_payment_id,
          gatewayRefundId: refund.id,
          initiatedBy: 'customer',
          notes: req.body?.reason || 'Order cancelled by customer',
        });
      } catch (refundErr) {
        console.error('[CANCEL REFUND ERROR]', refundErr.message);
        await pool.query(`UPDATE orders SET refund_status='failed', updated_at=NOW() WHERE id=$1`, [id]);
        logPayment(id, 'refund_initiation_failed', {
          status: 'failed',
          gatewayPaymentId: order.razorpay_payment_id,
          initiatedBy: 'customer',
          notes: refundErr.message,
        });
      }
    }

    res.json({ success: true, message: "Order cancelled successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[CANCEL ORDER]", err);
    res.status(500).json({ success: false, message: "Cancellation failed" });
  } finally {
    client.release();
  }
};

/* ================= REQUEST RETURN ================= */

exports.returnOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const { uploadImageToAWS } = require('../../utils/awsImageUpload');
    const userId = req.user.id;
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: "Return reason is required" });
    }

    // Upload any attached files to S3
    const uploadedUrls = [];
    if (req.files?.length) {
      for (const file of req.files) {
        try {
          const url = await uploadImageToAWS(file, 'returns');
          uploadedUrls.push(url);
        } catch (_) {}
      }
    }
    // Also accept pre-uploaded URLs sent as JSON array string
    let extraUrls = [];
    try { extraUrls = JSON.parse(req.body.imageUrls || '[]'); } catch (_) {}
    const returnImages = [...uploadedUrls, ...extraUrls.filter((u) => typeof u === 'string' && u.startsWith('http'))];

    await client.query("BEGIN");

    const orderRes = await client.query(
      `SELECT * FROM orders WHERE id=$1 AND user_id=$2 FOR UPDATE`,
      [id, userId]
    );

    if (!orderRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const order = orderRes.rows[0];

    if (order.status === 7) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Return already requested" });
    }

    if (order.status !== 5) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Return can only be requested for delivered orders"
      });
    }

    // Check if products are returnable
    const itemsCheck = await client.query(
      `SELECT p.is_returnable FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = $1 AND p.is_returnable = FALSE LIMIT 1`,
      [id]
    );
    if (itemsCheck.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: 'This order contains non-returnable products' });
    }

    // Enforce 7-day return window from actual delivery timestamp
    const deliveredAt = order.delivered_at ? new Date(order.delivered_at) : new Date(order.updated_at);
    const daysSinceDelivery = (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > 7) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Return window expired. Returns must be requested within 7 days of delivery."
      });
    }

    await client.query(
      `UPDATE orders SET status=7, return_reason=$1, return_images=$2, updated_at=NOW() WHERE id=$3`,
      [reason, JSON.stringify(returnImages), id]
    );

    await client.query("COMMIT");

    // Send return-requested email (fire-and-forget)
    try {
      const uRow = await pool.query(`SELECT u.name, u.email, o.invoice_no FROM users u JOIN orders o ON o.user_id=u.id WHERE o.id=$1`, [id])
      if (uRow.rows[0]?.email) sendReturnRequestedEmail({ email: uRow.rows[0].email, name: uRow.rows[0].name, orderId: id, invoiceNo: uRow.rows[0].invoice_no })
    } catch (_) {}

    res.json({ success: true, message: "Return request submitted successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[RETURN ORDER]", err);
    res.status(500).json({ success: false, message: "Return request failed" });
  } finally {
    client.release();
  }
};

/* ================= RAZORPAY HTML PAYMENT PAGE ================= */

/* ================= PAYMENT REDIRECT (HTTP 302 → custom scheme) ================= */
// Chrome Custom Tabs blocks JS-initiated window.location to custom schemes but
// follows HTTP 302 redirects. This endpoint issues that redirect.
exports.paymentRedirect = (req, res) => {
  const { deepLink, ...rest } = req.query;
  const decoded = deepLink ? decodeURIComponent(deepLink) : '';
  if (!decoded.startsWith('oroganix://')) {
    return res.status(400).send('Invalid redirect target');
  }
  const params = new URLSearchParams(rest).toString();
  res.redirect(302, params ? `${decoded}?${params}` : decoded);
};

exports.getPaymentPage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { returnUrl } = req.query;

    const orderRes = await pool.query(
      `SELECT id, total_amount, razorpay_order_id, payment_status FROM orders WHERE id=$1 AND user_id=$2`,
      [id, userId]
    );

    if (!orderRes.rows.length) {
      return res.status(404).send('<h2>Order not found</h2>');
    }

    const order = orderRes.rows[0];

    if (order.payment_status === 'paid') {
      return res.send('<h2>Payment already completed!</h2>');
    }

    if (!order.razorpay_order_id) {
      return res.status(400).send('<h2>Invalid order for online payment</h2>');
    }

    // Route JS navigation through a backend HTTP 302 redirect because Chrome
    // Custom Tabs blocks window.location to custom schemes from JS callbacks.
    const deepLinkReturn = (returnUrl && returnUrl.startsWith('oroganix://'))
      ? returnUrl
      : 'oroganix://payment';
    const backendBase = `${req.protocol}://${req.get('host')}`;
    const callbackUrl = `${backendBase}/api/orders/payment-redirect?deepLink=${encodeURIComponent(deepLinkReturn)}`;
    const keyId = process.env.RAZORPAY_KEY;
    const amount = Math.round(Number(order.total_amount) * 100);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Oroganix Payment</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, sans-serif; background: #0d120d; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #1a2e1e; border-radius: 20px; padding: 36px; max-width: 380px; width: 90%; text-align: center; }
    .logo { font-size: 48px; margin-bottom: 12px; }
    h1 { color: #fff; font-size: 22px; margin-bottom: 6px; }
    .sub { color: rgba(255,255,255,0.5); font-size: 13px; margin-bottom: 24px; }
    .amount { font-size: 42px; font-weight: 900; color: #c9a84c; margin-bottom: 28px; }
    button { background: linear-gradient(90deg, #1a2e1e, #2d5a3d); color: #fff; border: none; border-radius: 14px; padding: 16px 32px; font-size: 15px; font-weight: 700; cursor: pointer; width: 100%; }
    button:active { opacity: 0.8; }
    .secure { color: rgba(255,255,255,0.3); font-size: 11px; margin-top: 16px; }
    #status { margin-top: 16px; padding: 12px; border-radius: 10px; display: none; font-weight: 600; }
    #status.success { background: rgba(16,185,129,0.2); color: #6ee7b7; }
    #status.error { background: rgba(239,68,68,0.2); color: #fca5a5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🌿</div>
    <h1>Oroganix</h1>
    <div class="sub">Pure · Natural · Ayurvedic</div>
    <div class="amount">₹${(amount / 100).toFixed(2)}</div>
    <button id="payBtn" onclick="startPayment()">Pay Now · ₹${(amount / 100).toFixed(2)}</button>
    <div class="secure">🔒 256-bit SSL encrypted payment</div>
    <div id="status"></div>
  </div>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    function startPayment() {
      document.getElementById('payBtn').disabled = true;
      document.getElementById('payBtn').textContent = 'Opening payment...';
      var options = {
        key: '${keyId}',
        amount: ${amount},
        currency: 'INR',
        name: 'Oroganix',
        description: 'Order #${id}',
        order_id: '${order.razorpay_order_id}',
        theme: { color: '#1a2e1e' },
        handler: function(response) {
          var s = document.getElementById('status');
          s.textContent = 'Payment successful! Verifying...';
          s.style.display = 'block';
          s.className = 'success';
          var returnBase = '${callbackUrl}';
          var redirectUrl = returnBase + '?orderId=${id}&razorpay_payment_id=' + response.razorpay_payment_id + '&razorpay_order_id=' + response.razorpay_order_id + '&razorpay_signature=' + response.razorpay_signature + '&status=success';
          setTimeout(function(){ window.location.href = redirectUrl; }, 800);
        },
        modal: {
          ondismiss: function() {
            document.getElementById('payBtn').disabled = false;
            document.getElementById('payBtn').textContent = 'Pay Now · ₹${(amount / 100).toFixed(2)}';
            var s = document.getElementById('status');
            s.textContent = 'Payment cancelled.';
            s.style.display = 'block';
            s.className = 'error';
            var returnBase = '${callbackUrl}';
            setTimeout(function(){ window.location.href = returnBase + '?orderId=${id}&status=cancelled'; }, 1200);
          }
        }
      };
      var rzp = new Razorpay(options);
      rzp.open();
    }
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error('[PAYMENT PAGE]', err);
    res.status(500).send('<h2>Server error</h2>');
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const countRes = await pool.query(
      `SELECT COUNT(DISTINCT o.id) FROM orders o WHERE o.user_id=$1`,
      [userId]
    );
    const total = Number(countRes.rows[0].count);

    const result = await pool.query(
  `
  SELECT
    o.id,
    o.invoice_no,
    o.status,
    o.total_amount,
    o.payment_method,
    o.created_at,
    o.tracking_number,
    o.courier_name,
    o.shipped_at,
    o.shipping_address,
    o.return_reason,

    /* Invoice Details */
    i.id           AS invoice_id,
    i.invoice_no   AS invoice_number,
    i.invoice_date,
    i.subtotal     AS invoice_subtotal,
    i.tax          AS invoice_tax,
    i.total        AS invoice_total,
    i.pdf_url,

    /* Order Items — include variant_label */
    json_agg(
      json_build_object(
        'product_id', p.id,
        'name', p.name,
        'quantity', oi.quantity,
        'price', oi.price,
        'image', p.images->>0,
        'variant_label', COALESCE(pv.label, oi.variant_label, NULL)
      ) ORDER BY oi.id
    ) AS items

  FROM orders o

  JOIN order_items oi
    ON oi.order_id = o.id

  JOIN products p
    ON p.id = oi.product_id

  LEFT JOIN product_variants pv
    ON pv.id = oi.variant_id

  /* Invoice Join */
  LEFT JOIN invoices i
    ON i.order_id = o.id

  WHERE o.user_id = $1

  GROUP BY
    o.id,
    i.id

  ORDER BY o.created_at DESC
  LIMIT $2 OFFSET $3
  `,
  [userId, limit, offset]
);

    res.json({
      success: true,
      data: result.rows,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });

  } catch (err) {
    console.error("Get Orders Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

/* ================= ORDER STATUS TIMELINE (user-facing) ================= */

exports.getOrderTimeline = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const own = await pool.query(
      `SELECT o.id, o.status, o.courier_name, o.tracking_number, o.shipped_at,
              o.created_at as order_placed_at,
              sp.delivery_days
       FROM orders o
       LEFT JOIN user_addresses ua ON ua.id = o.address_id
       LEFT JOIN serviceable_pincodes sp ON sp.pincode = ua.pincode
       WHERE o.id=$1 AND o.user_id=$2`,
      [id, userId]
    );
    if (!own.rows.length)
      return res.status(404).json({ success: false, message: "Order not found" });

    const orderInfo = own.rows[0];

    const logs = await pool.query(
      `SELECT
         osl.id,
         osl.old_status,
         osl.new_status,
         osl.note,
         osl.created_at,
         sm_old.label AS old_label,
         sm_new.label AS new_label
       FROM order_status_logs osl
       LEFT JOIN order_status_master sm_old ON sm_old.code = osl.old_status
       LEFT JOIN order_status_master sm_new ON sm_new.code = osl.new_status
       WHERE osl.order_id = $1
       ORDER BY osl.created_at ASC`,
      [id]
    );

    // Calculate ETA: shipped_at + delivery_days (fallback 5 days)
    let estimatedDelivery = null;
    if (orderInfo.shipped_at) {
      const days = orderInfo.delivery_days || 5;
      const eta = new Date(orderInfo.shipped_at);
      eta.setDate(eta.getDate() + days);
      estimatedDelivery = eta.toISOString();
    }

    res.json({
      success: true,
      timeline: logs.rows,
      tracking: {
        courier_name: orderInfo.courier_name || null,
        tracking_number: orderInfo.tracking_number || null,
        shipped_at: orderInfo.shipped_at || null,
        estimated_delivery: estimatedDelivery,
        current_status: orderInfo.status,
      }
    });
  } catch (err) {
    console.error("[ORDER TIMELINE]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ================= RETRY PAYMENT (for unpaid online orders) ================= */

exports.retryPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const orderRes = await pool.query(
      `SELECT id, total_amount, payment_status, status, payment_method, razorpay_order_id
       FROM orders WHERE id=$1 AND user_id=$2`,
      [id, userId]
    );

    if (!orderRes.rows.length)
      return res.status(404).json({ success: false, message: "Order not found" });

    const order = orderRes.rows[0];

    if (order.payment_method !== 'online')
      return res.status(400).json({ success: false, message: "Not an online payment order" });

    if (order.payment_status === 'paid')
      return res.status(400).json({ success: false, message: "Order is already paid" });

    if (order.status === 6)
      return res.status(400).json({ success: false, message: "Order has been cancelled" });

    // Extend expiry by 15 more minutes and create a fresh Razorpay order
    const amount = Math.round(Number(order.total_amount) * 100);
    const rzpOrder = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `retry_${id}_${Date.now()}`,
    });

    await pool.query(
      `UPDATE orders SET razorpay_order_id=$1, expires_at=NOW()+INTERVAL '15 minutes', status=0, updated_at=NOW() WHERE id=$2`,
      [rzpOrder.id, id]
    );

    res.json({
      success: true,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      orderId: order.id,
    });
  } catch (err) {
    console.error("[RETRY PAYMENT]", err);
    res.status(500).json({ success: false, message: "Failed to initiate payment retry" });
  }
};

/* ================= RAZORPAY WEBHOOK ================= */
// Mounted BEFORE express.json() using express.raw() so raw body is preserved for signature check.
// RAZORPAY_WEBHOOK_SECRET must be set in .env and match the secret configured in Razorpay dashboard.

exports.razorpayWebhook = async (req, res) => {
  const sig = req.headers['x-razorpay-signature'];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.warn('[WEBHOOK] RAZORPAY_WEBHOOK_SECRET not set — skipping');
    return res.status(200).json({ received: true });
  }

  // Verify signature using raw body (Buffer from express.raw())
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  if (expected !== sig) {
    console.warn('[WEBHOOK] Invalid Razorpay signature');
    return res.status(400).json({ success: false, message: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString());
  } catch {
    return res.status(400).json({ success: false, message: 'Bad payload' });
  }

  // Handle refund events
  if (event.event === 'refund.processed' || event.event === 'refund.failed') {
    const refund = event?.payload?.refund?.entity;
    if (!refund?.payment_id) return res.status(200).json({ received: true });

    const refundStatus = event.event === 'refund.processed' ? 'processed' : 'failed';
    try {
      const orderRes = await pool.query(
        `SELECT id, user_id FROM orders WHERE razorpay_payment_id=$1 LIMIT 1`,
        [refund.payment_id]
      );
      if (!orderRes.rows.length) return res.status(200).json({ received: true });

      const { id: orderId, user_id: userId } = orderRes.rows[0];
      await pool.query(
        `UPDATE orders SET refund_id=$1, refund_status=$2, refund_amount=$3, updated_at=NOW() WHERE id=$4`,
        [refund.id, refundStatus, Number(refund.amount) / 100, orderId]
      );

      // ── Payment log ──
      logPayment(orderId, refundStatus === 'processed' ? 'refund_processed' : 'refund_failed', {
        amount: Number(refund.amount) / 100,
        status: refundStatus,
        gatewayPaymentId: refund.payment_id,
        gatewayRefundId: refund.id,
        gatewayEvent: event.event,
        initiatedBy: 'system',
        notes: `Webhook: ${event.event}`,
      });

      try {
        if (refundStatus === 'processed') {
          createNotification(userId, 'refund', `Refund Processed 💚`,
            `Your refund of ₹${(Number(refund.amount) / 100).toFixed(2)} for Order #${orderId} has been processed.`,
            { order_id: orderId });
          emitToUser(userId, 'refund_processed', { order_id: orderId, amount: Number(refund.amount) / 100 });
        } else {
          createNotification(userId, 'refund', `Refund Failed`,
            `The refund for Order #${orderId} could not be processed. Please contact support.`,
            { order_id: orderId });
          emitToUser(userId, 'refund_failed', { order_id: orderId });
        }
      } catch (notifErr) {
        console.error('[REFUND WEBHOOK] notification error:', notifErr.message);
      }

      return res.status(200).json({ received: true });
    } catch (err) {
      console.error('[REFUND WEBHOOK] DB error:', err.message);
      return res.status(500).json({ success: false, message: 'Processing error' });
    }
  }

  // Only handle payment.captured — ignore everything else silently
  if (event.event !== 'payment.captured') {
    return res.status(200).json({ received: true });
  }

  const payment = event?.payload?.payment?.entity;
  if (!payment?.order_id) {
    return res.status(200).json({ received: true });
  }

  const razorpay_order_id = payment.order_id;
  const razorpay_payment_id = payment.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Find order by razorpay_order_id — lock row
    const orderRes = await client.query(
      `SELECT id, user_id, payment_status, expires_at FROM orders WHERE razorpay_order_id=$1 FOR UPDATE`,
      [razorpay_order_id]
    );
    if (!orderRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(200).json({ received: true }); // Unknown order — ack anyway
    }

    const order = orderRes.rows[0];

    // Idempotency — already processed (browser verify beat us)
    if (order.payment_status === 'paid') {
      await client.query('ROLLBACK');
      return res.status(200).json({ received: true });
    }

    const orderId = order.id;
    const userId = order.user_id;

    // Reduce stock (variant-aware) — same logic as verifyPayment
    const items = await client.query(
      `SELECT product_id, variant_id, quantity FROM order_items WHERE order_id=$1`,
      [orderId]
    );
    for (const item of items.rows) {
      if (item.variant_id) {
        const rv = await client.query(
          `UPDATE product_variants SET inventory = inventory - $1 WHERE id=$2 AND inventory >= $1 RETURNING id`,
          [item.quantity, item.variant_id]
        );
        if (!rv.rows.length) throw new Error(`Variant ${item.variant_id} stock mismatch`);
      } else {
        const rp = await client.query(
          `UPDATE products SET inventory = inventory - $1 WHERE id=$2 AND inventory >= $1 RETURNING id`,
          [item.quantity, item.product_id]
        );
        if (!rp.rows.length) throw new Error(`Product ${item.product_id} stock mismatch`);
      }
    }

    // Mark order paid
    await client.query(
      `UPDATE orders SET payment_status='paid', status=1, razorpay_payment_id=$1 WHERE id=$2`,
      [razorpay_payment_id, orderId]
    );

    // Clear cart
    await client.query(`DELETE FROM cart WHERE user_id=$1`, [userId]);

    // Credit referral reward
    await creditReferralReward(client, userId, orderId);

    await client.query('COMMIT');

    // ── Payment log ──
    logPayment(orderId, 'payment_captured_webhook', {
      status: 'success',
      gatewayPaymentId: razorpay_payment_id,
      gatewayOrderId: razorpay_order_id,
      gatewayEvent: event.event,
      initiatedBy: 'system',
      notes: 'Captured via Razorpay webhook',
    });

    // Fire admin socket notification
    try { emitToAdmin('new_order', { orderId }); } catch (_) {}

    // Send order confirmation email
    try {
      const [userRow, orderRow, itemsRow] = await Promise.all([
        pool.query(`SELECT name, email FROM users WHERE id=$1`, [userId]),
        pool.query(`SELECT invoice_no, shipping_address, total_amount FROM orders WHERE id=$1`, [orderId]),
        pool.query(
          `SELECT oi.quantity, oi.price, oi.variant_label, p.name as product_name
           FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id=$1`,
          [orderId]
        ),
      ]);
      const userInfo = userRow.rows[0];
      const orderInfo = orderRow.rows[0];
      if (userInfo?.email) {
        sendOrderConfirmationEmail({
          email: userInfo.email,
          name: userInfo.name,
          orderId,
          invoiceNo: orderInfo?.invoice_no,
          items: itemsRow.rows,
          total: orderInfo?.total_amount,
          paymentMethod: 'online',
          address: orderInfo?.shipping_address?.address || '',
        });
      }
    } catch (_) {}

    return res.status(200).json({ received: true });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[WEBHOOK] Error processing payment.captured:', err.message);
    // Return 500 so Razorpay retries delivery
    return res.status(500).json({ success: false, message: 'Processing error' });
  } finally {
    client.release();
  }
};

/* ================= REORDER — copy items from existing order into cart ================= */

exports.reorder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const orderRes = await pool.query(
      `SELECT o.id FROM orders o WHERE o.id=$1 AND o.user_id=$2`,
      [id, userId]
    );
    if (!orderRes.rows.length) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const itemsRes = await pool.query(
      `SELECT oi.product_id, oi.variant_id, oi.quantity,
              p.name, p.status,
              COALESCE(pv.inventory, p.inventory) AS eff_inv
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       LEFT JOIN product_variants pv ON pv.id = oi.variant_id
       WHERE oi.order_id = $1`,
      [id]
    );

    let added = 0;
    for (const item of itemsRes.rows) {
      if (item.status !== 'active' || item.eff_inv <= 0) continue;
      await pool.query(`
        INSERT INTO cart (user_id, product_id, variant_id, quantity)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, product_id, COALESCE(variant_id, -1))
        DO UPDATE SET quantity = cart.quantity + EXCLUDED.quantity, updated_at = NOW()
      `, [userId, item.product_id, item.variant_id || null, item.quantity]);
      added++;
    }

    res.json({ success: true, message: `${added} item(s) added to cart`, added });
  } catch (err) {
    console.error('[Reorder]', err.message);
    res.status(500).json({ success: false, message: 'Reorder failed' });
  }
};

/* ================= BUY NOW ================= */
// Like createOrder but takes a single item directly — never touches the cart table.

exports.buyNow = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const {
      productId, quantity: rawQty, variantId,
      shipping, paymentMethod, addressId, couponCode,
      walletDiscount: requestedWalletDiscount,
      loyaltyDiscount: requestedLoyaltyDiscount,
    } = req.body;

    const quantity = Math.max(1, Number(rawQty) || 1);

    if (!productId) return res.status(400).json({ success: false, message: 'Product is required' });
    if (!addressId) return res.status(400).json({ success: false, message: 'Address is required' });
    if (!['cod', 'online'].includes(paymentMethod))
      return res.status(400).json({ success: false, message: 'Invalid payment method' });

    // Address validation
    const addrRes = await client.query(
      `SELECT id, type, street, city, state, pincode FROM user_addresses WHERE id=$1 AND user_id=$2`,
      [addressId, userId]
    );
    if (!addrRes.rows.length)
      return res.status(400).json({ success: false, message: 'Invalid address selected' });
    const addr = addrRes.rows[0];

    // Pincode serviceability
    let deliveryDays = 5;
    if (addr.pincode) {
      const pc = await client.query(
        `SELECT delivery_days FROM serviceable_pincodes WHERE pincode=$1 AND is_active=TRUE LIMIT 1`,
        [addr.pincode]
      );
      if (!pc.rows.length)
        return res.status(400).json({ success: false, message: `Sorry, we don't deliver to pincode ${addr.pincode} yet.` });
      deliveryDays = pc.rows[0].delivery_days || 5;
    }

    await client.query('BEGIN');

    const appSettings = await getAppSettings(client);
    const DELIVERY = Number(appSettings.delivery_charge || 0);
    const PLATFORM = Number(appSettings.platform_fee || 0);
    const FREE_LIMIT = Number(appSettings.free_delivery_limit || 0);

    // Fetch product + variant in one query, lock product row
    const productRes = await client.query(`
      SELECT p.id AS product_id, p.name AS product_name, p.gst_percent, p.status,
             COALESCE(pv.price, p.price) AS effective_price,
             COALESCE(pv.inventory, p.inventory) AS effective_inventory,
             pv.label AS variant_label
      FROM products p
      LEFT JOIN product_variants pv ON pv.id = $2
      WHERE p.id = $1
      FOR UPDATE OF p
    `, [productId, variantId || null]);

    if (!productRes.rows.length) throw new Error('Product not found');
    const item = productRes.rows[0];
    if (item.status !== 'active') throw new Error('Product is unavailable');
    if (Number(item.effective_inventory) < quantity) throw new Error('Insufficient stock');

    // Flash sale
    let flashPrice = null;
    let flashSaleId = null;
    try {
      const flashRes = await client.query(`
        SELECT fsp.product_id, fs.id AS flash_sale_id,
          COALESCE(fsp.special_price,
            CASE WHEN fs.discount_type='percent' THEN p.price*(1-fs.discount_value/100)
            ELSE p.price-fs.discount_value END) AS flash_price
        FROM flash_sale_products fsp
        JOIN flash_sales fs ON fs.id=fsp.flash_sale_id
        JOIN products p ON p.id=fsp.product_id
        WHERE fsp.product_id=$1 AND fs.is_active=TRUE AND fs.starts_at<=NOW() AND fs.ends_at>NOW()
          AND (fs.max_uses IS NULL OR fs.uses_count<fs.max_uses)
          AND (fsp.stock_limit IS NULL OR fsp.sold_count<fsp.stock_limit)
        LIMIT 1
      `, [productId]);
      if (flashRes.rows.length) {
        flashPrice = parseFloat(flashRes.rows[0].flash_price);
        flashSaleId = flashRes.rows[0].flash_sale_id;
      }
    } catch (_) {}

    const regularPrice = Number(item.effective_price);
    const price = flashPrice != null && flashPrice < regularPrice ? flashPrice : regularPrice;
    const gst = Number(item.gst_percent || 0);
    let subtotal = +(price * quantity).toFixed(2);
    let totalTax = +((subtotal * gst) / 100).toFixed(2);
    const delivery = subtotal >= FREE_LIMIT ? 0 : DELIVERY;
    let total = +(subtotal + totalTax + delivery + PLATFORM).toFixed(2);
    if (total <= 0) throw new Error('Invalid order amount');

    // Coupon
    let discountAmount = 0, appliedCouponId = null, appliedCouponCode = null;
    if (couponCode) {
      const couponRes = await client.query(`
        SELECT * FROM coupons
        WHERE UPPER(code)=UPPER($1) AND is_active=TRUE
          AND (valid_from IS NULL OR valid_from<=NOW())
          AND (valid_to IS NULL OR valid_to>=NOW())
        FOR UPDATE
      `, [couponCode]);
      if (!couponRes.rows.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Coupon is expired or no longer valid.' });
      }
      const c = couponRes.rows[0];
      if (!(!c.user_id || c.user_id === userId)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'This coupon is not valid for your account.' });
      }
      if (!(Number(c.usage_limit) === 0 || c.used_count < Number(c.usage_limit))) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Coupon usage limit has been reached.' });
      }
      if (!(subtotal >= Number(c.min_order))) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: `Minimum order value of ₹${c.min_order} required.` });
      }
      discountAmount = c.type === 'percent' ? (subtotal * Number(c.value)) / 100 : Number(c.value);
      if (Number(c.max_discount) > 0) discountAmount = Math.min(discountAmount, Number(c.max_discount));
      discountAmount = +Math.min(discountAmount, subtotal).toFixed(2);
      total = +(total - discountAmount).toFixed(2);
      if (total < 0) total = 0;
      appliedCouponId = c.id; appliedCouponCode = c.code;
      await client.query('UPDATE coupons SET used_count=used_count+1,updated_at=NOW() WHERE id=$1', [c.id]);
    }

    // Wallet / Loyalty
    const loyaltyConfig = await getLoyaltySettings();
    let walletDiscountApplied = 0, loyaltyDiscountApplied = 0, loyaltyPointsDeducted = 0;

    if (loyaltyConfig.wallet_enabled && Number(requestedWalletDiscount) > 0) {
      const wr = await client.query(`SELECT wallet_balance FROM users WHERE id=$1 FOR UPDATE`, [userId]);
      walletDiscountApplied = Math.min(Number(requestedWalletDiscount), Number(wr.rows[0]?.wallet_balance || 0), total);
    }
    if (loyaltyConfig.loyalty_enabled && Number(requestedLoyaltyDiscount) > 0) {
      const lr = await client.query(`SELECT loyalty_points_balance FROM users WHERE id=$1 FOR UPDATE`, [userId]);
      const pts = Number(lr.rows[0]?.loyalty_points_balance || 0);
      const redeemRate = loyaltyConfig.loyalty_redeem_rate;
      const maxDiscount = Math.min(+(pts * redeemRate).toFixed(2), +(total * loyaltyConfig.loyalty_max_redeem_percent / 100).toFixed(2));
      loyaltyDiscountApplied = Math.min(Number(requestedLoyaltyDiscount), maxDiscount, total - walletDiscountApplied);
      loyaltyPointsDeducted = Math.ceil(loyaltyDiscountApplied / redeemRate);
    }

    const finalTotal = Math.max(0, total - walletDiscountApplied - loyaltyDiscountApplied);

    // Create order
    const expectedDeliveryDate = new Date();
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + deliveryDays);

    const orderRes = await client.query(`
      INSERT INTO orders
        (user_id,total_amount,payment_method,shipping_address,address_id,status,payment_status,
         expires_at,coupon_code,discount_amount,wallet_discount,expected_delivery_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()+INTERVAL '15 minutes',$8,$9,$10,$11)
      RETURNING id
    `, [
      userId, finalTotal, paymentMethod,
      JSON.stringify({
        name: shipping?.name || '', phone: shipping?.phone || '',
        address: `${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}`,
        address_id: addr.id, type: addr.type,
        price_breakup: { subtotal, gst: totalTax, delivery, platform_fee: PLATFORM,
          discount: discountAmount, wallet_discount: walletDiscountApplied,
          coupon_code: appliedCouponCode, grand_total: finalTotal }
      }),
      addr.id, STATUS_PENDING,
      paymentMethod === 'cod' ? 'pending' : 'unpaid',
      appliedCouponCode, discountAmount, walletDiscountApplied,
      expectedDeliveryDate.toISOString().slice(0, 10),
    ]);

    const orderId = orderRes.rows[0].id;

    if (walletDiscountApplied > 0) {
      await client.query(`UPDATE users SET wallet_balance=wallet_balance-$1 WHERE id=$2`, [walletDiscountApplied, userId]);
      await client.query(`INSERT INTO wallet_transactions (user_id,amount,type,source,order_id,description) VALUES ($1,$2,'debit','order',$3,$4)`,
        [userId, walletDiscountApplied, orderId, `Used on order #${orderId}`]);
    }
    if (loyaltyPointsDeducted > 0) {
      await client.query(`UPDATE users SET loyalty_points_balance=loyalty_points_balance-$1 WHERE id=$2`, [loyaltyPointsDeducted, userId]);
      await client.query(`INSERT INTO loyalty_points (user_id,points,type,source,order_id,description) VALUES ($1,$2,'redeem','order',$3,$4)`,
        [userId, loyaltyPointsDeducted, orderId, `Redeemed on order #${orderId}`]);
    }
    if (appliedCouponId) {
      await client.query('INSERT INTO coupon_uses (coupon_id,user_id,order_id) VALUES ($1,$2,$3)', [appliedCouponId, userId, orderId]);
    }

    // Insert single order item
    await client.query(`
      INSERT INTO order_items (order_id,product_id,variant_id,variant_label,quantity,price)
      VALUES ($1,$2,$3,$4,$5,$6)
    `, [orderId, item.product_id, variantId || null, item.variant_label || null, quantity, price]);

    // Flash sale count update
    const pendingSocketEvents = [];
    if (flashSaleId) {
      try {
        const up = await client.query(
          `UPDATE flash_sale_products SET sold_count=sold_count+$1 WHERE flash_sale_id=$2 AND product_id=$3 RETURNING sold_count,stock_limit`,
          [quantity, flashSaleId, productId]
        );
        const pr = up.rows[0];
        if (pr) {
          pendingSocketEvents.push(['flash_product_update', { saleId: flashSaleId, productId, soldCount: pr.sold_count, stockLimit: pr.stock_limit }]);
          if (pr.stock_limit && pr.sold_count >= pr.stock_limit)
            pendingSocketEvents.push(['flash_product_sold_out', { saleId: flashSaleId, productId }]);
        }
        const us = await client.query(`UPDATE flash_sales SET uses_count=uses_count+1 WHERE id=$1 RETURNING uses_count,max_uses,title`, [flashSaleId]);
        const sr = us.rows[0];
        if (sr && sr.max_uses && sr.uses_count >= sr.max_uses)
          pendingSocketEvents.push(['flash_sale_exhausted', { saleId: flashSaleId, title: sr.title }]);
      } catch (_) {}
    }

    // COD: deduct stock only — do NOT clear cart
    if (paymentMethod === 'cod') {
      if (variantId) {
        const rv = await client.query(`UPDATE product_variants SET inventory=inventory-$1 WHERE id=$2 AND inventory>=$1 RETURNING id`, [quantity, variantId]);
        if (!rv.rows.length) throw new Error('Variant stock update failed');
      } else {
        const rp = await client.query(`UPDATE products SET inventory=inventory-$1 WHERE id=$2 AND inventory>=$1 RETURNING id`, [quantity, productId]);
        if (!rp.rows.length) throw new Error('Stock update failed');
      }
      await creditReferralReward(client, userId, orderId);
    }

    // Online: create Razorpay order
    let razorpayOrder = null;
    if (paymentMethod === 'online') {
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(finalTotal * 100), currency: 'INR',
        receipt: `ORD_${orderId}`, payment_capture: 1,
      });
      await client.query(`UPDATE orders SET razorpay_order_id=$1 WHERE id=$2`, [razorpayOrder.id, orderId]);
    }

    await client.query('COMMIT');

    try { const { emitToAll } = require('../../socket'); for (const [e, p] of pendingSocketEvents) emitToAll(e, p); } catch (_) {}
    try { emitToAdmin('new_order', { order_id: orderId, user_id: userId }); } catch (_) {}

    if (paymentMethod === 'cod') {
      try {
        const [uRes, invRes] = await Promise.all([
          pool.query(`SELECT name,email FROM users WHERE id=$1`, [userId]),
          pool.query(`SELECT invoice_no,shipping_address FROM orders WHERE id=$1`, [orderId]),
        ]);
        const uRow = uRes.rows[0] || {}; const invRow = invRes.rows[0] || {};
        if (uRow.email) {
          sendOrderConfirmationEmail({
            email: uRow.email, name: uRow.name, orderId, invoiceNo: invRow.invoice_no,
            items: [{ name: item.product_name, quantity, price: item.effective_price, variant_label: item.variant_label || null }],
            total, paymentMethod: 'cod', address: invRow.shipping_address?.address || '',
          });
        }
      } catch (_) {}
    }

    res.json({
      success: true, orderId, amount: finalTotal,
      breakup: { subtotal, gst: totalTax, delivery, platformFee: PLATFORM, grandTotal: finalTotal },
      razorpay: razorpayOrder, razorpayKey: razorpayOrder ? process.env.RAZORPAY_KEY : undefined,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[BUY NOW]', err.message);
    res.status(400).json({ success: false, message: err.message || 'Order failed' });
  } finally {
    client.release();
  }
};

/* ─── PATCH /orders/:id/address ─────────────────────────────────────────────
   Customer changes delivery address while order is still pending/confirmed
   ────────────────────────────────────────────────────────────────────────── */
exports.updateOrderAddress = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { address_id } = req.body;

    if (!address_id) {
      return res.status(400).json({ success: false, message: 'address_id is required' });
    }

    await client.query('BEGIN');

    const orderRes = await client.query(
      `SELECT id, status, user_id FROM orders WHERE id=$1 AND user_id=$2 FOR UPDATE`,
      [id, userId]
    );
    if (!orderRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = orderRes.rows[0];
    if (![0, 1].includes(order.status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Address can only be changed before the order is shipped' });
    }

    const addrRes = await client.query(
      `SELECT id, name, phone, street, city, state, pincode, type FROM addresses WHERE id=$1 AND user_id=$2`,
      [address_id, userId]
    );
    if (!addrRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Address not found' });
    }

    const addr = addrRes.rows[0];
    const newShipping = {
      name: addr.name,
      phone: addr.phone,
      address: `${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}`,
      address_id: addr.id,
      type: addr.type,
    };

    await client.query(
      `UPDATE orders SET shipping_address=$1, updated_at=NOW() WHERE id=$2`,
      [JSON.stringify(newShipping), id]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Delivery address updated', shipping_address: newShipping });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[UPDATE ORDER ADDRESS]', err.message);
    res.status(500).json({ success: false, message: 'Failed to update address' });
  } finally {
    client.release();
  }
};

/* ─── POST /admin/orders/:id/refund ─────────────────────────────────────────
   Admin manually triggers a Razorpay refund for failed/missed auto-refunds
   ────────────────────────────────────────────────────────────────────────── */
exports.adminRefundOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const orderRes = await pool.query(
      `SELECT id, payment_method, payment_status, razorpay_payment_id, total_amount, refund_status FROM orders WHERE id=$1`,
      [id]
    );
    if (!orderRes.rows.length) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = orderRes.rows[0];

    if (order.payment_method === 'cod') {
      return res.status(400).json({ success: false, message: 'COD orders cannot be refunded through Razorpay' });
    }
    if (!order.razorpay_payment_id) {
      return res.status(400).json({ success: false, message: 'No Razorpay payment ID on record for this order' });
    }
    // Allow retry when refund previously failed (payment_status may be 'refunded' from a failed attempt)
    const canRefund = order.payment_status === 'paid' ||
      (order.payment_status === 'refunded' && order.refund_status === 'failed');
    if (!canRefund) {
      return res.status(400).json({ success: false, message: 'Order was not paid online or refund is not retryable' });
    }
    if (order.refund_status === 'processed' || order.refund_status === 'pending') {
      return res.status(400).json({ success: false, message: `Refund already ${order.refund_status} for this order` });
    }

    const refundAmount = Math.round(Number(order.total_amount) * 100);
    const refund = await razorpay.payments.refund(order.razorpay_payment_id, {
      amount: refundAmount,
      speed: 'normal',
      notes: { order_id: id, reason: 'Manual refund initiated by admin' },
    });

    // Use Razorpay's actual status ('pending' or 'processed')
    const rzpStatus = refund.status === 'processed' ? 'processed' : 'pending';
    await pool.query(
      `UPDATE orders SET refund_id=$1, refund_amount=$2, refund_status=$3, payment_status='refunded', updated_at=NOW() WHERE id=$4`,
      [refund.id, Number(order.total_amount), rzpStatus, id]
    );

    logPayment(id, 'admin_refund_initiated', {
      amount: order.total_amount,
      status: rzpStatus,
      gatewayPaymentId: order.razorpay_payment_id,
      gatewayRefundId: refund.id,
      initiatedBy: 'admin',
      notes: 'Manual refund initiated by admin',
    });

    res.json({ success: true, message: 'Refund initiated successfully', refund_id: refund.id, refund_status: rzpStatus });
  } catch (err) {
    console.error('[ADMIN REFUND]', err.message);
    const msg = err?.error?.description || err.message || 'Refund failed';
    res.status(500).json({ success: false, message: msg });
  }
};
