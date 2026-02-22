const pool = require("../../config/db")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const path = require("path")
const crypto = require("crypto")           // ✅ For verification token

const mailer = require("../../config/mailer") 
const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_KEY)
exports.userRegister = async (req, res) => {
  const client = await pool.connect();

  try {

    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields required",
      });
    }

    await client.query("BEGIN");

    /* Check existing */
    const exists = await client.query(
      "SELECT id FROM users WHERE email=$1",
      [email]
    );

    if (exists.rowCount) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    const hash = await bcrypt.hash(password, 12);

    const token = crypto.randomBytes(32).toString("hex");

    await client.query(
      `
      INSERT INTO users
      (name,email,phone,password,role,verification_token,is_verified)
      VALUES($1,$2,$3,$4,3,$5,true)
      `,
      [name, email, phone, hash, token]
    );

    const link = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    /* Send mail */
    // await sgMail.send({
    //   to: email,
    //   from: process.env.MAIL_FROM,
    //   subject: "Verify Your Account",
    //   html: `
    //     <p>Click to verify:</p>
    //     <a href="${link}">${link}</a>
    //   `,
    // });

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Registered.Successfully.",
    });

  } catch (err) {

    await client.query("ROLLBACK");

    console.error(err);

    res.status(500).json({
      message: "Register failed",
    });

  } finally {
    client.release();
  }
};


exports.userLogin = async (req, res) => {

  try {

    const { email, password } = req.body

    const result = await pool.query(
      `
      SELECT u.id,u.role,u.name,u.email,password,is_verified,c.quantity,u.phone
      FROM users u left join   cart c on u.id=c.user_id
      WHERE u.email=$1
      `,
      [email]
    )
    console.log(result,"result coming")

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

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        cart:user?.quantity||0,
        role:user?.role||1,
        phone:user?.phone||"",
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

  res.clearCookie("token")

  res.json({ message: "Logged out" })
}
exports.getMe = async (req, res) => {

  try {

    const userId = req.user.id

    const result = await pool.query(`

      SELECT
        id,
        name,
        email,
        role,
        phone,
        is_verified,
        created_at

      FROM users
      WHERE id=$1

    `,[userId])


    if (!result.rows.length) {
      return res.status(404).json({
        message:'User not found'
      })
    }


    res.json({
      success:true,
      user: result.rows[0]
    })

  } catch (err) {

    console.error(err)

    res.status(500).json({
      message:'Fetch user failed'
    })
  }
}