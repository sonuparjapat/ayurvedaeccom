const pool = require('../../config/db')

const { v4: uuid } = require('uuid')
const { deleteFromCloud } = require('../../config/cloudinary')





// update user
exports.updateUser = async (req, res) => {

  try {

    const { id } = req.params

    const {
   name,
    
      email,
      phone,
      role,
      is_verified,
    } = req.body

    let fields = []
    let values = []
    let i = 1


    if (name) {
      fields.push(`name=$${i++}`)
      values.push(name)
    }

  


    if (email) {
      fields.push(`email=$${i++}`)
      values.push(email)
    }

    if (phone) {
      fields.push(`phone=$${i++}`)
      values.push(phone)
    }

    if (role) {
      fields.push(`role=$${i++}`)
      values.push(role)
    }

    if (is_verified !== undefined) {
      fields.push(`is_verified=$${i++}`)
      values.push(is_verified)
    }

    if (!fields.length) {
      return res.status(400).json({
        message: "No data to update"
      })
    }

    values.push(id)

    const query = `
      UPDATE users
      SET ${fields.join(", ")},
          updated_at=NOW()
      WHERE id=$${i}
    `

    await pool.query(query, values)

    res.json({ success: true })

  } catch (err) {

    console.error(err)

    res.status(500).json({ message: "Server error" })
  }
}


/* ================= GET USERS ================= */

exports.users = async (req, res) => {

  try {

    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10

    const search = req.query.search || ''
    const role = req.query.role || ''

    const offset = (page - 1) * limit

    let where = "WHERE 1=1"
    let values = []
    let i = 1


    if (search) {
      where += ` AND (name ILIKE $${i} OR email ILIKE $${i})`
      values.push(`%${search}%`)
      i++
    }


    if (role) {
      where += ` AND role=$${i}`
      values.push(role)
      i++
    }


    /* COUNT */

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM users ${where}`,
      values
    )

    const total = parseInt(countRes.rows[0].count)


    /* DATA */

    const usersRes = await pool.query(

      `
      SELECT 
        id,
        name,
      
        email,
        phone,
        role,
        is_verified,
        created_at

      FROM users

      ${where}

      ORDER BY created_at DESC

      LIMIT $${i} OFFSET $${i + 1}
      `,

      [...values, limit, offset]
    )


    res.json({

      users: usersRes.rows,

      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },

    })

  } catch (err) {

    console.error(err)

    res.status(500).json({ message: "Server error" })
  }

}

exports.logout = (req, res) => {

  res.clearCookie("adminToken")
  res.clearCookie("userToken")

  res.json({ success: true })
}

/* STATS */

exports.stats = async (req, res) => {

  const revenue = await pool.query(`
    SELECT COALESCE(SUM(amount),0) FROM payments
    WHERE status='success'
  `)

  const orders = await pool.query(`SELECT COUNT(*) FROM orders`)
  const users = await pool.query(`SELECT COUNT(*) FROM users`)
  const products = await pool.query(`SELECT COUNT(*) FROM products`)

  const pending = await pool.query(`
    SELECT COUNT(*) FROM orders WHERE status='pending'
  `)

  const lowStock = await pool.query(`
    SELECT COUNT(*) FROM products WHERE inventory < 10
  `)


  res.json({
    totalRevenue: Number(revenue.rows[0].coalesce),
    totalOrders: Number(orders.rows[0].count),
    totalUsers: Number(users.rows[0].count),
    totalProducts: Number(products.rows[0].count),
    pendingOrders: Number(pending.rows[0].count),
    lowStockItems: Number(lowStock.rows[0].count),
  })
}


/* RECENT ORDERS */

exports.recentOrders = async (req, res) => {

  const data = await pool.query(`

    SELECT
      o.id,
      o.id AS order_number,
      u.name AS customer,
      o.total_amount AS amount,
      o.status

    FROM orders o
    LEFT JOIN users u ON u.id=o.user_id

    ORDER BY o.created_at DESC
    LIMIT 5

  `)

  res.json(data.rows)
}


/* TOP PRODUCTS */

exports.topProducts = async (req, res) => {

  const data = await pool.query(`

    SELECT
      p.name,
      SUM(oi.quantity) AS sales,
      SUM(oi.price * oi.quantity) AS revenue,
      p.inventory AS stock

    FROM order_items oi

    JOIN products p ON p.id=oi.product_id

    GROUP BY p.id

    ORDER BY revenue DESC

    LIMIT 5

  `)

  res.json(data.rows)
}



/* CREATE */
exports.create = async (req, res) => {
  try {

    const {
      name,
      slug,
      shortdescription,
      longdescription,

      price,
      compareprice,

      inventory,
      sku,

      category,
      brand,
      status,

      meta_title,
      meta_description,
      meta_keywords
    } = req.body

    // Validation
    if (!name || !price || !inventory) {
      return res.status(400).json({
        message: 'Name, Price & Stock required'
      })
    }

    const images = req.files
      ? req.files.map(f => f.path)
      : []

    await pool.query(`
      INSERT INTO products (

        name,
        slug,

        shortdescription,
        longdescription,

        price,
        compareprice,

        inventory,
        sku,

        category_name,
        brand,
        status,

        images,

        meta_title,
        meta_description,
        meta_keywords

      )

      VALUES (
        $1,$2,$3,
        $4,$5,
        $6,$7,
        $8,$9,
        $10,$11,$12,
        $13,
        $14,$15
      )
    `, [
      name,
      slug,

      shortdescription || '',
      longdescription || '',

      Number(price),
      Number(compareprice || 0),

      Number(inventory),
      sku || '',

      category || '',
      brand || '',
      status || 'draft',

      JSON.stringify(images),

      meta_title || '',
      meta_description || '',
      meta_keywords || ''

    ])

    res.json({
      success: true,
      message: 'Product created'
    })

  } catch (err) {

    console.error(err)

    res.status(500).json({
      message: 'Create failed'
    })
  }
}


/* GET ALL */

exports.getAll = async (req, res) => {

  try {

    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 8
    const search = req.query.search || ''

    const offset = (page - 1) * limit


    /* ================= DATA ================= */

    const data = await pool.query(`

      SELECT *
      FROM products

      WHERE
        name ILIKE $1
        OR category_name ILIKE $1
        OR brand ILIKE $1

      ORDER BY created_at DESC

      LIMIT $2 OFFSET $3

    `, [
      `%${search}%`,
      limit,
      offset,
    ])


    /* ================= COUNT ================= */

    const count = await pool.query(`

      SELECT COUNT(*)
      FROM products

      WHERE
        name ILIKE $1
        OR category_name ILIKE $1
        OR brand ILIKE $1

    `, [
      `%${search}%`,
    ])


    res.json({

      products: data.rows,

      total: Number(count.rows[0].count),

      page,

      limit,

    })

  } catch (err) {

    console.error(err)

    res.status(500).json({
      message: 'Fetch failed',
    })

  }
}


/* UPDATE */
const normalizeArray = (data) => {

  if (!data) return []

  // Already array
  if (Array.isArray(data)) return data

  // JSON string
  if (typeof data === 'string') {

    try {
      const parsed = JSON.parse(data)

      if (Array.isArray(parsed)) return parsed

      return [parsed]

    } catch {

      // Normal string
      return [data]
    }
  }

  return []
}

exports.update = async (req, res) => {

  try {

    const id = req.params.id

    const body = req.body
console.log(body.oldImages,"old images","deleted image",body.deletedImages)
  const oldImages = normalizeArray(body.oldImages)

const deletedImages = normalizeArray(body.deletedImages)

    for (const img of deletedImages) {
      await deleteFromCloud(img)
    }

    const newImages = req.files?.map(f => f.path) || []

    const finalImages = [
      ...oldImages.filter(i => !deletedImages.includes(i)),
      ...newImages,
    ]

    const result = await pool.query(`

      UPDATE products SET

        name=$1,
        slug=$2,

        shortdescription=$3,
        longdescription=$4,

        price=$5,
        compareprice=$6,

        inventory=$7,
        sku=$8,

        category_name=$9,
        brand=$10,
        status=$11,

        images=$12,

        meta_title=$13,
        meta_description=$14,
        meta_keywords=$15

      WHERE id=$16
      RETURNING *

    `, [

      body.name,
      body.slug,

      body.shortdescription,
      body.longdescription,

      Number(body.price),
      Number(body.compareprice),

      Number(body.inventory),
      body.sku,

      body.category,
      body.brand,
      body.status,

      JSON.stringify(finalImages),

      body.meta_title,
      body.meta_description,
      body.meta_keywords,

      id

    ])

    if (!result.rowCount) {
      return res.status(404).json({ message:'Not found' })
    }

    res.json({
      success:true,
      product: result.rows[0]
    })

  } catch (err) {

    console.error(err)

    res.status(500).json({
      message:'Update failed'
    })
  }
}



/* DELETE */
exports.remove = async (req,res)=>{

  await pool.query(`
    UPDATE products
    SET status='deleted'
    WHERE id=$1
  `,[req.params.id])

  res.json({ success:true })
}

