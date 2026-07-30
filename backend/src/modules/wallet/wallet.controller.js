const pool = require('../../config/db')
const { getLoyaltySettings, invalidateCache } = require('../../services/loyaltySettings.service')

const TIERS = [
  { name: 'bronze',   min: 0,     max: 4999,  label: 'Bronze',   emoji: '🥉', color: '#cd7f32', benefits: ['5% cashback on wallet topups'] },
  { name: 'silver',   min: 5000,  max: 19999, label: 'Silver',   emoji: '🥈', color: '#9e9e9e', benefits: ['7% cashback', 'Free delivery on all orders'] },
  { name: 'gold',     min: 20000, max: 49999, label: 'Gold',     emoji: '🥇', color: '#ffd700', benefits: ['10% cashback', 'Free delivery', 'Priority support'] },
  { name: 'platinum', min: 50000, max: null,  label: 'Platinum', emoji: '💎', color: '#b5a0d8', benefits: ['15% cashback', 'Free delivery', 'Dedicated support', 'Early access to sales'] },
]

/* ─── Get wallet balance + recent transactions (user) ─── */
exports.getWallet = async (req, res) => {
  try {
    const userId = req.user.id
    const [balRes, txRes, loyaltyRes] = await Promise.all([
      pool.query('SELECT wallet_balance, loyalty_points_balance FROM users WHERE id=$1', [userId]),
      pool.query(`SELECT * FROM wallet_transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`, [userId]),
      pool.query(`SELECT * FROM loyalty_points WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`, [userId]),
    ])
    res.json({
      wallet_balance: Number(balRes.rows[0]?.wallet_balance || 0),
      loyalty_points: Number(balRes.rows[0]?.loyalty_points_balance || 0),
      transactions: txRes.rows,
      loyalty_history: loyaltyRes.rows,
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

/* ─── Apply wallet at checkout ─── */
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

/* ─── Admin: list all users' wallet balances ─── */
exports.adminListWallets = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 50 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    let where = `WHERE u.role = 3`
    const vals = []
    if (search) {
      where += ` AND (u.name ILIKE $1 OR u.email ILIKE $1)`
      vals.push(`%${search}%`)
    }

    const [usersRes, statsRes] = await Promise.all([
      pool.query(
        `SELECT u.id, u.name, u.email, u.phone, u.wallet_balance, u.loyalty_points_balance,
                (SELECT COUNT(*) FROM wallet_transactions wt WHERE wt.user_id=u.id) AS tx_count,
                (SELECT MAX(wt.created_at) FROM wallet_transactions wt WHERE wt.user_id=u.id) AS last_tx
         FROM users u ${where}
         ORDER BY u.wallet_balance DESC
         LIMIT ${Number(limit)} OFFSET ${offset}`,
        vals
      ),
      pool.query(
        `SELECT
           COALESCE(SUM(wallet_balance),0) AS total_wallet,
           COALESCE(SUM(loyalty_points_balance),0) AS total_loyalty,
           COUNT(*) AS total_users,
           COUNT(*) FILTER (WHERE wallet_balance > 0) AS users_with_balance
         FROM users WHERE role=3`
      ),
    ])

    res.json({ users: usersRes.rows, stats: statsRes.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

/* ─── Admin: get individual user's full wallet + loyalty history ─── */
exports.adminUserDetail = async (req, res) => {
  try {
    const { id } = req.params
    const [userRes, txRes, loyaltyRes] = await Promise.all([
      pool.query(`SELECT id, name, email, phone, wallet_balance, loyalty_points_balance FROM users WHERE id=$1`, [id]),
      pool.query(`SELECT wt.*, o.invoice_no FROM wallet_transactions wt LEFT JOIN orders o ON o.id=wt.order_id WHERE wt.user_id=$1 ORDER BY wt.created_at DESC`, [id]),
      pool.query(`SELECT lp.*, o.invoice_no FROM loyalty_points lp LEFT JOIN orders o ON o.id=lp.order_id WHERE lp.user_id=$1 ORDER BY lp.created_at DESC`, [id]),
    ])
    if (!userRes.rows[0]) return res.status(404).json({ message: 'User not found' })
    res.json({ user: userRes.rows[0], transactions: txRes.rows, loyalty_history: loyaltyRes.rows })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

/* ─── Admin: credit wallet ─── */
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
    await client.query('UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id=$2', [amount, user_id])
    await client.query('COMMIT')
    res.json({ success: true })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ message: 'Credit failed' })
  } finally { client.release() }
}

/* ─── Admin: debit wallet (correction / adjustment) ─── */
exports.adminDebitWallet = async (req, res) => {
  const client = await pool.connect()
  try {
    const { user_id, amount, description } = req.body
    if (!user_id || !amount || Number(amount) <= 0)
      return res.status(400).json({ message: 'user_id and positive amount required' })

    await client.query('BEGIN')
    const balRes = await client.query('SELECT wallet_balance FROM users WHERE id=$1 FOR UPDATE', [user_id])
    const balance = Number(balRes.rows[0]?.wallet_balance || 0)
    if (balance < Number(amount)) {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: `Insufficient balance. User has ₹${balance.toFixed(2)}` })
    }

    await client.query(
      `INSERT INTO wallet_transactions (user_id, amount, type, source, description) VALUES ($1,$2,'debit','admin',$3)`,
      [user_id, amount, description || 'Admin adjustment']
    )
    await client.query('UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id=$2', [amount, user_id])
    await client.query('COMMIT')
    res.json({ success: true })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ message: err.message || 'Debit failed' })
  } finally { client.release() }
}

/* ─── Admin: credit loyalty points ─── */
exports.adminCreditLoyalty = async (req, res) => {
  const client = await pool.connect()
  try {
    const { user_id, points, description } = req.body
    if (!user_id || !points || Number(points) <= 0)
      return res.status(400).json({ message: 'user_id and positive points required' })

    await client.query('BEGIN')
    await client.query(
      `INSERT INTO loyalty_points (user_id, points, type, source, description) VALUES ($1,$2,'earn','admin',$3)`,
      [user_id, points, description || 'Admin award']
    )
    await client.query('UPDATE users SET loyalty_points_balance = loyalty_points_balance + $1 WHERE id=$2', [points, user_id])
    await client.query('COMMIT')
    res.json({ success: true })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ message: 'Award failed' })
  } finally { client.release() }
}

/* ─── Admin: deduct loyalty points ─── */
exports.adminDebitLoyalty = async (req, res) => {
  const client = await pool.connect()
  try {
    const { user_id, points, description } = req.body
    if (!user_id || !points || Number(points) <= 0)
      return res.status(400).json({ message: 'user_id and positive points required' })

    await client.query('BEGIN')
    const balRes = await client.query('SELECT loyalty_points_balance FROM users WHERE id=$1 FOR UPDATE', [user_id])
    const bal = Number(balRes.rows[0]?.loyalty_points_balance || 0)
    if (bal < Number(points))
      return res.status(400).json({ message: `Insufficient points. User has ${bal} pts` })

    await client.query(
      `INSERT INTO loyalty_points (user_id, points, type, source, description) VALUES ($1,$2,'redeem','admin',$3)`,
      [user_id, points, description || 'Admin deduction']
    )
    await client.query('UPDATE users SET loyalty_points_balance = loyalty_points_balance - $1 WHERE id=$2', [points, user_id])
    await client.query('COMMIT')
    res.json({ success: true })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ message: 'Deduction failed' })
  } finally { client.release() }
}

/* ─── Public: get loyalty settings (for frontend checkout display) ─── */
exports.getSettings = async (req, res) => {
  try {
    const [loyaltySettings, deliveryRes] = await Promise.all([
      getLoyaltySettings(),
      pool.query(
        `SELECT key, value, type FROM app_settings WHERE key IN ('free_delivery_limit','delivery_charge','platform_fee')`
      ),
    ])
    const delivery = {}
    for (const row of deliveryRes.rows) {
      delivery[row.key] = row.type === 'number' ? Number(row.value) : row.value
    }
    res.json({ settings: loyaltySettings, delivery })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

/* ─── Admin: get all loyalty settings for the settings panel ─── */
exports.adminGetLoyaltySettings = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, key, value, type, description, updated_at FROM app_settings
       WHERE key IN (
         'loyalty_enabled','wallet_enabled',
         'loyalty_earn_rate','loyalty_redeem_rate',
         'loyalty_min_redeem_points','loyalty_max_redeem_percent'
       ) ORDER BY key`
    )
    res.json({ settings: r.rows })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

/* ─── Admin: update loyalty settings (bulk key-value save) ─── */
exports.adminSaveLoyaltySettings = async (req, res) => {
  const ALLOWED_KEYS = [
    'loyalty_enabled', 'wallet_enabled',
    'loyalty_earn_rate', 'loyalty_redeem_rate',
    'loyalty_min_redeem_points', 'loyalty_max_redeem_percent',
  ]
  try {
    const updates = req.body.settings // array of { key, value }
    if (!Array.isArray(updates) || !updates.length)
      return res.status(400).json({ message: 'settings array required' })

    for (const { key, value } of updates) {
      if (!ALLOWED_KEYS.includes(key)) continue
      await pool.query(
        `UPDATE app_settings SET value=$1, updated_at=NOW() WHERE key=$2`,
        [String(value), key]
      )
    }
    invalidateCache() // force re-read on next order
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: 'Save failed' })
  }
}

/* ─── Loyalty Tier (user) ─── */
exports.getTier = async (req, res) => {
  try {
    const userId = req.user.id
    const r = await pool.query(
      `SELECT loyalty_tier, total_spent,
              COALESCE((SELECT SUM(total_amount) FROM orders WHERE user_id=$1 AND status=5), 0) AS computed_spent
       FROM users WHERE id=$1`,
      [userId]
    )
    const user = r.rows[0]
    if (!user) return res.status(404).json({ message: 'User not found' })

    const spent = Number(user.computed_spent || 0)
    const currentIdx = TIERS.findIndex(t => t.name === (user.loyalty_tier || 'bronze'))
    const tier = TIERS[currentIdx] || TIERS[0]
    const nextTier = TIERS[currentIdx + 1] || null

    // Sync tier if stale
    const computedTier = TIERS.slice().reverse().find(t => spent >= t.min) || TIERS[0]
    if (computedTier.name !== tier.name) {
      await pool.query(`UPDATE users SET loyalty_tier=$1, total_spent=$2 WHERE id=$3`, [computedTier.name, spent, userId])
    }

    res.json({
      success: true,
      tier: { ...computedTier, spent },
      next_tier: nextTier ? { ...nextTier, remaining: Math.max(0, nextTier.min - spent) } : null,
      all_tiers: TIERS,
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}
