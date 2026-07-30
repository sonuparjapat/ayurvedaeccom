const pool = require('../config/db')

/**
 * Log a payment event. Never throws — failures are swallowed so logging
 * never blocks or breaks the actual payment flow.
 *
 * @param {number|null} orderId
 * @param {string} eventType  e.g. 'order_placed', 'payment_captured', 'refund_initiated'
 * @param {object} data
 *   amount            – in rupees
 *   status            – 'success' | 'pending' | 'failed' | 'initiated' | etc.
 *   gatewayPaymentId  – razorpay_payment_id
 *   gatewayOrderId    – razorpay_order_id
 *   gatewayRefundId   – razorpay refund id
 *   gatewayEvent      – webhook event name (e.g. 'refund.processed')
 *   initiatedBy       – 'customer' | 'admin' | 'system'
 *   metadata          – plain object with extra context
 *   notes             – free-text note
 */
async function logPayment(orderId, eventType, data = {}) {
  try {
    const {
      amount,
      status,
      gatewayPaymentId,
      gatewayOrderId,
      gatewayRefundId,
      gatewayEvent,
      initiatedBy,
      metadata,
      notes,
    } = data

    await pool.query(
      `INSERT INTO payment_logs
       (order_id, event_type, amount, status,
        gateway_payment_id, gateway_order_id, gateway_refund_id,
        gateway_event, initiated_by, metadata, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        orderId || null,
        eventType,
        amount != null ? Number(amount) : null,
        status || null,
        gatewayPaymentId || null,
        gatewayOrderId || null,
        gatewayRefundId || null,
        gatewayEvent || null,
        initiatedBy || 'system',
        metadata ? JSON.stringify(metadata) : null,
        notes || null,
      ]
    )
  } catch (err) {
    console.error('[PAYMENT_LOG ERROR]', err.message)
  }
}

module.exports = { logPayment }
