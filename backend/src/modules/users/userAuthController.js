const pool = require("../../config/db")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { v4: uuidv4 } = require("uuid")

/* ================= REGISTER ================= */

exports.register = async (req, res) => {

  try {

    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" })
    }

    /* Check user */

    const userExist = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    )

    if (userExist.rows.length > 0) {
      return res.status(400).json({ message: "Email already exists" })
    }

    /* Hash Password */

    const hashedPassword = await bcrypt.hash(password, 10)

    /* Save */

    const id = uuidv4()

    await pool.query(
      `INSERT INTO users(id,name,email,password)
       VALUES($1,$2,$3,$4)`,

      [id, name, email, hashedPassword]
    )

    res.status(201).json({ message: "Registration successful" })

  } catch (err) {

    console.log(err)

    res.status(500).json({ message: "Server error" })
  }
}


/* ================= LOGIN ================= */

exports.login = async (req, res) => {

  try {

    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "All fields required" })
    }

    /* Find user */

    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const user = result.rows[0]

    /* Compare */

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    /* Token */

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    /* Cookie */

    res.cookie("userToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })

  } catch (err) {

    console.log(err)

    res.status(500).json({ message: "Server error" })
  }
}


/* ================= LOGOUT ================= */

exports.logout = async (req, res) => {

  res.clearCookie("userToken")

  res.json({ message: "Logged out" })
}