const pool = require('../../config/db')

/* GET /notifications
   Query params:
     page       - page number (default 1)
     limit      - per page (default 20, max 50)
     type       - filter by type: order_update | support_reply | ticket_status | broadcast | all
     is_read    - filter by read status: true | false | all (default all)
     date_from  - ISO date string (inclusive)
     date_to    - ISO date string (inclusive, end of day)
*/
exports.list = async (req, res) => {
  try {
    const userId = req.user.id
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20))
    const offset = (page - 1) * limit
    const { type, is_read, date_from, date_to } = req.query

    const conditions = ['user_id = $1']
    const vals = [userId]
    let idx = 2

    if (type && type !== 'all' && type !== 'broadcast') {
      conditions.push(`type = $${idx++}`)
      vals.push(type)
    }

    if (is_read === 'true') {
      conditions.push(`is_read = true`)
    } else if (is_read === 'false') {
      conditions.push(`is_read = false`)
    }

    if (date_from) {
      conditions.push(`created_at >= $${idx++}`)
      vals.push(new Date(date_from).toISOString())
    }

    if (date_to) {
      conditions.push(`created_at < $${idx++}`)
      // End of the given day
      const end = new Date(date_to)
      end.setDate(end.getDate() + 1)
      vals.push(end.toISOString())
    }

    const where = `WHERE ${conditions.join(' AND ')}`

    // Only fetch broadcasts tab if type is 'all' or 'broadcast'
    const includeBroadcasts = !type || type === 'all' || type === 'broadcast'

    const [personalRes, countRes, unreadRes, broadcastRes] = await Promise.all([
      pool.query(
        `SELECT * FROM user_notifications ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...vals, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*) AS total FROM user_notifications ${where}`,
        vals
      ),
      pool.query(
        `SELECT COUNT(*) AS count FROM user_notifications WHERE user_id=$1 AND is_read=false`,
        [userId]
      ),
      includeBroadcasts
        ? pool.query(
            `SELECT id, title, body, sent_to, created_at FROM push_notification_logs
             ORDER BY created_at DESC LIMIT 10`
          )
        : Promise.resolve({ rows: [] }),
    ])

    const total = parseInt(countRes.rows[0].total)

    res.json({
      notifications: personalRes.rows,
      broadcasts: broadcastRes.rows,
      unread_count: parseInt(unreadRes.rows[0].count),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next: offset + limit < total,
        has_prev: page > 1,
      },
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
