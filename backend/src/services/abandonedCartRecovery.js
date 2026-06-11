const pool = require('../config/db')

let lastRun = 0
const INTERVAL = 30 * 60 * 1000 // run max every 30 min

module.exports = async function runAbandonedCartRecovery() {
  const now = Date.now()
  if (now - lastRun < INTERVAL) return
  lastRun = now

  try {
    // Find carts updated > 1 hour ago with items but user has no order in last 2 hours
    const result = await pool.query(
      `SELECT DISTINCT c.user_id, u.email, u.name,
        JSON_AGG(JSON_BUILD_OBJECT(
          'product_id', c.product_id, 'name', p.name, 'price', c.price,
          'quantity', c.quantity, 'image', p.images[1]
        )) AS items,
        COUNT(c.id) AS item_count
       FROM cart c
       JOIN users u ON u.id = c.user_id
       JOIN products p ON p.id = c.product_id
       WHERE c.updated_at < NOW() - INTERVAL '1 hour'
         AND c.updated_at > NOW() - INTERVAL '48 hours'
         AND c.user_id NOT IN (
           SELECT DISTINCT user_id FROM orders
           WHERE created_at > NOW() - INTERVAL '2 hours'
         )
         AND u.email IS NOT NULL
       GROUP BY c.user_id, u.email, u.name
       LIMIT 50`
    )

    if (!result.rows.length) return

    const sendAbandonedCartEmail = require('./email/abandonedCart')
    for (const row of result.rows) {
      try {
        await sendAbandonedCartEmail(row.email, row.name, row.items)
      } catch (e) {
        console.error('Abandoned cart email failed for', row.email, e.message)
      }
    }

    console.log(`📧 Abandoned cart recovery: ${result.rows.length} emails sent`)
  } catch (err) {
    console.error('Abandoned cart recovery error:', err.message)
  }
}
