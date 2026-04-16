const cron = require("node-cron");
const pool=require("../config/db") // adjust path

/* ======================
   CLEAN UNPAID ORDERS
====================== */

const cleanOrders = async () => {
  try {
    console.log(
      "Cleaning unpaid orders..."
    );

    await pool.query(`
      DELETE FROM orders
      WHERE payment_status = 'unpaid'
      AND expires_at < NOW()
    `);

    console.log(
      "Expired unpaid orders cleaned"
    );

  } catch (err) {
    console.error(
      "Order cleanup error:",
      err
    );
  }
};

/* ======================
   CLEAN GUEST CART
====================== */

const cleanGuestCart =
  async () => {
    try {
      console.log(
        "Cleaning guest carts..."
      );

      await pool.query(`
        DELETE FROM guest_cart
        WHERE guest_session_id IN (
          SELECT session_id
          FROM guest_sessions
          WHERE expires_at < NOW()
          OR is_active = false
        )
      `);

      await pool.query(`
        DELETE FROM guest_sessions
        WHERE expires_at < NOW()
        OR is_active = false
      `);

      console.log(
        "Expired guest carts cleaned"
      );

    } catch (err) {
      console.error(
        "Guest cart cleanup error:",
        err
      );
    }
  };

/* ======================
   START ALL JOBS
====================== */

const startJobs = () => {
  console.log(
    "🚀 Starting background jobs..."
  );

  /* every 10 min */
  cron.schedule(
    "*/10 * * * *",
    cleanOrders
  );

  /* every 6 hours */
  cron.schedule(
    "0 */6 * * *",
    cleanGuestCart
  );

  console.log(
    "All jobs started"
  );
};

module.exports = startJobs;