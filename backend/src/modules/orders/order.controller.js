const pool = require("../../config/db");
const Razorpay = require("razorpay");
const crypto = require("crypto");

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

    const { shipping, paymentMethod,addressId  } = req.body;
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

    /* ================= LOCK CART ================= */

    const cartRes = await client.query(`
      SELECT
        c.product_id,
        c.quantity,

        p.price,
        p.inventory,
        p.gst_percent,
        p.status

      FROM cart c
      JOIN products p ON p.id = c.product_id

      WHERE c.user_id = $1
      FOR UPDATE
    `, [userId]);

    const cart = cartRes.rows;

    if (!cart.length) {
      throw new Error("Cart is empty");
    }

    /* ================= CALCULATION ================= */

    let subtotal = 0;
    let totalTax = 0;

    for (const item of cart) {

      if (item.status !== "active") {
        throw new Error("Some products are unavailable");
      }

      if (item.inventory < item.quantity) {
        throw new Error("Some items are out of stock");
      }

      const price = Number(item.price);
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

    /* ================= CREATE ORDER ================= */

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
    expires_at
  )
  VALUES
  ($1,$2,$3,$4,$5,$6,$7,NOW() + INTERVAL '15 minutes')
  RETURNING id
`, [
  userId,
  total,
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
      grand_total: total
    }
  }),

  /* FK reference */
  addr.id,

  STATUS_PENDING,

  paymentMethod === "cod" ? "paid" : "unpaid"
]);

    const orderId = orderRes.rows[0].id;

    /* ================= CREATE ITEMS ================= */

    for (const item of cart) {

      const price = Number(item.price);
      const qty = Number(item.quantity);

      await client.query(`
        INSERT INTO order_items
        (order_id, product_id, quantity, price)
        VALUES ($1,$2,$3,$4)
      `, [
        orderId,
        item.product_id,
        qty,
        price
      ]);
    }

    /* ================= COD STOCK ================= */

    if (paymentMethod === "cod") {

      for (const item of cart) {

        const r = await client.query(`
          UPDATE products
          SET inventory = inventory - $1
          WHERE id = $2
            AND inventory >= $1
          RETURNING id
        `, [
          item.quantity,
          item.product_id
        ]);

        if (!r.rows.length) {
          throw new Error("Stock update failed");
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

        amount: Math.round(total * 100),

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

    await client.query("COMMIT");

    /* ================= RESPONSE ================= */

    res.json({
      success: true,

      orderId,

      amount: total,

      breakup: {
        subtotal,
        gst: totalTax,
        delivery,
        platformFee: PLATFORM,
        grandTotal: total
      },

      razorpay: razorpayOrder
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

    /* ================= REDUCE STOCK ================= */

    const items = await client.query(`
      SELECT *
      FROM order_items
      WHERE order_id=$1
    `, [orderId]);

    for (const item of items.rows) {

      const r = await client.query(`
        UPDATE products
        SET inventory = inventory - $1
        WHERE id=$2 AND inventory >= $1
        RETURNING id
      `, [item.quantity, item.product_id]);

      if (!r.rows.length) {
        throw new Error("Stock mismatch");
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

    await client.query("COMMIT");

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

exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware

    const result = await pool.query(
  `
  SELECT
    o.id,
    o.invoice_no,
    o.status,
    o.total_amount,
    o.created_at,
    o.tracking_number,
    o.shipped_at,
    o.shipping_address,
    

    /* Invoice Details */
    i.id           AS invoice_id,
    i.invoice_no   AS invoice_number,
    i.invoice_date,
    i.subtotal     AS invoice_subtotal,
    i.tax          AS invoice_tax,
    i.total        AS invoice_total,
    i.pdf_url,

    /* Order Items */
    json_agg(
      json_build_object(
      'product_id', p.id,
        'name', p.name,
        'quantity', oi.quantity,
        'price', oi.price,
        'image', p.images->>0
      )
    ) AS items

  FROM orders o

  JOIN order_items oi 
    ON oi.order_id = o.id

  JOIN products p 
    ON p.id = oi.product_id

  /* Invoice Join */
  LEFT JOIN invoices i 
    ON i.order_id = o.id

  WHERE o.user_id = $1

  GROUP BY 
    o.id,
    i.id

  ORDER BY o.created_at DESC
  `,
  [userId]
);

    res.json({
      success: true,
      data: result.rows,
    });

  } catch (err) {
    console.error("Get Orders Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};