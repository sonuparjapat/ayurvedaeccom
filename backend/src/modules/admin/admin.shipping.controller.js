const pool = require("../../config/db")
const { emitToUser } = require('../../socket')

exports.addTracking = async (req, res) => {
  try {

    const { id } = req.params
    const { courier_name, tracking_number } = req.body

    if (!courier_name || !tracking_number) {
      return res.status(400).json({
        success: false,
        message: 'Courier & tracking required'
      })
    }

    const orderRes = await pool.query(
      `SELECT status, user_id FROM orders WHERE id=$1`,
      [id]
    )

    if (!orderRes.rowCount) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }

    if (![2, 3].includes(Number(orderRes.rows[0].status))) {
      return res.status(400).json({
        success: false,
        message: 'Tracking can only be added when order is Processing or Shipped'
      })
    }

    await pool.query(
      `UPDATE orders SET courier_name=$1, tracking_number=$2, shipped_at=NOW() WHERE id=$3`,
      [courier_name, tracking_number, id]
    )

    // Notify customer in real-time
    emitToUser(orderRes.rows[0].user_id, 'tracking_updated', {
      order_id: Number(id),
      courier_name,
      tracking_number,
    })

    res.status(200).json({
      success: true,
      message: 'Tracking added'
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({
      success: false,
      message: 'Tracking failed'
    })
  }
}
