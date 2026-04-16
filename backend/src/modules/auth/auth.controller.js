const pool = require("../../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const crypto = require("crypto")          // ✅ For temp password

const mailer = require("../../config/mail")  // ✅ For mail

// ======================== Admin/user creation=================================
exports.createAdmin = async (req, res) => {

  try {

    const {
      name,
      email,
      phone,
      role, // 1 or 2
    } = req.body


    /* Only allow 1 or 2 */

    if (![1, 2].includes(role)) {
      return res.status(400).json({
        message: "Invalid role"
      })
    }


    /* Check Existing */

    const exists = await pool.query(
      "SELECT id FROM users WHERE email=$1",
      [email]
    )

    if (exists.rows.length) {
      return res.status(400).json({
        message: "Email exists"
      })
    }


    /* Auto Password */

    const tempPass = crypto
      .randomBytes(6)
      .toString("hex")

    const hash = await bcrypt.hash(tempPass, 10)

    await pool.query(
      `
      INSERT INTO users
      (name,email,phone,password,role,is_verified)
      VALUES($1,$2,$3,$4,$5,true)
      `,
      [name, email, phone, hash, role]
    )


    /* Send Credentials */

   await mailer.sendTransacEmail({
  sender: {
    email:
      process.env.MAIL_FROM,
    name:
      process.env.APP_NAME
  },

  to: [
    {
      email
    }
  ],

  subject:
   "Admin Account Created",

  htmlContent: `
   <h3>Admin Access</h3>
   <p>Email: ${email}</p>
   <p>Password: ${tempPass}</p>
   <p>Please change after login</p>
  `
});

    res.json({
      success: true,
      message: "Admin created"
    })

  } catch (err) {

    console.error(err)

    res.status(500).json({ message: "Server error" })
  }
}

exports.login = async (req, res) => {

  try {

    const { email, password } = req.body

    const result = await pool.query(
      `
      SELECT id,role,email,password
      FROM users
      WHERE email=$1
      `,
      [email]
    )

    if (!result.rows.length) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const user = result.rows[0]

    /* Only ADMIN & SUPERADMIN */

    if (![1, 2].includes(user.role)) {

      return res.status(403).json({
        message: "Admin access only"
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
    { expiresIn: "2h" }
    )

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({
      success: true,

      admin: {
        id: user.id,
        name: user.first_name,
        email: user.email,
        role: user.role,
      },
    })

  } catch (err) {

    console.error(err)

    res.status(500).json({ message: "Server error" })
  }
}
exports.logout = (req, res) => {

  res.clearCookie("token")

  res.json({ success: true })
}






