const pool = require("../../config/db")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const path = require("path")
const crypto = require("crypto")           // ✅ For verification token

const mailer = require("../../config/mail")



exports.userRegister = async (req, res) => {
  const client = await pool.connect();

  try {
    const { name, email, phone, password } = req.body;

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

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters long."
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

    /* ================= EMAIL TOKEN ================= */

    const token = crypto
      .randomBytes(32)
      .toString("hex");

    /* ================= INSERT USER ================= */

    await client.query(
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
        created_at,
        updated_at
      )
      VALUES
      ($1,$2,$3,$4,3,$5,false,NOW(),NOW())
      `,
      [
        cleanName,
        cleanEmail,
        cleanPhone,
        hash,
        token
      ]
    );

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

  subject: "Verify your email address",

  htmlContent: `
    <div style="font-family:Arial;padding:20px;">
      <h2>Welcome to ${process.env.APP_NAME}</h2>

      <p>Your account has been created successfully.</p>

      <p>Please verify your email address to continue.</p>

      <a href="${verifyLink}"
         style="
           background:#2874f0;
           color:#fff;
           padding:12px 18px;
           text-decoration:none;
           border-radius:6px;
           display:inline-block;
         ">
         Verify Email
      </a>

      <p style="margin-top:15px;">
        If you did not create this account, ignore this email.
      </p>
    </div>
  `
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
      { expiresIn: "2h" }
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
      { expiresIn: "2h" }
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

    /* Dev mode only */

    if (
      process.env.NODE_ENV !==
      "production"
    ) {
      console.log(
        "MOBILE OTP:",
        otp
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "OTP sent successfully.",
      ...(process.env.NODE_ENV !==
      "production"
        ? { otp }
        : {})
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
      { expiresIn: "2h" }
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

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters long."
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