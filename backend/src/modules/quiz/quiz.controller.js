const pool = require('../../config/db')
const crypto = require('crypto')

/* ─── Shared reward distributor ─────────────────────────────────────── */
async function distributeReward(client, userId, rewardType, rewardValue, sourceType, sourceId, description) {
  let rewardRef = null
  if (rewardType === 'wallet' && rewardValue > 0) {
    await client.query(`UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`, [rewardValue, userId])
    await client.query(
      `INSERT INTO wallet_transactions (user_id, amount, type, source, description) VALUES ($1,$2,'credit',$3,$4)`,
      [userId, rewardValue, sourceType, description]
    )
  } else if (rewardType === 'points' && rewardValue > 0) {
    await client.query(`UPDATE users SET loyalty_points_balance = loyalty_points_balance + $1 WHERE id = $2`, [rewardValue, userId])
    await client.query(
      `INSERT INTO loyalty_transactions (user_id, type, points, description) VALUES ($1,'earn',$2,$3)`,
      [userId, rewardValue, description]
    )
  } else if (rewardType === 'coupon' && rewardValue > 0) {
    rewardRef = 'RWD' + crypto.randomBytes(3).toString('hex').toUpperCase()
    await client.query(
      `INSERT INTO coupons (code, type, value, is_active, valid_to, usage_limit, usage_per_user)
       VALUES ($1, 'flat', $2, TRUE, NOW() + INTERVAL '30 days', 1, 1)`,
      [rewardRef, rewardValue]
    )
  }
  // Always write to reward audit log
  if (rewardType !== 'none' && rewardValue > 0) {
    await client.query(
      `INSERT INTO reward_logs (user_id, source_type, source_id, reward_type, reward_value, reward_ref, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [userId, sourceType, sourceId, rewardType, rewardValue, rewardRef, description]
    )
  }
  return rewardRef
}

/* ══════════════════════════════════════════════════════════
   STATIC DOSHA QUIZ (legacy — unchanged)
══════════════════════════════════════════════════════════ */

const QUESTIONS = [
  { q: 'My body frame is:', options: ['Slim or tall, light build', 'Medium, muscular build', 'Large, broad, or heavy build'] },
  { q: 'My skin tends to be:', options: ['Dry, rough, or flaky', 'Warm, oily, or prone to redness', 'Moist, smooth, and cool'] },
  { q: 'My appetite is:', options: ['Variable — sometimes hungry, sometimes not', 'Strong — I get irritable when hungry', 'Steady — I can skip meals easily'] },
  { q: 'My sleep is:', options: ['Light and easily disturbed', 'Moderate — I fall asleep quickly but sleep lightly', 'Deep and long — hard to wake up'] },
  { q: 'My memory is:', options: ['Quick to learn, quick to forget', 'Sharp and precise', 'Slow to learn but long-lasting'] },
  { q: 'My digestion is:', options: ['Irregular — gas, bloating, or constipation', 'Fast — strong but prone to acidity', 'Slow — heavy feeling after meals'] },
  { q: 'My energy levels are:', options: ['Bursts of energy followed by fatigue', 'Sustained, intense, and driven', 'Steady and enduring but slow to start'] },
  { q: 'Under stress I tend to be:', options: ['Anxious, worried, or fearful', 'Angry, irritable, or critical', 'Withdrawn, lethargic, or avoidant'] },
  { q: 'My weather preference is:', options: ['I prefer warm weather', 'I prefer cool weather', 'I dislike cold, damp weather'] },
  { q: 'My natural temperament is:', options: ['Creative, enthusiastic, quick-thinking', 'Focused, ambitious, perfectionistic', 'Calm, patient, nurturing'] },
]

const DOSHA_INFO = {
  Vata: {
    description: 'You are predominantly Vata — the energy of movement and creativity. Vata types are lively, enthusiastic, and imaginative, but may experience anxiety, irregular digestion, and variable energy.',
    tips: ['Eat warm, cooked, nourishing foods', 'Maintain a consistent daily routine', 'Favor grounding oils like sesame and almond', 'Avoid cold, raw foods and excessive stimulation', 'Practice calming yoga and meditation'],
    categories: ['Digestive Health', 'Stress & Sleep', 'Immunity'],
    color: '#7c3aed', emoji: '🌬️',
  },
  Pitta: {
    description: 'You are predominantly Pitta — the energy of transformation and metabolism. Pitta types are sharp, driven, and intelligent, but may be prone to inflammation, irritability, and excess heat.',
    tips: ['Eat cooling, hydrating foods — cucumbers, coconut, mint', 'Avoid spicy, oily, and fermented foods', 'Practice cooling pranayama like Sheetali', 'Spend time in nature and avoid overworking', 'Use cooling oils like coconut and neem'],
    categories: ['Skin Care', 'Digestive Health', 'Stress & Sleep'],
    color: '#dc2626', emoji: '🔥',
  },
  Kapha: {
    description: 'You are predominantly Kapha — the energy of stability and nourishment. Kapha types are calm, loving, and grounded, but may struggle with weight gain, lethargy, and congestion.',
    tips: ['Eat light, warm, and spicy foods', 'Exercise regularly — vigorous activity is beneficial', 'Avoid heavy, cold, and oily foods', 'Rise early and avoid daytime sleeping', 'Use warming herbs like ginger, black pepper, and turmeric'],
    categories: ['Weight Management', 'Immunity', 'Energy & Vitality'],
    color: '#059669', emoji: '🌊',
  },
}

exports.getQuestions = (req, res) => res.json({ success: true, questions: QUESTIONS })

exports.getDoshaProducts = async (req, res) => {
  try {
    const { dosha } = req.params
    const info = DOSHA_INFO[dosha]
    if (!info) return res.status(400).json({ success: false, message: 'Invalid dosha' })
    const cats = info.categories
    const result = await pool.query(
      `SELECT id, name, slug, price, compareprice, images, averagerating, reviewcount, inventory, category_name, is_returnable, return_window_days
       FROM products WHERE is_active=TRUE AND inventory>0
         AND category_name ILIKE ANY(ARRAY[${cats.map((_, i) => `$${i + 1}`).join(',')}])
       ORDER BY is_bestseller DESC, averagerating DESC, reviewcount DESC LIMIT 12`,
      cats.map(c => `%${c}%`)
    )
    if (!result.rows.length) {
      const fallback = await pool.query(
        `SELECT id, name, slug, price, compareprice, images, averagerating, reviewcount, inventory, category_name FROM products WHERE is_active=TRUE AND inventory>0 ORDER BY is_bestseller DESC, averagerating DESC LIMIT 8`
      )
      return res.json({ success: true, products: fallback.rows, dosha, categories: cats })
    }
    res.json({ success: true, products: result.rows, dosha, categories: cats })
  } catch (err) {
    console.error('[DOSHA PRODUCTS]', err)
    res.status(500).json({ success: false, message: 'Failed to fetch recommendations' })
  }
}

exports.submitResult = async (req, res) => {
  try {
    const { answers, sessionId } = req.body
    if (!Array.isArray(answers) || answers.length !== QUESTIONS.length)
      return res.status(400).json({ success: false, message: 'Please answer all questions' })
    let vata = 0, pitta = 0, kapha = 0
    for (const a of answers) { if (a === 0) vata++; else if (a === 1) pitta++; else kapha++ }
    const dosha = vata >= pitta && vata >= kapha ? 'Vata' : pitta >= kapha ? 'Pitta' : 'Kapha'
    const userId = req.user?.id || null
    await pool.query(
      `INSERT INTO quiz_results (user_id, session_id, dosha, vata_score, pitta_score, kapha_score, answers) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [userId, sessionId || null, dosha, vata, pitta, kapha, JSON.stringify(answers)]
    )
    res.json({ success: true, dosha, vataScore: vata, pittaScore: pitta, kaphaScore: kapha, ...DOSHA_INFO[dosha] })
  } catch (err) {
    console.error('[QUIZ RESULT]', err)
    res.status(500).json({ success: false, message: 'Failed to save quiz result' })
  }
}

/* ══════════════════════════════════════════════════════════
   DYNAMIC QUIZ — ADMIN CRUD
══════════════════════════════════════════════════════════ */

exports.adminListQuizzes = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, parseInt(req.query.limit) || 20)
    const offset = (page - 1) * limit
    const [rows, count] = await Promise.all([
      pool.query(
        `SELECT q.*, u.name AS created_by_name,
           (SELECT COUNT(*) FROM user_quiz_attempts a WHERE a.quiz_id=q.id) AS attempts_count,
           (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id=q.id) AS questions_count
         FROM quizzes q LEFT JOIN users u ON u.id=q.created_by
         ORDER BY q.created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      pool.query(`SELECT COUNT(*) FROM quizzes`),
    ])
    res.json({ success: true, data: rows.rows, total: Number(count.rows[0].count), page, limit })
  } catch (err) {
    console.error('[adminListQuizzes]', err)
    res.status(500).json({ success: false, message: 'Failed to list quizzes' })
  }
}

exports.adminGetQuiz = async (req, res) => {
  try {
    const quiz = await pool.query(`SELECT * FROM quizzes WHERE id=$1`, [req.params.id])
    if (!quiz.rows.length) return res.status(404).json({ success: false, message: 'Quiz not found' })
    const questions = await pool.query(
      `SELECT qq.*, json_agg(qo ORDER BY qo.sort_order) AS options
       FROM quiz_questions qq
       LEFT JOIN quiz_options qo ON qo.question_id=qq.id
       WHERE qq.quiz_id=$1 GROUP BY qq.id ORDER BY qq.sort_order`,
      [req.params.id]
    )
    res.json({ success: true, data: { ...quiz.rows[0], questions: questions.rows } })
  } catch (err) {
    console.error('[adminGetQuiz]', err)
    res.status(500).json({ success: false, message: 'Failed to get quiz' })
  }
}

exports.adminCreateQuiz = async (req, res) => {
  try {
    const {
      title, description, type = 'scored',
      starts_at, expires_at, max_attempts_per_user = 1, pass_score = 0,
      reward_type = 'none', reward_value = 0, reward_is_percent = false, reward_max_claims = 0,
      is_active = true
    } = req.body
    if (!title?.trim()) return res.status(400).json({ success: false, message: 'Title is required' })
    const result = await pool.query(
      `INSERT INTO quizzes (title, description, type, starts_at, expires_at, max_attempts_per_user, pass_score,
         reward_type, reward_value, reward_is_percent, reward_max_claims, is_active, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [title.trim(), description || null, type, starts_at || null, expires_at || null,
       max_attempts_per_user, pass_score, reward_type, reward_value, reward_is_percent,
       reward_max_claims, is_active, req.user?.id || null]
    )
    res.status(201).json({ success: true, data: result.rows[0] })
  } catch (err) {
    console.error('[adminCreateQuiz]', err)
    res.status(500).json({ success: false, message: 'Failed to create quiz' })
  }
}

exports.adminUpdateQuiz = async (req, res) => {
  try {
    const {
      title, description, type, starts_at, expires_at,
      max_attempts_per_user, pass_score, reward_type, reward_value,
      reward_is_percent, reward_max_claims, is_active
    } = req.body
    const result = await pool.query(
      `UPDATE quizzes SET
         title=COALESCE($1,title), description=COALESCE($2,description), type=COALESCE($3,type),
         starts_at=$4, expires_at=$5,
         max_attempts_per_user=COALESCE($6,max_attempts_per_user),
         pass_score=COALESCE($7,pass_score),
         reward_type=COALESCE($8,reward_type), reward_value=COALESCE($9,reward_value),
         reward_is_percent=COALESCE($10,reward_is_percent),
         reward_max_claims=COALESCE($11,reward_max_claims),
         is_active=COALESCE($12,is_active), updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [title, description, type, starts_at || null, expires_at || null,
       max_attempts_per_user, pass_score, reward_type, reward_value,
       reward_is_percent, reward_max_claims, is_active, req.params.id]
    )
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Quiz not found' })
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    console.error('[adminUpdateQuiz]', err)
    res.status(500).json({ success: false, message: 'Failed to update quiz' })
  }
}

exports.adminDeleteQuiz = async (req, res) => {
  try {
    await pool.query(`DELETE FROM quizzes WHERE id=$1`, [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete quiz' })
  }
}

/* ── Questions ── */
exports.adminAddQuestion = async (req, res) => {
  try {
    const { quiz_id, question_text, sort_order = 0 } = req.body
    if (!quiz_id || !question_text?.trim())
      return res.status(400).json({ success: false, message: 'quiz_id and question_text required' })
    const result = await pool.query(
      `INSERT INTO quiz_questions (quiz_id, question_text, sort_order) VALUES ($1,$2,$3) RETURNING *`,
      [quiz_id, question_text.trim(), sort_order]
    )
    res.status(201).json({ success: true, data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add question' })
  }
}

exports.adminUpdateQuestion = async (req, res) => {
  try {
    const { question_text, sort_order } = req.body
    const r = await pool.query(
      `UPDATE quiz_questions SET question_text=COALESCE($1,question_text), sort_order=COALESCE($2,sort_order) WHERE id=$3 RETURNING *`,
      [question_text, sort_order, req.params.id]
    )
    if (!r.rows.length) return res.status(404).json({ success: false, message: 'Question not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update question' })
  }
}

exports.adminDeleteQuestion = async (req, res) => {
  try {
    await pool.query(`DELETE FROM quiz_questions WHERE id=$1`, [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete question' })
  }
}

/* ── Options ── */
exports.adminAddOption = async (req, res) => {
  try {
    const { question_id, option_text, is_correct = false, points = 1, sort_order = 0 } = req.body
    if (!question_id || !option_text?.trim())
      return res.status(400).json({ success: false, message: 'question_id and option_text required' })
    const result = await pool.query(
      `INSERT INTO quiz_options (question_id, option_text, is_correct, points, sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [question_id, option_text.trim(), is_correct, points, sort_order]
    )
    res.status(201).json({ success: true, data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add option' })
  }
}

exports.adminUpdateOption = async (req, res) => {
  try {
    const { option_text, is_correct, points, sort_order } = req.body
    const r = await pool.query(
      `UPDATE quiz_options SET
         option_text=COALESCE($1,option_text), is_correct=COALESCE($2,is_correct),
         points=COALESCE($3,points), sort_order=COALESCE($4,sort_order)
       WHERE id=$5 RETURNING *`,
      [option_text, is_correct, points, sort_order, req.params.id]
    )
    if (!r.rows.length) return res.status(404).json({ success: false, message: 'Option not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update option' })
  }
}

exports.adminDeleteOption = async (req, res) => {
  try {
    await pool.query(`DELETE FROM quiz_options WHERE id=$1`, [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete option' })
  }
}

exports.adminGetAttempts = async (req, res) => {
  try {
    const quizId = req.params.id
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, parseInt(req.query.limit) || 20)
    const offset = (page - 1) * limit
    const [rows, count, stats] = await Promise.all([
      pool.query(
        `SELECT a.*, u.name AS user_name, u.email AS user_email
         FROM user_quiz_attempts a LEFT JOIN users u ON u.id=a.user_id
         WHERE a.quiz_id=$1 ORDER BY a.completed_at DESC LIMIT $2 OFFSET $3`,
        [quizId, limit, offset]
      ),
      pool.query(`SELECT COUNT(*) FROM user_quiz_attempts WHERE quiz_id=$1`, [quizId]),
      pool.query(
        `SELECT AVG(score) AS avg_score, MAX(score) AS max_score, MIN(score) AS min_score,
                COUNT(*) FILTER(WHERE passed=TRUE) AS passed_count,
                COUNT(*) FILTER(WHERE reward_given=TRUE) AS rewarded_count
         FROM user_quiz_attempts WHERE quiz_id=$1`,
        [quizId]
      ),
    ])
    res.json({ success: true, data: rows.rows, total: Number(count.rows[0].count), page, limit, stats: stats.rows[0] })
  } catch (err) {
    console.error('[adminGetAttempts]', err)
    res.status(500).json({ success: false, message: 'Failed to get attempts' })
  }
}

/* ══════════════════════════════════════════════════════════
   DYNAMIC QUIZ — USER PLAY
══════════════════════════════════════════════════════════ */

exports.getActiveQuizzes = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, description, type, expires_at, reward_type, reward_value, reward_is_percent,
              (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id=quizzes.id) AS questions_count,
              (SELECT COUNT(*) FROM user_quiz_attempts WHERE quiz_id=quizzes.id) AS total_attempts
       FROM quizzes
       WHERE is_active=TRUE
         AND (starts_at IS NULL OR starts_at <= NOW())
         AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY created_at DESC`
    )
    res.json({ success: true, data: result.rows })
  } catch (err) {
    console.error('[getActiveQuizzes]', err)
    res.status(500).json({ success: false, message: 'Failed to fetch quizzes' })
  }
}

exports.getQuizForPlay = async (req, res) => {
  try {
    const quizId = req.params.id
    const quiz = await pool.query(
      `SELECT id, title, description, type, expires_at, reward_type, reward_value, reward_is_percent, max_attempts_per_user
       FROM quizzes WHERE id=$1 AND is_active=TRUE
         AND (starts_at IS NULL OR starts_at <= NOW())
         AND (expires_at IS NULL OR expires_at > NOW())`,
      [quizId]
    )
    if (!quiz.rows.length) return res.status(404).json({ success: false, message: 'Quiz not found or has expired' })

    const questions = await pool.query(
      `SELECT qq.id, qq.question_text, qq.sort_order,
              json_agg(json_build_object('id',qo.id,'text',qo.option_text,'sort_order',qo.sort_order) ORDER BY qo.sort_order) AS options
       FROM quiz_questions qq
       JOIN quiz_options qo ON qo.question_id=qq.id
       WHERE qq.quiz_id=$1 GROUP BY qq.id ORDER BY qq.sort_order`,
      [quizId]
    )

    // Check attempt count for logged-in users
    let attempts_used = 0
    if (req.user?.id) {
      const ac = await pool.query(
        `SELECT COUNT(*) FROM user_quiz_attempts WHERE quiz_id=$1 AND user_id=$2`,
        [quizId, req.user.id]
      )
      attempts_used = Number(ac.rows[0].count)
    }

    res.json({ success: true, data: { ...quiz.rows[0], questions: questions.rows, attempts_used } })
  } catch (err) {
    console.error('[getQuizForPlay]', err)
    res.status(500).json({ success: false, message: 'Failed to load quiz' })
  }
}

exports.submitDynamicQuiz = async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const quizId = parseInt(req.params.id)
    const userId = req.user?.id || null
    const { answers, sessionId } = req.body // answers: [{ question_id, option_id }]

    if (!Array.isArray(answers) || !answers.length)
      return res.status(400).json({ success: false, message: 'Answers required' })

    // Load quiz — FOR UPDATE prevents concurrent submissions from both passing attempt limit
    const quizRes = await client.query(
      `SELECT * FROM quizzes WHERE id=$1 AND is_active=TRUE
         AND (starts_at IS NULL OR starts_at<=NOW()) AND (expires_at IS NULL OR expires_at>NOW())
         FOR UPDATE`,
      [quizId]
    )
    if (!quizRes.rows.length) {
      await client.query('ROLLBACK')
      return res.status(404).json({ success: false, message: 'Quiz not found or expired' })
    }
    const quiz = quizRes.rows[0]

    // Enforce lifetime attempt limit for logged-in users
    if (userId && quiz.max_attempts_per_user > 0) {
      const ac = await client.query(
        `SELECT COUNT(*) FROM user_quiz_attempts WHERE quiz_id=$1 AND user_id=$2`,
        [quizId, userId]
      )
      if (Number(ac.rows[0].count) >= quiz.max_attempts_per_user) {
        await client.query('ROLLBACK')
        return res.status(400).json({ success: false, message: 'You have used all your attempts for this quiz' })
      }
    }

    // Enforce daily attempt limit (0 = no daily limit)
    if (userId && quiz.max_attempts_per_day > 0) {
      const dc = await client.query(
        `SELECT COUNT(*) FROM user_quiz_attempts WHERE quiz_id=$1 AND user_id=$2 AND DATE(completed_at) = CURRENT_DATE`,
        [quizId, userId]
      )
      if (Number(dc.rows[0].count) >= quiz.max_attempts_per_day) {
        await client.query('ROLLBACK')
        return res.status(400).json({ success: false, message: `You can attempt this quiz ${quiz.max_attempts_per_day} time(s) per day. Come back tomorrow!` })
      }
    }

    // Score
    let score = 0, totalPossible = 0
    for (const { question_id, option_id } of answers) {
      const opts = await client.query(
        `SELECT is_correct, points FROM quiz_options WHERE id=$1 AND question_id=$2`,
        [option_id, question_id]
      )
      if (opts.rows.length) {
        const maxPts = await client.query(
          `SELECT MAX(points) AS mp FROM quiz_options WHERE question_id=$1`, [question_id]
        )
        totalPossible += Number(maxPts.rows[0]?.mp || 1)
        if (opts.rows[0].is_correct) score += Number(opts.rows[0].points)
      }
    }

    const passed = score >= quiz.pass_score
    let rewardGiven = false
    let rewardRef = null
    const rewardType = quiz.reward_type
    const rewardValue = Number(quiz.reward_value)

    // Give reward if: passed AND reward_type != 'none' AND reward_max_claims not exhausted
    if (passed && userId && rewardType && rewardType !== 'none' && rewardValue > 0) {
      const claimsOk = quiz.reward_max_claims === 0 || quiz.reward_claims_count < quiz.reward_max_claims
      if (claimsOk) {
        rewardRef = await distributeReward(
          client, userId, rewardType, rewardValue,
          'quiz', quizId,
          `Reward for passing quiz "${quiz.title}" with score ${score}/${totalPossible}`
        )
        await client.query(`UPDATE quizzes SET reward_claims_count=reward_claims_count+1 WHERE id=$1`, [quizId])
        rewardGiven = true
      }
    }

    // Save attempt
    await client.query(
      `INSERT INTO user_quiz_attempts
         (quiz_id, user_id, session_id, score, total_possible, answers, passed, reward_type, reward_value, reward_given, reward_ref)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [quizId, userId, sessionId || null, score, totalPossible,
       JSON.stringify(answers), passed, rewardType, rewardValue, rewardGiven, rewardRef]
    )

    await client.query('COMMIT')
    res.json({
      success: true,
      score, totalPossible, passed,
      reward: rewardGiven ? { type: rewardType, value: rewardValue, ref: rewardRef } : null,
      message: passed
        ? `🎉 You scored ${score}/${totalPossible}!${rewardGiven ? ` Your reward: ${rewardType === 'coupon' ? `Coupon ${rewardRef}` : `₹${rewardValue} ${rewardType}`}` : ''}`
        : `You scored ${score}/${totalPossible}. You needed ${quiz.pass_score} to win a reward.`,
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[submitDynamicQuiz]', err)
    res.status(500).json({ success: false, message: 'Failed to submit quiz' })
  } finally {
    client.release()
  }
}

/* ── Admin: reward logs ── */
exports.adminGetRewardLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, parseInt(req.query.limit) || 30)
    const offset = (page - 1) * limit
    const source = req.query.source_type || null
    const mainWhere = source ? `WHERE r.source_type=$3` : ''
    const countWhere = source ? `WHERE source_type=$1` : ''
    const params = source ? [limit, offset, source] : [limit, offset]
    const [rows, count] = await Promise.all([
      pool.query(
        `SELECT r.*, u.name AS user_name, u.email AS user_email
         FROM reward_logs r LEFT JOIN users u ON u.id=r.user_id
         ${mainWhere} ORDER BY r.created_at DESC LIMIT $1 OFFSET $2`,
        params
      ),
      pool.query(`SELECT COUNT(*) FROM reward_logs ${countWhere}`, source ? [source] : []),
    ])
    res.json({ success: true, data: rows.rows, total: Number(count.rows[0].count), page, limit })
  } catch (err) {
    console.error('[adminGetRewardLogs]', err)
    res.status(500).json({ success: false, message: 'Failed to fetch reward logs' })
  }
}

module.exports = { ...exports, distributeReward }
