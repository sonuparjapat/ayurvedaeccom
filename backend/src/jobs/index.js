const cron = require("node-cron");
const pool = require("../config/db")
const runAbandonedCartRecovery = require('../services/abandonedCartRecovery')
const runSubscriptionBilling = require('../services/subscriptionBilling')
const autoCancelOrders = require('../services/autoCancelOrders')
// Proper order expiry handler: cancels, refunds wallet/loyalty/coupons — no hard DELETE
const startOrderCleanup = require('./orderCleanup')

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

  /* every 10 min — cancel+refund expired unpaid orders (registered by startOrderCleanup) */
  startOrderCleanup();

  /* every 6 hours */
  cron.schedule(
    "0 */6 * * *",
    cleanGuestCart
  );

  /* every 30 min — abandoned cart recovery emails */
  cron.schedule(
    "*/30 * * * *",
    runAbandonedCartRecovery
  );

  /* daily at 6am — subscription auto-billing */
  cron.schedule(
    "0 6 * * *",
    runSubscriptionBilling
  );

  /* every hour — auto-cancel pending orders not confirmed within ORDER_AUTO_CANCEL_HOURS */
  cron.schedule(
    "0 * * * *",
    autoCancelOrders
  );

  console.log(
    "All jobs started"
  );
};

module.exports = startJobs;