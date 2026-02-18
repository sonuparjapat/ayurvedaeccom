const cron = require("node-cron");
const pool = require("../config/db");

const cleanExpiredOrders = async () => {

  const client = await pool.connect();

  try {

    const result = await client.query(`
      DELETE FROM orders
      WHERE
        payment_status = 'unpaid'
        AND expires_at IS NOT NULL
        AND expires_at < NOW()
      RETURNING id
    `);

    if (result.rowCount > 0) {
      console.log(`🧹 Cleaned ${result.rowCount} expired orders`);
    }

  } catch (err) {

    console.error("❌ Order cleanup error:", err);

  } finally {

    client.release();
  }
};

const startOrderCleanup = () => {

  // Every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    console.log("⏳ Running expired order cleanup...");
    await cleanExpiredOrders();
  });

  console.log("✅ Order cleanup cron started (every 10 minutes)");
};

module.exports = startOrderCleanup;