const pool = require('../../config/db')

exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email required' })
    }
    const exists = await pool.query('SELECT id, is_active FROM newsletter_subscribers WHERE email = $1', [email.toLowerCase().trim()])
    if (exists.rows.length) {
      if (!exists.rows[0].is_active) {
        await pool.query('UPDATE newsletter_subscribers SET is_active = TRUE, subscribed_at = NOW() WHERE id = $1', [exists.rows[0].id])
        return res.json({ success: true, message: 'Welcome back! You have been re-subscribed.' })
      }
      return res.json({ success: true, message: 'You are already subscribed!' })
    }
    await pool.query('INSERT INTO newsletter_subscribers (email) VALUES ($1)', [email.toLowerCase().trim()])
    res.json({ success: true, message: 'Successfully subscribed! 🌿' })
  } catch (err) {
    console.error('[Newsletter]', err)
    res.status(500).json({ success: false, message: 'Subscription failed' })
  }
}

exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ success: false, message: 'Email required' })
    await pool.query('UPDATE newsletter_subscribers SET is_active = FALSE WHERE email = $1', [email.toLowerCase().trim()])
    res.json({ success: true, message: 'Unsubscribed successfully' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed' })
  }
}

exports.adminList = async (req, res) => {
  try {
    const { page = 1, limit = 50, status = 'all' } = req.query
    const pg = Math.max(1, parseInt(page) || 1)
    const lim = Math.min(200, Math.max(1, parseInt(limit) || 50))
    const offset = (pg - 1) * lim
    let where = ''
    if (status === 'active') where = 'WHERE is_active = TRUE'
    else if (status === 'inactive') where = 'WHERE is_active = FALSE'
    const countRes = await pool.query(`SELECT COUNT(*) FROM newsletter_subscribers ${where}`)
    const result = await pool.query(`SELECT * FROM newsletter_subscribers ${where} ORDER BY subscribed_at DESC LIMIT $1 OFFSET $2`, [lim, offset])
    const activeCount = await pool.query('SELECT COUNT(*) FROM newsletter_subscribers WHERE is_active = TRUE')
    res.json({
      success: true,
      data: result.rows,
      total: Number(countRes.rows[0].count),
      activeCount: Number(activeCount.rows[0].count),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Failed' })
  }
}

exports.adminExportCSV = async (req, res) => {
  try {
    const result = await pool.query('SELECT email, is_active, subscribed_at FROM newsletter_subscribers WHERE is_active = TRUE ORDER BY subscribed_at DESC')
    const csv = ['Email,Subscribed At', ...result.rows.map(r => `${r.email},${new Date(r.subscribed_at).toISOString().slice(0, 10)}`)].join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="newsletter_subscribers_${Date.now()}.csv"`)
    res.send(csv)
  } catch (err) {
    res.status(500).json({ success: false, message: 'Export failed' })
  }
}

exports.adminDelete = async (req, res) => {
  try {
    await pool.query('DELETE FROM newsletter_subscribers WHERE id = $1', [req.params.id])
    res.json({ success: true, message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed' })
  }
}
