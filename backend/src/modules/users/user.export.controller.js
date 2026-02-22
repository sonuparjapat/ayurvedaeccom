const fs = require("fs");
const path = require("path");
const pool = require("../../config/db");


exports.exportData = async (req, res) => {
  try {

    const userId = req.user.id;

    const user = await pool.query(
      `SELECT * FROM users WHERE id=$1`,
      [userId]
    );

    const orders = await pool.query(
      `SELECT * FROM orders WHERE user_id=$1`,
      [userId]
    );

    const reviews = await pool.query(
      `SELECT * FROM reviews WHERE user_id=$1`,
      [userId]
    );

    const data = {
      user: user.rows[0],
      orders: orders.rows,
      reviews: reviews.rows,
    };

    const file = path.join(
      __dirname,
      `../../exports/user-${userId}.json`
    );

    fs.writeFileSync(file, JSON.stringify(data, null, 2));

    res.download(file);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Export failed",
    });
  }
};