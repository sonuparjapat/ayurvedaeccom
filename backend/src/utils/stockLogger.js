const pool = require('../config/db')

/**
 * Fire-and-forget inventory change audit log.
 * Called whenever an admin manually changes product stock.
 */
exports.logStock = async ({
  productId,
  productName = null,
  variantId = null,
  adminId = null,
  oldInventory,
  newInventory,
  reason = 'manual_update',
  note = null,
} = {}) => {
  try {
    const changeAmount = Number(newInventory) - Number(oldInventory)
    await pool.query(
      `INSERT INTO stock_logs
         (product_id, product_name, variant_id, admin_id, old_inventory, new_inventory, change_amount, reason, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        productId,
        productName || null,
        variantId   || null,
        adminId     || null,
        Number(oldInventory),
        Number(newInventory),
        changeAmount,
        reason,
        note || null,
      ]
    )
  } catch (err) {
    console.warn('[STOCK LOG]', err.message)
  }
}
