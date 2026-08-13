/**
 * Subscription Auto-Billing Service
 * Runs on a cron schedule. Finds all active subscriptions due today
 * and auto-creates COD orders on behalf of the user.
 */

const pool = require('../config/db')

async function getAppSettings(client) {
  const config = { delivery_charge: 0, platform_fee: 0, free_delivery_limit: 500 }
  const { rows } = await client.query(`SELECT key, value, type FROM app_settings WHERE is_active=true`)
  rows.forEach(r => {
    let v = r.value
    if (r.type === 'number') v = Number(v)
    if (r.type === 'boolean') v = v === 'true'
    if (Object.prototype.hasOwnProperty.call(config, r.key)) config[r.key] = v
  })
  return config
}

const STATUS_PENDING = 0

async function runSubscriptionBilling() {
  console.log('[SubBilling] Starting subscription billing run...')
  const client = await pool.connect()

  try {
    // Find all active subscriptions due today or overdue
    const due = await client.query(`
      SELECT
        s.id          AS sub_id,
        s.user_id,
        s.product_id,
        s.variant_id,
        s.quantity,
        s.frequency_days,
        s.address_id,
        s.payment_method,
        p.name        AS product_name,
        p.price       AS product_price,
        p.gst_percent,
        p.status      AS product_status,
        p.inventory,
        COALESCE(pv.price, p.price)         AS effective_price,
        COALESCE(pv.inventory, p.inventory) AS effective_inventory,
        pv.label                            AS variant_label,
        ua.street, ua.city, ua.state, ua.pincode,
        u.name AS user_name, u.email AS user_email, u.phone AS user_phone
      FROM subscriptions s
      JOIN products p     ON p.id = s.product_id
      LEFT JOIN product_variants pv ON pv.id = s.variant_id
      LEFT JOIN user_addresses ua   ON ua.id = s.address_id
      JOIN users u        ON u.id = s.user_id
      WHERE s.status = 'active'
        AND s.next_order_date <= CURRENT_DATE
        AND p.status = 'active'
        AND (s.address_id IS NOT NULL)
    `)

    console.log(`[SubBilling] ${due.rows.length} subscriptions due`)

    const settings = await getAppSettings(client)
    const DELIVERY = Number(settings.delivery_charge || 0)
    const FREE_LIMIT = Number(settings.free_delivery_limit || 0)
    const PLATFORM = Number(settings.platform_fee || 0)

    for (const sub of due.rows) {
      const subClient = await pool.connect()
      try {
        // Skip if out of stock
        if (sub.effective_inventory <= 0) {
          console.log(`[SubBilling] Sub ${sub.sub_id}: out of stock, skipping`)
          // Push next_order_date by 1 day and retry tomorrow
          await pool.query(
            `UPDATE subscriptions SET next_order_date = next_order_date + INTERVAL '1 day' WHERE id=$1`,
            [sub.sub_id]
          )
          continue
        }

        await subClient.query('BEGIN')

        const price = Number(sub.effective_price)
        const qty   = Number(sub.quantity)
        const subtotal = +(price * qty).toFixed(2)
        const gst = +(subtotal * Number(sub.gst_percent || 18) / 100).toFixed(2)
        const delivery = subtotal >= FREE_LIMIT ? 0 : DELIVERY
        const total = +(subtotal + gst + delivery + PLATFORM).toFixed(2)

        // Check pincode serviceability and get delivery_days
        let deliveryDays = 5
        if (sub.pincode) {
          const pc = await subClient.query(
            `SELECT delivery_days FROM serviceable_pincodes WHERE pincode=$1 AND is_active=TRUE LIMIT 1`,
            [sub.pincode]
          )
          if (pc.rows.length) deliveryDays = pc.rows[0].delivery_days || 5
        }

        const expectedDelivery = new Date()
        expectedDelivery.setDate(expectedDelivery.getDate() + deliveryDays)

        const addressSnapshot = JSON.stringify({
          name: sub.user_name || '',
          phone: sub.user_phone || '',
          address: `${sub.street}, ${sub.city}, ${sub.state} - ${sub.pincode}`,
          address_id: sub.address_id,
          price_breakup: { subtotal, gst, delivery, platform_fee: PLATFORM, grand_total: total },
        })

        // Create order
        const orderRes = await subClient.query(`
          INSERT INTO orders
            (user_id, total_amount, payment_method, shipping_address, address_id,
             status, payment_status, expires_at, expected_delivery_date)
          VALUES ($1,$2,'cod',$3,$4,$5,'pending', NOW() + INTERVAL '7 days', $6)
          RETURNING id
        `, [sub.user_id, total, addressSnapshot, sub.address_id, STATUS_PENDING,
            expectedDelivery.toISOString().slice(0, 10)])

        const orderId = orderRes.rows[0].id

        // Insert order item
        await subClient.query(`
          INSERT INTO order_items (order_id, product_id, variant_id, variant_label, quantity, price)
          VALUES ($1,$2,$3,$4,$5,$6)
        `, [orderId, sub.product_id, sub.variant_id || null, sub.variant_label || null, qty, price])

        // Deduct inventory (atomic guard: only deduct if stock is still sufficient)
        const invUpdate = sub.variant_id
          ? await subClient.query(
              `UPDATE product_variants SET inventory = inventory - $1 WHERE id=$2 AND inventory >= $1`,
              [qty, sub.variant_id]
            )
          : await subClient.query(
              `UPDATE products SET inventory = inventory - $1 WHERE id=$2 AND inventory >= $1`,
              [qty, sub.product_id]
            )
        if (!invUpdate.rowCount) {
          // Stock was depleted by a concurrent transaction between the outer check and now
          await subClient.query('ROLLBACK')
          console.log(`[SubBilling] Sub ${sub.sub_id}: inventory depleted (race condition), skipping`)
          await pool.query(
            `UPDATE subscriptions SET next_order_date = next_order_date + INTERVAL '1 day' WHERE id=$1`,
            [sub.sub_id]
          )
          continue
        }

        // Advance next_order_date
        await subClient.query(`
          UPDATE subscriptions
          SET next_order_date = CURRENT_DATE + ($1 * INTERVAL '1 day'),
              total_orders = total_orders + 1,
              last_order_id = $2,
              updated_at = NOW()
          WHERE id = $3
        `, [sub.frequency_days, orderId, sub.sub_id])

        await subClient.query('COMMIT')
        console.log(`[SubBilling] Sub ${sub.sub_id} → Order ${orderId} created for user ${sub.user_id}`)
      } catch (err) {
        await subClient.query('ROLLBACK')
        console.error(`[SubBilling] Sub ${sub.sub_id} failed:`, err.message)
      } finally {
        subClient.release()
      }
    }

    console.log('[SubBilling] Billing run complete')
  } catch (err) {
    console.error('[SubBilling] Fatal error:', err.message)
  } finally {
    client.release()
  }
}

module.exports = runSubscriptionBilling
