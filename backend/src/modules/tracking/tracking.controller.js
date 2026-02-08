const pool = require("../../config/db");
const { v4: uuid } = require("uuid");


// Create tracking (After payment)
exports.createTracking = async (req, res) => {

  const { orderId, location } = req.body;

  await pool.query(
    `
    INSERT INTO tracking
    VALUES($1,$2,$3,$4)
    `,
    [
      uuid(),
      orderId,
      "ORDER_PLACED",
      location || "Warehouse",
    ]
  );

  res.json({ message: "Tracking Created" });
};


// Update tracking
exports.updateTracking = async (req, res) => {

  const { status, location } = req.body;
  const { orderId } = req.params;

  await pool.query(
    `
    UPDATE tracking
    SET status=$1,
        location=$2,
        updated_at=CURRENT_TIMESTAMP
    WHERE order_id=$3
    `,
    [status, location, orderId]
  );

  res.json({ message: "Tracking Updated" });
};


// Get tracking (User)
exports.getTracking = async (req, res) => {

  const { orderId } = req.params;

  const result = await pool.query(
    `
    SELECT * FROM tracking
    WHERE order_id=$1
    `,
    [orderId]
  );

  if (!result.rows.length)
    return res.status(404).json({ error: "No tracking found" });

  res.json(result.rows[0]);
};