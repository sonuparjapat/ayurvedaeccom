const pool = require("../config/db");

const startOrderCleanup = () => {

  console.log("🧹 Order cleanup job started");

  setInterval(async () => {

    try {

      const result = await pool.query(`
        UPDATE orders
        SET status='cancelled'
        WHERE status='pending'
        AND expires_at < NOW()
      `);

      if (result.rowCount > 0) {
        console.log(`🧹 Cancelled ${result.rowCount} expired orders`);
      }

    } catch (err) {

      console.error("❌ Order cleanup failed:", err);

    }

  }, 10 * 60 * 1000); // 10 min
};

module.exports = startOrderCleanup;