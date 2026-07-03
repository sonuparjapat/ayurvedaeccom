const pool = require('../config/db')
const { emitToUser } = require('../socket')

/**
 * Creates a persistent notification for a user and emits it via WebSocket.
 * type examples: 'order_update', 'support_reply', 'ticket_status', 'broadcast'
 */
exports.createNotification = async (userId, type, title, body, data = {}) => {
  try {
    const r = await pool.query(
      `INSERT INTO user_notifications (user_id, type, title, body, data)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, type, title, body || null, JSON.stringify(data)]
    )
    const notif = r.rows[0]
    emitToUser(userId, 'new_notification', notif)
    return notif
  } catch (err) {
    console.error('[notification.service] createNotification error:', err.message)
  }
}
