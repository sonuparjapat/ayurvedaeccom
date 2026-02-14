const pool = require('../../config/db')


exports.getPayments = async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT
        p.*,
        o.user_id,
        o.total_amount

      FROM payments p

      JOIN orders o ON o.id=p.order_id

      ORDER BY p.created_at DESC
    `)


    res.status(200).json({
      success: true,
      data: result.rows
    })


  } catch {

    res.status(500).json({
      success: false,
      message: 'Load failed'
    })

  }
}