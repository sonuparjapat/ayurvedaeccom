const pool = require('../config/db')

/**
 * Fire-and-forget email delivery log.
 * Called after every transactional email send attempt.
 */
exports.logEmail = async ({
  type = 'unknown',
  email = '',
  name = null,
  subject = null,
  orderId = null,
  userId = null,
  status = 'sent',
  error = null,
} = {}) => {
  try {
    await pool.query(
      `INSERT INTO email_logs
         (email_type, recipient_email, recipient_name, subject, order_id, user_id, status, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [type, email, name || null, subject || null, orderId || null, userId || null, status, error || null]
    )
  } catch (err) {
    // Never let logging failure affect the main flow
    console.warn('[EMAIL LOG]', err.message)
  }
}
