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

exports.createOrder = async (req, res) => {

  const client = await pool.connect();

  try {

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const { shipping, paymentMethod } = req.body;

    /* ================= VALIDATION ================= */

    if (!shipping?.name || !shipping?.phone || !shipping?.address) {
      return res.status(400).json({
        success: false,
        message: "Incomplete shipping details"
      });
    }

    if (!["cod", "online"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method"
      });
    }

    await client.query("BEGIN");

    /* ================= LOAD SETTINGS ================= */

    const settings = await getAppSettings(client);

    /* ================= LOCK CART ================= */

    const cart = await client.query(`
      SELECT
        c.id,
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

    if (!cart.rows.length) {
      throw new Error("Cart is empty");
    }

    /* ================= CALCULATE TOTAL ================= */

    let subtotal = 0;
    let totalTax = 0;

    for (const item of cart.rows) {

      if (item.status !='active') {
        throw new Error("Some products are unavailable");
      }

      if (item.inventory < item.quantity) {
        throw new Error("Some items are out of stock");
      }

      const itemSubtotal = item.price * item.quantity;

      const itemTax =
        (itemSubtotal * Number(item.gst_percent || 0)) / 100;

      subtotal += itemSubtotal;
      totalTax += itemTax;
    }

    /* ================= DELIVERY ================= */

    const delivery =
      subtotal >= settings.free_delivery_limit
        ? 0
        : settings.delivery_charge;

    /* ================= FINAL TOTAL ================= */

    const total =
      subtotal +
      totalTax +
      delivery +
      settings.platform_fee;

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
        status,
        payment_status,
        expires_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,NOW() + INTERVAL '15 minutes')
      RETURNING id
    `, [
      userId,
      total,
      paymentMethod,
      shipping,
      0,
      paymentMethod === "cod" ? "paid" : "unpaid"
    ]);

    const orderId = orderRes.rows[0].id;

    /* ================= CREATE ITEMS ================= */

    for (const item of cart.rows) {

      await client.query(`
        INSERT INTO order_items
        (order_id, product_id, quantity, price)
        VALUES ($1,$2,$3,$4)
      `, [
        orderId,
        item.product_id,
        item.quantity,
        item.price
      ]);
    }

    /* ================= COD → REDUCE STOCK ================= */

    if (paymentMethod === "cod") {

      for (const item of cart.rows) {

        const r = await client.query(`
          UPDATE products
          SET inventory = inventory - $1
          WHERE id = $2
            AND inventory >= $1
          RETURNING id
        `, [item.quantity, item.product_id]);

        if (!r.rows.length) {
          throw new Error("Stock update failed");
        }
      }

      await client.query(
        "DELETE FROM cart WHERE user_id=$1",
        [userId]
      );
    }

    /* ================= RAZORPAY ================= */

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
      `, [razorpayOrder.id, orderId]);
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      orderId,
      amount: total,
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
};


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
