const startOrderCleanup = require("./orderCleanup");

const startJobs = () => {

  console.log("🚀 Starting background jobs...");

  startOrderCleanup();

};
cleanOrders = async () => {
console.log("cleaning...")
  try {

    await pool.query(`
      DELETE FROM orders
      WHERE
        payment_status='unpaid'
        AND expires_at < NOW()
    `);

    console.log("Expired orders cleaned");

  } catch (err) {
    console.error("Cleanup error:", err);
  }
}

module.exports = startJobs;