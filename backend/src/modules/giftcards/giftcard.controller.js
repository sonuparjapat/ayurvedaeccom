const pool = require('../../config/db')
const crypto = require('crypto')

function generateCode() {
  return crypto.randomBytes(6).toString('hex').toUpperCase().replace(/(.{4})/g, '$1-').slice(0, -1)
}

/* ── Admin: Create gift card ── */
exports.adminCreateGiftCard = async (req, res) => {
  try {
    const { amount, issued_to_email, expires_at } = req.body
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount required' })
    }
    const code = generateCode()
    const result = await pool.query(`
      INSERT INTO gift_cards (code, amount, balance, issued_to_email, expires_at)
      VALUES ($1, $2, $2, $3, $4) RETURNING *
    `, [code, Number(amount), issued_to_email || null, expires_at || null])
    res.status(201).json({ success: true, data: result.rows[0] })
  } catch (err) {
    console.error('[adminCreateGiftCard]', err)
    res.status(500).json({ success: false, message: 'Failed to create gift card' })
  }
}

/* ── Admin: List gift cards ── */
exports.adminListGiftCards = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, parseInt(req.query.limit) || 20)
    const offset = (page - 1) * limit
    const [data, count] = await Promise.all([
      pool.query(`SELECT * FROM gift_cards ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]),
      pool.query(`SELECT COUNT(*) FROM gift_cards`),
    ])
    res.json({ success: true, data: data.rows, total: Number(count.rows[0].count), page, limit })
  } catch (err) {
    console.error('[adminListGiftCards]', err)
    res.status(500).json({ success: false, message: 'Failed to list gift cards' })
  }
}

/* ── Admin: Deactivate ── */
exports.adminDeactivateGiftCard = async (req, res) => {
  try {
    await pool.query(`UPDATE gift_cards SET is_active=FALSE WHERE id=$1`, [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to deactivate' })
  }
}

/* ── User/Public: Validate code ── */
exports.validateGiftCard = async (req, res) => {
  try {
    const { code } = req.params
    const result = await pool.query(`
      SELECT id, code, amount, balance, expires_at, is_active, issued_to_email
      FROM gift_cards WHERE UPPER(code) = UPPER($1)
    `, [code])
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Gift card not found' })
    const gc = result.rows[0]
    if (!gc.is_active) return res.status(400).json({ success: false, message: 'This gift card has been deactivated' })
    if (gc.balance <= 0) return res.status(400).json({ success: false, message: 'Gift card balance is exhausted' })
    if (gc.expires_at && new Date() > new Date(gc.expires_at)) {
      return res.status(400).json({ success: false, message: 'Gift card has expired' })
    }
    res.json({ success: true, data: { code: gc.code, balance: gc.balance, amount: gc.amount } })
  } catch (err) {
    console.error('[validateGiftCard]', err)
    res.status(500).json({ success: false, message: 'Failed to validate' })
  }
}

/* ── Apply gift card at checkout (called from order creation) ── */
exports.applyGiftCardToOrder = async (client, code, amountToApply, orderId, userId) => {
  const result = await client.query(
    `SELECT * FROM gift_cards WHERE UPPER(code) = UPPER($1) FOR UPDATE`,
    [code]
  )
  if (!result.rows.length) throw new Error('Invalid gift card code')
  const gc = result.rows[0]
  if (!gc.is_active || gc.balance <= 0) throw new Error('Gift card is inactive or exhausted')
  if (gc.expires_at && new Date() > new Date(gc.expires_at)) throw new Error('Gift card has expired')

  const actualDeduction = Math.min(amountToApply, Number(gc.balance))
  await client.query(
    `UPDATE gift_cards SET balance = balance - $1, used_at = CASE WHEN balance - $1 <= 0 THEN NOW() ELSE used_at END WHERE id = $2`,
    [actualDeduction, gc.id]
  )
  await client.query(
    `INSERT INTO gift_card_uses (gift_card_id, order_id, user_id, amount_used) VALUES ($1,$2,$3,$4)`,
    [gc.id, orderId, userId, actualDeduction]
  )
  return actualDeduction
}
