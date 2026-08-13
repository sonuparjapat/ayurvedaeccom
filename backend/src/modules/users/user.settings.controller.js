const pool = require("../../config/db");


/* ================= GET SETTINGS ================= */
exports.getSettings = async (req, res) => {
  try {

    const userId = req.user.id;

    let result = await pool.query(
      `SELECT * FROM user_settings WHERE user_id=$1`,
      [userId]
    );

    /* Auto create if missing */
    if (!result.rowCount) {
      result = await pool.query(
        `
        INSERT INTO user_settings(user_id)
        VALUES($1)
        RETURNING *
        `,
        [userId]
      );
    }

    res.json({
      success: true,
      data: result.rows[0],
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Fetch settings failed",
    });
  }
};



/* ================= UPDATE SETTINGS ================= */
exports.updateSettings = async (req, res) => {
  try {

    const userId = req.user.id;

    const {
      order_updates,
      promotions,
      price_drops,
      new_arrivals,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO user_settings (user_id, order_updates, promotions, price_drops, new_arrivals)
      VALUES ($5, $1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE
      SET
        order_updates=$1,
        promotions=$2,
        price_drops=$3,
        new_arrivals=$4,
        updated_at=NOW()
      RETURNING *
      `,
      [
        order_updates,
        promotions,
        price_drops,
        new_arrivals,
        userId,
      ]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Update failed",
    });
  }
};