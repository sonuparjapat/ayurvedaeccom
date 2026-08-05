const pool = require('../../config/db')

// 10 questions, each option: 0=Vata, 1=Pitta, 2=Kapha
const QUESTIONS = [
  {
    q: 'My body frame is:',
    options: ['Slim or tall, light build', 'Medium, muscular build', 'Large, broad, or heavy build'],
  },
  {
    q: 'My skin tends to be:',
    options: ['Dry, rough, or flaky', 'Warm, oily, or prone to redness', 'Moist, smooth, and cool'],
  },
  {
    q: 'My appetite is:',
    options: ['Variable — sometimes hungry, sometimes not', 'Strong — I get irritable when hungry', 'Steady — I can skip meals easily'],
  },
  {
    q: 'My sleep is:',
    options: ['Light and easily disturbed', 'Moderate — I fall asleep quickly but sleep lightly', 'Deep and long — hard to wake up'],
  },
  {
    q: 'My memory is:',
    options: ['Quick to learn, quick to forget', 'Sharp and precise', 'Slow to learn but long-lasting'],
  },
  {
    q: 'My digestion is:',
    options: ['Irregular — gas, bloating, or constipation', 'Fast — strong but prone to acidity', 'Slow — heavy feeling after meals'],
  },
  {
    q: 'My energy levels are:',
    options: ['Bursts of energy followed by fatigue', 'Sustained, intense, and driven', 'Steady and enduring but slow to start'],
  },
  {
    q: 'Under stress I tend to be:',
    options: ['Anxious, worried, or fearful', 'Angry, irritable, or critical', 'Withdrawn, lethargic, or avoidant'],
  },
  {
    q: 'My weather preference is:',
    options: ['I prefer warm weather', 'I prefer cool weather', 'I dislike cold, damp weather'],
  },
  {
    q: 'My natural temperament is:',
    options: ['Creative, enthusiastic, quick-thinking', 'Focused, ambitious, perfectionistic', 'Calm, patient, nurturing'],
  },
]

const DOSHA_INFO = {
  Vata: {
    description: 'You are predominantly Vata — the energy of movement and creativity. Vata types are lively, enthusiastic, and imaginative, but may experience anxiety, irregular digestion, and variable energy.',
    tips: [
      'Eat warm, cooked, nourishing foods',
      'Maintain a consistent daily routine',
      'Favor grounding oils like sesame and almond',
      'Avoid cold, raw foods and excessive stimulation',
      'Practice calming yoga and meditation',
    ],
    categories: ['Digestive Health', 'Stress & Sleep', 'Immunity'],
    color: '#7c3aed',
    emoji: '🌬️',
  },
  Pitta: {
    description: 'You are predominantly Pitta — the energy of transformation and metabolism. Pitta types are sharp, driven, and intelligent, but may be prone to inflammation, irritability, and excess heat.',
    tips: [
      'Eat cooling, hydrating foods — cucumbers, coconut, mint',
      'Avoid spicy, oily, and fermented foods',
      'Practice cooling pranayama like Sheetali',
      'Spend time in nature and avoid overworking',
      'Use cooling oils like coconut and neem',
    ],
    categories: ['Skin Care', 'Digestive Health', 'Stress & Sleep'],
    color: '#dc2626',
    emoji: '🔥',
  },
  Kapha: {
    description: 'You are predominantly Kapha — the energy of stability and nourishment. Kapha types are calm, loving, and grounded, but may struggle with weight gain, lethargy, and congestion.',
    tips: [
      'Eat light, warm, and spicy foods',
      'Exercise regularly — vigorous activity is beneficial',
      'Avoid heavy, cold, and oily foods',
      'Rise early and avoid daytime sleeping',
      'Use warming herbs like ginger, black pepper, and turmeric',
    ],
    categories: ['Weight Management', 'Immunity', 'Energy & Vitality'],
    color: '#059669',
    emoji: '🌊',
  },
}

exports.getQuestions = (req, res) => {
  res.json({ success: true, questions: QUESTIONS })
}

exports.getDoshaProducts = async (req, res) => {
  try {
    const { dosha } = req.params
    const info = DOSHA_INFO[dosha]
    if (!info) return res.status(400).json({ success: false, message: 'Invalid dosha' })

    // Search products whose category_name matches any of the dosha's recommended categories
    const cats = info.categories
    const placeholders = cats.map((_, i) => `$${i + 1}`).join(',')
    const result = await pool.query(
      `SELECT id, name, slug, price, compareprice, images, averagerating, reviewcount, inventory,
              category_name, is_returnable, return_window_days
       FROM products
       WHERE is_active = TRUE AND inventory > 0
         AND category_name ILIKE ANY(ARRAY[${cats.map((_, i) => `$${i + 1}`).join(',')}])
       ORDER BY is_bestseller DESC, averagerating DESC, reviewcount DESC
       LIMIT 12`,
      cats.map(c => `%${c}%`)
    )

    // Fallback: if no category match, return top-rated products
    if (!result.rows.length) {
      const fallback = await pool.query(
        `SELECT id, name, slug, price, compareprice, images, averagerating, reviewcount, inventory,
                category_name, is_returnable, return_window_days
         FROM products WHERE is_active = TRUE AND inventory > 0
         ORDER BY is_bestseller DESC, averagerating DESC LIMIT 8`
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
    if (!Array.isArray(answers) || answers.length !== QUESTIONS.length) {
      return res.status(400).json({ success: false, message: 'Please answer all questions' })
    }

    let vata = 0, pitta = 0, kapha = 0
    for (const a of answers) {
      if (a === 0) vata++
      else if (a === 1) pitta++
      else if (a === 2) kapha++
    }

    const dosha = vata >= pitta && vata >= kapha ? 'Vata' : pitta >= kapha ? 'Pitta' : 'Kapha'
    const userId = req.user?.id || null

    await pool.query(
      `INSERT INTO quiz_results (user_id, session_id, dosha, vata_score, pitta_score, kapha_score, answers)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, sessionId || null, dosha, vata, pitta, kapha, JSON.stringify(answers)]
    )

    const info = DOSHA_INFO[dosha]
    res.json({
      success: true,
      dosha,
      vataScore: vata,
      pittaScore: pitta,
      kaphaScore: kapha,
      ...info,
    })
  } catch (err) {
    console.error('[QUIZ RESULT]', err)
    res.status(500).json({ success: false, message: 'Failed to save quiz result' })
  }
}
