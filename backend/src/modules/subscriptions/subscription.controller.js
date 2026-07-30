const pool = require('../../config/db')

exports.createSubscription = async (req, res) => {
  try {
    const userId = req.user.id
    const { product_id, variant_id, quantity = 1, frequency_days = 30, address_id, payment_method = 'cod' } = req.body

    if (!product_id) return res.status(400).json({ success: false, message: 'Product required' })
    if (![7, 14, 30, 60, 90].includes(Number(frequency_days))) {
      return res.status(400).json({ success: false, message: 'Frequency must be 7, 14, 30, 60, or 90 days' })
    }

    const product = await pool.query('SELECT id, name, price FROM products WHERE id=$1 AND status=$2', [product_id, 'active'])
    if (!product.rows.length) return res.status(404).json({ success: false, message: 'Product not found' })

    const exists = await pool.query(
      'SELECT id FROM subscriptions WHERE user_id=$1 AND product_id=$2 AND status=$3',
      [userId, product_id, 'active']
    )
    if (exists.rows.length) return res.status(400).json({ success: false, message: 'Active subscription already exists for this product' })

    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + Number(frequency_days))

    const result = await pool.query(
      `INSERT INTO subscriptions (user_id, product_id, variant_id, quantity, frequency_days, next_order_date, address_id, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [userId, product_id, variant_id || null, quantity, frequency_days, nextDate, address_id || null, payment_method]
    )

    res.json({ success: true, data: result.rows[0], message: 'Subscription created' })
  } catch (err) {
    console.error('[Subscription Create]', err)
    res.status(500).json({ success: false, message: 'Failed to create subscription' })
  }
}

exports.getMySubscriptions = async (req, res) => {
  try {
    const userId = req.user.id
    const result = await pool.query(
      `SELECT s.*, p.name as product_name, p.price, p.images
       FROM subscriptions s
       JOIN products p ON s.product_id = p.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [userId]
    )
    res.json({ success: true, data: result.rows })
  } catch (err) {
    console.error('[Subscription List]', err)
    res.status(500).json({ success: false, message: 'Failed to load subscriptions' })
  }
}

exports.updateSubscription = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const { frequency_days, quantity, status, address_id, payment_method } = req.body

    const sub = await pool.query('SELECT * FROM subscriptions WHERE id=$1 AND user_id=$2', [id, userId])
    if (!sub.rows.length) return res.status(404).json({ success: false, message: 'Subscription not found' })

    const updates = []
    const values = []
    let idx = 1

    if (frequency_days) { updates.push(`frequency_days=$${idx++}`); values.push(frequency_days) }
    if (quantity) { updates.push(`quantity=$${idx++}`); values.push(quantity) }
    if (status) { updates.push(`status=$${idx++}`); values.push(status) }
    if (address_id) { updates.push(`address_id=$${idx++}`); values.push(address_id) }
    if (payment_method) { updates.push(`payment_method=$${idx++}`); values.push(payment_method) }
    updates.push(`updated_at=NOW()`)

    if (status === 'active' && sub.rows[0].status === 'paused') {
      const nextDate = new Date()
      nextDate.setDate(nextDate.getDate() + (frequency_days || sub.rows[0].frequency_days))
      updates.push(`next_order_date=$${idx++}`)
      values.push(nextDate)
    }

    values.push(id)
    await pool.query(
      `UPDATE subscriptions SET ${updates.join(', ')} WHERE id=$${idx}`,
      values
    )

    res.json({ success: true, message: 'Subscription updated' })
  } catch (err) {
    console.error('[Subscription Update]', err)
    res.status(500).json({ success: false, message: 'Failed to update' })
  }
}

exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    await pool.query(
      "UPDATE subscriptions SET status='cancelled', updated_at=NOW() WHERE id=$1 AND user_id=$2",
      [id, userId]
    )
    res.json({ success: true, message: 'Subscription cancelled' })
  } catch (err) {
    console.error('[Subscription Cancel]', err)
    res.status(500).json({ success: false, message: 'Failed to cancel' })
  }
}

exports.adminListSubscriptions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const offset = (page - 1) * limit
    let where = ''
    const params = [limit, offset]
    if (status) { where = 'WHERE s.status = $3'; params.push(status) }

    const result = await pool.query(
      `SELECT s.*, p.name as product_name, p.price, p.images, u.name as user_name, u.email as user_email
       FROM subscriptions s
       JOIN products p ON s.product_id = p.id
       JOIN users u ON s.user_id = u.id
       ${where}
       ORDER BY s.created_at DESC LIMIT $1 OFFSET $2`,
      params
    )
    const countWhere = status ? 'WHERE s.status = $1' : '';
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM subscriptions s ${countWhere}`,
      status ? [status] : []
    )

    res.json({ success: true, data: result.rows, total: Number(countRes.rows[0].count) })
  } catch (err) {
    console.error('[Admin Subscriptions]', err)
    res.status(500).json({ success: false, message: 'Failed' })
  }
}
