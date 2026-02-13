const pool = require('../../config/db')
const crypto = require('crypto')

exports.createOrder = async (req, res) => {

  const client = await pool.connect()

  try {

    const userId = req.user.id
    const {
      shippingInfo,
      paymentMethod,
      paymentId
    } = req.body

    await client.query('BEGIN')

    // 1️⃣ Get cart
    const cart = await client.query(`
      SELECT c.*, p.price, p.inventory
      FROM cart c
      JOIN products p ON p.id=c.product_id
      WHERE c.user_id=$1
    `,[userId])

    if (!cart.rows.length) {
      throw new Error('Cart empty')
    }

    // 2️⃣ Calculate total
    let total = 0

    for (let item of cart.rows) {

      if (item.inventory < item.quantity) {
        throw new Error('Out of stock')
      }

      total += item.price * item.quantity
    }

    // 3️⃣ Create order
    const orderNumber =
      'ORD' + Date.now()

    const order = await client.query(`

      INSERT INTO orders
      (user_id,total_amount,order_number,
       payment_status,payment_method,
       shipping_address)

      VALUES($1,$2,$3,$4,$5,$6)
      RETURNING id

    `,[
      userId,
      total,
      orderNumber,
      paymentMethod === 'cod' ? 'pending' : 'paid',
      paymentMethod,
      shippingInfo
    ])

    const orderId = order.rows[0].id

    // 4️⃣ Insert items
    for (let item of cart.rows) {

      await client.query(`
        INSERT INTO order_items
        (order_id,product_id,quantity,price)
        VALUES($1,$2,$3,$4)
      `,[
        orderId,
        item.product_id,
        item.quantity,
        item.price
      ])

      // Reduce stock
      await client.query(`
        UPDATE products
        SET inventory = inventory - $1
        WHERE id=$2
      `,[item.quantity,item.product_id])
    }

    // 5️⃣ Clear cart
    await client.query(`
      DELETE FROM cart WHERE user_id=$1
    `,[userId])

    await client.query('COMMIT')

    res.status(201).json({
      success:true,
      orderId,
      orderNumber
    })

  } catch (err) {

    await client.query('ROLLBACK')

    console.error(err)

    res.status(500).json({
      success:false,
      message:err.message
    })

  } finally {
    client.release()
  }
}