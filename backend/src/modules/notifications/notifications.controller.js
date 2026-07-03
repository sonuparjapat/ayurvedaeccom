const pool = require('../../config/db')

/* GET /notifications — personal notifications + recent admin broadcasts */
exports.list = async (req, res) => {
  try {
    const userId = req.user.id
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = 30
    const offset = (page - 1) * limit

    const [personalRes, broadcastRes, unreadRes] = await Promise.all([
      pool.query(
        `SELECT * FROM user_notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      ),
      pool.query(
        `SELECT id, title, body, sent_to, created_at
         FROM push_notification_logs
         ORDER BY created_at DESC
         LIMIT 10`
      ),
      pool.query(
        `SELECT COUNT(*) AS count FROM user_notifications WHERE user_id=$1 AND is_read=false`,
        [userId]
      ),
    ])

    res.json({
      notifications: personalRes.rows,
      broadcasts: broadcastRes.rows,
      unread_count: parseInt(unreadRes.rows[0].count),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

/* GET /notifications/unread-count — lightweight badge count for header */
exports.unreadCount = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT COUNT(*) AS count FROM user_notifications WHERE user_id=$1 AND is_read=false`,
      [req.user.id]
    )
    res.json({ count: parseInt(r.rows[0].count) })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

/* PUT /notifications/read-all — mark all unread as read */
exports.readAll = async (req, res) => {
  try {
    await pool.query(
      `UPDATE user_notifications SET is_read=true WHERE user_id=$1 AND is_read=false`,
      [req.user.id]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

/* PUT /notifications/:id/read — mark single notification as read */
exports.readOne = async (req, res) => {
  try {
    await pool.query(
      `UPDATE user_notifications SET is_read=true WHERE id=$1 AND user_id=$2`,
      [req.params.id, req.user.id]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}
