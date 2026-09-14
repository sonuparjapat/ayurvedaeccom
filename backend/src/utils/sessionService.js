const pool   = require('../config/db')
const crypto = require('crypto')

/* Lightweight device label from User-Agent string (no external deps) */
function parseDevice(ua) {
  if (!ua) return 'Unknown Device'
  if (/iPhone/i.test(ua))              return 'iPhone'
  if (/iPad/i.test(ua))               return 'iPad'
  if (/Android.*Mobile/i.test(ua))    return 'Android Phone'
  if (/Android/i.test(ua))            return 'Android Tablet'
  let browser = 'Browser'
  if (/Edg\//i.test(ua))              browser = 'Edge'
  else if (/Chrome/i.test(ua))        browser = 'Chrome'
  else if (/Firefox/i.test(ua))       browser = 'Firefox'
  else if (/Safari/i.test(ua))        browser = 'Safari'
  let os = ''
  if (/Windows/i.test(ua))            os = ' on Windows'
  else if (/Macintosh/i.test(ua))     os = ' on Mac'
  else if (/Linux/i.test(ua))         os = ' on Linux'
  return browser + os || 'Desktop Browser'
}

/* Create a new session row and return the sessionId (UUID) */
async function createSession({ userId, ip, userAgent }) {
  const sessionId   = crypto.randomUUID()
  const deviceLabel = parseDevice(userAgent)
  try {
    await pool.query(
      `INSERT INTO user_sessions (id, user_id, ip, user_agent, device_label)
       VALUES ($1, $2, $3, $4, $5)`,
      [sessionId, userId, ip || null, userAgent || null, deviceLabel]
    )
  } catch (err) {
    console.error('[SessionService] createSession failed:', err.message)
  }
  return sessionId
}

/* List non-revoked sessions for a user */
async function listSessions(userId) {
  const { rows } = await pool.query(
    `SELECT id, ip, device_label, user_agent, created_at
       FROM user_sessions
      WHERE user_id = $1 AND revoked = FALSE
      ORDER BY created_at DESC
      LIMIT 20`,
    [userId]
  )
  return rows
}

/* Revoke a single session (only if it belongs to userId) */
async function revokeSession(sessionId, userId) {
  const { rowCount } = await pool.query(
    `UPDATE user_sessions
        SET revoked = TRUE, revoked_at = NOW()
      WHERE id = $1 AND user_id = $2 AND revoked = FALSE`,
    [sessionId, userId]
  )
  return rowCount > 0
}

/* Revoke all sessions for a user except the one provided */
async function revokeOtherSessions(userId, keepSessionId) {
  const { rowCount } = await pool.query(
    `UPDATE user_sessions
        SET revoked = TRUE, revoked_at = NOW()
      WHERE user_id = $1 AND id != $2 AND revoked = FALSE`,
    [userId, keepSessionId]
  )
  return rowCount
}

/* Revoke all sessions for a user (used after password change) */
async function revokeAllSessions(userId) {
  await pool.query(
    `UPDATE user_sessions SET revoked = TRUE, revoked_at = NOW()
      WHERE user_id = $1 AND revoked = FALSE`,
    [userId]
  )
}

module.exports = { createSession, listSessions, revokeSession, revokeOtherSessions, revokeAllSessions }
