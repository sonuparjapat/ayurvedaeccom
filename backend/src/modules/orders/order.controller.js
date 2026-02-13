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

    /* Fetch Cart */
    const cart = await client.query(`
      SELECT c.*, p.price, p.inventory
      FROM cart c
      JOIN products p ON p.id = c.product_id
      WHERE c.user_id=$1
    `, [userId]);

    if (!cart.rows.length) {
      throw new Error("Cart empty");
    }

    let total = 0;

    for (let i of cart.rows) {

      if (i.inventory < i.quantity) {
        throw new Error("Out of stock");
      }

      total += i.price * i.quantity;
    }

    total += total * 0.05; // tax

    /* Create Order */
    const order = await client.query(`
      INSERT INTO orders
      (user_id,total_amount,payment_method,shipping_address)
      VALUES($1,$2,$3,$4)
      RETURNING *
    `,
      [
        userId,
        total,
        paymentMethod,
        shipping
      ]
    );

    const orderId = order.rows[0].id;

    /* Order Items + Reduce Stock */
    for (let i of cart.rows) {

      await client.query(`
        INSERT INTO order_items
        (order_id,product_id,quantity,price)
        VALUES($1,$2,$3,$4)
      `, [orderId, i.product_id, i.quantity, i.price]);

      await client.query(`
        UPDATE products
        SET inventory = inventory - $1
        WHERE id=$2
      `, [i.quantity, i.product_id]);
    }

    /* Razorpay */
    let razorpayOrder = null;

    if (paymentMethod === "online") {

      razorpayOrder = await razorpay.orders.create({
        amount: total * 100,
        currency: "INR",
        receipt: `ORD_${orderId}`
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

    console.error(err);

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

  try {

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

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

    await pool.query(`
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
    await pool.query(
      "DELETE FROM cart WHERE user_id=$1",
      [req.user.id]
    );

    res.json({ success: true });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false
    });
  }
};
