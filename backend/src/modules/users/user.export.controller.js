const pool = require("../../config/db");

exports.exportData = async (req, res) => {
  try {
    const userId = req.user.id;

    const [userRes, ordersRes, reviewsRes, addressesRes, wishlistRes] = await Promise.all([
      pool.query(
        `SELECT id, name, email, phone, created_at, is_active FROM users WHERE id=$1`,
        [userId]
      ),
      pool.query(
        `SELECT o.id, o.status, o.payment_status, o.total_amount, o.coupon_code,
                o.discount_amount, o.created_at,
                json_agg(json_build_object(
                  'product_name', p.name, 'quantity', oi.quantity, 'price', oi.price
                )) AS items
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
         JOIN products p ON p.id = oi.product_id
         WHERE o.user_id=$1
         GROUP BY o.id ORDER BY o.created_at DESC`,
        [userId]
      ),
      pool.query(
        `SELECT r.rating, r.comment, r.created_at, p.name AS product_name
         FROM reviews r JOIN products p ON p.id = r.product_id
         WHERE r.user_id=$1`,
        [userId]
      ),
      pool.query(
        `SELECT type, street, city, state, pincode, is_default FROM user_addresses WHERE user_id=$1`,
        [userId]
      ),
      pool.query(
        `SELECT p.name, p.price FROM wishlist w JOIN products p ON p.id = w.product_id WHERE w.user_id=$1`,
        [userId]
      ),
    ]);

    const data = {
      exported_at: new Date().toISOString(),
      profile: userRes.rows[0] || null,
      addresses: addressesRes.rows,
      orders: ordersRes.rows,
      reviews: reviewsRes.rows,
      wishlist: wishlistRes.rows,
    };

    const json = JSON.stringify(data, null, 2);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="my-oroganix-data-${userId}.json"`);
    res.setHeader('Content-Length', Buffer.byteLength(json));
    res.send(json);

  } catch (err) {
    console.error("Export error:", err);
    res.status(500).json({ message: "Export failed" });
  }
};
