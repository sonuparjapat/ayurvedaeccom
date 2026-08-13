/**
 * Auto-Cancel Stale Pending Orders
 *
 * Runs on a schedule. Cancels orders stuck at status=0 (Pending)
 * where the admin never confirmed within ORDER_AUTO_CANCEL_HOURS (default 24h).
 *
 * Per-order:
 *   1. Restore inventory (variant-aware)
 *   2. Mark order cancelled with reason
 *   3. Auto-refund via Razorpay for paid online orders
 *   4. Send cancellation email to customer
 *   5. Push in-app notification to customer
 *   6. Alert admin via socket
 */

const pool = require('../config/db')
const Razorpay = require('razorpay')
const { sendOrderCancelledEmail } = require('./email/orderStatusEmail')
const { createNotification } = require('./notification.service')
const { emitToAdmin } = require('../socket')
const { logPayment } = require('./paymentLogger')

const CANCEL_REASON = 'Auto-cancelled: Order was not confirmed within the allowed time.'
const HOURS = parseInt(process.env.ORDER_AUTO_CANCEL_HOURS) || 24

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
})

async function autoCancelOrders() {
  console.log(`[AutoCancel] Checking for pending orders older than ${HOURS}h…`)

  // Find all stale pending orders (status=0, created more than HOURS ago)
  // Excludes orders still in unpaid payment-pending state (those are handled by cleanOrders)
  let staleOrders
  try {
    const res = await pool.query(
      `SELECT o.id, o.user_id, o.payment_method, o.payment_status, o.total_amount,
              o.razorpay_payment_id, o.created_at, o.wallet_discount, o.coupon_code,
              o.gift_card_code, o.gift_card_discount,
              u.name AS user_name, u.email AS user_email,
              i.invoice_no
       FROM orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN invoices i ON i.order_id = o.id
       WHERE o.status = 0
         AND o.created_at < NOW() - ($1 * INTERVAL '1 hour')
         AND (o.payment_status = 'paid' OR o.payment_method = 'cod')
       ORDER BY o.created_at ASC`,
      [HOURS]
    )
    staleOrders = res.rows
  } catch (err) {
    console.error('[AutoCancel] Failed to fetch stale orders:', err.message)
    return
  }

  if (staleOrders.length === 0) {
    console.log('[AutoCancel] No stale orders found.')
    return
  }

  console.log(`[AutoCancel] Found ${staleOrders.length} stale order(s) to cancel.`)

  for (const order of staleOrders) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // 1. Restore inventory (variant-aware)
      const items = await client.query(
        `SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = $1`,
        [order.id]
      )

      for (const item of items.rows) {
        if (item.variant_id) {
          await client.query(
            `UPDATE product_variants SET inventory = inventory + $1 WHERE id = $2`,
            [item.quantity, item.variant_id]
          )
        } else {
          await client.query(
            `UPDATE products SET inventory = inventory + $1 WHERE id = $2`,
            [item.quantity, item.product_id]
          )
        }
      }

      // 2. Mark cancelled
      await client.query(
        `UPDATE orders
         SET status = 6,
             cancel_reason = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [CANCEL_REASON, order.id]
      )

      // 3a. Refund wallet credits used on this order
      const walletUsed = Number(order.wallet_discount || 0)
      if (walletUsed > 0) {
        await client.query(
          `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`,
          [walletUsed, order.user_id]
        )
        await client.query(
          `INSERT INTO wallet_transactions (user_id, amount, type, source, order_id, description)
           VALUES ($1, $2, 'credit', 'refund', $3, $4)`,
          [order.user_id, walletUsed, order.id, `Wallet refund for auto-cancelled order #${order.id}`]
        )
      }

      // 3b. Restore loyalty points used on this order
      const lpRes = await client.query(
        `SELECT COALESCE(SUM(points), 0) AS pts FROM loyalty_points WHERE order_id = $1 AND type = 'redeem'`,
        [order.id]
      )
      const loyaltyPts = Number(lpRes.rows[0]?.pts || 0)
      if (loyaltyPts > 0) {
        await client.query(
          `UPDATE users SET loyalty_points_balance = loyalty_points_balance + $1 WHERE id = $2`,
          [loyaltyPts, order.user_id]
        )
        await client.query(
          `INSERT INTO loyalty_points (user_id, points, type, source, order_id, description)
           VALUES ($1, $2, 'earn', 'refund', $3, $4)`,
          [order.user_id, loyaltyPts, order.id, `Points restored for auto-cancelled order #${order.id}`]
        )
      }

      // 3c. Restore gift card balance used on this order
      if (order.gift_card_code && Number(order.gift_card_discount) > 0) {
        await client.query(
          `UPDATE gift_cards SET balance = balance + $1 WHERE UPPER(code) = UPPER($2)`,
          [Number(order.gift_card_discount), order.gift_card_code]
        )
      }

      // 3d. Decrement coupon usage so it can be reused
      if (order.coupon_code) {
        await client.query(
          `UPDATE coupons SET used_count = GREATEST(0, used_count - 1), updated_at = NOW()
           WHERE UPPER(code) = UPPER($1)`,
          [order.coupon_code]
        )
        await client.query(`DELETE FROM coupon_uses WHERE order_id = $1`, [order.id])
      }

      // 3d. Restore flash sale slots if applicable
      const flashRows = await client.query(
        `SELECT flash_sale_id, product_id, quantity FROM price_logs
         WHERE order_id = $1 AND reason_type = 'flash_sale' AND flash_sale_id IS NOT NULL`,
        [order.id]
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

      await client.query('COMMIT')
      console.log(`[AutoCancel] Order #${order.id} cancelled.`)
    } catch (err) {
      await client.query('ROLLBACK')
      console.error(`[AutoCancel] Failed to cancel order #${order.id}:`, err.message)
      client.release()
      continue
    }
    client.release()

    // 3. Auto-refund for paid online orders (fire-and-forget after commit)
    let refundAmount = null
    let refundTo = null

    if (order.payment_method !== 'cod' && order.payment_status === 'paid' && order.razorpay_payment_id) {
      try {
        const refundPaise = Math.round(Number(order.total_amount) * 100)
        const refund = await razorpay.payments.refund(order.razorpay_payment_id, {
          amount: refundPaise,
          speed: 'normal',
          notes: { order_id: order.id, reason: 'Auto-cancelled: admin did not confirm' },
        })

        const rzpStatus = refund.status === 'processed' ? 'processed' : 'pending'
        await pool.query(
          `UPDATE orders
           SET refund_id = $1, refund_amount = $2, refund_status = $3,
               payment_status = 'refunded', updated_at = NOW()
           WHERE id = $4`,
          [refund.id, Number(order.total_amount), rzpStatus, order.id]
        )

        refundAmount = Number(order.total_amount)
        refundTo = 'original payment method'
        console.log(`[AutoCancel] Refund initiated for order #${order.id} — ${rzpStatus}`)
        logPayment(order.id, 'auto_cancel_refund_initiated', {
          amount: order.total_amount,
          status: rzpStatus,
          gatewayPaymentId: order.razorpay_payment_id,
          gatewayRefundId: refund.id,
          initiatedBy: 'system',
          notes: CANCEL_REASON,
        });
      } catch (refundErr) {
        console.error(`[AutoCancel] Refund failed for order #${order.id}:`, refundErr.message)
        await pool.query(
          `UPDATE orders SET refund_status = 'failed', updated_at = NOW() WHERE id = $1`,
          [order.id]
        )
        logPayment(order.id, 'refund_initiation_failed', {
          status: 'failed',
          gatewayPaymentId: order.razorpay_payment_id,
          initiatedBy: 'system',
          notes: refundErr.message,
        });
      }
    }

    // 4. Send cancellation email
    try {
      await sendOrderCancelledEmail({
        email: order.user_email,
        name: order.user_name,
        orderId: order.id,
        invoiceNo: order.invoice_no,
        reason: `Your order was not confirmed by our team within ${HOURS} hours. We apologise for the inconvenience.`,
        refundAmount,
        refundTo,
      })
    } catch (emailErr) {
      console.error(`[AutoCancel] Email failed for order #${order.id}:`, emailErr.message)
    }

    // 5. In-app notification to customer
    try {
      await createNotification(
        order.user_id,
        'order',
        `Order #${order.id} Auto-Cancelled`,
        `Your order was not confirmed within ${HOURS} hours and has been automatically cancelled.${
          refundAmount ? ` A refund of ₹${refundAmount.toLocaleString('en-IN')} has been initiated.` : ''
        }`,
        { order_id: order.id }
      )
    } catch (notifErr) {
      console.error(`[AutoCancel] Notification failed for order #${order.id}:`, notifErr.message)
    }

    // 6. Alert admin via socket
    try {
      emitToAdmin('order_auto_cancelled', {
        order_id: order.id,
        user_name: order.user_name,
        total_amount: order.total_amount,
        reason: CANCEL_REASON,
      })
    } catch {}
  }

  console.log(`[AutoCancel] Done. Processed ${staleOrders.length} order(s).`)
}

module.exports = autoCancelOrders
