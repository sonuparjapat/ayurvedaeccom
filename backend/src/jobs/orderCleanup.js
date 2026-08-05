const cron = require("node-cron");
const pool = require("../config/db");

const cleanExpiredOrders = async () => {
  // Find all expired unpaid orders
  const findRes = await pool.query(`
    SELECT id, user_id, wallet_discount, coupon_code
    FROM orders
    WHERE payment_status = 'unpaid'
      AND expires_at IS NOT NULL
      AND expires_at < NOW()
  `);

  if (!findRes.rowCount) return;

  let processed = 0;

  for (const order of findRes.rows) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Mark as cancelled (not deleted) so order history is preserved
      await client.query(
        `UPDATE orders
         SET status = 6, payment_status = 'cancelled',
             cancel_reason = 'Payment window expired — order was not paid in time.',
             updated_at = NOW()
         WHERE id = $1`,
        [order.id]
      );

      // Refund wallet credits if used
      const walletUsed = Number(order.wallet_discount || 0);
      if (walletUsed > 0) {
        await client.query(
          `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`,
          [walletUsed, order.user_id]
        );
        await client.query(
          `INSERT INTO wallet_transactions
             (user_id, amount, type, source, order_id, description)
           VALUES ($1, $2, 'credit', 'refund', $3, $4)`,
          [order.user_id, walletUsed, order.id,
           `Wallet refund — payment expired on order #${order.id}`]
        );
      }

      // Restore loyalty points if used
      const lpRes = await client.query(
        `SELECT COALESCE(SUM(points), 0) AS pts
         FROM loyalty_points WHERE order_id = $1 AND type = 'redeem'`,
        [order.id]
      );
      const loyaltyPts = Number(lpRes.rows[0]?.pts || 0);
      if (loyaltyPts > 0) {
        await client.query(
          `UPDATE users SET loyalty_points_balance = loyalty_points_balance + $1 WHERE id = $2`,
          [loyaltyPts, order.user_id]
        );
        await client.query(
          `INSERT INTO loyalty_points
             (user_id, points, type, source, order_id, description)
           VALUES ($1, $2, 'earn', 'refund', $3, $4)`,
          [order.user_id, loyaltyPts, order.id,
           `Points restored — payment expired on order #${order.id}`]
        );
      }

      // Decrement coupon used_count so it can be used again
      if (order.coupon_code) {
        await client.query(
          `UPDATE coupons
           SET used_count = GREATEST(0, used_count - 1), updated_at = NOW()
           WHERE UPPER(code) = UPPER($1)`,
          [order.coupon_code]
        );
        await client.query(
          `DELETE FROM coupon_uses WHERE order_id = $1`,
          [order.id]
        );
      }

      await client.query("COMMIT");
      processed++;
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`❌ Failed to process expired order #${order.id}:`, err.message);
    } finally {
      client.release();
    }
  }

  if (processed > 0) {
    console.log(`🧹 Processed ${processed} expired orders (cancelled + refunded)`);
  }
};

const startOrderCleanup = () => {
  cron.schedule("*/10 * * * *", async () => {
    console.log("⏳ Running expired order cleanup...");
    await cleanExpiredOrders();
  });
  console.log("✅ Order cleanup cron started (every 10 minutes)");
};

module.exports = startOrderCleanup;
