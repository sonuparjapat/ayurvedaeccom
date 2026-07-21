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

    await pool.query(
      `UPDATE tracking SET status=$1, location=$2, updated_at=NOW() WHERE order_id=$3`,
      [status, location || null, orderId]
    );
    res.json({ success: true, message: "Tracking updated" });
  } catch (err) {
    console.error("[updateTracking]", err.message);
    res.status(500).json({ success: false, message: "Failed to update tracking" });
  }
};

exports.getTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await pool.query(`SELECT * FROM tracking WHERE order_id=$1`, [orderId]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: "No tracking found for this order" });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("[getTracking]", err.message);
    res.status(500).json({ success: false, message: "Failed to get tracking" });
  }
};
