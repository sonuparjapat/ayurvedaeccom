const pool = require('../../config/db');

/* ================= CREATE ================= */
exports.createCompany = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      company_name, email, phone, website, gst_number,
      address_line1, city, state, country, pincode,
      support_email, social_links, extra_data,
      privacy_policy, terms_conditions, shipping_policy, return_policy,
    } = req.body;

    if (!company_name) {
      return res.status(400).json({ success: false, message: "Company name is required" });
    }

    let logo_url = req.body.logo_url || null;
    if (req.file) {
      const { uploadImageToAWS } = require('../../utils/awsImageUpload');
      logo_url = await uploadImageToAWS(req.file, 'company');
    }

    let parsedSocial = {};
    if (social_links) {
      try { parsedSocial = typeof social_links === 'string' ? JSON.parse(social_links) : social_links; } catch {}
    }

    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO company_settings
      (company_name, email, phone, website, gst_number, address_line1, city, state, country,
       pincode, support_email, logo_url, social_links, extra_data,
       privacy_policy, terms_conditions, shipping_policy, return_policy)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING *`,
      [
        company_name,
        email || null, phone || null, website || null, gst_number || null,
        address_line1 || null, city || null, state || null, country || null,
        pincode || null, support_email || null, logo_url,
        JSON.stringify(parsedSocial), extra_data ? JSON.stringify(extra_data) : '{}',
        privacy_policy || null, terms_conditions || null,
        shipping_policy || null, return_policy || null,
      ]
    );

    await client.query("COMMIT");
    res.status(201).json({ success: true, data: result.rows[0] });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};


/* ================= GET LIST ================= */
exports.getCompanies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const data = await pool.query(
      `SELECT * FROM company_settings
       WHERE is_active = true
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const count = await pool.query(
      `SELECT COUNT(*) FROM company_settings WHERE is_active = true`
    );

    res.json({
      success: true,
      data: data.rows,
      total: parseInt(count.rows[0].count),
      page,
      totalPages: Math.ceil(count.rows[0].count / limit)
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};


/* ================= GET SINGLE ================= */
exports.getCompanyById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM company_settings WHERE id=$1`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Company not found"
      });
    }

    res.json({ success: true, data: result.rows[0] });

  } catch (error) {
    res.status(500).json({ success: false });
  }
};


/* ================= UPDATE ================= */
exports.updateCompany = async (req, res) => {
  try {
    const id = req.params.id;

    const existing = await pool.query(`SELECT * FROM company_settings WHERE id=$1`, [id]);
    if (!existing.rows.length) return res.status(404).json({ success: false, message: 'Company not found' });

    const body = { ...req.body };

    // Handle logo file upload
    if (req.file) {
      const { uploadImageToAWS } = require('../../utils/awsImageUpload');
      body.logo_url = await uploadImageToAWS(req.file, 'company');
    }

    // Parse social_links if sent as string
    if (body.social_links && typeof body.social_links === 'string') {
      try { body.social_links = JSON.parse(body.social_links); } catch { delete body.social_links; }
    }

    const ALLOWED_FIELDS = new Set([
      'company_name', 'email', 'phone', 'website', 'gst_number',
      'address_line1', 'city', 'state', 'country', 'pincode',
      'support_email', 'logo_url', 'social_links', 'extra_data',
      'privacy_policy', 'terms_conditions', 'shipping_policy', 'return_policy',
    ]);

    const fields = Object.keys(body).filter(f => ALLOWED_FIELDS.has(f));
    const values = fields.map((f) => {
      const v = body[f];
      if (f === 'social_links') return typeof v === 'object' ? JSON.stringify(v) : v;
      return v;
    });

    if (!fields.length) return res.status(400).json({ success: false, message: 'No valid fields to update' });

    const setQuery = fields.map((f, i) => `${f}=$${i + 1}`).join(', ');

    const result = await pool.query(
      `UPDATE company_settings SET ${setQuery}, updated_at=NOW() WHERE id=$${fields.length + 1} RETURNING *`,
      [...values, id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};


/* ================= DELETE (SOFT) ================= */
exports.deleteCompany = async (req, res) => {
  try {
    await pool.query(
      `UPDATE company_settings SET is_active=false WHERE id=$1`,
      [req.params.id]
    );

    res.json({ success: true, message: "Deleted successfully" });

  } catch (error) {
    res.status(500).json({ success: false });
  }
};