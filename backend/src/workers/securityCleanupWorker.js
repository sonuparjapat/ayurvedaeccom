const pool   = require('../config/db')
const mailer = require('../config/mail')

const RETENTION_DAYS = 90

async function cleanupSecurityEvents() {
  try {
    const r = await pool.query(
      `DELETE FROM security_events
       WHERE created_at < NOW() - INTERVAL '${RETENTION_DAYS} days'
       RETURNING id`
    )
    if (r.rowCount > 0) {
      console.log(`[SecurityCleanup Cron] Deleted ${r.rowCount} security_events older than ${RETENTION_DAYS} days`)
    }
  } catch (err) {
    console.error('[SecurityCleanup Cron] Error:', err.message)
  }
}

/* Send admin email when a user account gets hard-locked (active brute-force signal) */
async function alertAdminOnHardLock(userId, email, ip) {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.MAIL_FROM
  if (!adminEmail) return

  try {
    await mailer.sendTransacEmail({
      sender: { email: process.env.MAIL_FROM, name: process.env.APP_NAME },
      to: [{ email: adminEmail }],
      subject: `[${process.env.APP_NAME}] Account hard-locked — possible brute-force attack`,
      htmlContent: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
          <div style="background:#991b1b;padding:20px;border-radius:8px;text-align:center;margin-bottom:20px;">
            <h2 style="color:#fff;margin:0;font-size:18px;">🚨 Account Hard-Locked</h2>
          </div>
          <p style="color:#374151;font-size:14px;"><strong>Admin Alert</strong> — an account has been hard-locked after repeated failed login attempts.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
            <tr style="border-bottom:1px solid #e5e7eb;">
              <td style="padding:8px;color:#6b7280;">User ID</td>
              <td style="padding:8px;color:#111827;font-weight:600;">${userId}</td>
            </tr>
            <tr style="border-bottom:1px solid #e5e7eb;">
              <td style="padding:8px;color:#6b7280;">Email</td>
              <td style="padding:8px;color:#111827;font-weight:600;">${email}</td>
            </tr>
            <tr style="border-bottom:1px solid #e5e7eb;">
              <td style="padding:8px;color:#6b7280;">Attacking IP</td>
              <td style="padding:8px;color:#111827;font-weight:600;">${ip}</td>
            </tr>
            <tr>
              <td style="padding:8px;color:#6b7280;">Time</td>
              <td style="padding:8px;color:#111827;font-weight:600;">${new Date().toISOString()}</td>
            </tr>
          </table>
          <p style="color:#6b7280;font-size:13px;">Consider blocking the attacking IP from the admin security panel if attacks continue.</p>
          <p style="color:#9ca3af;font-size:11px;margin-top:24px;">This is an automated security alert. Do not reply.</p>
        </div>`
    })
  } catch (err) {
    console.error('[SecurityCleanup] Admin alert email failed:', err.message)
  }
}

/* ── Weekly security digest ── */
async function sendWeeklySecurityDigest() {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.MAIL_FROM
  if (!adminEmail) return

  try {
    const r = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE event_type IN ('login_success','email_otp_login','mobile_otp_login','google_login')) AS logins,
        COUNT(*) FILTER (WHERE event_type = 'login_failed')                    AS failures,
        COUNT(*) FILTER (WHERE event_type IN ('account_locked','account_hard_locked')) AS lockouts,
        COUNT(*) FILTER (WHERE event_type = 'new_ip_login')                    AS new_ip_logins,
        COUNT(*) FILTER (WHERE event_type = 'ip_blocked')                      AS ip_blocks,
        COUNT(*) FILTER (WHERE event_type = 'distributed_brute_force')         AS dist_bf,
        COUNT(*) FILTER (WHERE event_type = 'logout')                          AS logouts,
        COUNT(DISTINCT user_id) FILTER (WHERE event_type IN ('login_success','email_otp_login','mobile_otp_login','google_login')) AS unique_users
      FROM security_events
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `)
    const s = r.rows[0]

    await mailer.sendTransacEmail({
      sender: { email: process.env.MAIL_FROM, name: process.env.APP_NAME },
      to: [{ email: adminEmail }],
      subject: `[${process.env.APP_NAME}] Weekly Security Digest — ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      htmlContent: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
          <div style="background:linear-gradient(135deg,#1a3a2a,#3d7a5a);padding:20px;border-radius:8px;text-align:center;margin-bottom:24px;">
            <h2 style="color:#fff;margin:0;font-size:18px;">📊 Weekly Security Digest</h2>
            <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:6px 0 0;">Last 7 days · ${process.env.APP_NAME}</p>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:14px;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
            <tr style="background:#f3f4f6;">
              <th style="padding:10px 14px;text-align:left;color:#6b7280;font-weight:600;">Metric</th>
              <th style="padding:10px 14px;text-align:right;color:#6b7280;font-weight:600;">Count</th>
            </tr>
            ${[
              ['✅ Successful logins', s.logins],
              ['👤 Unique users logged in', s.unique_users],
              ['🚪 Logouts', s.logouts],
              ['❌ Failed login attempts', s.failures],
              ['🔒 Account lockouts', s.lockouts],
              ['🌐 New IP logins', s.new_ip_logins],
              ['🚫 IPs blocked', s.ip_blocks],
              ['⚠️ Distributed brute-force alerts', s.dist_bf],
            ].map(([label, val], i) => `
              <tr style="border-top:1px solid #e5e7eb;background:${i % 2 === 0 ? '#fff' : '#fafafa'};">
                <td style="padding:10px 14px;color:#374151;">${label}</td>
                <td style="padding:10px 14px;text-align:right;font-weight:700;color:${Number(val) > 0 && label.includes('❌') ? '#dc2626' : '#111827'};">${val}</td>
              </tr>`).join('')}
          </table>
          <p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:20px;">Automated weekly report · ${new Date().toISOString()}</p>
        </div>`
    })
    console.log('[SecurityDigest] Weekly digest sent to', adminEmail)
  } catch (err) {
    console.error('[SecurityDigest] Failed to send weekly digest:', err.message)
  }
}

/* Schedule weekly digest: run every Monday at ~8 AM server time */
function scheduleWeeklyDigest() {
  function msUntilNextMonday8AM() {
    const now = new Date()
    const next = new Date(now)
    const day = next.getDay() // 0=Sun, 1=Mon
    const daysUntilMon = day === 1 ? (now.getHours() >= 8 ? 7 : 0) : (8 - day) % 7
    next.setDate(now.getDate() + daysUntilMon)
    next.setHours(8, 0, 0, 0)
    if (next <= now) next.setDate(next.getDate() + 7)
    return next.getTime() - now.getTime()
  }
  setTimeout(function fire() {
    sendWeeklySecurityDigest()
    setTimeout(fire, 7 * 24 * 60 * 60 * 1000)
  }, msUntilNextMonday8AM())
  console.log('[SecurityDigest] Weekly digest scheduled — next run Monday 8 AM')
}

module.exports = {
  startSecurityCleanupWorker() {
    cleanupSecurityEvents()
    setInterval(cleanupSecurityEvents, 24 * 60 * 60 * 1000)
    scheduleWeeklyDigest()
    console.log('[SecurityCleanup Cron] Started — pruning events older than 90 days, running every 24h')
  },
  alertAdminOnHardLock,
}
