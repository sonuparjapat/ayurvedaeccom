const pool = require('../../config/db');

/* ================= CREATE ================= */
exports.createCompany = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      company_name,
      email,
      phone,
      website,
      gst_number,
      address_line1,
      city,
      state,
      country,
      pincode,
      extra_data,
    } = req.body;

    if (!company_name) {
      return res.status(400).json({
        success: false,
        message: "Company name is required"
      });
    }

    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO company_settings
      (company_name, email, phone, website, gst_number,
       address_line1, city, state, country, pincode, extra_data)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *`,
      [
        company_name,
        email || null,
        phone || null,
        website || null,
        gst_number || null,
        address_line1 || null,
        city || null,
        state || null,
        country || null,
        pincode || null,
        extra_data || {}
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
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

    const existing = await pool.query(
      `SELECT * FROM company_settings WHERE id=$1`,
      [id]
    );

    if (!existing.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Company not found"
      });
    }

    const fields = Object.keys(req.body);
    const values = Object.values(req.body);

    const setQuery = fields
      .map((field, index) => `${field}=$${index + 1}`)
      .join(',');

    const result = await pool.query(
      `UPDATE company_settings
       SET ${setQuery}, updated_at=NOW()
       WHERE id=$${fields.length + 1}
       RETURNING *`,
      [...values, id]
    );

    res.json({ success: true, data: result.rows[0] });

  } catch (error) {
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