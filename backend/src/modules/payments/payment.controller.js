const Razorpay = require("razorpay");
const crypto = require("crypto");
const pool = require("../../config/db");
const { v4: uuid } = require("uuid");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// Create Razorpay Order
exports.createPayment = async (req, res) => {

  const { orderId } = req.body;

  // Get order
  const result = await pool.query(
    `SELECT * FROM orders WHERE id=$1`,
    [orderId]
  );

  if (!result.rows.length)
    return res.status(404).json({ error: "Order not found" });

  const order = result.rows[0];

  if (order.status !== "PENDING")
    return res.status(400).json({ error: "Already paid" });

  const options = {
    amount: order.total * 100, // paise
    currency: "INR",
    receipt: orderId,
  };

  const razorOrder = await razorpay.orders.create(options);

  res.json({
    razorpayOrderId: razorOrder.id,
    amount: options.amount,
    key: process.env.RAZORPAY_KEY_ID,
  });
};


// Verify Payment
exports.verifyPayment = async (req, res) => {

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
  } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign)
    .digest("hex");

  if (expected !== razorpay_signature) {
    return res.status(400).json({ error: "Invalid signature" });
  }

  // Save payment
  await pool.query(
    `
    INSERT INTO payments
    VALUES($1,$2,$3,$4,$5,$6,$7)
    `,
    [
      uuid(),
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      null,
      "SUCCESS",
    ]
  );

  // Update order
  await pool.query(
    `UPDATE orders SET status='PAID' WHERE id=$1`,
    [orderId]
  );

  res.json({ message: "Payment Successful" });
};