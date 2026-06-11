const pool = require('../../config/db')

/* ─── Get wallet balance + recent transactions ─── */
exports.getWallet = async (req, res) => {
  try {
    const userId = req.user.id
    const balRes = await pool.query('SELECT wallet_balance, loyalty_points_balance FROM users WHERE id=$1', [userId])
    const txRes = await pool.query(
      `SELECT * FROM wallet_transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20`,
      [userId]
    )
    const loyaltyRes = await pool.query(
      `SELECT * FROM loyalty_points WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20`,
      [userId]
    )
    res.json({
      wallet_balance: Number(balRes.rows[0]?.wallet_balance || 0),
      loyalty_points: Number(balRes.rows[0]?.loyalty_points_balance || 0),
      transactions: txRes.rows,
      loyalty_history: loyaltyRes.rows
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

/* ─── Admin: credit wallet to a user ─── */
exports.adminCreditWallet = async (req, res) => {
  const client = await pool.connect()
  try {
    const { user_id, amount, description } = req.body
    if (!user_id || !amount || Number(amount) <= 0)
      return res.status(400).json({ message: 'user_id and positive amount required' })

    await client.query('BEGIN')
    await client.query(
      `INSERT INTO wallet_transactions (user_id, amount, type, source, description) VALUES ($1,$2,'credit','admin',$3)`,
      [user_id, amount, description || 'Admin credit']
    )
    await client.query('UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2', [amount, user_id])
    await client.query('COMMIT')
    res.json({ success: true })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ message: 'Credit failed' })
  } finally {
    client.release()
  }
}

/* ─── Admin: list all users' wallet balances ─── */
exports.adminListWallets = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT u.id, u.name, u.email, u.wallet_balance, u.loyalty_points_balance
       FROM users u WHERE u.role = 3 ORDER BY u.wallet_balance DESC LIMIT 100`
    )
    res.json({ users: r.rows })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

/* ─── Apply wallet at checkout (called internally, also exposed) ─── */
exports.applyWallet = async (req, res) => {
  try {
    const userId = req.user.id
    const { amount } = req.body
    const balRes = await pool.query('SELECT wallet_balance FROM users WHERE id=$1', [userId])
    const balance = Number(balRes.rows[0]?.wallet_balance || 0)
    const apply = Math.min(Number(amount), balance)
    res.json({ applicable: apply, balance })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}
