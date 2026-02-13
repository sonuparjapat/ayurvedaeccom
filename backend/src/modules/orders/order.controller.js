const pool = require("../../config/db");
const Razorpay = require("razorpay");
const crypto = require("crypto");

/* ================= RAZORPAY ================= */

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

/* ================= CREATE ORDER ================= */

exports.createOrder = async (req, res) => {

  const client = await pool.connect();

  try {

    const userId = req.user.id;
    const { shipping, paymentMethod } = req.body;

    await client.query("BEGIN");

    /* Lock Cart + Products */

    const cart = await client.query(`
      SELECT c.*, p.price, p.inventory
      FROM cart c
      JOIN products p ON p.id = c.product_id
      WHERE c.user_id=$1
      FOR UPDATE
    `, [userId]);

    if (!cart.rows.length) {
      throw new Error("Cart empty");
    }


    let subtotal = 0;

    for (let item of cart.rows) {

      if (item.inventory < item.quantity) {
        throw new Error("Product out of stock");
      }

      subtotal += item.price * item.quantity;
    }

    const tax = subtotal * 0.05;
    const total = subtotal + tax;


    /* Create Order (Pending) */

    const order = await client.query(`
      INSERT INTO orders
      (user_id,total_amount,payment_method,shipping_address,status,expires_at)
      VALUES($1,$2,$3,$4,'pending',NOW() + INTERVAL '15 minutes')
      RETURNING id
    `, [
      userId,
      total,
      paymentMethod,
      shipping
    ]);

    const orderId = order.rows[0].id;


    /* Create Items (NO STOCK REDUCE YET) */

    for (let i of cart.rows) {

      await client.query(`
        INSERT INTO order_items
        (order_id,product_id,quantity,price)
        VALUES($1,$2,$3,$4)
      `, [orderId, i.product_id, i.quantity, i.price]);

    }


    /* Razorpay */

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
      razorpay: razorpayOrder
    });


  } catch (err) {

    await client.query("ROLLBACK");

    console.error("[CREATE ORDER]", err);

    res.status(400).json({
      success: false,
      message: err.message
    });

  } finally {

    client.release();

  }
};

/* ================= VERIFY PAYMENT ================= */

exports.verifyPayment = async (req, res) => {

  const client = await pool.connect();

  try {

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;


    /* Verify Signature */

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


    /* Lock Order */

    const order = await client.query(`
      SELECT * FROM orders
      WHERE id=$1
      FOR UPDATE
    `, [orderId]);

    if (!order.rows.length) {
      throw new Error("Order not found");
    }

    if (order.rows[0].payment_status === 'paid') {
      return res.json({ success: true });
    }


    /* Reduce Stock NOW */

    const items = await client.query(`
      SELECT * FROM order_items
      WHERE order_id=$1
    `, [orderId]);


    for (let i of items.rows) {

      const r = await client.query(`
        UPDATE products
        SET inventory = inventory - $1
        WHERE id=$2 AND inventory >= $1
        RETURNING id
      `, [i.quantity, i.product_id]);

      if (!r.rows.length) {
        throw new Error("Stock mismatch");
      }
    }


    /* Update Order */

    await client.query(`
      UPDATE orders
      SET
        payment_status='paid',
        status='confirmed',
        razorpay_payment_id=$1,
        razorpay_signature=$2
      WHERE id=$3
    `, [
      razorpay_payment_id,
      razorpay_signature,
      orderId
    ]);


    /* Clear Cart */

    await client.query(
      "DELETE FROM cart WHERE user_id=$1",
      [req.user.id]
    );


    await client.query("COMMIT");


    res.json({ success: true });


  } catch (err) {

    await client.query("ROLLBACK");

    console.error("[VERIFY PAYMENT]", err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  } finally {

    client.release();

  }
};
