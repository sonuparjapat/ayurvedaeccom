const pool = require('../../config/db')

const { v4: uuid } = require('uuid')
const { deleteFromCloud } = require('../../config/cloudinary')
const orderstatus=require("../../utils/orderstatusmap")
const {
  uploadImageToAWS,
  deleteFromAWS
} = require("../../utils/awsImageUpload");


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
    SELECT COUNT(*) FROM orders WHERE status='0'
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

   let images = [];
  let uploadedImages = []; 
if (req.files?.length) {

  for (const file of req.files) {

    const url = await uploadImageToAWS(file);

    images.push(url);
      uploadedImages.push(url);
  }
}

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
   // 🔥 ROLLBACK AWS FILES
    for (const url of uploadedImages) {
      await deleteFromAWS(url);
    }
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
let uploadedImages = []
    const body = req.body
console.log(body.oldImages,"old images","deleted image",body.deletedImages)
 // Images user kept
const oldImages = normalizeArray(body.oldImages);

// 1️⃣ Get current images from DB
const existing = await pool.query(
  "SELECT images FROM products WHERE id=$1",
  [id]
);

if (!existing.rowCount) {
  return res.status(404).json({ message: "Not found" });
}

const dbImages = existing.rows[0].images || [];


// 2️⃣ Find removed images
const imagesToDelete = dbImages.filter(
  img => !oldImages.includes(img)
);


// 3️⃣ Delete removed images from AWS
for (const img of imagesToDelete) {
  await deleteFromAWS(img);
}


// 4️⃣ Upload new images
let newImages = [];

if (req.files?.length) {

  for (const file of req.files) {

    const url = await uploadImageToAWS(file);
  uploadedImages.push(url);
    newImages.push(url);
  }
}


// 5️⃣ Merge final images
const finalImages = [
  ...oldImages,
  ...newImages
];

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
 for (const url of uploadedImages) {
      await deleteFromAWS(url);
    }
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


/* ================= GET ALL ORDERS ================= */

exports.getOrders = async (req, res) => {

  try {

    /* ================= QUERY PARAMS ================= */

    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all'
    } = req.query


    const offset = (page - 1) * limit


    /* ================= FILTER ================= */

    let where = ` WHERE 1=1 `
    let values = []
    let idx = 1


    /* ================= SEARCH ================= */

    if (search) {

      where += `
        AND (
          u.name ILIKE $${idx}
          OR u.email ILIKE $${idx}
          OR o.id::TEXT ILIKE $${idx}
        )
      `

      values.push(`%${search}%`)
      idx++

    }


    /* ================= STATUS ================= */

    if (status !== 'all') {

      where += ` AND o.status = $${idx} `

      values.push(status)

      idx++

    }


    /* ================= DATA ================= */

    const dataQuery = `

      SELECT

        o.*,

        u.name AS user_name,
        u.email AS user_email,

        COUNT(oi.id) AS items_count,

        i.invoice_no,
        i.invoice_date


      FROM orders o


      JOIN users u ON u.id = o.user_id


      LEFT JOIN order_items oi ON oi.order_id = o.id


      LEFT JOIN invoices i ON i.order_id = o.id


      ${where}


      GROUP BY o.id, u.id, i.id


      ORDER BY o.created_at DESC


      LIMIT $${idx}
      OFFSET $${idx + 1}

    `


    values.push(limit, offset)


    const data = await pool.query(
      dataQuery,
      values
    )


    /* ================= COUNT ================= */

    const countQuery = `

      SELECT COUNT(*)

      FROM orders o

      JOIN users u ON u.id = o.user_id

      ${where}

    `


    const count = await pool.query(
      countQuery,
      values.slice(0, values.length - 2)
    )


    /* ================= STATS ================= */

    const stats = await pool.query(`

      SELECT

        COUNT(*) AS total,

        COALESCE(SUM(total_amount),0) AS revenue,

        COUNT(*) FILTER (WHERE status='0') AS pending,

        COUNT(*) FILTER (WHERE status='4') AS completed

      FROM orders

    `)


    /* ================= RESPONSE ================= */

    res.status(200).json({

      success: true,

      data: data.rows,

      meta: {

        total: Number(count.rows[0].count),

        revenue: stats.rows[0].revenue,

        pending: stats.rows[0].pending,

        completed: stats.rows[0].completed,

        page: Number(page),

        pages: Math.ceil(
          count.rows[0].count / limit
        )

      }

    })


  } catch (err) {

    console.error(err)

    res.status(500).json({

      success: false,

      message: 'Load failed'

    })

  }

}



/* ================= GET ORDER DETAILS ================= */

exports.getOrderById = async (req, res) => {

  try {

    const { id } = req.params


    const order = await pool.query(`
      SELECT
        o.*,
        u.name,
        u.email,
        u.phone
      FROM orders o
      JOIN users u ON u.id=o.user_id
      WHERE o.id=$1
    `, [id])


    const items = await pool.query(`
      SELECT
        oi.*,
        p.name,
        p.images
      FROM order_items oi
      JOIN products p ON p.id=oi.product_id
      WHERE oi.order_id=$1
    `, [id])


    if (!order.rowCount) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }


    res.status(200).json({
      success: true,
      order: order.rows[0],
      items: items.rows
    })


  } catch {

    res.status(500).json({
      success: false,
      message: 'Load failed'
    })

  }
}



exports.updateOrderStatus = async (req, res) => {

  try {

    const { id } = req.params
let { status } = req.body;
status = Number(status);


    /* ================= VALIDATION ================= */

    if (!status&&status!=0) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      })
    }


    /* ================= GET ORDER ================= */

    const orderRes = await pool.query(
      `
      SELECT
        status,
        shipped_at,
        courier_name,
        tracking_number
      FROM orders
      WHERE id = $1
      `,
      [id]
    )


    if (!orderRes.rowCount) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }


    const order = orderRes.rows[0]
    const currentStatus = order.status

/* ================= SHIPMENT VALIDATION ================= */




    /* ================= ROLLBACK RULE ================= */

    // ❗ If trying: confirmed → pending
    if (
      currentStatus == 1 &&
      status == 0
    ) {

      // Check shipment created or not
      if (order.tracking_number || order.shipped_at) {

        return res.status(400).json({
          success: false,
          message: 'Cannot rollback. Shipment already created.'
        })

      }

      // Optional: time limit (5 min)
      const timeCheck = await pool.query(`
        SELECT
          EXTRACT(EPOCH FROM (NOW() - updated_at)) AS seconds
        FROM orders
        WHERE id=$1
      `,[id])


      if (timeCheck.rows[0].seconds > 300) {

        return res.status(400).json({
          success: false,
          message: 'Rollback time expired'
        })

      }
    }


    /* ================= TRANSITION RULES ================= */

   allowedTransitions = {
  0: [1,5],       // pending → confirmed/cancelled
  1: [2,5,0],     // confirmed → processing/cancelled/pending
  2: [3,5],
  3: [4],
  4: [],
  5: []
}


    const allowed = allowedTransitions[currentStatus] || []


    if (!allowed.includes(status)) {

      return res.status(400).json({
        success: false,
        message: `Invalid transition: ${orderstatus[currentStatus]} → ${orderstatus[status]}`
      })

    }
if (currentStatus == 3&&(!order.courier_name || !order.tracking_number)) {

    return res.status(400).json({
      success: false,
      message: 'Add courier & tracking before shipping'
    })

  }

    /* ================= UPDATE ================= */

    await pool.query(
      `
      UPDATE orders
      SET
        status = $1,
        updated_at = NOW()
      WHERE id = $2
      `,
      [status, id]
    )


    /* ================= LOG  ================= */

    await pool.query(`
      INSERT INTO order_status_logs
      (order_id, old_status, new_status)
      VALUES ($1,$2,$3)
    `,[id,currentStatus,status])


    /* ================= RESPONSE ================= */

    res.status(200).json({
      success: true,
      message: 'Status updated successfully'
    })


  } catch (err) {

    console.error(err)

    res.status(500).json({
      success: false,
      message: 'Update failed'
    })

  }
}


// get carts >>>>>>>>>>>>>>>>>>>>
exports.getCarts = async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT
        c.id,
        c.quantity,
        c.created_at,

        u.name,
        u.email,

        p.name AS product,
        p.price

      FROM cart c

      JOIN users u ON u.id=c.user_id

      JOIN products p ON p.id=c.product_id

      ORDER BY c.created_at DESC
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

// get all status codes *****************
exports.getstauscodes=async(req,res)=>{
try{
const resdata=await pool.query(`select code ,label from order_status_master where is_active=$1`,[true])

res?.status(200)?.json({data:resdata?.rows||[],status:true})
}catch{
res?.status(500).json({message:"Something went wrong",status:false})
}
}