const pool   = require("../../config/db")
const bcrypt = require("bcryptjs")
const jwt    = require("jsonwebtoken")
const crypto = require("crypto")
const mailer = require("../../config/mail")
const { addAdminLog } = require("../../utils/adminLogger")

/* ── startup guard: crash fast if JWT_SECRET is missing ── */
if (!process.env.JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET environment variable is not set. Refusing to start.')
  process.exit(1)
}

/* ── HMAC-SHA256 OTP hash (safe even with a DB dump — key = JWT_SECRET) ── */
function hashOtp(otp) {
  return crypto.createHmac('sha256', process.env.JWT_SECRET).update(String(otp)).digest('hex')
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

// ======================== Admin creation =================================
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, phone, role } = req.body

    if (![1, 2].includes(role)) {
      return res.status(400).json({ message: "Invalid role" })
    }

    const exists = await pool.query("SELECT id FROM users WHERE email=$1", [email])
    if (exists.rows.length) {
      return res.status(400).json({ message: "Email exists" })
    }

    const tempPass = crypto.randomBytes(6).toString("hex")
    const hash = await bcrypt.hash(tempPass, 10)

    await pool.query(
      `INSERT INTO users (name,email,phone,password,role,is_verified)
       VALUES($1,$2,$3,$4,$5,true)`,
      [name, email, phone, hash, role]
    )

    try {
      await mailer.sendTransacEmail({
        sender: { email: process.env.MAIL_FROM, name: process.env.APP_NAME },
        to: [{ email }],
        subject: "Admin Account Created",
        htmlContent: `
          <h3>Admin Access — ${process.env.APP_NAME}</h3>
          <p>Email: ${email}</p>
          <p>Temporary Password: <strong>${tempPass}</strong></p>
          <p>Please change your password immediately after first login.</p>
        `
      })
    } catch (mailErr) {
      console.error('[createAdmin] welcome email failed (admin already saved):', mailErr.message)
    }

    res.json({ success: true, message: "Admin created" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
}

// ======================== Step 1: Verify password → send 2FA OTP ==========
exports.login = async (req, res) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown'

  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    const result = await pool.query(
      `SELECT id, role, email, password, name, login_attempts, locked_until
       FROM users WHERE email=$1 LIMIT 1`,
      [email]
    )

    if (!result.rows.length) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const user = result.rows[0]

    /* Admin only */
    if (![1, 2].includes(user.role)) {
      return res.status(403).json({ message: "Admin access only" })
    }

    /* Account lockout check */
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      await addAdminLog({
        adminId: user.id,
        action: 'ADMIN_LOGIN_BLOCKED',
        module: 'AUTH',
        details: { reason: 'account_locked', email },
        ip,
      })
      return res.status(423).json({ message: "Account temporarily locked. Please try again later." })
    }

    const match = await bcrypt.compare(password, user.password)

    if (!match) {
      const attempts = Number(user.login_attempts || 0) + 1
      const lockUpdate = attempts >= 5
        ? `login_attempts=$1, locked_until=NOW() + INTERVAL '15 minutes', updated_at=NOW()`
        : `login_attempts=$1, updated_at=NOW()`

      await pool.query(
        `UPDATE users SET ${lockUpdate} WHERE id=$2`,
        [attempts, user.id]
      )

      await addAdminLog({
        adminId: user.id,
        action: 'ADMIN_LOGIN_FAILED',
        module: 'AUTH',
        details: { reason: 'wrong_password', attempts, email },
        ip,
      })

      const remaining = 5 - attempts
      const msg = attempts >= 5
        ? 'Too many failed attempts. Account locked for 15 minutes.'
        : `Invalid credentials. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`

      return res.status(400).json({ message: msg })
    }

    /* Password correct — generate 2FA OTP */
    const otp = generateOtp()
    const otpHash = hashOtp(otp)

    await pool.query(
      `UPDATE users
       SET otp_code=$1, otp_type='admin_2fa', otp_expiry=NOW() + INTERVAL '10 minutes',
           otp_attempts=0, updated_at=NOW()
       WHERE id=$2`,
      [otpHash, user.id]
    )

    /* Send OTP email */
    try {
      await mailer.sendTransacEmail({
        sender: { email: process.env.MAIL_FROM, name: process.env.APP_NAME },
        to: [{ email: user.email }],
        subject: `Admin Login OTP — ${process.env.APP_NAME}`,
        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
            <div style="background:#064e3b;padding:20px;border-radius:8px;text-align:center;margin-bottom:20px;">
              <h2 style="color:#fff;margin:0;font-size:20px;">🔐 Admin Login OTP</h2>
            </div>
            <p style="color:#374151;font-size:14px;">Hello <strong>${user.name}</strong>,</p>
            <p style="color:#374151;font-size:14px;">Your admin login verification code is:</p>
            <div style="background:#fff;border:2px solid #6ee7b7;border-radius:10px;padding:18px;text-align:center;margin:18px 0;">
              <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#064e3b;">${otp}</span>
            </div>
            <p style="color:#6b7280;font-size:12px;">Valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
            <p style="color:#9ca3af;font-size:11px;">If you did not attempt to log in, please change your password immediately.</p>
          </div>
        `
      })
    } catch (mailErr) {
      console.error('[Admin 2FA] OTP email failed:', mailErr.message)
      /* Still return success — don't reveal the mail failure to the client */
    }

    return res.json({
      success: true,
      requiresOtp: true,
      message: 'Verification code sent to your email address.',
    })

  } catch (err) {
    console.error('[Admin Login]', err)
    res.status(500).json({ message: "Server error" })
  }
}

// ======================== Step 2: Verify 2FA OTP → issue JWT ==============
exports.verifyAdmin2FA = async (req, res) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown'

  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" })
    }

    const result = await pool.query(
      `SELECT id, role, email, name, otp_code, otp_expiry, otp_type
       FROM users WHERE email=$1 LIMIT 1`,
      [email]
    )

    if (!result.rows.length) {
      return res.status(400).json({ message: "Invalid request" })
    }

    const user = result.rows[0]

    if (![1, 2].includes(user.role)) {
      return res.status(403).json({ message: "Admin access only" })
    }

    if (!user.otp_code || user.otp_type !== 'admin_2fa') {
      return res.status(400).json({ message: "No pending OTP. Please log in again." })
    }

    if (!user.otp_expiry || new Date(user.otp_expiry) < new Date()) {
      await pool.query(`UPDATE users SET otp_code=NULL, otp_type=NULL, otp_expiry=NULL WHERE id=$1`, [user.id])
      return res.status(400).json({ message: "OTP has expired. Please log in again." })
    }

    if (hashOtp(otp) !== user.otp_code) {
      await addAdminLog({
        adminId: user.id,
        action: 'ADMIN_2FA_FAILED',
        module: 'AUTH',
        details: { email },
        ip,
      })
      return res.status(400).json({ message: "Invalid OTP." })
    }

    /* Success — clear OTP, update last_login, reset login_attempts */
    await pool.query(
      `UPDATE users
       SET otp_code=NULL, otp_type=NULL, otp_expiry=NULL,
           login_attempts=0, locked_until=NULL,
           last_login=NOW(), updated_at=NOW()
       WHERE id=$1`,
      [user.id]
    )

    await addAdminLog({
      adminId: user.id,
      action: 'ADMIN_LOGIN_SUCCESS',
      module: 'AUTH',
      details: { email },
      ip,
    })

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    return res.json({
      success: true,
      admin: { id: user.id, name: user.name, email: user.email, role: user.role },
    })

  } catch (err) {
    console.error('[Admin 2FA Verify]', err)
    res.status(500).json({ message: "Server error" })
  }
}

// ======================== Logout ==========================================
exports.logout = (req, res) => {
  res.clearCookie("token")
  res.json({ success: true })
}
