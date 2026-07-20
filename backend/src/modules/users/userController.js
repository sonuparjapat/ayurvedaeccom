const pool = require("../../config/db");
const bcrypt = require("bcryptjs");

// change password
exports.changePassword = async (req, res) => {
  try {

    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: "All fields required",
      });
    }

    const user = await pool.query(
      "SELECT password FROM users WHERE id=$1",
      [userId]
    );

    const match = await bcrypt.compare(
      oldPassword,
      user.rows[0].password
    );

    if (!match) {
      return res.status(400).json({
        message: "Wrong password",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password too short",
      });
    }

    const hash = await bcrypt.hash(newPassword, 12);

    await pool.query(
      `
      UPDATE users
      SET password=$1, updated_at=NOW()
      WHERE id=$2
      `,
      [hash, userId]
    );

    res.json({
      success: true,
      message: "Password updated",
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Password change failed",
    });
  }
};
// update profile
exports.updateProfile = async (req, res) => {
  try {

    const userId = req.user.id;
    const { name, email, phone } = req.body;

    if (!name || !email) {
      // Return 400 bad request if name or email is not provided
      return res.status(400).json({
        message: "Name and email are required",
      });
    }

    // Check for duplicate email
    const check = await pool.query(
      "SELECT id FROM users WHERE email=$1 AND id != $2",
      [email, userId]
    );

    if (check.rowCount) {
      // Return 400 bad request if email already exists
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    // Update user profile
    const result = await pool.query(
      `
      UPDATE users
      SET
        name=$1,
        email=$2,
        phone=$3,
        updated_at=NOW()
      WHERE id=$4
      RETURNING id,name,email,phone
      `,
      [name, email, phone, userId]
    );

    // Return the updated user profile
    res.json({
      success: true,
      user: result.rows[0],
    });

  } catch (err) {

    console.error(err);

    // Return 500 internal server error if something goes wrong
    res.status(500).json({
      message: "Update failed",
    });
  }
};
exports.deleteAccount = async (req, res) => {
  try {

    const userId = req.user.id;

    await pool.query(
      `
      UPDATE users
      SET is_active=false,
          updated_at=NOW()
      WHERE id=$1
      `,
      [userId]
    );

    res.clearCookie("token");

    res.json({
      success: true,
      message: "Account deactivated",
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Delete failed",
    });
  }
};
/* ================= ADD ADDRESS ================= */
exports.addAddress = async (req, res) => {
  try {

    const userId = req.user.id;

    const {
      type,
      street,
      city,
      state,
      pincode,
      isDefault,
      email
    } = req.body;


    /* Validation */
    if (!street || !city || !state || !pincode||!email) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }


    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      /* If new address is default → remove old default */
      if (isDefault) {
        await client.query(
          `UPDATE user_addresses
           SET is_default = false
           WHERE user_id = $1`,
          [userId]
        );
      }

      const result = await client.query(
        `
        INSERT INTO user_addresses
        (user_id,type,street,city,state,pincode,email,is_default)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING *
        `,
        [
          userId,
          (type || "home").toLowerCase(),
          street,
          city,
          state,
          pincode,
          email,
          isDefault || false,
        ]
      );

      await client.query("COMMIT");

      res.status(201).json({
        success: true,
        data: result.rows[0],
      });

    } catch (err) {

      await client.query("ROLLBACK");
      throw err;

    } finally {
      client.release();
    }

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Add address failed",
    });
  }
};



/* ================= GET MY ADDRESSES ================= */
exports.getMyAddresses = async (req, res) => {
  try {

    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT *
      FROM user_addresses
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at DESC
      `,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: "Fetch failed",
    });
  }
};



/* ================= UPDATE ================= */
exports.updateAddress = async (req, res) => {
  try {

    const userId = req.user.id;
    const id = req.params.id;

    const {
      type,
      street,
      city,
      state,
      pincode,
      isDefault,
      email
    } = req.body;


    const client = await pool.connect();

    try {

      await client.query("BEGIN");

      if (isDefault) {
        await client.query(
          `UPDATE user_addresses
           SET is_default = false
           WHERE user_id = $1`,
          [userId]
        );
      }


      const result = await client.query(
        `
        UPDATE user_addresses
        SET
          type=$1,
          street=$2,
          city=$3,
          state=$4,
          pincode=$5,
          is_default=$6,
          updated_at=NOW(),
          email=$7

        WHERE id=$8 AND user_id=$9
        RETURNING *
        `,
        [
          (type || 'home').toLowerCase(),
          street,
          city,
          state,
          pincode,
          isDefault || false,
          email,
          id,
          userId,
        ]
      );


      if (!result.rowCount) {
        return res.status(404).json({
          success: false,
          message: "Not found",
        });
      }

      await client.query("COMMIT");

      res.json({
        success: true,
        data: result.rows[0],
      });

    } catch (err) {

      await client.query("ROLLBACK");
      throw err;

    } finally {
      client.release();
    }

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: "Update failed",
    });
  }
};



/* ================= DELETE ================= */
exports.deleteAddress = async (req, res) => {
  try {

    const userId = req.user.id;
    const id = req.params.id;

    const result = await pool.query(
      `
      DELETE FROM user_addresses
      WHERE id=$1 AND user_id=$2
      `,
      [id, userId]
    );


    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }


    res.json({
      success: true,
      message: "Deleted",
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};



/* ================= SET DEFAULT ================= */
exports.setDefaultAddress = async (req, res) => {
  try {

    const userId = req.user.id;
    const id = req.params.id;

    const client = await pool.connect();

    try {

      await client.query("BEGIN");

      await client.query(
        `
        UPDATE user_addresses
        SET is_default=false
        WHERE user_id=$1
        `,
        [userId]
      );


      const result = await client.query(
        `
        UPDATE user_addresses
        SET is_default=true
        WHERE id=$1 AND user_id=$2
        RETURNING *
        `,
        [id, userId]
      );


      if (!result.rowCount) {
        return res.status(404).json({
          success: false,
          message: "Not found",
        });
      }

      await client.query("COMMIT");

      res.json({
        success: true,
        data: result.rows[0],
      });

    } catch (err) {

      await client.query("ROLLBACK");
      throw err;

    } finally {
      client.release();
    }

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: "Set default failed",
    });
  }
};

/* ─── REFERRAL STATS ─────────────────────────────────── */
exports.getReferralStats = async (req, res) => {
  try {
    const userId = req.user.id
    const [userRes, referralsRes, earnedRes] = await Promise.all([
      pool.query('SELECT referral_code, wallet_balance FROM users WHERE id=$1', [userId]),
      pool.query(
        `SELECT r.status, r.reward_amount, r.created_at, r.rewarded_at,
                u.name AS referred_name, u.email AS referred_email
         FROM referrals r
         JOIN users u ON u.id = r.referred_id
         WHERE r.referrer_id = $1
         ORDER BY r.created_at DESC
         LIMIT 50`,
        [userId]
      ),
      pool.query(
        `SELECT COALESCE(SUM(reward_amount), 0) AS total_earned
         FROM referrals WHERE referrer_id = $1 AND status = 'rewarded'`,
        [userId]
      ),
    ])
    const referrals = referralsRes.rows
    res.json({
      success: true,
      referral_code: userRes.rows[0]?.referral_code || null,
      wallet_balance: parseFloat(userRes.rows[0]?.wallet_balance || 0),
      referrals,
      total: referrals.length,
      rewarded: referrals.filter(r => r.status === 'rewarded').length,
      earned: parseFloat(earnedRes.rows[0]?.total_earned || 0),
    })
  } catch (err) {
    console.error('[REFERRAL STATS]', err)
    res.status(500).json({ success: false, referrals: [], total: 0, earned: 0 })
  }
}
