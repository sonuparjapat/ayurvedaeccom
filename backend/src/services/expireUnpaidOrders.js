const pool = require('../config/db')

let lastRun = 0
const RUN_INTERVAL_MS = 5 * 60 * 1000 // run every 5 minutes max

module.exports = async function expireUnpaidOrders() {
  const now = Date.now()
  if (now - lastRun < RUN_INTERVAL_MS) return
  lastRun = now

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Find online orders older than 30 min with unpaid status still in pending (status=0)
    const expired = await client.query(`
      SELECT id FROM orders
      WHERE payment_method = 'online'
        AND payment_status = 'unpaid'
        AND status = 0
        AND created_at < NOW() - INTERVAL '30 minutes'
      FOR UPDATE SKIP LOCKED
    `)

    for (const row of expired.rows) {
      const orderId = row.id

      // Fetch order meta for wallet/loyalty/gift-card restoration
      const orderMeta = await client.query(
        `SELECT user_id, wallet_discount, gift_card_code, gift_card_discount FROM orders WHERE id=$1`,
        [orderId]
      )
      const { user_id: userId, wallet_discount: walletDiscount, gift_card_code, gift_card_discount } = orderMeta.rows[0] || {}

      // Restore inventory
      const items = await client.query(
        `SELECT product_id, variant_id, quantity FROM order_items WHERE order_id=$1`,
        [orderId]
      )
      for (const item of items.rows) {
        if (item.variant_id) {
          await client.query(
            `UPDATE product_variants SET inventory=inventory+$1, updated_at=NOW() WHERE id=$2`,
            [item.quantity, item.variant_id]
          )
        } else {
          await client.query(
            `UPDATE products SET inventory=inventory+$1, updated_at=NOW() WHERE id=$2`,
            [item.quantity, item.product_id]
          )
        }
      }

      // Restore wallet credit that was deducted at order creation
      const walletUsed = Number(walletDiscount || 0)
      if (walletUsed > 0 && userId) {
        await client.query(
          `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id=$2`,
          [walletUsed, userId]
        )
        await client.query(
          `INSERT INTO wallet_transactions (user_id, amount, type, source, order_id, description)
           VALUES ($1, $2, 'credit', 'refund', $3, $4)`,
          [userId, walletUsed, orderId, `Auto-refund: payment timeout on order #${orderId}`]
        )
      }

      // Restore loyalty points that were redeemed at order creation
      if (userId) {
        const lpRes = await client.query(
          `SELECT COALESCE(SUM(points), 0) AS pts FROM loyalty_points WHERE order_id=$1 AND type='redeem'`,
          [orderId]
        )
        const loyaltyPts = Number(lpRes.rows[0]?.pts || 0)
        if (loyaltyPts > 0) {
          await client.query(
            `UPDATE users SET loyalty_points_balance = loyalty_points_balance + $1 WHERE id=$2`,
            [loyaltyPts, userId]
          )
          await client.query(
            `INSERT INTO loyalty_points (user_id, points, type, source, order_id, description)
             VALUES ($1, $2, 'earn', 'refund', $3, $4)`,
            [userId, loyaltyPts, orderId, `Auto-restore: payment timeout on order #${orderId}`]
          )
        }
      }

      // Restore gift card balance used on this order
      if (gift_card_code && Number(gift_card_discount) > 0) {
        await client.query(
          `UPDATE gift_cards SET balance = balance + $1 WHERE UPPER(code) = UPPER($2)`,
          [Number(gift_card_discount), gift_card_code]
        )
      }

      // Restore coupon usage if a coupon was applied
      await client.query(
        `UPDATE coupons SET used_count = GREATEST(0, used_count - 1) WHERE code = (
           SELECT coupon_code FROM orders WHERE id=$1 AND coupon_code IS NOT NULL
         )`,
        [orderId]
      )
      await client.query(`DELETE FROM coupon_uses WHERE order_id=$1`, [orderId])

      // Restore flash sale slots if applicable
      const flashRows = await client.query(
        `SELECT flash_sale_id, product_id, quantity FROM price_logs
         WHERE order_id = $1 AND reason_type = 'flash_sale' AND flash_sale_id IS NOT NULL`,
        [orderId]
      )
      if (flashRows.rowCount) {
        const saleIds = new Set()
        for (const r of flashRows.rows) {
          await client.query(
            `UPDATE flash_sale_products SET sold_count = GREATEST(0, sold_count - $1)
             WHERE flash_sale_id = $2 AND product_id = $3`,
            [r.quantity, r.flash_sale_id, r.product_id]
          )
          saleIds.add(r.flash_sale_id)
        }
        for (const saleId of saleIds) {
          await client.query(
            `UPDATE flash_sales SET uses_count = GREATEST(0, uses_count - 1) WHERE id = $1`,
            [saleId]
          )
        }
      }

      // Cancel order
      await client.query(
        `UPDATE orders SET status=6, payment_status='failed', updated_at=NOW() WHERE id=$1`,
        [orderId]
      )

      // Log the auto-cancellation
      await client.query(
        `INSERT INTO order_status_logs (order_id, old_status, new_status, note) VALUES ($1, 0, 6, 'Auto-cancelled: payment timeout')`,
        [orderId]
      )
    }

    await client.query('COMMIT')

    if (expired.rowCount > 0) {
      console.log(`[CLEANUP] Auto-cancelled ${expired.rowCount} unpaid expired orders`)
    }
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[CLEANUP] Expire unpaid orders failed:', err.message)
  } finally {
    client.release()
  }
}
