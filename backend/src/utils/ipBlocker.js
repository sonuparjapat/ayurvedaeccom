const pool = require('../config/db')

/*
  Escalating block durations based on total violation count.
  Violations reset only when an admin manually unblocks the IP.

  count 1-2  → 1 hour
  count 3-5  → 24 hours
  count 6+   → 7 days
*/
function blockHours(violationCount) {
  if (violationCount <= 2) return 1
  if (violationCount <= 5) return 24
  return 168 // 7 days
}

/*
  Middleware: reject the request immediately if the IP is currently blocked.
  Applied to all auth routes so a blocked IP cannot even reach the rate limiter.
*/
exports.checkIpBlock = async (req, res, next) => {
  const ip = req.ip || 'unknown'
  try {
    const r = await pool.query(
      `SELECT blocked_until, violation_count
       FROM ip_blocks
       WHERE ip = $1 AND blocked_until > NOW()
       LIMIT 1`,
      [ip]
    )
    if (r.rows.length) {
      const until = new Date(r.rows[0].blocked_until)
      const diffMin = Math.ceil((until - Date.now()) / 60000)
      return res.status(403).json({
        success: false,
        message: `Access temporarily blocked. Try again in ${diffMin < 60 ? `${diffMin} minute(s)` : `${Math.ceil(diffMin / 60)} hour(s)`}.`,
      })
    }
  } catch (err) {
    console.error('[checkIpBlock]', err.message)
    // fail open — don't block legitimate traffic on a DB error
  }
  next()
}

/*
  Called by the rate-limit handler when a limit is exceeded.
  Upserts the ip_blocks row with an escalating duration.
  Reason is a short label for the admin UI.
*/
exports.recordViolation = async (ip, reason = 'rate_limit_exceeded') => {
  try {
    const existing = await pool.query(
      `SELECT violation_count FROM ip_blocks WHERE ip = $1`,
      [ip]
    )
    const count = existing.rows.length ? existing.rows[0].violation_count + 1 : 1
    const hours = blockHours(count)

    await pool.query(
      `INSERT INTO ip_blocks (ip, blocked_until, violation_count, reason, updated_at)
       VALUES ($1, NOW() + ($2 * INTERVAL '1 hour'), $3, $4, NOW())
       ON CONFLICT (ip) DO UPDATE
         SET blocked_until    = GREATEST(ip_blocks.blocked_until, NOW() + ($2 * INTERVAL '1 hour')),
             violation_count  = $3,
             reason           = $4,
             updated_at       = NOW()`,
      [ip, hours, count, reason]
    )

    console.warn(`[IP Block] ${ip} — violation #${count} — blocked ${hours}h (reason: ${reason})`)
  } catch (err) {
    console.error('[recordViolation]', err.message)
  }
}

/* Admin helpers */

exports.listBlocks = async ({ activeOnly = true, limit = 100, offset = 0 } = {}) => {
  const where = activeOnly ? `WHERE blocked_until > NOW()` : ''
  const r = await pool.query(
    `SELECT ip, blocked_until, violation_count, reason, created_at, updated_at
     FROM ip_blocks ${where}
     ORDER BY updated_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  )
  return r.rows
}

exports.unblockIp = async (ip) => {
  await pool.query(
    `UPDATE ip_blocks
     SET blocked_until = NOW() - INTERVAL '1 second', updated_at = NOW()
     WHERE ip = $1`,
    [ip]
  )
}

exports.manualBlock = async (ip, hours = 24, reason = 'manual_admin_block') => {
  await pool.query(
    `INSERT INTO ip_blocks (ip, blocked_until, violation_count, reason, updated_at)
     VALUES ($1, NOW() + ($2 * INTERVAL '1 hour'), 1, $3, NOW())
     ON CONFLICT (ip) DO UPDATE
       SET blocked_until    = NOW() + ($2 * INTERVAL '1 hour'),
           violation_count  = ip_blocks.violation_count + 1,
           reason           = $3,
           updated_at       = NOW()`,
    [ip, hours, reason]
  )
}
