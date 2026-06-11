const pool = require('../../config/db')
const { broadcastAll, broadcastSegment, savePushToken } = require('../../services/pushNotification')

/* Save token from mobile app */
exports.saveToken = async (req, res) => {
  try {
    const { token, deviceType } = req.body
    if (!token) return res.status(400).json({ message: 'Token required' })
    await savePushToken(req.user.id, token, deviceType || 'mobile')
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
