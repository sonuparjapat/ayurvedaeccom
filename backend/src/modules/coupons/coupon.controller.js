const pool = require('../../config/db');

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function calcDiscount(coupon, cartTotal) {
  let discount = coupon.type === 'percent'
    ? (cartTotal * Number(coupon.value)) / 100
    : Number(coupon.value);
  if (Number(coupon.max_discount) > 0) discount = Math.min(discount, Number(coupon.max_discount));
  return +Math.min(discount, cartTotal).toFixed(2);
}

/* ─── PUBLIC: list active coupons — user-specific + global ─────────────────
   Requires optionalAuth so logged-in users see their personal coupons.
   Returns two buckets:
     coupons      — available now (min_order met or 0)
     unlockable   — not yet usable due to min_order (so UI can show "add ₹X more")
   Guest users only get global (user_id IS NULL) coupons.
*/
exports.getActiveCoupons = async (req, res) => {
  try {
    const userId = req.user?.id || null;

    // Base filter: active, not expired, usage limit not exhausted
    const baseFilter = `
      is_active = TRUE
      AND (usage_limit = 0 OR used_count < usage_limit)
      AND (valid_from IS NULL OR valid_from <= NOW())
      AND (valid_to IS NULL OR valid_to >= NOW())
    `;

    // user_id filter: global coupons (NULL) plus user-specific ones if logged in
    const userFilter = userId
      ? `(user_id IS NULL OR user_id = $1)`
      : `user_id IS NULL`;

    const params = userId ? [userId] : [];

    const result = await pool.query(`
      SELECT id, code,
             type AS discount_type,
             value AS discount_value,
             min_order AS min_order_amount,
             max_discount, valid_to, description, user_id, usage_per_user
      FROM coupons
      WHERE ${baseFilter} AND ${userFilter}
      ORDER BY user_id DESC NULLS LAST, min_order ASC, created_at DESC
      LIMIT 30
    `, params);

    // Also check per-user usage for logged-in users — exclude already maxed coupons
    let rows = result.rows;
    if (userId) {
      const usedRes = await pool.query(
        `SELECT coupon_id, COUNT(*) AS uses FROM coupon_uses WHERE user_id=$1 GROUP BY coupon_id`,
        [userId]
      );
      const usedMap = {};
      usedRes.rows.forEach(r => { usedMap[r.coupon_id] = Number(r.uses); });

      rows = rows.filter(c => {
        const perUser = Number(c.usage_per_user) || 0;
        if (perUser === 0) return true;
        return (usedMap[c.id] || 0) < perUser;
      });
    }

    res.json({ success: true, coupons: rows });
  } catch (err) {
    console.error('[COUPONS LIST]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
  }
};

/* ─── PUBLIC: validate and return discount (no order created yet) ────────── */

exports.applyCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    const userId = req.user?.id || null;

    if (!code) return res.status(400).json({ success: false, message: 'Coupon code is required' });
    const total = Number(cartTotal || 0);
    if (total <= 0) return res.status(400).json({ success: false, message: 'Invalid cart total' });

    const couponRes = await pool.query(`
      SELECT * FROM coupons
      WHERE UPPER(code) = UPPER($1)
        AND is_active = TRUE
        AND (valid_from IS NULL OR valid_from <= NOW())
        AND (valid_to IS NULL OR valid_to >= NOW())
    `, [code]);

    if (!couponRes.rows.length)
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code' });

    const coupon = couponRes.rows[0];

    // user-specific coupon: only the assigned user can use it
    if (coupon.user_id && coupon.user_id !== userId)
      return res.status(403).json({ success: false, message: 'This coupon is not valid for your account' });

    if (Number(coupon.usage_limit) > 0 && coupon.used_count >= coupon.usage_limit)
      return res.status(400).json({ success: false, message: 'This coupon has reached its usage limit' });

    if (total < Number(coupon.min_order))
      return res.status(400).json({ success: false, message: `Minimum order value of ₹${coupon.min_order} required` });

    if (userId && Number(coupon.usage_per_user) > 0) {
      const used = await pool.query(
        'SELECT COUNT(*) FROM coupon_uses WHERE coupon_id=$1 AND user_id=$2',
        [coupon.id, userId]
      );
      if (Number(used.rows[0].count) >= Number(coupon.usage_per_user))
        return res.status(400).json({ success: false, message: 'You have already used this coupon' });
    }

    const discount = calcDiscount(coupon, total);

    res.json({
      success: true,
      coupon: {
        id: coupon.id, code: coupon.code, type: coupon.type,
        value: coupon.value, maxDiscount: coupon.max_discount,
        minOrder: coupon.min_order, validTo: coupon.valid_to,
      },
      discount,
      newTotal: +(total - discount).toFixed(2),
      message: `🎉 Coupon applied! You save ₹${discount}`,
    });
  } catch (err) {
    console.error('[APPLY COUPON]', err);
    res.status(500).json({ success: false, message: 'Failed to apply coupon' });
  }
};

/* ─── ADMIN: list all coupons ────────────────────────────────────────────── */

exports.adminList = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Number(req.query.limit || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const where = search ? `WHERE UPPER(c.code) LIKE UPPER($3)` : '';
    const params = search ? [limit, offset, `%${search}%`] : [limit, offset];

    const [rows, count] = await Promise.all([
      pool.query(
        `SELECT c.*, u.name AS user_name, u.email AS user_email
         FROM coupons c
         LEFT JOIN users u ON u.id = c.user_id
         ${where}
         ORDER BY c.created_at DESC LIMIT $1 OFFSET $2`,
        params
      ),
      pool.query(`SELECT COUNT(*) FROM coupons c ${where}`, search ? [`%${search}%`] : []),
    ]);

    res.json({ success: true, coupons: rows.rows, total: Number(count.rows[0].count), page, limit });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to list coupons' });
  }
};

/* ─── ADMIN: search users (for assigning user-specific coupons) ──────────── */

exports.adminSearchUsers = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ users: [] });
    const result = await pool.query(
      `SELECT id, name, email FROM users WHERE role = 3 AND (name ILIKE $1 OR email ILIKE $1) LIMIT 10`,
      [`%${q}%`]
    );
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Search failed' });
  }
};

/* ─── ADMIN: create coupon ───────────────────────────────────────────────── */

exports.adminCreate = async (req, res) => {
  try {
    const {
      code, type, value, min_order = 0, max_discount = 0,
      usage_limit = 0, usage_per_user = 1, valid_from, valid_to,
      description, user_id = null,
    } = req.body;
    if (!code || !type || !value) return res.status(400).json({ success: false, message: 'code, type, value required' });
    if (!['flat', 'percent'].includes(type)) return res.status(400).json({ success: false, message: 'type must be flat or percent' });

    const result = await pool.query(`
      INSERT INTO coupons
        (code, type, value, min_order, max_discount, usage_limit, usage_per_user, valid_from, valid_to, description, user_id)
      VALUES (UPPER($1),$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [code, type, value, min_order, max_discount, usage_limit, usage_per_user,
        valid_from || null, valid_to || null, description || null, user_id || null]);

    res.status(201).json({ success: true, coupon: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    res.status(500).json({ success: false, message: 'Failed to create coupon' });
  }
};

/* ─── ADMIN: update coupon ───────────────────────────────────────────────── */

exports.adminUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      type, value, min_order, max_discount, usage_limit, usage_per_user,
      valid_from, valid_to, description, is_active, user_id,
    } = req.body;

    const result = await pool.query(`
      UPDATE coupons SET
        type = COALESCE($1, type),
        value = COALESCE($2, value),
        min_order = COALESCE($3, min_order),
        max_discount = COALESCE($4, max_discount),
        usage_limit = COALESCE($5, usage_limit),
        usage_per_user = COALESCE($6, usage_per_user),
        valid_from = $7,
        valid_to = $8,
        description = COALESCE($9, description),
        is_active = COALESCE($10, is_active),
        user_id = $11,
        updated_at = NOW()
      WHERE id = $12 RETURNING *
    `, [type, value, min_order, max_discount, usage_limit, usage_per_user,
        valid_from || null, valid_to || null, description, is_active,
        user_id || null,
        id]);

    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, coupon: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update coupon' });
  }
};

/* ─── ADMIN: delete coupon ───────────────────────────────────────────────── */

exports.adminDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM coupons WHERE id=$1 RETURNING id', [id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete coupon' });
  }
};

module.exports = exports;
