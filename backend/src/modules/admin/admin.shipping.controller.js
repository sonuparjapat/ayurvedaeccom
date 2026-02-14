const pool = require("../../config/db")

exports.addTracking = async (req, res) => {
console.log(req.body,"req body")
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
      `SELECT status FROM orders WHERE id=$1`,
      [id]
    )


    if (!orderRes.rowCount) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }


    if (orderRes.rows[0].status != '3') {
      return res.status(400).json({
        success: false,
        message: 'Tracking allowed only after shipped'
      })
    }


    await pool.query(
      `
      UPDATE orders
      SET
        courier_name=$1,
        tracking_number=$2,
        shipped_at=NOW()
      WHERE id=$3
      `,
      [courier_name, tracking_number, id]
    )


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
