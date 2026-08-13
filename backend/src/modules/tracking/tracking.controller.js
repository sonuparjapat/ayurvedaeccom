const pool = require("../../config/db");
const { v4: uuid } = require("uuid");

exports.createTracking = async (req, res) => {
  try {
    const { orderId, location } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: "orderId required" });

    await pool.query(
      `INSERT INTO tracking (id, order_id, status, location) VALUES($1,$2,$3,$4)
       ON CONFLICT (order_id) DO UPDATE SET status=EXCLUDED.status, location=EXCLUDED.location, updated_at=NOW()`,
      [uuid(), orderId, "ORDER_PLACED", location || "Warehouse"]
    );
    res.json({ success: true, message: "Tracking created" });
  } catch (err) {
    console.error("[createTracking]", err.message);
    res.status(500).json({ success: false, message: "Failed to create tracking" });
  }
};

exports.updateTracking = async (req, res) => {
  try {
    const { status, location } = req.body;
    const { orderId } = req.params;
    if (!status) return res.status(400).json({ success: false, message: "status required" });

    const result = await pool.query(
      `UPDATE tracking SET status=$1, location=$2, updated_at=NOW() WHERE order_id=$3`,
      [status, location || null, orderId]
    );
    if (!result.rowCount) return res.status(404).json({ success: false, message: "No tracking record found for this order" });
    res.json({ success: true, message: "Tracking updated" });
  } catch (err) {
    console.error("[updateTracking]", err.message);
    res.status(500).json({ success: false, message: "Failed to update tracking" });
  }
};

exports.getTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    // Verify order belongs to the authenticated user before returning tracking
    const result = await pool.query(
      `SELECT t.* FROM tracking t
       JOIN orders o ON o.id = t.order_id
       WHERE t.order_id=$1 AND o.user_id=$2`,
      [orderId, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: "No tracking found for this order" });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("[getTracking]", err.message);
    res.status(500).json({ success: false, message: "Failed to get tracking" });
  }
};

/* ================= PUBLIC TRACKING BY TOKEN (no login required) ================= */
exports.getTrackingByToken = async (req, res) => {
  try {
    const { token } = req.params
    // UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(token)) {
      return res.status(400).json({ success: false, message: 'Invalid tracking link' })
    }

    const orderRes = await pool.query(`
      SELECT
        o.id, o.invoice_no, o.status, o.tracking_token,
        o.tracking_number, o.courier_name, o.shipped_at, o.created_at,
        o.expected_delivery_date, o.total_amount, o.payment_method,
        json_agg(
          json_build_object(
            'name', p.name,
            'quantity', oi.quantity,
            'image', p.images->>0,
            'variant_label', oi.variant_label
          ) ORDER BY oi.id
        ) AS items
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN products p ON p.id = oi.product_id
      WHERE o.tracking_token = $1
      GROUP BY o.id
    `, [token])

    if (!orderRes.rows.length) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    const order = orderRes.rows[0]

    // Fetch tracking info
    const trackRes = await pool.query(`SELECT status, location, updated_at FROM tracking WHERE order_id=$1`, [order.id])

    res.json({
      success: true,
      data: {
        invoice_no: order.invoice_no,
        status: order.status,
        tracking_number: order.tracking_number,
        courier_name: order.courier_name,
        shipped_at: order.shipped_at,
        created_at: order.created_at,
        expected_delivery_date: order.expected_delivery_date,
        total_amount: order.total_amount,
        payment_method: order.payment_method,
        items: order.items,
        tracking: trackRes.rows[0] || null,
      }
    })
  } catch (err) {
    console.error('[getTrackingByToken]', err.message)
    res.status(500).json({ success: false, message: 'Failed to fetch tracking' })
  }
}
