const pool   = require('../config/db')
const mailer = require('../config/mail')

/*
  Runs every hour.
  Finds all hard-locked accounts whose locked_until has passed and unlocks them.
  Sends a "you've been auto-unlocked" email so users know they can sign in again.
*/
async function unlockExpiredAccounts() {
  try {
    const r = await pool.query(
      `UPDATE users
       SET lock_type = NULL, locked_until = NULL, login_attempts = 0,
           unlock_token = NULL, unlock_token_expiry = NULL, updated_at = NOW()
       WHERE lock_type = 'hard' AND locked_until <= NOW()
       RETURNING id, name, email`
    )

    if (!r.rows.length) return

    console.log(`[AccountUnlock Cron] Auto-unlocked ${r.rows.length} account(s)`)

    /* Send confirmation email to each unlocked user (fire-and-forget) */
    for (const user of r.rows) {
      mailer.sendTransacEmail({
        sender: { email: process.env.MAIL_FROM, name: process.env.APP_NAME },
        to: [{ email: user.email }],
        subject: `Your ${process.env.APP_NAME} account has been automatically unlocked`,
        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
            <div style="background:#064e3b;padding:20px;border-radius:8px;text-align:center;margin-bottom:20px;">
              <h2 style="color:#fff;margin:0;font-size:18px;">✅ Account Auto-Unlocked</h2>
            </div>
            <p style="color:#374151;font-size:14px;">Hi <strong>${user.name}</strong>,</p>
            <p style="color:#374151;font-size:14px;">Your account lockout period has ended and your account has been <strong>automatically unlocked</strong>. You can now sign in again.</p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${process.env.FRONTEND_URL}/login" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-size:15px;font-weight:700;">Sign In →</a>
            </div>
            <p style="color:#374151;font-size:13px;">To prevent future lockouts, consider using "Forgot Password" if you have trouble remembering your password.</p>
            <p style="color:#9ca3af;font-size:11px;margin-top:24px;">Do not reply to this email.</p>
          </div>`
      }).catch(err => console.error('[AccountUnlock Cron] Email failed for', user.email, err.message))
    }

  } catch (err) {
    console.error('[AccountUnlock Cron] Error:', err.message)
  }
}

module.exports = function startAccountUnlockWorker() {
  /* Run once immediately on startup to catch any that expired while server was down */
  unlockExpiredAccounts()

  /* Then every hour */
  setInterval(unlockExpiredAccounts, 60 * 60 * 1000)

  console.log('[AccountUnlock Cron] Started — checking every hour')
}
