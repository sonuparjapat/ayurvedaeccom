const pool = require('../../config/db')
const { broadcastAll, broadcastSegment, savePushToken } = require('../../services/pushNotification')

/* Save token from mobile app */
exports.saveToken = async (req, res) => {
  try {
    const { token, device_type, deviceType } = req.body
    if (!token) return res.status(400).json({ message: 'Token required' })
    await savePushToken(req.user.id, token, device_type || deviceType || 'mobile')
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

/* Admin: broadcast to all users */
exports.adminBroadcast = async (req, res) => {
  try {
    const { title, body, data } = req.body
    if (!title || !body) return res.status(400).json({ message: 'Title and body required' })
    const result = await broadcastAll(title, body, data || {})
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ message: 'Broadcast failed' })
  }
}

/* Admin: get notification stats */
exports.adminStats = async (req, res) => {
  try {
    const r = await pool.query(`SELECT COUNT(*) AS total_tokens, COUNT(DISTINCT user_id) AS total_users FROM push_tokens`)
    res.json(r.rows[0])
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

/* User notifications inbox — last 30 order status events */
exports.userNotifications = async (req, res) => {
  try {
    const userId = req.user.id
    const r = await pool.query(
      `SELECT osl.id, osl.order_id, osl.new_status, osl.note, osl.created_at,
              sm.label AS status_label, o.invoice_no,
              o.total_amount
       FROM order_status_logs osl
       JOIN orders o ON o.id = osl.order_id
       LEFT JOIN order_status_master sm ON sm.code = osl.new_status
       WHERE o.user_id = $1
       ORDER BY osl.created_at DESC
       LIMIT 50`,
      [userId]
    )
    const statusEmoji = {
      0:'🕐',1:'✅',2:'⚙️',3:'📦',4:'🚚',5:'🎉',6:'❌',7:'↩️',8:'💰',9:'✔️'
    }
    const notifications = r.rows.map(row => ({
      id: row.id,
      order_id: row.order_id,
      invoice_no: row.invoice_no,
      new_status: row.new_status,
      title: `Order ${row.invoice_no || '#' + row.order_id} — ${row.status_label || 'Updated'}`,
      body: row.note || `Your order status changed to ${row.status_label}`,
      emoji: statusEmoji[row.new_status] || '📬',
      created_at: row.created_at,
      type: 'order_update',
    }))
    res.json({ notifications })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}
