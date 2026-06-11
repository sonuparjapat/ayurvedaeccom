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
