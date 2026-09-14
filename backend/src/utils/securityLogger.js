const pool   = require('../config/db')
const mailer = require('../config/mail')

/* ─────────────────────────────────────────────
   Event type constants — import these instead of
   using raw strings so typos are caught at load time.
   ───────────────────────────────────────────── */
const SEC = {
  // Registration & verification
  USER_REGISTERED:          'user_registered',
  EMAIL_VERIFIED:           'email_verified',
  VERIFICATION_RESENT:      'verification_resent',

  // Login / Logout
  LOGIN_SUCCESS:            'login_success',
  LOGIN_FAILED:             'login_failed',
  LOGOUT:                   'logout',
  NEW_IP_LOGIN:             'new_ip_login',       // login from a previously-unseen IP

  // OTP
  OTP_REQUESTED:            'otp_requested',
  OTP_VERIFIED:             'otp_verified',
  OTP_FAILED:               'otp_failed',

  // Account lockout
  ACCOUNT_WARNED:           'account_warned',     // 3rd failed attempt warning email
  ACCOUNT_SOFT_LOCKED:      'account_soft_locked',
  ACCOUNT_HARD_LOCKED:      'account_hard_locked',
  ACCOUNT_UNLOCKED_EMAIL:   'account_unlocked_email',
  ACCOUNT_UNLOCKED_CRON:    'account_unlocked_cron',

  // Password
  PASSWORD_RESET_REQUESTED: 'password_reset_requested',
  PASSWORD_RESET_COMPLETED: 'password_reset_completed',
  PASSWORD_CHANGED:         'password_changed',

  // Profile
  PROFILE_UPDATED:          'profile_updated',
  ADDRESS_ADDED:            'address_added',
  ADDRESS_UPDATED:          'address_updated',
  ADDRESS_DELETED:          'address_deleted',
  ACCOUNT_DELETED:          'account_deleted',

  // Admin
  ADMIN_LOGIN_SUCCESS:      'admin_login_success',
  ADMIN_LOGIN_FAILED:       'admin_login_failed',
  ADMIN_2FA_VERIFIED:       'admin_2fa_verified',
  ADMIN_LOGOUT:             'admin_logout',

  // Suspicious
  IP_BLOCKED:               'ip_blocked',
  RATE_LIMITED:             'rate_limited',
  DISTRIBUTED_BRUTE_FORCE:  'distributed_brute_force',
}

/* ─────────────────────────────────────────────
   Core logger — fire-and-forget, never throws.
   ───────────────────────────────────────────── */
async function logSecurityEvent({ userId, eventType, email, ip, userAgent, metadata = {} }) {
  try {
    await pool.query(
      `INSERT INTO security_events (user_id, event_type, email, ip, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId || null, eventType, email || null, ip || null, userAgent || null, JSON.stringify(metadata)]
    )
  } catch (err) {
    console.error('[SecurityLogger] DB write failed:', err.message)
  }
}

/* ─────────────────────────────────────────────
   New-IP login detection.
   Compares current IP against last_login_ip stored on the user row.
   Sends an alert email if they differ (or if last_login_ip was NULL).
   Call AFTER a successful login, before updating last_login_ip.
   ───────────────────────────────────────────── */
async function checkNewIpLogin({ user, ip, userAgent }) {
  if (!ip || ip === user.last_login_ip) return   // same IP — nothing to do

  // Log the event
  logSecurityEvent({
    userId:    user.id,
    eventType: SEC.NEW_IP_LOGIN,
    email:     user.email,
    ip,
    userAgent,
    metadata:  { previousIp: user.last_login_ip || null },
  })

  // Only email if the user had a previous known IP (first-ever login doesn't need an alert)
  if (!user.last_login_ip) return

  mailer.sendTransacEmail({
    sender:      { email: process.env.MAIL_FROM, name: process.env.APP_NAME },
    to:          [{ email: user.email }],
    subject:     `New sign-in to your ${process.env.APP_NAME} account`,
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
        <div style="background:#1e3a5f;padding:20px;border-radius:8px;text-align:center;margin-bottom:20px;">
          <h2 style="color:#fff;margin:0;font-size:18px;">🔔 New Sign-In Detected</h2>
        </div>
        <p style="color:#374151;font-size:14px;">Hi <strong>${user.name}</strong>,</p>
        <p style="color:#374151;font-size:14px;">We noticed a sign-in to your account from a <strong>new location or device</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px;">
          <tr><td style="padding:8px;color:#6b7280;">IP Address</td><td style="padding:8px;color:#111827;font-weight:600;">${ip}</td></tr>
          <tr style="background:#f3f4f6;"><td style="padding:8px;color:#6b7280;">Device / Browser</td><td style="padding:8px;color:#111827;font-weight:600;">${(userAgent || 'Unknown').substring(0, 80)}</td></tr>
          <tr><td style="padding:8px;color:#6b7280;">Time</td><td style="padding:8px;color:#111827;font-weight:600;">${new Date().toUTCString()}</td></tr>
        </table>
        <p style="color:#374151;font-size:14px;">If this was you, no action is needed.</p>
        <p style="color:#dc2626;font-size:14px;font-weight:600;">If this wasn't you, change your password immediately:</p>
        <div style="text-align:center;margin:20px 0;">
          <a href="${process.env.FRONTEND_URL}/forgot-password" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:12px 32px;border-radius:50px;font-size:14px;font-weight:700;">Secure My Account</a>
        </div>
        <p style="color:#9ca3af;font-size:11px;">Do not reply to this email.</p>
      </div>`,
  }).catch(err => console.error('[SecurityLogger] New-IP email failed:', err.message))
}

/* ─────────────────────────────────────────────
   Helpers for reading events (used by admin API)
   ───────────────────────────────────────────── */
async function getSecurityEvents({ userId, eventType, ip, limit = 50, offset = 0 }) {
  const conditions = []
  const values     = []
  let   idx        = 1

  if (userId)    { conditions.push(`user_id    = $${idx++}`); values.push(userId) }
  if (eventType) { conditions.push(`event_type = $${idx++}`); values.push(eventType) }
  if (ip)        { conditions.push(`ip         = $${idx++}`); values.push(ip) }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  values.push(limit, offset)

  const { rows } = await pool.query(
    `SELECT se.*, u.name AS user_name
       FROM security_events se
       LEFT JOIN users u ON u.id = se.user_id
       ${where}
       ORDER BY se.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
    values
  )
  return rows
}

async function countSecurityEvents({ userId, eventType, ip }) {
  const conditions = []
  const values     = []
  let   idx        = 1

  if (userId)    { conditions.push(`user_id    = $${idx++}`); values.push(userId) }
  if (eventType) { conditions.push(`event_type = $${idx++}`); values.push(eventType) }
  if (ip)        { conditions.push(`ip         = $${idx++}`); values.push(ip) }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const { rows } = await pool.query(
    `SELECT COUNT(*) AS total FROM security_events ${where}`,
    values
  )
  return Number(rows[0].total)
}

/* ─────────────────────────────────────────────
   Distributed brute-force detection.
   Call after every login_failed event.
   Alert if 20+ failures for this email in 1 hour from 3+ distinct IPs.
   One admin alert per email per hour (de-duped via security_events lookup).
   ───────────────────────────────────────────── */
async function checkDistributedBruteForce({ email, ip }) {
  if (!email) return
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*) AS total, COUNT(DISTINCT ip) AS distinct_ips
         FROM security_events
        WHERE event_type = 'login_failed'
          AND email = $1
          AND created_at > NOW() - INTERVAL '1 hour'`,
      [email]
    )
    const total      = Number(rows[0].total)
    const distinctIps = Number(rows[0].distinct_ips)
    if (total < 20 || distinctIps < 3) return

    // Check if we already alerted in the last hour to avoid spam
    const recent = await pool.query(
      `SELECT 1 FROM security_events
        WHERE event_type = 'distributed_brute_force'
          AND email = $1
          AND created_at > NOW() - INTERVAL '1 hour'
        LIMIT 1`,
      [email]
    )
    if (recent.rows.length) return  // already alerted this hour

    await logSecurityEvent({ eventType: SEC.DISTRIBUTED_BRUTE_FORCE, email, ip, metadata: { total, distinctIps } })

    const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.MAIL_FROM
    if (!adminEmail) return

    mailer.sendTransacEmail({
      sender:      { email: process.env.MAIL_FROM, name: process.env.APP_NAME },
      to:          [{ email: adminEmail }],
      subject:     `[${process.env.APP_NAME}] Distributed brute-force attack detected`,
      htmlContent: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
          <div style="background:#7c2d12;padding:20px;border-radius:8px;text-align:center;margin-bottom:20px;">
            <h2 style="color:#fff;margin:0;font-size:18px;">⚠️ Distributed Brute-Force Detected</h2>
          </div>
          <p style="color:#374151;font-size:14px;">A distributed password attack has been detected against a single account.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
            <tr style="border-bottom:1px solid #e5e7eb;">
              <td style="padding:8px;color:#6b7280;">Target email</td>
              <td style="padding:8px;color:#111827;font-weight:600;">${email}</td>
            </tr>
            <tr style="border-bottom:1px solid #e5e7eb;">
              <td style="padding:8px;color:#6b7280;">Failed attempts (1h)</td>
              <td style="padding:8px;color:#b91c1c;font-weight:700;">${total}</td>
            </tr>
            <tr style="border-bottom:1px solid #e5e7eb;">
              <td style="padding:8px;color:#6b7280;">Distinct attacker IPs</td>
              <td style="padding:8px;color:#b91c1c;font-weight:700;">${distinctIps}</td>
            </tr>
            <tr>
              <td style="padding:8px;color:#6b7280;">Latest attacker IP</td>
              <td style="padding:8px;color:#111827;font-weight:600;">${ip}</td>
            </tr>
          </table>
          <p style="color:#6b7280;font-size:13px;">This attack originates from multiple IPs so per-IP rate limits alone won't stop it. Consider temporarily suspending this account or contacting the user.</p>
          <p style="color:#9ca3af;font-size:11px;margin-top:24px;">Automated security alert. Do not reply.</p>
        </div>`,
    }).catch(err => console.error('[SecurityLogger] Distributed BF alert email failed:', err.message))
  } catch (err) {
    console.error('[SecurityLogger] checkDistributedBruteForce error:', err.message)
  }
}

module.exports = { SEC, logSecurityEvent, checkNewIpLogin, checkDistributedBruteForce, getSecurityEvents, countSecurityEvents }
