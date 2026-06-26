const pool = require('../../config/db')

async function resolveProductId(idOrSlug) {
  if (/^\d+$/.test(String(idOrSlug))) return Number(idOrSlug)
  const r = await pool.query('SELECT id FROM products WHERE slug=$1 LIMIT 1', [idOrSlug])
  return r.rows[0]?.id || null
}

/* ─── PUBLIC: get approved Q&A for a product ─── */
exports.getProductQA = async (req, res) => {
  try {
    const productId = await resolveProductId(req.params.productId)
    if (!productId) return res.json({ questions: [], total: 0 })
    const { page = 1, limit = 10 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const qRes = await pool.query(
      `SELECT pq.*,
        JSON_AGG(
          JSON_BUILD_OBJECT('id', pa.id, 'answer', pa.answer, 'user_name', pa.user_name, 'is_admin', pa.is_admin, 'created_at', pa.created_at)
          ORDER BY pa.is_admin DESC, pa.created_at ASC
        ) FILTER (WHERE pa.id IS NOT NULL) AS answers
       FROM product_questions pq
       LEFT JOIN product_answers pa ON pa.question_id = pq.id
       WHERE pq.product_id = $1 AND pq.status = 'approved'
       GROUP BY pq.id
       ORDER BY pq.created_at DESC
       LIMIT $2 OFFSET $3`,
      [productId, limit, offset]
    )

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM product_questions WHERE product_id=$1 AND status='approved'`,
      [productId]
    )

    res.json({ questions: qRes.rows, total: Number(countRes.rows[0].count) })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

/* ─── USER: ask a question ─── */
exports.askQuestion = async (req, res) => {
  try {
    const productId = await resolveProductId(req.params.productId)
    if (!productId) return res.status(404).json({ message: 'Product not found' })
    const { question } = req.body
    const userId = req.user?.id
    const userName = req.user?.name || 'Anonymous'

    if (!question?.trim()) return res.status(400).json({ message: 'Question is required' })

    const r = await pool.query(
      `INSERT INTO product_questions (product_id, user_id, user_name, question) VALUES ($1,$2,$3,$4) RETURNING *`,
      [productId, userId || null, userName, question.trim()]
    )
    res.status(201).json({ success: true, question: r.rows[0] })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

/* ─── USER/ADMIN: answer a question ─── */
exports.answerQuestion = async (req, res) => {
  try {
    const { questionId } = req.params
    const { answer } = req.body
    const isAdmin = req.user?.role <= 2

    if (!answer?.trim()) return res.status(400).json({ message: 'Answer is required' })

    const r = await pool.query(
      `INSERT INTO product_answers (question_id, user_id, user_name, is_admin, answer)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [questionId, req.user.id, req.user.name, isAdmin, answer.trim()]
    )
    res.status(201).json({ success: true, answer: r.rows[0] })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

/* ─── ADMIN: list all questions (pending + approved) ─── */
exports.adminListQuestions = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const r = await pool.query(
      `SELECT pq.*, p.name AS product_name,
        (SELECT COUNT(*) FROM product_answers WHERE question_id = pq.id) AS answer_count
       FROM product_questions pq
       JOIN products p ON p.id = pq.product_id
       WHERE pq.status = $1
       ORDER BY pq.created_at DESC
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    )
    const countRes = await pool.query(`SELECT COUNT(*) FROM product_questions WHERE status=$1`, [status])
    res.json({ questions: r.rows, total: Number(countRes.rows[0].count) })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

/* ─── ADMIN: approve/reject question ─── */
exports.adminUpdateQuestion = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    await pool.query(`UPDATE product_questions SET status=$1 WHERE id=$2`, [status, id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

/* ─── ADMIN: delete question ─── */
exports.adminDeleteQuestion = async (req, res) => {
  try {
    await pool.query('DELETE FROM product_questions WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}
