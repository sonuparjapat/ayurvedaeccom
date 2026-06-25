const pool = require('../../config/db')
const bcrypt = require("bcryptjs")
const validator = require("validator")
const { v4: uuid } = require('uuid')
const { deleteFromCloud } = require('../../config/cloudinary')
const orderstatus=require("../../utils/orderstatusmap")
const {
  sendOrderStatusMail
} = require("../../utils/orderMail");
const { emitToUser, emitToAdmin } = require('../../socket');
const {
  uploadImageToAWS,
  deleteFromAWS
} = require("../../utils/awsImageUpload");
const Razorpay = require('razorpay');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

// create user 
exports.createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      is_verified
    } = req.body

    /* =========================
       1. Basic Validation
    ========================= */

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      })
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      })
    }

    if (phone && phone.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number"
      })
    }

    /* =========================
       2. Check Duplicate Email
    ========================= */

    const userExists = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    )

    if (userExists.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already exists"
      })
    }

    /* =========================
       3. Hash Password
    ========================= */

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    /* =========================
       4. Role Protection
       (prevent invalid roles)
    ========================= */

    const allowedRoles = [0, 1, 2] 
    // 0 = user, 1 = admin, 2 = staff

    const finalRole = allowedRoles.includes(role)
      ? role
      : 0

    /* =========================
       5. Insert User
    ========================= */

    const query = `
      INSERT INTO users
      (
        name,
        email,
        phone,
        password,
        role,
        is_verified,
        created_at,
        updated_at
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,NOW(),NOW())
      RETURNING id, name, email, role
    `

    const values = [
      name.trim(),
      email.toLowerCase(),
      phone || null,
      hashedPassword,
      finalRole,
      is_verified ?? false
    ]

    const result = await pool.query(query, values)

    /* =========================
       6. Success Response
    ========================= */

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: result.rows[0]
    })

  } catch (err) {

    console.error("Create User Error:", err)

    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}

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

  res.clearCookie("token")


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



/* LOW STOCK PRODUCTS */
exports.getLowStockProducts = async (req, res) => {
  try {
    const threshold = Number(req.query.threshold) || 10;
    const result = await pool.query(`
      SELECT id, name, inventory, images, status
      FROM products
      WHERE inventory <= $1 AND status = TRUE
      ORDER BY inventory ASC
      LIMIT 50
    `, [threshold]);
    res.json({ success: true, products: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch low stock products' });
  }
};

/* CREATE */
exports.create = async (req, res) => {
    let uploadedImages = []; 
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
      category_id,

      category_name,
      brand,
      status,

      meta_title,
      meta_description,
      meta_keywords,
      gst_percent,
      hsn_code,
      cess_percent,

      brand_id,
      tags,
      is_featured,
      is_bestseller,
      cost_price,
      weight_grams,
      length_cm,
      width_cm,
      height_cm,
      low_stock_threshold,
      specifications,
      barcode,
    } = req.body

    // Validation
    if (!name || !price || !inventory) {
      return res.status(400).json({
        message: 'Name, Price & Stock required'
      })
    }

   let images = [];

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
        category_id,
        brand,
        status,

        images,

        meta_title,
        meta_description,
        meta_keywords,
        gst_percent,
        hsn_code,
        cess_percent,

        brand_id,
        tags,
        is_featured,
        is_bestseller,
        cost_price,
        weight_grams,
        length_cm,
        width_cm,
        height_cm,
        low_stock_threshold,
        specifications,
        barcode

      )

      VALUES (
        $1,$2,$3,
        $4,$5,
        $6,$7,
        $8,$9,
        $10,$11,$12,
        $13,
        $14,$15,$16,$17,$18,$19,
        $20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31
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

      category_name || '',
      category_id || "",
      brand || '',
      status || 'draft',

      JSON.stringify(images),

      meta_title || '',
      meta_description || '',
      meta_keywords || '',
      Number(gst_percent || 0),
      hsn_code || '',
      Number(cess_percent || 0),

      brand_id || null,
      tags ? (typeof tags === 'string' ? tags : JSON.stringify(tags)) : null,
      is_featured === 'true' || is_featured === true || false,
      is_bestseller === 'true' || is_bestseller === true || false,
      cost_price ? Number(cost_price) : null,
      weight_grams ? Number(weight_grams) : null,
      length_cm ? Number(length_cm) : null,
      width_cm ? Number(width_cm) : null,
      height_cm ? Number(height_cm) : null,
      low_stock_threshold ? Number(low_stock_threshold) : null,
      specifications ? (typeof specifications === 'string' ? specifications : JSON.stringify(specifications)) : null,
      barcode || null,

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
    console.log(err,"error coming")
    res.status(500).json({
      message:err?.detail|| 'Create failed'
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
// console.log("test")
    const data = await pool.query(`

      SELECT p.*,
        b.name AS brand_display_name
      FROM products p

      LEFT JOIN brands b ON p.brand_id = b.id

      WHERE
        p.name ILIKE $1
        OR p.category_name ILIKE $1
        OR p.brand ILIKE $1

      ORDER BY p.created_at DESC

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
let uploadedImages=[]
  try {

    const id = req.params.id

    const body = req.body

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
        meta_keywords=$15,
        category_id=$16,
        gst_percent=$17,
        hsn_code=$18,
        cess_percent=$19,

        brand_id=$21,
        tags=$22,
        is_featured=$23,
        is_bestseller=$24,
        cost_price=$25,
        weight_grams=$26,
        length_cm=$27,
        width_cm=$28,
        height_cm=$29,
        low_stock_threshold=$30,
        specifications=$31,
        barcode=$32

      WHERE id=$20
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

      body.category_name,
      body.brand,
      body.status,

      JSON.stringify(finalImages),

      body.meta_title,
      body.meta_description,
      body.meta_keywords,
      body.category_id,
      Number(body.gst_percent || 0),
      body.hsn_code || '',
      Number(body.cess_percent || 0),
      id,

      body.brand_id || null,
      body.tags ? (typeof body.tags === 'string' ? body.tags : JSON.stringify(body.tags)) : null,
      body.is_featured === 'true' || body.is_featured === true || false,
      body.is_bestseller === 'true' || body.is_bestseller === true || false,
      body.cost_price ? Number(body.cost_price) : null,
      body.weight_grams ? Number(body.weight_grams) : null,
      body.length_cm ? Number(body.length_cm) : null,
      body.width_cm ? Number(body.width_cm) : null,
      body.height_cm ? Number(body.height_cm) : null,
      body.low_stock_threshold ? Number(body.low_stock_threshold) : null,
      body.specifications ? (typeof body.specifications === 'string' ? body.specifications : JSON.stringify(body.specifications)) : null,
      body.barcode || null,

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
        p.images,
        COALESCE(oi.variant_label, '') as variant_label
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
 const client = await pool.connect();
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

 await client.query("BEGIN");
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

   const allowedTransitions = {
  0: [1, 6],        // PENDING → CONFIRMED / CANCELLED
  1: [2, 6, 0],     // CONFIRMED → PROCESSING / CANCELLED / PENDING
  2: [3, 6],        // PROCESSING → SHIPPED / CANCELLED
  3: [4],           // SHIPPED → OUT_FOR_DELIVERY
  4: [5],           // OUT_FOR_DELIVERY → DELIVERED
  5: [7],           // DELIVERED → RETURN_REQUESTED
  6: [],            // CANCELLED → END
  7: [8],           // RETURN_REQUESTED → RETURNED
  8: [9],           // RETURNED → REFUNDED
  9: []             // REFUNDED → END
};


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

    /* ================= UPDATE STATUS ================= */

    await client.query(
      `UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2`,
      [status, id]
    );

    /* ================= LOYALTY POINTS ON DELIVERY (status→5) ================= */
    if (status === 5) {
      try {
        const orderRow = await client.query(`SELECT user_id, total_amount FROM orders WHERE id=$1`, [id])
        if (orderRow.rows.length) {
          const { user_id, total_amount } = orderRow.rows[0]
          const points = Math.floor(Number(total_amount) / 10)
          if (points > 0) {
            await client.query(
              `INSERT INTO loyalty_points (user_id, points, type, source, order_id, description)
               VALUES ($1, $2, 'earn', 'order', $3, $4)`,
              [user_id, points, id, `Earned on order #${id}`]
            )
            await client.query(
              `UPDATE users SET loyalty_points_balance = COALESCE(loyalty_points_balance,0) + $1 WHERE id=$2`,
              [points, user_id]
            )
          }
        }
      } catch (lpErr) {
        console.error('[LOYALTY POINTS ERROR]', lpErr.message)
      }
    }

    /* ================= INVENTORY RESTORE ON RETURN (status→8) ================= */
    if (status === 8) {
      const items = await client.query(
        `SELECT product_id, variant_id, quantity FROM order_items WHERE order_id=$1`,
        [id]
      );
      for (const item of items.rows) {
        if (item.variant_id) {
          await client.query(
            `UPDATE product_variants SET inventory=inventory+$1, updated_at=NOW() WHERE id=$2`,
            [item.quantity, item.variant_id]
          );
        } else {
          await client.query(
            `UPDATE products SET inventory=inventory+$1, updated_at=NOW() WHERE id=$2`,
            [item.quantity, item.product_id]
          );
        }
      }
      await client.query(
        `UPDATE orders SET return_approved_at=NOW() WHERE id=$1`,
        [id]
      );
    }

    /* ================= RAZORPAY REFUND ON REFUND (status→9) ================= */
    if (status === 9) {
      try {
        const paymentRow = await client.query(
          `SELECT razorpay_payment_id, total_amount, payment_method FROM orders WHERE id=$1`,
          [id]
        );
        const o = paymentRow.rows[0];
        if (o?.razorpay_payment_id && o.payment_method === 'online') {
          const refundAmount = Math.round(Number(o.total_amount) * 100);
          const refund = await razorpay.payments.refund(o.razorpay_payment_id, {
            amount: refundAmount,
            speed: 'normal',
            notes: { order_id: id },
          });
          await client.query(
            `UPDATE orders SET refund_id=$1, refund_amount=$2, refund_status='processed', payment_status='refunded', updated_at=NOW() WHERE id=$3`,
            [refund.id, Number(o.total_amount), id]
          );
        } else {
          await client.query(
            `UPDATE orders SET refund_status='cod_manual', updated_at=NOW() WHERE id=$1`,
            [id]
          );
        }
      } catch (refundErr) {
        console.error('[REFUND ERROR]', refundErr.message);
      }
    }

    /* ================= LOG (inside transaction) ================= */
    await client.query(
      `INSERT INTO order_status_logs (order_id, old_status, new_status, changed_by, note) VALUES ($1,$2,$3,$4,$5)`,
      [id, currentStatus, status, req.user?.id || null, null]
    );

    await client.query("COMMIT");

    /* ================= SEND CUSTOMER MAIL + REAL-TIME SOCKET ================= */
    try {
      const userRes = await pool.query(
        `SELECT u.id as user_id, u.email, u.name FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=$1 LIMIT 1`,
        [id]
      );
      if (userRes.rows.length) {
        const { user_id, email, name } = userRes.rows[0];
        await sendOrderStatusMail({ email, name, orderId: id, status });
        emitToUser(user_id, 'order_status_updated', {
          order_id: id,
          status,
          status_label: orderstatus[status] || String(status),
        });
      }
    } catch (mailErr) {
      console.log("Order mail/socket failed:", mailErr.message);
    }

    /* ================= RESPONSE ================= */
    res.status(200).json({
      success: true,
      message: 'Status updated successfully'
    })


  } catch (err) {
  await client.query("ROLLBACK");
    console.error(err)

    res.status(500).json({
      success: false,
      message: 'Update failed'
    })

  }finally{
  client.release();
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

/* ═══════════════════════════════════════════════════════
   PRODUCT VARIANTS — ADMIN CRUD
═══════════════════════════════════════════════════════ */

exports.adminGetVariants = async (req, res) => {
  try {
    const { productId } = req.params
    const result = await pool.query(
      `SELECT * FROM product_variants WHERE product_id=$1 ORDER BY sort_order ASC, price ASC`,
      [productId]
    )
    res.json({ success: true, variants: result.rows })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch variants' })
  }
}

exports.adminCreateVariant = async (req, res) => {
  try {
    const { productId } = req.params
    const { label, sku, price, compareprice, inventory, attributes, sort_order, cost_price, weight_grams, barcode, image_url } = req.body
    if (!label || !price) return res.status(400).json({ success: false, message: 'label and price required' })
    const result = await pool.query(`
      INSERT INTO product_variants (product_id, label, sku, price, compareprice, inventory, attributes, sort_order, cost_price, weight_grams, barcode, image_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *
    `, [productId, label, sku || null, price, compareprice || null, inventory || 0, attributes || {}, sort_order || 0, cost_price ? Number(cost_price) : null, weight_grams ? Number(weight_grams) : null, barcode || null, image_url || null])
    res.status(201).json({ success: true, variant: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create variant' })
  }
}

exports.adminUpdateVariant = async (req, res) => {
  try {
    const { id } = req.params
    const { label, sku, price, compareprice, inventory, attributes, sort_order, is_active, cost_price, weight_grams, barcode, image_url } = req.body
    const result = await pool.query(`
      UPDATE product_variants SET
        label = COALESCE($1, label), sku = COALESCE($2, sku), price = COALESCE($3, price),
        compareprice = $4, inventory = COALESCE($5, inventory), attributes = COALESCE($6, attributes),
        sort_order = COALESCE($7, sort_order), is_active = COALESCE($8, is_active),
        cost_price = COALESCE($10, cost_price), weight_grams = COALESCE($11, weight_grams),
        barcode = COALESCE($12, barcode), image_url = COALESCE($13, image_url),
        updated_at = NOW()
      WHERE id = $9 RETURNING *
    `, [label, sku, price, compareprice || null, inventory, attributes, sort_order, is_active, id, cost_price ? Number(cost_price) : null, weight_grams ? Number(weight_grams) : null, barcode || null, image_url || null])
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Variant not found' })
    res.json({ success: true, variant: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update variant' })
  }
}

exports.adminDeleteVariant = async (req, res) => {
  try {
    await pool.query('DELETE FROM product_variants WHERE id=$1', [req.params.id])
    res.json({ success: true, message: 'Variant deleted' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete variant' })
  }
}

/* ═══════════════════════════════════════════════════════
   PINCODE SERVICEABILITY — ADMIN CRUD
═══════════════════════════════════════════════════════ */

exports.adminListPincodes = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 50 } = req.query
    const offset = (Number(page) - 1) * Number(limit)
    const where = search ? `WHERE pincode ILIKE $3 OR city ILIKE $3 OR state ILIKE $3` : ''
    const params = search ? [Number(limit), offset, `%${search}%`] : [Number(limit), offset]
    const [rows, count] = await Promise.all([
      pool.query(`SELECT * FROM serviceable_pincodes ${where} ORDER BY id DESC LIMIT $1 OFFSET $2`, params),
      pool.query(`SELECT COUNT(*) FROM serviceable_pincodes ${where}`, search ? [`%${search}%`] : []),
    ])
    res.json({ success: true, pincodes: rows.rows, total: Number(count.rows[0].count) })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to list pincodes' })
  }
}

exports.adminCreatePincode = async (req, res) => {
  try {
    const { pincode, city, state, delivery_days, is_active } = req.body
    if (!pincode) return res.status(400).json({ success: false, message: 'pincode required' })
    const result = await pool.query(
      `INSERT INTO serviceable_pincodes (pincode, city, state, delivery_days, is_active) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (pincode) DO UPDATE SET city=$2, state=$3, delivery_days=$4, is_active=$5 RETURNING *`,
      [pincode, city || null, state || null, delivery_days || 5, is_active !== false]
    )
    res.status(201).json({ success: true, pincode: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save pincode' })
  }
}

exports.adminUpdatePincode = async (req, res) => {
  try {
    const { id } = req.params
    const { city, state, delivery_days, is_active } = req.body
    const result = await pool.query(
      `UPDATE serviceable_pincodes SET city=$1, state=$2, delivery_days=$3, is_active=$4 WHERE id=$5 RETURNING *`,
      [city, state, delivery_days, is_active, id]
    )
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, pincode: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update' })
  }
}

exports.adminDeletePincode = async (req, res) => {
  try {
    await pool.query('DELETE FROM serviceable_pincodes WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete' })
  }
}

/* ═══════════════════════════════════════════════════════
   STOCK NOTIFICATIONS — ADMIN VIEW
═══════════════════════════════════════════════════════ */

exports.adminListStockNotifications = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sn.*, p.name as product_name, pv.label as variant_label
      FROM stock_notifications sn
      JOIN products p ON p.id = sn.product_id
      LEFT JOIN product_variants pv ON pv.id = sn.variant_id
      ORDER BY sn.created_at DESC LIMIT 200
    `)
    res.json({ success: true, notifications: result.rows })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch' })
  }
}

/* ═══════════════════════════════════════════════════════
   ORDER TIMELINE
═══════════════════════════════════════════════════════ */

exports.getOrderTimeline = async (req, res) => {
  try {
    const { id } = req.params
    const [timeline, order] = await Promise.all([
      pool.query(`
        SELECT osl.*, sm_old.label as old_label, sm_new.label as new_label, u.name as changed_by_name
        FROM order_status_logs osl
        LEFT JOIN order_status_master sm_old ON sm_old.code = osl.old_status
        LEFT JOIN order_status_master sm_new ON sm_new.code = osl.new_status
        LEFT JOIN users u ON u.id = osl.changed_by
        WHERE osl.order_id = $1 ORDER BY osl.created_at ASC
      `, [id]),
      pool.query(`
        SELECT o.*, u.name as user_name, u.email as user_email
        FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.id = $1
      `, [id]),
    ])
    if (!order.rows.length) return res.status(404).json({ success: false, message: 'Order not found' })
    res.json({ success: true, timeline: timeline.rows, order: order.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch timeline' })
  }
}

/* ─── CSV EXPORT ─── */
exports.exportOrdersCSV = async (req, res) => {
  try {
    const { from, to, status } = req.query
    let where = 'WHERE 1=1'
    const params = []
    if (from) { params.push(from); where += ` AND o.created_at >= $${params.length}` }
    if (to) { params.push(to); where += ` AND o.created_at <= $${params.length}` }
    if (status && status !== 'all') { params.push(status); where += ` AND o.status = $${params.length}` }

    const r = await pool.query(
      `SELECT o.id, o.order_number, u.name as customer, u.email, u.phone,
        o.total_amount, o.payment_method, o.payment_status, o.status,
        osm.label as status_label, o.created_at, o.courier_name, o.tracking_number
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       LEFT JOIN order_status_master osm ON osm.code = o.status
       ${where} ORDER BY o.created_at DESC`, params
    )

    const headers = ['Order ID','Order Number','Customer','Email','Phone','Total','Payment Method','Payment Status','Status','Date','Courier','Tracking']
    const rows = r.rows.map(o => [
      o.id, o.order_number, o.customer, o.email, o.phone,
      o.total_amount, o.payment_method, o.payment_status, o.status_label,
      new Date(o.created_at).toISOString().slice(0,10), o.courier_name || '', o.tracking_number || ''
    ])

    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="orders_${Date.now()}.csv"`)
    res.send(csv)
  } catch (err) {
    res.status(500).json({ message: 'Export failed' })
  }
}

exports.exportUsersCSV = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.wallet_balance, u.loyalty_points_balance,
        COUNT(DISTINCT o.id) AS total_orders, COALESCE(SUM(o.total_amount),0) AS total_spent,
        u.created_at
       FROM users u LEFT JOIN orders o ON o.user_id = u.id WHERE u.role = 3
       GROUP BY u.id ORDER BY u.created_at DESC`
    )
    const headers = ['ID','Name','Email','Phone','Wallet Balance','Loyalty Points','Total Orders','Total Spent','Joined']
    const rows = r.rows.map(u => [u.id, u.name, u.email, u.phone, u.wallet_balance, u.loyalty_points_balance, u.total_orders, u.total_spent, new Date(u.created_at).toISOString().slice(0,10)])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="users_${Date.now()}.csv"`)
    res.send(csv)
  } catch (err) {
    res.status(500).json({ message: 'Export failed' })
  }
}

/* ─── REVIEWS MODERATION ─── */
exports.adminListReviews = async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query
    const offset = (Number(page) - 1) * Number(limit)
    const allowed = ['pending', 'approved', 'rejected']
    const vals = [Number(limit), offset]
    let where = ''
    if (status !== 'all' && allowed.includes(status)) {
      where = 'AND r.status = $3'
      vals.push(status)
    }
    const r = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.images, r.status, r.created_at,
              u.name as user_name, p.name as product_name, p.id as product_id
       FROM reviews r
       LEFT JOIN users u ON u.id = r.user_id
       LEFT JOIN products p ON p.id = r.product_id
       WHERE 1=1 ${where} ORDER BY r.created_at DESC LIMIT $1 OFFSET $2`,
      vals
    )
    const countVals = status !== 'all' && allowed.includes(status) ? [status] : []
    const countWhere = countVals.length ? 'WHERE r.status = $1' : ''
    const countRes = await pool.query(`SELECT COUNT(*) FROM reviews r ${countWhere}`, countVals)
    res.json({ reviews: r.rows, total: Number(countRes.rows[0].count) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

exports.adminUpdateReview = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const allowed = ['pending', 'approved', 'rejected']
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' })
    const rev = await pool.query(`UPDATE reviews SET status=$1 WHERE id=$2 RETURNING product_id`, [status, id])
    if (rev.rows.length) {
      const pid = rev.rows[0].product_id
      await pool.query(
        `UPDATE products SET
           averagerating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE product_id=$1 AND status='approved'), 0),
           reviewcount   = (SELECT COUNT(*) FROM reviews WHERE product_id=$1 AND status='approved')
         WHERE id=$1`,
        [pid]
      )
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: 'Update failed' })
  }
}

exports.adminDeleteReview = async (req, res) => {
  try {
    const rev = await pool.query(`DELETE FROM reviews WHERE id=$1 RETURNING product_id`, [req.params.id])
    if (rev.rows.length) {
      const pid = rev.rows[0].product_id
      await pool.query(
        `UPDATE products SET
           averagerating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE product_id=$1 AND status='approved'), 0),
           reviewcount   = (SELECT COUNT(*) FROM reviews WHERE product_id=$1 AND status='approved')
         WHERE id=$1`,
        [pid]
      )
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: 'Delete failed' })
  }
}

/* ─── ABANDONED CARTS ─── */
exports.getAbandonedCarts = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT c.user_id, u.name, u.email,
        COUNT(c.id) AS item_count,
        SUM(c.price * c.quantity) AS cart_value,
        MAX(c.updated_at) AS last_updated
       FROM cart c
       JOIN users u ON u.id = c.user_id
       WHERE c.updated_at < NOW() - INTERVAL '1 hour'
         AND c.updated_at > NOW() - INTERVAL '48 hours'
         AND c.user_id NOT IN (
           SELECT DISTINCT user_id FROM orders WHERE created_at > NOW() - INTERVAL '2 hours'
         )
       GROUP BY c.user_id, u.name, u.email
       ORDER BY last_updated DESC LIMIT 100`
    )
    res.json({ carts: r.rows })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

/* ─── LOYALTY POINTS ADMIN ─── */
exports.adminCreditLoyalty = async (req, res) => {
  const client = await pool.connect()
  try {
    const { user_id, points, description } = req.body
    if (!user_id || !points) return res.status(400).json({ message: 'user_id and points required' })
    await client.query('BEGIN')
    await client.query(
      `INSERT INTO loyalty_points (user_id, points, type, source, description) VALUES ($1,$2,'earn','admin',$3)`,
      [user_id, points, description || 'Admin credit']
    )
    await client.query('UPDATE users SET loyalty_points_balance = loyalty_points_balance + $1 WHERE id=$2', [points, user_id])
    await client.query('COMMIT')
    res.json({ success: true })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ message: 'Credit failed' })
  } finally {
    client.release()
  }
}

/* ─── COD DELIVERY OTP ─── */
exports.generateDeliveryOTP = async (req, res) => {
  try {
    const { id } = req.params
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    await pool.query(`UPDATE orders SET delivery_otp=$1 WHERE id=$2 AND status=4`, [otp, id])
    res.json({ success: true, otp })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

exports.verifyDeliveryOTP = async (req, res) => {
  try {
    const { id } = req.params
    const { otp } = req.body
    const r = await pool.query(`SELECT delivery_otp FROM orders WHERE id=$1`, [id])
    if (!r.rows.length) return res.status(404).json({ message: 'Order not found' })
    if (r.rows[0].delivery_otp !== otp) return res.status(400).json({ message: 'Invalid OTP' })
    await pool.query(`UPDATE orders SET delivery_otp_verified=TRUE WHERE id=$1`, [id])
    res.json({ success: true, message: 'OTP verified' })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

/* ─── RETURNS MANAGEMENT ─── */

exports.adminGetReturns = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '7,8,9' } = req.query
    const offset = (Number(page) - 1) * Number(limit)
    const statuses = status.split(',').map(Number)
    const r = await pool.query(
      `SELECT o.id, o.invoice_no, o.status, o.total_amount, o.return_reason,
              o.created_at, o.updated_at, o.payment_method,
              u.name AS user_name, u.email AS user_email, u.id AS user_id,
              (SELECT json_agg(json_build_object('name',oi.product_name,'qty',oi.quantity,'price',oi.price,'image',p.thumbnail))
               FROM order_items oi LEFT JOIN products p ON p.id=oi.product_id WHERE oi.order_id=o.id) AS items
       FROM orders o JOIN users u ON u.id=o.user_id
       WHERE o.status = ANY($1)
       ORDER BY o.updated_at DESC
       LIMIT $2 OFFSET $3`,
      [statuses, limit, offset]
    )
    const cnt = await pool.query(`SELECT COUNT(*) FROM orders WHERE status = ANY($1)`, [statuses])
    res.json({ data: r.rows, meta: { total: Number(cnt.rows[0].count), page: Number(page), limit: Number(limit) } })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

exports.adminApproveReturn = async (req, res) => {
  const client = await pool.connect()
  try {
    const { id } = req.params
    const { refund_to_wallet = true } = req.body
    await client.query('BEGIN')
    const ord = await client.query(`SELECT id, status, total_amount, user_id FROM orders WHERE id=$1`, [id])
    if (!ord.rows.length) return res.status(404).json({ message: 'Order not found' })
    if (ord.rows[0].status !== 7) return res.status(400).json({ message: 'Order is not in Return Requested state' })
    await client.query(`UPDATE orders SET status=8, updated_at=NOW() WHERE id=$1`, [id])
    if (refund_to_wallet) {
      const amount = Number(ord.rows[0].total_amount)
      const userId = ord.rows[0].user_id
      await client.query(`INSERT INTO wallet_transactions (user_id, amount, type, source, description) VALUES ($1,$2,'credit','refund','Return refund for order #' || $3)`, [userId, amount, id])
      await client.query(`UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id=$2`, [amount, userId])
    }
    await client.query('COMMIT')
    res.json({ success: true, message: 'Return approved, refund initiated' })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ message: 'Approval failed' })
  } finally { client.release() }
}

exports.adminRejectReturn = async (req, res) => {
  try {
    const { id } = req.params
    const { reason = 'Return request rejected by admin' } = req.body
    const ord = await pool.query(`SELECT status FROM orders WHERE id=$1`, [id])
    if (!ord.rows.length) return res.status(404).json({ message: 'Order not found' })
    if (ord.rows[0].status !== 7) return res.status(400).json({ message: 'Order is not in Return Requested state' })
    await pool.query(`UPDATE orders SET status=5, cancel_reason=$1, updated_at=NOW() WHERE id=$2`, [reason, id])
    res.json({ success: true, message: 'Return rejected' })
  } catch (err) {
    res.status(500).json({ message: 'Rejection failed' })
  }
}

exports.adminCompleteRefund = async (req, res) => {
  try {
    const { id } = req.params
    await pool.query(`UPDATE orders SET status=9, updated_at=NOW() WHERE id=$1 AND status=8`, [id])
    res.json({ success: true, message: 'Refund completed' })
  } catch (err) {
    res.status(500).json({ message: 'Failed' })
  }
}

/* ═══════════════════════════════════════════════════════
   BRAND CRUD — ADMIN
═══════════════════════════════════════════════════════ */

exports.adminListBrands = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50))
    const search = req.query.search || ''
    const offset = (page - 1) * limit
    const countRes = await pool.query('SELECT COUNT(*) FROM brands WHERE LOWER(name) LIKE LOWER($1)', [`%${search}%`])
    const result = await pool.query(
      'SELECT * FROM brands WHERE LOWER(name) LIKE LOWER($1) ORDER BY sort_order, id DESC LIMIT $2 OFFSET $3',
      [`%${search}%`, limit, offset]
    )
    res.json({ success: true, data: result.rows, total: Number(countRes.rows[0].count) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Failed to fetch brands' })
  }
}

exports.adminCreateBrand = async (req, res) => {
  try {
    const { name, description, is_active = true, sort_order = 0 } = req.body
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Brand name required' })
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
    let logo_url = null
    if (req.file) logo_url = await uploadImageToAWS(req.file, 'brands')
    const result = await pool.query(
      'INSERT INTO brands (name, slug, logo_url, description, is_active, sort_order) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name.trim(), slug, logo_url, description || null, is_active !== 'false', Number(sort_order) || 0]
    )
    res.json({ success: true, data: result.rows[0], message: 'Brand created' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Failed to create brand' })
  }
}

exports.adminUpdateBrand = async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, is_active, sort_order, remove_logo } = req.body
    const old = await pool.query('SELECT * FROM brands WHERE id=$1', [id])
    if (!old.rows.length) return res.status(404).json({ success: false, message: 'Brand not found' })
    let logo_url = old.rows[0].logo_url
    if (req.file) {
      if (logo_url) await deleteFromAWS(logo_url)
      logo_url = await uploadImageToAWS(req.file, 'brands')
    }
    if (remove_logo === 'true') {
      if (logo_url) await deleteFromAWS(logo_url)
      logo_url = null
    }
    const slug = name ? name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') : old.rows[0].slug
    const result = await pool.query(
      'UPDATE brands SET name=$1, slug=$2, logo_url=$3, description=$4, is_active=$5, sort_order=$6, updated_at=NOW() WHERE id=$7 RETURNING *',
      [name?.trim() || old.rows[0].name, slug, logo_url, description ?? old.rows[0].description, is_active !== undefined ? is_active !== 'false' : old.rows[0].is_active, Number(sort_order) ?? old.rows[0].sort_order, id]
    )
    res.json({ success: true, data: result.rows[0], message: 'Brand updated' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Failed to update brand' })
  }
}

exports.adminDeleteBrand = async (req, res) => {
  try {
    const { id } = req.params
    const used = await pool.query('SELECT id FROM products WHERE brand_id=$1 LIMIT 1', [id])
    if (used.rows.length) return res.status(400).json({ success: false, message: 'Brand is in use by products' })
    const old = await pool.query('SELECT logo_url FROM brands WHERE id=$1', [id])
    if (old.rows[0]?.logo_url) await deleteFromAWS(old.rows[0].logo_url)
    await pool.query('DELETE FROM brands WHERE id=$1', [id])
    res.json({ success: true, message: 'Brand deleted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Failed to delete brand' })
  }
}

/* ═══════════════════════════════════════════════════════
   LOW STOCK ALERTS — DETAILED VIEW
═══════════════════════════════════════════════════════ */

exports.checkLowStock = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.name, p.sku, p.inventory, p.low_stock_threshold,
             COALESCE(p.low_stock_threshold, 10) as threshold
      FROM products p
      WHERE p.status = 'active'
        AND p.inventory <= COALESCE(p.low_stock_threshold, 10)
        AND p.inventory > 0
      ORDER BY p.inventory ASC
      LIMIT 50
    `)

    const outOfStock = await pool.query(`
      SELECT id, name, sku FROM products WHERE status='active' AND inventory <= 0 LIMIT 50
    `)

    res.json({
      success: true,
      data: {
        lowStock: result.rows,
        outOfStock: outOfStock.rows,
        lowStockCount: result.rows.length,
        outOfStockCount: outOfStock.rows.length,
      }
    })
  } catch (err) {
    console.error('[LowStock] Error:', err)
    res.status(500).json({ success: false, message: 'Failed' })
  }
}
