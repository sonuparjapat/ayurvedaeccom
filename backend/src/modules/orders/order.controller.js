const pool = require("../../config/db");
const { v4: uuid } = require("uuid");

/**
 * Create Order
 * Body: { items: [{ productId, quantity }] }
 */
exports.createOrder = async (req, res) => {

  const userId = req.user.id;
  const { items } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: "No items" });
  }

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    let total = 0;

    // Calculate total
    for (let item of items) {

      const result = await client.query(
        `SELECT price, stock FROM products WHERE id=$1`,
        [item.productId]
      );

      if (!result.rows.length)
        throw "Product not found";

      const product = result.rows[0];

      if (product.stock < item.quantity)
        throw "Not enough stock";

      total += product.price * item.quantity;
    }

    // Create order
    const orderId = uuid();

    await client.query(
      `INSERT INTO orders VALUES($1,$2,$3,$4)`,
      [orderId, userId, "PENDING", total]
    );

    // Insert items + reduce stock
    for (let item of items) {

      const product = await client.query(
        `SELECT price FROM products WHERE id=$1`,
        [item.productId]
      );

      await client.query(
        `INSERT INTO order_items VALUES($1,$2,$3,$4,$5)`,
        [uuid(), orderId, item.productId, item.quantity, product.rows[0].price]
      );

      await client.query(
        `UPDATE products SET stock = stock - $1 WHERE id=$2`,
        [item.quantity, item.productId]
      );
    }

    await client.query("COMMIT");

    res.json({ message: "Order Created", orderId });

  } catch (err) {

    await client.query("ROLLBACK");

    res.status(400).json({ error: err });

  } finally {

    client.release();
  }
};


/**
 * User Orders
 */
exports.getMyOrders = async (req, res) => {

  const userId = req.user.id;

  const result = await pool.query(
    `
    SELECT * FROM orders
    WHERE user_id=$1
    ORDER BY created_at DESC
    `,
    [userId]
  );

  res.json(result.rows);
};


/**
 * Admin: All Orders
 */
exports.getAllOrders = async (req, res) => {

  const result = await pool.query(
    `SELECT * FROM orders ORDER BY created_at DESC`
  );

  res.json(result.rows);
};


/**
 * Admin: Update Status
 */
exports.updateStatus = async (req, res) => {

  const { status } = req.body;
  const { id } = req.params;

  await pool.query(
    `UPDATE orders SET status=$1 WHERE id=$2`,
    [status, id]
  );

  res.json({ message: "Status Updated" });
};