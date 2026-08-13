const pool = require('../../config/db')
const { distributeReward } = require('../quiz/quiz.controller')

/* ══════════════════════════════════════════════════
   SCRATCH CARDS — ADMIN
══════════════════════════════════════════════════ */

exports.adminListScratchCards = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, parseInt(req.query.limit) || 20)
    const offset = (page - 1) * limit
    const [rows, count] = await Promise.all([
      pool.query(
        `SELECT sc.*,
           (SELECT COUNT(*) FROM scratch_card_claims WHERE scratch_card_id=sc.id) AS claims_count_real
         FROM scratch_cards sc ORDER BY sc.created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      pool.query(`SELECT COUNT(*) FROM scratch_cards`),
    ])
    res.json({ success: true, data: rows.rows, total: Number(count.rows[0].count), page, limit })
  } catch (err) {
    console.error('[adminListScratchCards]', err)
    res.status(500).json({ success: false, message: 'Failed to list scratch cards' })
  }
}

exports.adminCreateScratchCard = async (req, res) => {
  try {
    const {
      title, description, reward_type = 'wallet', reward_value, reward_is_percent = false,
      max_claims = 0, max_claims_per_user = 1, starts_at, expires_at, is_active = true
    } = req.body
    if (!title?.trim()) return res.status(400).json({ success: false, message: 'Title is required' })
    if (!reward_value || Number(reward_value) <= 0)
      return res.status(400).json({ success: false, message: 'Reward value must be > 0' })
    const result = await pool.query(
      `INSERT INTO scratch_cards (title, description, reward_type, reward_value, reward_is_percent,
         max_claims, max_claims_per_user, starts_at, expires_at, is_active, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [title.trim(), description || null, reward_type, Number(reward_value), reward_is_percent,
       max_claims, max_claims_per_user, starts_at || null, expires_at || null, is_active, req.user?.id || null]
    )
    res.status(201).json({ success: true, data: result.rows[0] })
  } catch (err) {
    console.error('[adminCreateScratchCard]', err)
    res.status(500).json({ success: false, message: 'Failed to create scratch card' })
  }
}

exports.adminUpdateScratchCard = async (req, res) => {
  try {
    const { title, description, reward_type, reward_value, reward_is_percent,
            max_claims, max_claims_per_user, starts_at, expires_at, is_active } = req.body
    const r = await pool.query(
      `UPDATE scratch_cards SET
         title=COALESCE($1,title), description=COALESCE($2,description),
         reward_type=COALESCE($3,reward_type), reward_value=COALESCE($4,reward_value),
         reward_is_percent=COALESCE($5,reward_is_percent), max_claims=COALESCE($6,max_claims),
         max_claims_per_user=COALESCE($7,max_claims_per_user),
         starts_at=$8, expires_at=$9, is_active=COALESCE($10,is_active)
       WHERE id=$11 RETURNING *`,
      [title, description, reward_type, reward_value, reward_is_percent,
       max_claims, max_claims_per_user, starts_at || null, expires_at || null, is_active, req.params.id]
    )
    if (!r.rows.length) return res.status(404).json({ success: false, message: 'Scratch card not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update scratch card' })
  }
}

exports.adminDeleteScratchCard = async (req, res) => {
  try {
    await pool.query(`DELETE FROM scratch_cards WHERE id=$1`, [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete scratch card' })
  }
}

/* ══════════════════════════════════════════════════
   SCRATCH CARDS — USER
══════════════════════════════════════════════════ */

exports.getActiveScratchCards = async (req, res) => {
  try {
    const userId = req.user?.id
    const cards = await pool.query(
      `SELECT sc.id, sc.title, sc.description, sc.reward_type, sc.reward_value, sc.reward_is_percent,
              sc.expires_at, sc.max_claims_per_user, sc.max_claims_per_day,
              (SELECT COUNT(*) FROM scratch_card_claims WHERE scratch_card_id=sc.id AND user_id=$1) AS user_claims,
              (SELECT COUNT(*) FROM scratch_card_claims WHERE scratch_card_id=sc.id AND user_id=$1 AND DATE(claimed_at)=CURRENT_DATE) AS user_claims_today
       FROM scratch_cards sc
       WHERE sc.is_active=TRUE
         AND (sc.starts_at IS NULL OR sc.starts_at<=NOW())
         AND (sc.expires_at IS NULL OR sc.expires_at>NOW())
         AND (sc.max_claims=0 OR sc.claims_count<sc.max_claims)
       ORDER BY sc.created_at DESC`,
      [userId]
    )
    res.json({ success: true, data: cards.rows })
  } catch (err) {
    console.error('[getActiveScratchCards]', err)
    res.status(500).json({ success: false, message: 'Failed to fetch scratch cards' })
  }
}

exports.claimScratchCard = async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const userId = req.user?.id
    const cardId = parseInt(req.params.id)

    // Lock and fetch card
    const cardRes = await client.query(
      `SELECT * FROM scratch_cards WHERE id=$1 AND is_active=TRUE
         AND (starts_at IS NULL OR starts_at<=NOW())
         AND (expires_at IS NULL OR expires_at>NOW())
       FOR UPDATE`,
      [cardId]
    )
    if (!cardRes.rows.length) {
      await client.query('ROLLBACK')
      return res.status(404).json({ success: false, message: 'Scratch card not found or expired' })
    }
    const card = cardRes.rows[0]

    // Check total claims cap
    if (card.max_claims > 0 && card.claims_count >= card.max_claims) {
      await client.query('ROLLBACK')
      return res.status(400).json({ success: false, message: 'This scratch card campaign has ended' })
    }

    // Check per-user lifetime limit (0 = unlimited)
    if (card.max_claims_per_user > 0) {
      const userClaims = await client.query(
        `SELECT COUNT(*) FROM scratch_card_claims WHERE scratch_card_id=$1 AND user_id=$2`,
        [cardId, userId]
      )
      if (Number(userClaims.rows[0].count) >= card.max_claims_per_user) {
        await client.query('ROLLBACK')
        return res.status(400).json({ success: false, message: 'You have already claimed this scratch card' })
      }
    }

    // Check per-user daily limit (0 = no daily limit)
    if (card.max_claims_per_day > 0) {
      const todayClaims = await client.query(
        `SELECT COUNT(*) FROM scratch_card_claims WHERE scratch_card_id=$1 AND user_id=$2 AND DATE(claimed_at) = CURRENT_DATE`,
        [cardId, userId]
      )
      if (Number(todayClaims.rows[0].count) >= card.max_claims_per_day) {
        await client.query('ROLLBACK')
        return res.status(400).json({ success: false, message: `You can claim this scratch card ${card.max_claims_per_day} time(s) per day. Come back tomorrow!` })
      }
    }

    // Distribute reward
    const rewardRef = await distributeReward(
      client, userId, card.reward_type, Number(card.reward_value),
      'scratch_card', cardId,
      `Scratch card reward: ${card.title}`
    )

    // Record claim
    await client.query(
      `INSERT INTO scratch_card_claims (scratch_card_id, user_id, reward_type, reward_value, reward_ref)
       VALUES ($1,$2,$3,$4,$5)`,
      [cardId, userId, card.reward_type, card.reward_value, rewardRef]
    )
    await client.query(`UPDATE scratch_cards SET claims_count=claims_count+1 WHERE id=$1`, [cardId])

    await client.query('COMMIT')
    res.json({
      success: true,
      reward: { type: card.reward_type, value: Number(card.reward_value), ref: rewardRef },
      message: card.reward_type === 'coupon'
        ? `🎉 You won a coupon! Code: ${rewardRef}`
        : `🎉 You won ₹${card.reward_value} ${card.reward_type}!`,
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[claimScratchCard]', err)
    res.status(500).json({ success: false, message: 'Failed to claim scratch card' })
  } finally {
    client.release()
  }
}

/* ══════════════════════════════════════════════════
   SPIN WHEEL — ADMIN
══════════════════════════════════════════════════ */

exports.adminListWheels = async (req, res) => {
  try {
    const wheels = await pool.query(
      `SELECT sw.*,
         (SELECT COUNT(*) FROM spin_wheel_plays WHERE wheel_id=sw.id) AS plays_count,
         (SELECT json_agg(s ORDER BY s.sort_order) FROM spin_wheel_segments s WHERE s.wheel_id=sw.id) AS segments
       FROM spin_wheels sw ORDER BY sw.created_at DESC`
    )
    res.json({ success: true, data: wheels.rows })
  } catch (err) {
    console.error('[adminListWheels]', err)
    res.status(500).json({ success: false, message: 'Failed to list wheels' })
  }
}

exports.adminCreateWheel = async (req, res) => {
  try {
    const { title, spins_per_user_per_day = 1, is_active = true, expires_at, segments = [] } = req.body
    if (!title?.trim()) return res.status(400).json({ success: false, message: 'Title required' })
    if (!segments.length) return res.status(400).json({ success: false, message: 'At least one segment required' })

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const wheelRes = await client.query(
        `INSERT INTO spin_wheels (title, spins_per_user_per_day, is_active, expires_at, created_by)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [title.trim(), spins_per_user_per_day, is_active, expires_at || null, req.user?.id || null]
      )
      const wheelId = wheelRes.rows[0].id
      for (let i = 0; i < segments.length; i++) {
        const s = segments[i]
        await client.query(
          `INSERT INTO spin_wheel_segments (wheel_id, label, reward_type, reward_value, probability_weight, color, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [wheelId, s.label, s.reward_type || 'none', s.reward_value || 0, s.probability_weight || 10, s.color || '#3d7a5a', i]
        )
      }
      await client.query('COMMIT')
      res.status(201).json({ success: true, data: wheelRes.rows[0] })
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('[adminCreateWheel]', err)
    res.status(500).json({ success: false, message: 'Failed to create wheel' })
  }
}

exports.adminUpdateWheel = async (req, res) => {
  try {
    const { title, spins_per_user_per_day, is_active, expires_at } = req.body
    const r = await pool.query(
      `UPDATE spin_wheels SET
         title=COALESCE($1,title), spins_per_user_per_day=COALESCE($2,spins_per_user_per_day),
         is_active=COALESCE($3,is_active), expires_at=$4
       WHERE id=$5 RETURNING *`,
      [title, spins_per_user_per_day, is_active, expires_at || null, req.params.id]
    )
    if (!r.rows.length) return res.status(404).json({ success: false, message: 'Wheel not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update wheel' })
  }
}

exports.adminDeleteWheel = async (req, res) => {
  try {
    await pool.query(`DELETE FROM spin_wheels WHERE id=$1`, [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete wheel' })
  }
}

exports.adminUpsertSegment = async (req, res) => {
  try {
    const { wheel_id, label, reward_type = 'none', reward_value = 0, probability_weight = 10, color = '#3d7a5a', sort_order = 0 } = req.body
    const id = req.params.segId
    let r
    if (id) {
      r = await pool.query(
        `UPDATE spin_wheel_segments SET label=$1,reward_type=$2,reward_value=$3,probability_weight=$4,color=$5,sort_order=$6 WHERE id=$7 RETURNING *`,
        [label, reward_type, reward_value, probability_weight, color, sort_order, id]
      )
      if (!r.rows.length) return res.status(404).json({ success: false, message: 'Segment not found' })
    } else {
      r = await pool.query(
        `INSERT INTO spin_wheel_segments (wheel_id,label,reward_type,reward_value,probability_weight,color,sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [wheel_id, label, reward_type, reward_value, probability_weight, color, sort_order]
      )
    }
    res.json({ success: true, data: r.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save segment' })
  }
}

exports.adminDeleteSegment = async (req, res) => {
  try {
    await pool.query(`DELETE FROM spin_wheel_segments WHERE id=$1`, [req.params.segId])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete segment' })
  }
}

/* ══════════════════════════════════════════════════
   SPIN WHEEL — USER
══════════════════════════════════════════════════ */

exports.getActiveWheels = async (req, res) => {
  try {
    const userId = req.user?.id
    const wheels = await pool.query(
      `SELECT sw.id, sw.title, sw.spins_per_user_per_day, sw.expires_at,
              (SELECT json_agg(s ORDER BY s.sort_order) FROM spin_wheel_segments s WHERE s.wheel_id=sw.id) AS segments,
              (SELECT COUNT(*) FROM spin_wheel_plays p
               WHERE p.wheel_id=sw.id AND p.user_id=$1
                 AND DATE(p.played_at)=CURRENT_DATE) AS spins_today
       FROM spin_wheels sw
       WHERE sw.is_active=TRUE AND (sw.expires_at IS NULL OR sw.expires_at>NOW())
       ORDER BY sw.created_at DESC`,
      [userId]
    )
    res.json({ success: true, data: wheels.rows })
  } catch (err) {
    console.error('[getActiveWheels]', err)
    res.status(500).json({ success: false, message: 'Failed to fetch wheels' })
  }
}

exports.spinWheel = async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const userId = req.user?.id
    const wheelId = parseInt(req.params.id)

    const wheelRes = await client.query(
      `SELECT * FROM spin_wheels WHERE id=$1 AND is_active=TRUE AND (expires_at IS NULL OR expires_at>NOW()) FOR UPDATE`,
      [wheelId]
    )
    if (!wheelRes.rows.length) {
      await client.query('ROLLBACK')
      return res.status(404).json({ success: false, message: 'Wheel not found or expired' })
    }
    const wheel = wheelRes.rows[0]

    // Check daily spin limit
    if (wheel.spins_per_user_per_day > 0) {
      const todayPlays = await client.query(
        `SELECT COUNT(*) FROM spin_wheel_plays WHERE wheel_id=$1 AND user_id=$2 AND DATE(played_at)=CURRENT_DATE`,
        [wheelId, userId]
      )
      if (Number(todayPlays.rows[0].count) >= wheel.spins_per_user_per_day) {
        await client.query('ROLLBACK')
        return res.status(400).json({ success: false, message: `You can spin ${wheel.spins_per_user_per_day} time(s) per day. Come back tomorrow!` })
      }
    }

    // Fetch segments and do weighted random selection
    const segsRes = await client.query(
      `SELECT * FROM spin_wheel_segments WHERE wheel_id=$1 ORDER BY sort_order`, [wheelId]
    )
    const segments = segsRes.rows
    if (!segments.length) {
      await client.query('ROLLBACK')
      return res.status(400).json({ success: false, message: 'Wheel has no segments configured' })
    }

    const totalWeight = segments.reduce((s, seg) => s + (seg.probability_weight || 1), 0)
    let rand = Math.random() * totalWeight
    let chosen = segments[segments.length - 1]
    for (const seg of segments) {
      rand -= (seg.probability_weight || 1)
      if (rand <= 0) { chosen = seg; break }
    }

    // Distribute reward
    let rewardRef = null
    if (chosen.reward_type && chosen.reward_type !== 'none' && Number(chosen.reward_value) > 0) {
      rewardRef = await distributeReward(
        client, userId, chosen.reward_type, Number(chosen.reward_value),
        'spin_wheel', wheelId,
        `Spin wheel reward: ${chosen.label} from "${wheel.title}"`
      )
    }

    await client.query(
      `INSERT INTO spin_wheel_plays (wheel_id, user_id, segment_id, segment_label, reward_type, reward_value, reward_given, reward_ref)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [wheelId, userId, chosen.id, chosen.label,
       chosen.reward_type, chosen.reward_value,
       chosen.reward_type !== 'none' && Number(chosen.reward_value) > 0, rewardRef]
    )

    await client.query('COMMIT')
    res.json({
      success: true,
      segment: { id: chosen.id, label: chosen.label, color: chosen.color, sort_order: chosen.sort_order },
      reward: chosen.reward_type !== 'none' && Number(chosen.reward_value) > 0
        ? { type: chosen.reward_type, value: Number(chosen.reward_value), ref: rewardRef }
        : null,
      message: chosen.reward_type === 'none' || !Number(chosen.reward_value)
        ? `Better luck next time! You landed on "${chosen.label}"`
        : chosen.reward_type === 'coupon'
          ? `🎉 You won a coupon! Code: ${rewardRef}`
          : `🎉 You won ${chosen.label}! ₹${chosen.reward_value} added to your ${chosen.reward_type}.`,
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[spinWheel]', err)
    res.status(500).json({ success: false, message: 'Failed to spin' })
  } finally {
    client.release()
  }
}

exports.getUserGameHistory = async (req, res) => {
  try {
    const userId = req.user?.id
    const [scratchHistory, spinHistory] = await Promise.all([
      pool.query(
        `SELECT c.*, sc.title AS card_title FROM scratch_card_claims c
         JOIN scratch_cards sc ON sc.id=c.scratch_card_id
         WHERE c.user_id=$1 ORDER BY c.claimed_at DESC LIMIT 20`,
        [userId]
      ),
      pool.query(
        `SELECT p.*, sw.title AS wheel_title FROM spin_wheel_plays p
         JOIN spin_wheels sw ON sw.id=p.wheel_id
         WHERE p.user_id=$1 ORDER BY p.played_at DESC LIMIT 20`,
        [userId]
      ),
    ])
    res.json({ success: true, scratch: scratchHistory.rows, spins: spinHistory.rows })
  } catch (err) {
    console.error('[getUserGameHistory]', err)
    res.status(500).json({ success: false, message: 'Failed to fetch history' })
  }
}
