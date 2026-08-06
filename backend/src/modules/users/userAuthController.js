const pool = require("../../config/db")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const path = require("path")
const crypto = require("crypto")
const axios = require("axios")

const mailer = require("../../config/mail")
const { sendOTP: sendOTPSms } = require('../../services/sms')



exports.userRegister = async (req, res) => {
  const client = await pool.connect();

  try {
    const { name, email, phone, password, referralCode } = req.body;

    /* ================= VALIDATION ================= */

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter your name, email address and password."
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone ? phone.trim() : null;

    if (cleanName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid full name."
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address."
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long."
      });
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one letter and one number."
      });
    }

    if (cleanPhone && cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid mobile number."
      });
    }

    await client.query("BEGIN");

    /* ================= CHECK EMAIL ================= */

    const exists = await client.query(
      `SELECT id FROM users WHERE email=$1 LIMIT 1`,
      [cleanEmail]
    );

    if (exists.rowCount) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message:
          "This email address is already registered."
      });
    }

    /* ================= CHECK PHONE ================= */

    if (cleanPhone) {
      const phoneExists = await client.query(
        `SELECT id FROM users WHERE phone=$1 LIMIT 1`,
        [cleanPhone]
      );

      if (phoneExists.rowCount) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          message:
            "This mobile number is already registered."
        });
      }
    }

    /* ================= PASSWORD HASH ================= */

    const hash = await bcrypt.hash(password, 12);

    /* ================= EMAIL TOKEN + REFERRAL CODE ================= */

    const token = crypto
      .randomBytes(32)
      .toString("hex");

    const newReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    /* ================= INSERT USER ================= */

    const insertRes = await client.query(
      `
      INSERT INTO users
      (
        name,
        email,
        phone,
        password,
        role,
        verification_token,
        is_verified,
        referral_code,
        created_at,
        updated_at
      )
      VALUES
      ($1,$2,$3,$4,3,$5,false,$6,NOW(),NOW())
      RETURNING id
      `,
      [
        cleanName,
        cleanEmail,
        cleanPhone,
        hash,
        token,
        newReferralCode
      ]
    );

    const newUserId = insertRes.rows[0].id;

    /* ================= REFERRAL TRACKING ================= */
    if (referralCode) {
      try {
        const refRes = await client.query(
          `SELECT id FROM users WHERE UPPER(referral_code) = UPPER($1) AND id != $2`,
          [referralCode.trim(), newUserId]
        );
        if (refRes.rows.length) {
          const referrerId = refRes.rows[0].id;
          await client.query(
            `UPDATE users SET referred_by = $1 WHERE id = $2`,
            [referrerId, newUserId]
          );
          await client.query(
            `INSERT INTO referrals (referrer_id, referred_id, status) VALUES ($1, $2, 'pending')
             ON CONFLICT (referred_id) DO NOTHING`,
            [referrerId, newUserId]
          );
        }
      } catch (_) {
        // referral tracking is non-fatal — don't block registration
      }
    }

    const verifyLink =
      `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    /* ================= SEND MAIL ================= */

  await mailer.sendTransacEmail({
  sender: {
    email: process.env.MAIL_FROM,
    name: process.env.APP_NAME
  },

  to: [
    {
      email: cleanEmail
    }
  ],

  subject: `Welcome to ${process.env.APP_NAME || 'Oroganix'} 🌿 — Verify your email`,

  htmlContent: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f0f7f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#1a3a2a,#3d7a5a);padding:32px 28px;text-align:center;">
        <p style="color:rgba(255,255,255,0.7);font-size:12px;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 8px;">🌿 Welcome</p>
        <h1 style="color:#fff;margin:0;font-size:26px;font-weight:700;">${process.env.APP_NAME || 'Oroganix'}</h1>
        <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:8px 0 0;">Natural Ayurvedic Wellness</p>
      </div>
      <div style="padding:28px;">
        <h2 style="font-size:20px;color:#1a2e1a;margin:0 0 12px;">Hey ${cleanName.split(' ')[0]}, welcome aboard! 🎉</h2>
        <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 20px;">
          Your account has been created. Please verify your email address to unlock all features and start your Ayurvedic wellness journey.
        </p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${verifyLink}" style="display:inline-block;background:linear-gradient(135deg,#1a3a2a,#3d7a5a);color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-size:15px;font-weight:700;">Verify My Email →</a>
        </div>
        <p style="font-size:12px;color:#aaa;text-align:center;margin:0;">
          Button not working? <a href="${verifyLink}" style="color:#3d7a5a;">Click here</a><br>
          Didn't create this account? You can safely ignore this email.
        </p>
      </div>
      <div style="background:#f8faf8;padding:16px 28px;text-align:center;border-top:1px solid #eee;">
        <p style="font-size:11px;color:#bbb;margin:0;">&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'Oroganix'} · Natural Ayurvedic Wellness</p>
      </div>
    </div></body></html>`
});
    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message:
        "Your account has been created successfully. Please verify your email address to continue."
    });

  } catch (err) {

    await client.query("ROLLBACK");

    console.error("REGISTER ERROR:", err);

    return res.status(500).json({
      success: false,
      message:
        "We were unable to create your account. Please try again."
    });

  } finally {
    client.release();
  }
};


exports.userLogin = async (req, res) => {
  try {

    const { email, password } = req.body;

    /* ================= VALIDATION ================= */

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter your email address and password."
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    /* ================= GET USER ================= */

    const result = await pool.query(
      `
      SELECT
        u.id,
        u.role,
        u.name,
        u.email,
        u.password,
        u.phone,
        u.is_verified,
        u.is_active,
        u.login_attempts,
        u.locked_until,

        COALESCE(
          (
            SELECT SUM(quantity)
            FROM cart
            WHERE user_id = u.id
          ),
          0
        ) AS cart_count

      FROM users u
      WHERE u.email = $1
      LIMIT 1
      `,
      [cleanEmail]
    );

    if (!result.rowCount) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid email address or password."
      });
    }

    const user = result.rows[0];

    /* ================= ACCOUNT ACTIVE ================= */

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is currently inactive."
      });
    }

    /* ================= LOCK CHECK ================= */

    if (
      user.locked_until &&
      new Date(user.locked_until) > new Date()
    ) {
      return res.status(423).json({
        success: false,
        message:
          "Your account is temporarily locked. Please try again later."
      });
    }

    /* ================= EMAIL VERIFIED ================= */

    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message:
          "Please verify your email address before logging in."
      });
    }

    /* ================= USER ROLE ================= */

    if (Number(user.role) !== 3) {
      return res.status(403).json({
        success: false,
        message:
          "This account is not eligible for customer login."
      });
    }

    /* ================= PASSWORD MATCH ================= */

    const match = await bcrypt.compare(
      password,
      user.password
    );

    if (!match) {

      const attempts =
        Number(user.login_attempts || 0) + 1;

      if (attempts >= 5) {
        await pool.query(
          `
          UPDATE users
          SET
            login_attempts = $1,
            locked_until = NOW() + INTERVAL '15 minutes',
            updated_at = NOW()
          WHERE id = $2
          `,
          [attempts, user.id]
        );
      } else {
        await pool.query(
          `
          UPDATE users
          SET
            login_attempts = $1,
            updated_at = NOW()
          WHERE id = $2
          `,
          [attempts, user.id]
        );
      }

      return res.status(400).json({
        success: false,
        message:
          "Invalid email address or password."
      });
    }

    /* ================= SUCCESS RESET ================= */

    await pool.query(
      `
      UPDATE users
      SET
        login_attempts = 0,
        locked_until = NULL,
        last_login = NOW(),
        updated_at = NOW()
      WHERE id = $1
      `,
      [user.id]
    );

    /* ================= TOKEN ================= */

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    /* ================= COOKIE ================= */

    res.cookie("token", token, {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",
      maxAge:
        7 * 24 * 60 * 60 * 1000
    });

    /* ================= RESPONSE ================= */

    return res.status(200).json({
      success: true,
      token,
      message:
        "Login successful.",

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        cart: Number(user.cart_count || 0)
      }
    });

  } catch (err) {

    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      success: false,
      message:
        "Unable to login right now. Please try again."
    });
  }
};
exports.verifyEmail = async (req, res) => {
  try {

    const { token } = req.body;

    /* ================= TOKEN CHECK ================= */

    if (!token) {
      return res.status(400).json({
        success: false,
        message:
          "Verification token is required."
      });
    }

    /* ================= FIND USER ================= */

    const result = await pool.query(
      `
      SELECT
        id,
        email,
        is_verified
      FROM users
      WHERE verification_token = $1
      LIMIT 1
      `,
      [token]
    );

    if (!result.rowCount) {
      return res.status(400).json({
        success: false,
        message:
          "This verification link is invalid or has expired."
      });
    }

    const user = result.rows[0];

    /* ================= ALREADY VERIFIED ================= */

    if (user.is_verified) {
      return res.status(200).json({
        success: true,
        message:
          "Your email address is already verified."
      });
    }

    /* ================= VERIFY ACCOUNT ================= */

    await pool.query(
      `
      UPDATE users
      SET
        is_verified = true,
        email_verified_at = NOW(),
        verification_token = NULL,
        updated_at = NOW()
      WHERE id = $1
      `,
      [user.id]
    );

    return res.status(200).json({
      success: true,
      message:
        "Your email address has been verified successfully."
    });

  } catch (err) {

    console.error("VERIFY EMAIL ERROR:", err);

    return res.status(500).json({
      success: false,
      message:
        "We could not verify your email address. Please try again."
    });
  }
};
exports.forgotPassword = async (req, res) => {
  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter your email address."
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const result = await pool.query(
      `
      SELECT id,name,email
      FROM users
      WHERE email=$1 AND role=3
      LIMIT 1
      `,
      [cleanEmail]
    );

    /* Always same response for privacy */

    if (!result.rowCount) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email address, a password reset link has been sent."
      });
    }

    const user = result.rows[0];

    const token = crypto
      .randomBytes(32)
      .toString("hex");

    await pool.query(
      `
      UPDATE users
      SET
        reset_token = $1,
        reset_token_expiry = NOW() + INTERVAL '30 minutes',
        updated_at = NOW()
      WHERE id = $2
      `,
      [token, user.id]
    );

    const resetLink =
      `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await mailer.sendTransacEmail({
      sender: {
        email: process.env.MAIL_FROM,
        name: process.env.APP_NAME
      },

      to: [
        { email: cleanEmail }
      ],

      subject: "Reset your password",

      htmlContent: `
        <div style="font-family:Arial;padding:20px;">
          <h2>Password Reset Request</h2>

          <p>Hello ${user.name},</p>

          <p>We received a request to reset your password.</p>

          <a href="${resetLink}"
             style="
               background:#2874f0;
               color:#fff;
               padding:12px 18px;
               text-decoration:none;
               border-radius:6px;
               display:inline-block;
             ">
             Reset Password
          </a>

          <p style="margin-top:15px;">
            This link expires in 30 minutes.
          </p>
        </div>
      `
    });

    return res.status(200).json({
      success: true,
      message:
        "If an account exists with this email address, a password reset link has been sent."
    });

  } catch (err) {

    console.error("FORGOT PASSWORD ERROR:", err);

    return res.status(500).json({
      success: false,
      message:
        "Unable to process your request right now."
    });
  }
};

// send login otp
exports.sendLoginOtp = async (req, res) => {
  try {

    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter your email address."
      });
    }

    const clean =
      identifier.trim().toLowerCase();

    const result = await pool.query(
      `
     SELECT id,name,email,is_verified,role,otp_attempts,updated_at
      FROM users
      WHERE email = $1
      LIMIT 1
      `,
      [clean]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        message:
          "No account found with this email address."
      });
    }

    const user = result.rows[0];

    if (Number(user.role) !== 3) {
      return res.status(403).json({
        success: false,
        message:
          "Invalid customer account."
      });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message:
          "Please verify your email address first."
      });
    }
const lastUpdated =
  new Date(user.updated_at);

const now = new Date();

const diffMinutes =
  (now - lastUpdated) /
  1000 / 60;

let attempts =
  Number(user.otp_attempts || 0);

/* Reset after 15 mins */

if (diffMinutes > 15) {
  attempts = 0;
}

if (attempts >= 3) {
  return res.status(429).json({
    success: false,
    message:
      "Too many OTP requests. Please try again after 15 minutes."
  });
}
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

  await pool.query(
  `
  UPDATE users
  SET
    otp_code = $1,
    otp_type = 'login',
    otp_expiry = NOW() + INTERVAL '10 minutes',
    otp_attempts = $2,
    updated_at = NOW()
  WHERE id = $3
  `,
  [
    otp,
    attempts + 1,
    user.id
  ]
);

    await mailer.sendTransacEmail({
      sender: {
        email: process.env.MAIL_FROM,
        name: process.env.APP_NAME
      },

      to: [
        { email: user.email }
      ],

      subject: "Your login OTP",

      htmlContent: `
        <div style="font-family:Arial;padding:20px;">
          <h2>Secure Login Code</h2>

          <p>Hello ${user.name},</p>

          <p>Your OTP is:</p>

          <h1 style="letter-spacing:4px;">
            ${otp}
          </h1>

          <p>
            Valid for 10 minutes.
          </p>
        </div>
      `
    });

    return res.status(200).json({
      success: true,
      message:
        "OTP sent successfully."
    });

  } catch (err) {

    console.error(
      "SEND OTP ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to send OTP right now."
    });
  }
};


// verify otp
exports.verifyLoginOtp = async (req, res) => {
  try {

    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({
        success: false,
        message:
          "Email address and OTP are required."
      });
    }

    const clean =
      identifier.trim().toLowerCase();

    const result = await pool.query(
      `
      SELECT
        id,
        role,
        name,
        email,
        phone,
        is_verified,
        otp_code,
        otp_expiry,

        COALESCE(
          (
            SELECT SUM(quantity)
            FROM cart
            WHERE user_id = users.id
          ),
          0
        ) AS cart_count

      FROM users
      WHERE email = $1
      LIMIT 1
      `,
      [clean]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        message:
          "Account not found."
      });
    }

    const user = result.rows[0];

    if (Number(user.role) !== 3) {
      return res.status(403).json({
        success: false,
        message:
          "Invalid customer account."
      });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message:
          "Please verify your email address first."
      });
    }

    if (!user.otp_code) {
      return res.status(400).json({
        success: false,
        message:
          "Please request a new OTP."
      });
    }

    if (String(user.otp_code) !== String(otp)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid OTP entered."
      });
    }

    if (
      !user.otp_expiry ||
      new Date(user.otp_expiry) < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "OTP has expired. Please request a new one."
      });
    }

    /* Clear OTP + update login */

    await pool.query(
      `
      UPDATE users
      SET
        otp_code = NULL,
        otp_type = NULL,
        otp_expiry = NULL,
        otp_attempts = 0,
        last_login = NOW(),
        updated_at = NOW()
      WHERE id = $1
      `,
      [user.id]
    );

    /* JWT */

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite:
        process.env.NODE_ENV ===
        "production"
          ? "none"
          : "lax",
      maxAge:
        7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      message:
        "Login successful.",

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        cart: Number(
          user.cart_count || 0
        )
      }
    });

  } catch (err) {

    console.error(
      "VERIFY OTP ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify OTP right now."
    });
  }
};


// viamobilenumber
exports.sendMobileOtp = async (req, res) => {
  try {

    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter mobile number."
      });
    }

    const cleanPhone =
      phone.trim();

    if (cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter valid mobile number."
      });
    }

    const result = await pool.query(
      `
     SELECT
  id,
  name,
  phone,
  role,
  is_active,
  otp_attempts,
  updated_at
FROM users
WHERE phone = $1
LIMIT 1
      `,
      [cleanPhone]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        message:
          "No account found with this mobile number."
      });
    }

    const user = result.rows[0];
const lastUpdated =
  new Date(user.updated_at);

const now = new Date();

const diffMinutes =
  (now - lastUpdated) /
  1000 / 60;

let attempts =
  Number(user.otp_attempts || 0);

/* Reset after 15 mins */

if (diffMinutes > 15) {
  attempts = 0;
}

if (attempts >= 3) {
  return res.status(429).json({
    success: false,
    message:
      "Too many OTP requests. Please try again after 15 minutes."
  });
}
    if (Number(user.role) !== 3) {
      return res.status(403).json({
        success: false,
        message:
          "Invalid customer account."
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message:
          "Account inactive."
      });
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

   await pool.query(
  `
  UPDATE users
  SET
    otp_code = $1,
    otp_type = 'mobile_login',
    otp_expiry = NOW() + INTERVAL '10 minutes',
    otp_attempts = $2,
    updated_at = NOW()
  WHERE id = $3
  `,
  [
    otp,
    attempts + 1,
    user.id
  ]
);

    /* Send via SMS (fire-and-forget) */
    sendOTPSms(cleanPhone, otp).catch(() => {})

    /* Dev mode only — also log to console */
    if (process.env.NODE_ENV !== "production") {
      console.log("MOBILE OTP:", otp)
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully.",
      ...(process.env.NODE_ENV !== "production" ? { otp } : {})
    });

  } catch (err) {

    console.error(
      "SEND MOBILE OTP ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to send OTP."
    });
  }
};

exports.verifyMobileOtp = async (req, res) => {
  try {

    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message:
          "Mobile number and OTP are required."
      });
    }

    const cleanPhone =
      phone.trim();

    const result = await pool.query(
      `
      SELECT
        u.id,
        u.role,
        u.name,
        u.email,
        u.phone,
        u.is_active,
        u.otp_code,
        u.otp_expiry,

        COALESCE(
          (
            SELECT SUM(quantity)
            FROM cart
            WHERE user_id = u.id
          ),
          0
        ) AS cart_count

      FROM users u
      WHERE u.phone = $1
      LIMIT 1
      `,
      [cleanPhone]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        message:
          "Account not found."
      });
    }

    const user = result.rows[0];

    if (Number(user.role) !== 3) {
      return res.status(403).json({
        success: false,
        message:
          "Invalid customer account."
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message:
          "Account inactive."
      });
    }

    if (!user.otp_code) {
      return res.status(400).json({
        success: false,
        message:
          "Please request a new OTP."
      });
    }

    if (
      String(user.otp_code) !==
      String(otp)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid OTP entered."
      });
    }

    if (
      !user.otp_expiry ||
      new Date(user.otp_expiry) <
        new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "OTP has expired. Please request a new one."
      });
    }

    /* Success updates */

    await pool.query(
      `
      UPDATE users
      SET
        otp_code = NULL,
        otp_type = NULL,
        otp_expiry = NULL,
        otp_attempts = 0,
        phone_verified = true,
        phone_verified_at = NOW(),
        last_login = NOW(),
        updated_at = NOW()
      WHERE id = $1
      `,
      [user.id]
    );

    /* JWT */

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite:
        process.env.NODE_ENV ===
        "production"
          ? "none"
          : "lax",
      maxAge:
        7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      message:
        "Login successful.",

      user: {
        id: user.id,
        name: user.name,
        email: user.email || "",
        phone: user.phone || "",
        role: user.role,
        cart: Number(
          user.cart_count || 0
        )
      }
    });

  } catch (err) {

    console.error(
      "VERIFY MOBILE OTP ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify OTP."
    });
  }
};


// resend verification
exports.resendVerification = async (req, res) => {
  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter your email address."
      });
    }

    const cleanEmail =
      email.trim().toLowerCase();

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        is_verified
      FROM users
      WHERE email = $1
      LIMIT 1
      `,
      [cleanEmail]
    );

    if (!result.rowCount) {
      return res.status(200).json({
        success: true,
        message:
          "If your account exists, a verification email has been sent."
      });
    }

    const user = result.rows[0];

    if (user.is_verified) {
      return res.status(200).json({
        success: true,
        message:
          "Your email address is already verified."
      });
    }

    const token = crypto
      .randomBytes(32)
      .toString("hex");

    await pool.query(
      `
      UPDATE users
      SET
        verification_token = $1,
        updated_at = NOW()
      WHERE id = $2
      `,
      [token, user.id]
    );

    const verifyLink =
      `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await mailer.sendTransacEmail({
      sender: {
        email: process.env.MAIL_FROM,
        name: process.env.APP_NAME
      },

      to: [
        { email: user.email }
      ],

      subject:
        "Verify your email address",

      htmlContent: `
        <div style="font-family:Arial;padding:20px;">
          <h2>Email Verification</h2>

          <p>Hello ${user.name},</p>

          <p>Please verify your email address.</p>

          <a href="${verifyLink}"
             style="
               background:#16a34a;
               color:#fff;
               padding:12px 18px;
               text-decoration:none;
               border-radius:6px;
               display:inline-block;
             ">
             Verify Email
          </a>
        </div>
      `
    });

    return res.status(200).json({
      success: true,
      message:
        "Verification email sent successfully."
    });

  } catch (err) {

    console.error(
      "RESEND VERIFY ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to resend verification email."
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {

    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Token and password are required."
      });
    }

    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long and contain at least one letter and one number."
      });
    }

    const result = await pool.query(
      `
      SELECT id
      FROM users
      WHERE reset_token = $1
      AND reset_token_expiry > NOW()
      LIMIT 1
      `,
      [token]
    );

    if (!result.rowCount) {
      return res.status(400).json({
        success: false,
        message:
          "This reset link is invalid or expired."
      });
    }

    const user = result.rows[0];

    const hash =
      await bcrypt.hash(
        password,
        12
      );

    await pool.query(
      `
      UPDATE users
      SET
        password = $1,
        reset_token = NULL,
        reset_token_expiry = NULL,
        login_attempts = 0,
        locked_until = NULL,
        updated_at = NOW()
      WHERE id = $2
      `,
      [hash, user.id]
    );

    return res.status(200).json({
      success: true,
      message:
        "Your password has been reset successfully."
    });

  } catch (err) {

    console.error(
      "RESET PASSWORD ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to reset password right now."
    });
  }
};
/* ================= LOGOUT ================= */

exports.googleLogin = async (req, res) => {
  try {
    const { id_token } = req.body
    if (!id_token) return res.status(400).json({ success: false, message: 'id_token required' })

    // ── Step 1: Verify the token with Google's servers ──
    // We never trust name/email from the frontend — always get them from Google directly.
    let tokenInfo
    try {
      const r = await axios.get(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(id_token)}`,
        { timeout: 5000 }
      )
      tokenInfo = r.data
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid Google token — verification failed' })
    }

    // ── Step 2: Confirm the token belongs to OUR app (audience check) ──
    // Accept web, Android, and mobile web client IDs.
    // GOOGLE_MOBILE_CLIENT_ID is the webClientId configured in @react-native-google-signin —
    // this becomes the `aud` of the id_token returned by the mobile app.
    const allowedAudiences = [
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_ANDROID_CLIENT_ID,
      process.env.GOOGLE_MOBILE_CLIENT_ID,
    ].filter(Boolean)
    if (allowedAudiences.length && !allowedAudiences.includes(tokenInfo.aud)) {
      console.warn('[Google Login] aud mismatch:', tokenInfo.aud, 'not in', allowedAudiences)
      return res.status(401).json({ success: false, message: 'Token was not issued for this application' })
    }

    // ── Step 3: Email must be verified by Google ──
    if (!tokenInfo.email_verified || tokenInfo.email_verified === 'false') {
      return res.status(401).json({ success: false, message: 'Google account email is not verified' })
    }

    const cleanEmail = tokenInfo.email.trim().toLowerCase()
    const cleanName = (tokenInfo.name || tokenInfo.given_name || cleanEmail.split('@')[0]).trim()

    // ── Step 4: Find or create the user ──
    let user
    const existing = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail])

    if (existing.rows.length) {
      user = existing.rows[0]
      // Auto-verify and link google_id on every Google login
      if (!user.is_verified || !user.google_id) {
        await pool.query(
          'UPDATE users SET is_verified = TRUE, google_id = COALESCE(google_id, $2), updated_at = NOW() WHERE id = $1',
          [user.id, tokenInfo.sub || null]
        )
        user.is_verified = true
      }
    } else {
      // New user — create with random password (they'll use Google to sign in)
      const hash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10)
      const myReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase()
      const result = await pool.query(
        `INSERT INTO users (name, email, password, role, is_verified, referral_code, google_id)
         VALUES ($1, $2, $3, 3, TRUE, $4, $5) RETURNING *`,
        [cleanName, cleanEmail, hash, myReferralCode, tokenInfo.sub || null]
      )
      user = result.rows[0]

      // Track referral if the frontend passed a ?ref= code
      const incomingRef = (req.body.referralCode || '').trim()
      if (incomingRef) {
        try {
          const refRes = await pool.query(
            `SELECT id FROM users WHERE UPPER(referral_code) = UPPER($1) AND id != $2`,
            [incomingRef, user.id]
          )
          if (refRes.rows.length) {
            const referrerId = refRes.rows[0].id
            await pool.query(`UPDATE users SET referred_by = $1 WHERE id = $2`, [referrerId, user.id])
            await pool.query(
              `INSERT INTO referrals (referrer_id, referred_id, status) VALUES ($1, $2, 'pending')
               ON CONFLICT (referred_id) DO NOTHING`,
              [referrerId, user.id]
            )
          }
        } catch (_) {}
      }
    }

    // ── Step 5: Issue your own JWT ──
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    )

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, is_verified: user.is_verified, phone: user.phone },
    })
  } catch (err) {
    console.error('[Google Login]', err)
    res.status(500).json({ success: false, message: 'Google login failed' })
  }
}

/* ── Google Login via userinfo (mobile fallback when id_token not in auth response) ── */
exports.googleLoginUserinfo = async (req, res) => {
  try {
    const { email, name, email_verified } = req.body
    if (!email) return res.status(400).json({ success: false, message: 'email required' })
    // email_verified must be true — Google only returns verified emails from /userinfo
    // but we still check the field if present
    if (email_verified === false || email_verified === 'false') {
      return res.status(401).json({ success: false, message: 'Google account email is not verified' })
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanName = (name || cleanEmail.split('@')[0]).trim()

    let user
    const existing = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail])
    if (existing.rows.length) {
      user = existing.rows[0]
      if (!user.is_verified) {
        await pool.query('UPDATE users SET is_verified = TRUE WHERE id = $1', [user.id])
        user.is_verified = true
      }
    } else {
      const hash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10)
      const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase()
      const result = await pool.query(
        `INSERT INTO users (name, email, password, role, is_verified, referral_code)
         VALUES ($1, $2, $3, 3, TRUE, $4) RETURNING *`,
        [cleanName, cleanEmail, hash, referralCode]
      )
      user = result.rows[0]
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    )

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })

    res.json({
      success: true, token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, is_verified: user.is_verified, phone: user.phone },
    })
  } catch (err) {
    console.error('[Google Userinfo Login]', err)
    res.status(500).json({ success: false, message: 'Google login failed' })
  }
}

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
        referral_code,
        wallet_balance,
        referred_by,
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