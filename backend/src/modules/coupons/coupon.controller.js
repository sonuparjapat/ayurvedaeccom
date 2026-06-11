const pool = require('../../config/db');

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function calcDiscount(coupon, cartTotal) {
  let discount = coupon.type === 'percent'
    ? (cartTotal * Number(coupon.value)) / 100
    : Number(coupon.value);
  if (Number(coupon.max_discount) > 0) discount = Math.min(discount, Number(coupon.max_discount));
  return +Math.min(discount, cartTotal).toFixed(2);
}

/* ─── PUBLIC: list active coupons (for "available offers" section) ─────────── */

exports.getActiveCoupons = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, code, type, value, min_order, max_discount, valid_to, description
      FROM coupons
      WHERE is_active = TRUE
        AND (usage_limit = 0 OR used_count < usage_limit)
        AND (valid_from IS NULL OR valid_from <= NOW())
        AND (valid_to IS NULL OR valid_to >= NOW())
      ORDER BY created_at DESC
      LIMIT 20
    `);
    res.json({ success: true, coupons: result.rows });
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

    const where = search ? `WHERE UPPER(code) LIKE UPPER($3)` : '';
    const params = search ? [limit, offset, `%${search}%`] : [limit, offset];

    const [rows, count] = await Promise.all([
      pool.query(`SELECT * FROM coupons ${where} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, params),
      pool.query(`SELECT COUNT(*) FROM coupons ${where}`, search ? [`%${search}%`] : []),
    ]);

    res.json({ success: true, coupons: rows.rows, total: Number(count.rows[0].count), page, limit });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to list coupons' });
  }
};

/* ─── ADMIN: create coupon ───────────────────────────────────────────────── */

exports.adminCreate = async (req, res) => {
  try {
    const { code, type, value, min_order = 0, max_discount = 0, usage_limit = 0, usage_per_user = 1, valid_from, valid_to, description } = req.body;
    if (!code || !type || !value) return res.status(400).json({ success: false, message: 'code, type, value required' });
    if (!['flat', 'percent'].includes(type)) return res.status(400).json({ success: false, message: 'type must be flat or percent' });

    const result = await pool.query(`
      INSERT INTO coupons (code, type, value, min_order, max_discount, usage_limit, usage_per_user, valid_from, valid_to, description)
      VALUES (UPPER($1),$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [code, type, value, min_order, max_discount, usage_limit, usage_per_user, valid_from || null, valid_to || null, description || null]);

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
    const { type, value, min_order, max_discount, usage_limit, usage_per_user, valid_from, valid_to, description, is_active } = req.body;

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
        updated_at = NOW()
      WHERE id = $11 RETURNING *
    `, [type, value, min_order, max_discount, usage_limit, usage_per_user, valid_from || null, valid_to || null, description, is_active, id]);

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
