const pool = require('../../config/db')

/* ── PUBLIC: get all active FAQs grouped by category ── */
exports.getPublic = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, question, answer, category, sort_order
       FROM faqs
       WHERE is_active = TRUE
       ORDER BY category, sort_order ASC, id ASC`
    )
    // Group by category
    const grouped = {}
    for (const row of rows) {
      const cat = row.category || 'General'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push({ id: row.id, question: row.question, answer: row.answer })
    }
    res.json({ success: true, faqs: grouped })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/* ── ADMIN: list all FAQs (flat, including inactive) ── */
exports.adminList = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM faqs ORDER BY category, sort_order ASC, id ASC`
    )
    res.json({ success: true, faqs: rows })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/* ── ADMIN: create FAQ ── */
exports.create = async (req, res) => {
  try {
    const { question, answer, category = 'General', sort_order = 0, is_active = true } = req.body
    if (!question?.trim() || !answer?.trim()) {
      return res.status(400).json({ success: false, message: 'Question and answer required' })
    }
    const { rows } = await pool.query(
      `INSERT INTO faqs (question, answer, category, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [question.trim(), answer.trim(), category.trim(), Number(sort_order), Boolean(is_active)]
    )
    res.status(201).json({ success: true, faq: rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/* ── ADMIN: update FAQ ── */
exports.update = async (req, res) => {
  try {
    const { id } = req.params
    const { question, answer, category, sort_order, is_active } = req.body
    const { rows } = await pool.query(
      `UPDATE faqs
       SET question = COALESCE($1, question),
           answer   = COALESCE($2, answer),
           category = COALESCE($3, category),
           sort_order = COALESCE($4, sort_order),
           is_active  = COALESCE($5, is_active),
           updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [
        question?.trim() || null,
        answer?.trim() || null,
        category?.trim() || null,
        sort_order != null ? Number(sort_order) : null,
        is_active != null ? Boolean(is_active) : null,
        id
      ]
    )
    if (!rows.length) return res.status(404).json({ success: false, message: 'FAQ not found' })
    res.json({ success: true, faq: rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/* ── ADMIN: delete FAQ ── */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params
    const { rowCount } = await pool.query('DELETE FROM faqs WHERE id=$1', [id])
    if (!rowCount) return res.status(404).json({ success: false, message: 'FAQ not found' })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
