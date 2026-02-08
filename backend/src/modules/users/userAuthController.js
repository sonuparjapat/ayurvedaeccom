const pool = require("../../config/db")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")


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

    const link = `${process.env.FRONTEND_URL}/verify/${token}`

    await mailer.sendMail({
      to: email,
      subject: "Verify Your Account",
      html: `<p>Click to verify:</p><a href="${link}">Verify</a>`
    })

    res.json({
      success: true,
      message: "Registered. Verify email."
    })

  } catch (err) {

    console.error(err)

    res.status(500).json({ message: "Server error" })
  }
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

    const { token } = req.params

    if (!token) {
      return res.status(400).json({
        message: "Invalid token"
      })
    }

    /* Find User */

    const result = await pool.query(
      `
      SELECT id
      FROM users
      WHERE verification_token=$1
      `,
      [token]
    )

    if (!result.rows.length) {
      return res.status(400).json({
        message: "Token expired or invalid"
      })
    }

    /* Activate */

    await pool.query(
      `
      UPDATE users
      SET is_verified=true,
          verification_token=NULL,
          updated_at=NOW()
      WHERE verification_token=$1
      `,
      [token]
    )

    res.json({
      success: true,
      message: "Email verified successfully"
    })

  } catch (err) {

    console.error(err)

    res.status(500).json({ message: "Server error" })
  }
}


/* ================= LOGOUT ================= */

exports.logout = async (req, res) => {

  res.clearCookie("userToken")

  res.json({ message: "Logged out" })
}