const pool = require('../../config/db');
const { uploadImageToAWS, deleteFromAWS } = require('../../utils/awsImageUpload');

/* ─── PUBLIC: active banners for home carousel ───────────────────────────── */

exports.getPublicBanners = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, tag, title, subtitle, image_url, bg_color1, bg_color2, cta_text, cta_link
      FROM banners
      WHERE is_active = TRUE
      ORDER BY sort_order ASC, created_at ASC
      LIMIT 10
    `);
    res.json({ success: true, banners: result.rows });
  } catch (err) {
    console.error('[BANNERS PUBLIC]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch banners' });
  }
};

/* ─── ADMIN: list (with optional search/pagination) ─────────────────────── */

exports.adminList = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Number(req.query.limit || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const where = search ? `WHERE title ILIKE $3 OR tag ILIKE $3` : '';
    const params = search ? [limit, offset, `%${search}%`] : [limit, offset];
    const [rows, count] = await Promise.all([
      pool.query(`SELECT * FROM banners ${where} ORDER BY sort_order ASC, created_at DESC LIMIT $1 OFFSET $2`, params),
      pool.query(`SELECT COUNT(*) FROM banners ${where}`, search ? [`%${search}%`] : []),
    ]);
    res.json({ success: true, banners: rows.rows, total: Number(count.rows[0].count), page, limit });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to list banners' });
  }
};

/* ─── ADMIN: create ──────────────────────────────────────────────────────── */

exports.adminCreate = async (req, res) => {
  try {
    const { tag, title, subtitle, bg_color1, bg_color2, cta_text, cta_link, sort_order } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'title is required' });

    let image_url = req.body.image_url || null;
    if (req.file) image_url = await uploadImageToAWS(req.file, 'banners');

    const result = await pool.query(`
      INSERT INTO banners (tag, title, subtitle, image_url, bg_color1, bg_color2, cta_text, cta_link, sort_order)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [tag || null, title, subtitle || null, image_url,
        bg_color1 || '#1a3a22', bg_color2 || '#0d1f15',
        cta_text || 'Explore Products', cta_link || '/products', sort_order || 0]);

    res.status(201).json({ success: true, banner: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create banner' });
  }
};

/* ─── ADMIN: update ──────────────────────────────────────────────────────── */

exports.adminUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { tag, title, subtitle, bg_color1, bg_color2, cta_text, cta_link, sort_order, is_active } = req.body;

    let image_url = req.body.image_url || null;
    if (req.file) {
      const old = await pool.query('SELECT image_url FROM banners WHERE id=$1', [id]);
      if (old.rows[0]?.image_url) await deleteFromAWS(old.rows[0].image_url).catch(() => {});
      image_url = await uploadImageToAWS(req.file, 'banners');
    }

    const result = await pool.query(`
      UPDATE banners SET
        tag = COALESCE($1, tag),
        title = COALESCE($2, title),
        subtitle = COALESCE($3, subtitle),
        image_url = $4,
        bg_color1 = COALESCE($5, bg_color1),
        bg_color2 = COALESCE($6, bg_color2),
        cta_text = COALESCE($7, cta_text),
        cta_link = COALESCE($8, cta_link),
        sort_order = COALESCE($9, sort_order),
        is_active = COALESCE($10, is_active),
        updated_at = NOW()
      WHERE id = $11 RETURNING *
    `, [tag, title, subtitle, image_url || null, bg_color1, bg_color2, cta_text, cta_link, sort_order, is_active, id]);

    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, banner: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update banner' });
  }
};

/* ─── ADMIN: delete ──────────────────────────────────────────────────────── */

exports.adminDelete = async (req, res) => {
  try {
    await pool.query('DELETE FROM banners WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'Banner deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete banner' });
  }
};

module.exports = exports;
