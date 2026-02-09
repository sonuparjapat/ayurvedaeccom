const pool = require("../../config/db")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const path = require("path")
const crypto = require("crypto")           // ✅ For verification token

const mailer = require("../../config/mail") 
exports.userRegister = async (req, res) => {

  try {

    const {
      name,
      email,
      phone,
      password,
    } = req.body

    /* Check existing */

    const exists = await pool.query(
      "SELECT id FROM users WHERE email=$1",
      [email]
    )

    if (exists.rows.length) {
      return res.status(400).json({
        message: "Email already registered"
      })
    }

    const hash = await bcrypt.hash(password, 10)

    const token = crypto.randomBytes(32).toString("hex")

    await pool.query(
      `
      INSERT INTO users
      (name,email,phone,password,role,verification_token)
      VALUES($1,$2,$3,$4,3,$5)
      `,
      [name, email, phone, hash, token]
    )

    /* Send Email */

    const link = `${process.env.FRONTEND_URL}/verify-email?token=${token}`

await mailer.sendMail({
  from: `"${process.env.APP_NAME}" <${process.env.MAIL_FROM}>`, // REQUIRED

  to: email,
  to: email,
  subject: "Verify Your Account",
  html: `
  <div style="font-family: Arial, sans-serif; background:#f4f6fb; padding:30px">
    <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;overflow:hidden">
      
      <div style="background:#4f46e5;color:white;padding:20px;text-align:center">
        <h2>Welcome to ${process.env.APP_NAME}</h2>
      </div>

      <div style="padding:30px;color:#333">
        <p>Hi 👋,</p>
        <p>Thank you for registering. Please verify your email to activate your account.</p>

        <div style="text-align:center;margin:30px 0">
          <a href="${link}" 
             style="background:#4f46e5;color:#fff;padding:12px 24px;
                    border-radius:8px;text-decoration:none;font-weight:bold">
            Verify Email
          </a>
        </div>

        <p style="font-size:14px;color:#666">
          This link will expire in 15 minutes.<br/>
          If you didn’t create an account, you can safely ignore this email.
        </p>
      </div>

      <div style="background:#f1f1f1;padding:15px;text-align:center;font-size:12px;color:#777">
        © ${new Date().getFullYear()} ${process.env.APP_NAME}. All rights reserved.
      </div>

    </div>
  </div>
  `
})

   res.json({
    success: true,
    message: "Registered. Verify email."
  })

} catch (err) {
  console.error("MAIL ERROR:", err)

  res.status(500).json({
    success: false,
    message: "Email not sent"
  })}
}


exports.userLogin = async (req, res) => {

  try {

    const { email, password } = req.body

    const result = await pool.query(
      `
      SELECT id,role,name,email,password,is_verified
      FROM users
      WHERE email=$1
      `,
      [email]
    )

    if (!result.rows.length) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const user = result.rows[0]

    if (!user.is_verified) {
      return res.status(403).json({
        message: "Verify email first"
      })
    }

    if (user.role !== 3) {
      return res.status(403).json({
        message: "Not a user account"
      })
    }

    const match = await bcrypt.compare(
      password,
      user.password
    )

    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    res.cookie("userToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({
      success: true,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })

  } catch (err) {

    console.error(err)

    res.status(500).json({ message: "Server error" })
  }
}
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body   // ✅ FIXED

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required',
      })
    }

    const result = await pool.query(
      `
      SELECT id
      FROM users
      WHERE verification_token = $1
      `,
      [token]
    )

    if (!result.rows.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification link',
      })
    }

    await pool.query(
      `
      UPDATE users
      SET
        is_verified = true,
        verification_token = NULL,
        updated_at = NOW()
      WHERE verification_token = $1
      `,
      [token]
    )

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    })

  } catch (err) {
    console.error('VERIFY EMAIL ERROR:', err)

    return res.status(500).json({
      success: false,
      message: 'Server error while verifying email',
    })
  }
}


/* ================= LOGOUT ================= */

exports.logout = async (req, res) => {

  res.clearCookie("userToken")

  res.json({ message: "Logged out" })
}