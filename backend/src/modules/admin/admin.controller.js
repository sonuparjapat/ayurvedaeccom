const pool = require('../../config/db')
const bcrypt = require("bcryptjs")
const validator = require("validator")
const { v4: uuid } = require('uuid')
const { deleteFromCloud } = require('../../config/cloudinary')
const orderstatus=require("../../utils/orderstatusmap")
const {
  sendOrderStatusMail
} = require("../../utils/orderMail");
const {
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendReturnApprovedEmail,
  sendReturnRejectedEmail,
} = require('../../services/email/orderStatusEmail');
const emailTemplates = require('../../utils/emailTemplates');
const mailer = require('../../config/mail');
const { emitToUser, emitToAdmin, emitToAll, getLiveStats } = require('../../socket');
const { createNotification } = require('../../services/notification.service');
const { sendToUser: sendPushToUser } = require('../../services/pushNotification');
const { getLoyaltySettings } = require('../../services/loyaltySettings.service');
const { sendDeliveryOTP: sendDeliveryOTPSms, sendOrderStatusSMS } = require('../../services/sms');
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
      is_verified,
      department_id
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

    const allowedRoles = [1, 2, 3]
    const finalRole = allowedRoles.includes(Number(role)) ? Number(role) : 3

    /* Prevent role-2 admins from creating superadmin accounts */
    if (Number(req.user.role) === 2 && finalRole === 1) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to create superadmin accounts"
      })
    }

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
        department_id,
        created_at,
        updated_at
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
      RETURNING id, name, email, role, department_id
    `

    const values = [
      name.trim(),
      email.toLowerCase(),
      phone || null,
      hashedPassword,
      finalRole,
      is_verified ?? false,
      finalRole === 2 ? (department_id || null) : null
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
      department_id,
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

    if (phone !== undefined) {
      fields.push(`phone=$${i++}`)
      values.push(phone || null)
    }

    if (role) {
      fields.push(`role=$${i++}`)
      values.push(role)
    }

    if (is_verified !== undefined) {
      fields.push(`is_verified=$${i++}`)
      values.push(is_verified)
    }

    // Update department_id: set to the value for role=2, clear for other roles
    if (department_id !== undefined || role !== undefined) {
      const newRole = role ? Number(role) : null
      if (newRole === 2 && department_id !== undefined) {
        fields.push(`department_id=$${i++}`)
        values.push(department_id ? Number(department_id) : null)
      } else if (newRole && newRole !== 2) {
        fields.push(`department_id=NULL`)
      } else if (department_id !== undefined) {
        fields.push(`department_id=$${i++}`)
        values.push(department_id ? Number(department_id) : null)
      }
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


/* ================= ADMIN DELETE USER ================= */

exports.adminDeleteUser = async (req, res) => {
  try {
    const { id } = req.params
    // Prevent deleting superadmins unless caller is superadmin
    const target = await pool.query('SELECT role FROM users WHERE id=$1', [id])
    if (!target.rows.length) return res.status(404).json({ success: false, message: 'User not found' })
    if (target.rows[0].role === 1 && req.user.role !== 1) {
      return res.status(403).json({ success: false, message: 'Cannot delete a superadmin' })
    }
    await pool.query(`UPDATE users SET is_active=false, updated_at=NOW() WHERE id=$1`, [id])
    console.log(`[ADMIN DELETE USER] User #${id} deactivated by admin #${req.user.id}`)
    res.json({ success: true, message: 'User deactivated' })
  } catch (err) {
    console.error('[ADMIN DELETE USER]', err)
    res.status(500).json({ success: false, message: 'Failed to deactivate user' })
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
      where += ` AND (u.name ILIKE $${i} OR u.email ILIKE $${i})`
      values.push(`%${search}%`)
      i++
    }


    if (role) {
      where += ` AND u.role=$${i}`
      values.push(role)
      i++
    }


    /* COUNT */

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM users u LEFT JOIN departments d ON d.id = u.department_id ${where}`,
      values
    )

    const total = parseInt(countRes.rows[0].count)


    /* DATA */

    const usersRes = await pool.query(

      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.is_verified,
        u.department_id,
        d.name AS department_name,
        u.created_at

      FROM users u
      LEFT JOIN departments d ON d.id = u.department_id

      ${where}

      ORDER BY u.created_at DESC

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
  try {
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
  } catch (err) {
    console.error('[STATS ERROR]', err)
    res.status(500).json({ success: false, message: 'Failed to fetch stats' })
  }
}


/* SPARKLINES — last 7 days per KPI */

exports.sparklines = async (req, res) => {
  try {
    const [revRows, orderRows, userRows] = await Promise.all([
      pool.query(`
        SELECT date_trunc('day', created_at) AS day, COALESCE(SUM(amount),0) AS value
        FROM payments WHERE status='success' AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY day ORDER BY day
      `),
      pool.query(`
        SELECT date_trunc('day', created_at) AS day, COUNT(*) AS value
        FROM orders WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY day ORDER BY day
      `),
      pool.query(`
        SELECT date_trunc('day', created_at) AS day, COUNT(*) AS value
        FROM users WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY day ORDER BY day
      `),
    ])

    const toSeries = (rows) => {
      const map = {}
      rows.forEach(r => { map[r.day.toISOString().slice(0, 10)] = Number(r.value) })
      const series = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        series.push(map[d.toISOString().slice(0, 10)] || 0)
      }
      return series
    }

    res.json({
      success: true,
      data: {
        revenue: toSeries(revRows.rows),
        orders: toSeries(orderRows.rows),
        users: toSeries(userRows.rows),
      },
    })
  } catch (err) {
    console.error('[SPARKLINES]', err)
    res.status(500).json({ success: false })
  }
}


/* RECENT ORDERS */

exports.recentOrders = async (req, res) => {
  try {
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
  } catch (err) {
    console.error('[RECENT ORDERS ERROR]', err)
    res.status(500).json({ success: false, message: 'Failed to fetch recent orders' })
  }
}


/* TOP PRODUCTS */

exports.topProducts = async (req, res) => {
  try {
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
  } catch (err) {
    console.error('[TOP PRODUCTS ERROR]', err)
    res.status(500).json({ success: false, message: 'Failed to fetch top products' })
  }
}



/* LOW STOCK PRODUCTS */
exports.getLowStockProducts = async (req, res) => {
  try {
    const threshold = Number(req.query.threshold) || 10;
    const result = await pool.query(`
      SELECT id, name, inventory, images, status
      FROM products
      WHERE inventory <= $1 AND status = 'active'
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

      product_type,
      unit,
      tax_included,
      shipping_class,
      allow_backorder,
      highlights,
      ingredients,
      benefits,
      usage_instructions,
      storage_instructions,
      warnings,
      video_url,
      fssai_number,
      coa_url,
      focus_keyword,
      min_order_qty,
      max_order_qty,
      is_returnable,
      return_window_days,
      replacement_available,
      sort_order,
      safety_tags,
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
        barcode,

        product_type,
        unit,
        tax_included,
        shipping_class,
        allow_backorder,
        highlights,
        ingredients,
        benefits,
        usage_instructions,
        storage_instructions,
        warnings,
        video_url,
        fssai_number,
        coa_url,
        focus_keyword,
        min_order_qty,
        max_order_qty,
        is_returnable,
        return_window_days,
        replacement_available,
        sort_order,
        faqs,
        safety_tags

      )

      VALUES (
        $1,$2,$3,
        $4,$5,
        $6,$7,
        $8,$9,
        $10,$11,$12,
        $13,
        $14,$15,$16,$17,$18,$19,
        $20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,
        $32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46,$47,$48,$49,$50,$51,$52,$53,$54
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
      category_id ? Number(category_id) : null,
      brand || '',
      status || 'draft',

      JSON.stringify(images),

      meta_title || '',
      meta_description || '',
      meta_keywords || '',
      Number(gst_percent || 0),
      hsn_code || '',
      Number(cess_percent || 0),

      brand_id ? Number(brand_id) : null,
      (() => {
        if (!tags) return '[]'
        if (typeof tags !== 'string') return JSON.stringify(tags)
        try { const parsed = JSON.parse(tags); if (Array.isArray(parsed)) return JSON.stringify(parsed) } catch {}
        return JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean))
      })(),
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

      product_type || 'simple',
      unit || null,
      tax_included === 'true' || tax_included === true || false,
      shipping_class || 'standard',
      allow_backorder === 'true' || allow_backorder === true || false,
      highlights ? (typeof highlights === 'string' ? highlights : JSON.stringify(highlights)) : null,
      ingredients || null,
      benefits || null,
      usage_instructions || null,
      storage_instructions || null,
      warnings || null,
      video_url || null,
      fssai_number || null,
      coa_url || null,
      focus_keyword || null,
      min_order_qty ? Number(min_order_qty) : 1,
      max_order_qty ? Number(max_order_qty) : null,
      is_returnable === 'false' || is_returnable === false ? false : true,
      return_window_days ? Number(return_window_days) : 7,
      replacement_available === 'true' || replacement_available === true ? true : false,
      sort_order ? Number(sort_order) : 0,
      req.body.faqs ? (typeof req.body.faqs === 'string' ? req.body.faqs : JSON.stringify(req.body.faqs)) : '[]',
      (() => {
        if (!safety_tags) return '{}'
        if (Array.isArray(safety_tags)) return `{${safety_tags.map(t => `"${t}"`).join(',')}}`
        if (typeof safety_tags === 'string') {
          try { const p = JSON.parse(safety_tags); if (Array.isArray(p)) return `{${p.map(t => `"${t}"`).join(',')}}` } catch {}
          return `{${safety_tags.split(',').map(t => `"${t.trim()}"`).join(',')}}`
        }
        return '{}'
      })(),

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
  "SELECT images, inventory FROM products WHERE id=$1",
  [id]
);
const oldInventory = Number(existing.rows[0]?.inventory || 0);

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
        barcode=$32,

        product_type=$33,
        unit=$34,
        tax_included=$35,
        shipping_class=$36,
        allow_backorder=$37,
        highlights=$38,
        ingredients=$39,
        benefits=$40,
        usage_instructions=$41,
        storage_instructions=$42,
        warnings=$43,
        video_url=$44,
        fssai_number=$45,
        coa_url=$46,
        focus_keyword=$47,
        min_order_qty=$48,
        max_order_qty=$49,
        is_returnable=$50,
        return_window_days=$51,
        replacement_available=$52,
        sort_order=$53,
        faqs=$54,
        safety_tags=$55

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
      body.category_id ? Number(body.category_id) : null,
      Number(body.gst_percent || 0),
      body.hsn_code || '',
      Number(body.cess_percent || 0),
      id,

      body.brand_id ? Number(body.brand_id) : null,
      (() => {
        if (!body.tags) return '[]'
        if (typeof body.tags !== 'string') return JSON.stringify(body.tags)
        try { const parsed = JSON.parse(body.tags); if (Array.isArray(parsed)) return JSON.stringify(parsed) } catch {}
        return JSON.stringify(body.tags.split(',').map(t => t.trim()).filter(Boolean))
      })(),
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

      body.product_type || 'simple',
      body.unit || null,
      body.tax_included === 'true' || body.tax_included === true || false,
      body.shipping_class || 'standard',
      body.allow_backorder === 'true' || body.allow_backorder === true || false,
      body.highlights ? (typeof body.highlights === 'string' ? body.highlights : JSON.stringify(body.highlights)) : null,
      body.ingredients || null,
      body.benefits || null,
      body.usage_instructions || null,
      body.storage_instructions || null,
      body.warnings || null,
      body.video_url || null,
      body.fssai_number || null,
      body.coa_url || null,
      body.focus_keyword || null,
      body.min_order_qty ? Number(body.min_order_qty) : 1,
      body.max_order_qty ? Number(body.max_order_qty) : null,
      body.is_returnable === 'false' || body.is_returnable === false ? false : true,
      body.return_window_days ? Number(body.return_window_days) : 7,
      body.replacement_available === 'true' || body.replacement_available === true ? true : false,
      body.sort_order ? Number(body.sort_order) : 0,
      body.faqs ? (typeof body.faqs === 'string' ? body.faqs : JSON.stringify(body.faqs)) : '[]',
      (() => {
        const st = body.safety_tags
        if (!st) return '{}'
        if (Array.isArray(st)) return `{${st.map(t => `"${t}"`).join(',')}}`
        if (typeof st === 'string') {
          try { const p = JSON.parse(st); if (Array.isArray(p)) return `{${p.map(t => `"${t}"`).join(',')}}` } catch {}
          return `{${st.split(',').map(t => `"${t.trim()}"`).join(',')}}`
        }
        return '{}'
      })(),

    ])

    if (!result.rowCount) {
      return res.status(404).json({ message:'Not found' })
    }

    // Back-in-stock push + email notifications
    const newInventory = Number(body.inventory);
    if (oldInventory === 0 && newInventory > 0) {
      try {
        const notifs = await pool.query(
          `SELECT user_id, email FROM stock_notifications WHERE product_id=$1 AND notified_at IS NULL`,
          [id]
        );
        if (notifs.rows.length > 0) {
          const productName = body.name || `Product #${id}`;
          const productUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/product/${id}`;
          const { subject, html } = emailTemplates.backInStock({ productName, productUrl });
          for (const n of notifs.rows) {
            if (n.user_id) {
              sendPushToUser(
                n.user_id,
                '✅ Back in Stock!',
                `${productName} is available again — order before it sells out!`,
                { type: 'stock_alert', product_id: parseInt(id) }
              );
            }
            if (n.email) {
              mailer.sendTransacEmail({
                sender: { email: process.env.MAIL_FROM || 'noreply@oroganix.com', name: process.env.APP_NAME || 'Oroganix' },
                to: [{ email: n.email }],
                subject,
                htmlContent: html,
              }).catch(() => {});
            }
          }
          await pool.query(
            `UPDATE stock_notifications SET notified_at=NOW() WHERE product_id=$1 AND notified_at IS NULL`,
            [id]
          );
        }
      } catch (e) {
        console.error('[BACK-IN-STOCK]', e.message);
      }
    }

    // Broadcast stock update to all connected web clients for real-time badge
    if (body.inventory !== undefined) {
      emitToAll('product_stock_update', { productId: parseInt(id), inventory: newInventory })
      // Emit low-stock alert to admin room when inventory drops to threshold
      if (newInventory !== null && newInventory <= 10) {
        const prodName = result.rows[0]?.name || `Product #${id}`
        emitToAdmin('low_stock_alert', { productId: parseInt(id), productName: prodName, inventory: newInventory })
      }
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
  try {
    await pool.query(`
      UPDATE products
      SET status='inactive'
      WHERE id=$1
    `,[req.params.id])

    res.json({ success:true })
  } catch (err) {
    console.error('[Delete Product]', err)
    res.status(500).json({ success: false, message: 'Delete failed' })
  }
}


/* ================= GET ALL ORDERS ================= */

exports.getOrders = async (req, res) => {

  try {

    /* ================= QUERY PARAMS ================= */

    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      refund_status = ''
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

    /* ================= REFUND STATUS ================= */

    if (refund_status) {
      where += ` AND o.refund_status = $${idx} `
      values.push(refund_status)
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

    const orderRes = await client.query(
      `
      SELECT
        status,
        shipped_at,
        courier_name,
        tracking_number,
        payment_method
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
if (currentStatus == 3 && (!order.courier_name || !order.tracking_number)) {
    return res.status(400).json({
      success: false,
      message: 'Add courier & tracking number before marking Out for Delivery'
    })
  }

    /* ================= UPDATE STATUS ================= */

    await client.query(
      `UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2`,
      [status, id]
    );

    /* ================= COD PAYMENT COLLECTED ON DELIVERY (status→5) ================= */
    if (status === 5) {
      await client.query(`UPDATE orders SET delivered_at=NOW() WHERE id=$1`, [id]);
      if (order.payment_method === 'cod') {
        await client.query(`UPDATE orders SET payment_status='paid' WHERE id=$1`, [id]);
      }
    }

    /* ================= LOYALTY POINTS ON DELIVERY (status→5) ================= */
    if (status === 5) {
      try {
        const loyaltyConfig = await getLoyaltySettings()
        if (loyaltyConfig.loyalty_enabled) {
          const orderRow = await client.query(`SELECT user_id, grand_total, total_amount FROM orders WHERE id=$1`, [id])
          if (orderRow.rows.length) {
            const { user_id, grand_total, total_amount } = orderRow.rows[0]
            // Use grand_total (amount actually paid) for earn calculation
            const amountPaid = Number(grand_total || total_amount || 0)
            // earnRate = points per ₹1 (e.g. 0.1 = 1 pt per ₹10)
            const points = Math.floor(amountPaid * loyaltyConfig.loyalty_earn_rate)
            if (points > 0) {
              await client.query(
                `INSERT INTO loyalty_points (user_id, points, type, source, order_id, description)
                 VALUES ($1, $2, 'earn', 'order', $3, $4)`,
                [user_id, points, id, `Earned on order #${id} (₹${amountPaid.toFixed(2)} × ${loyaltyConfig.loyalty_earn_rate} = ${points} pts)`]
              )
              await client.query(
                `UPDATE users SET loyalty_points_balance = COALESCE(loyalty_points_balance,0) + $1 WHERE id=$2`,
                [points, user_id]
              )
            }
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
        `SELECT u.id as user_id, u.email, u.name, o.invoice_no FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=$1 LIMIT 1`,
        [id]
      );
      if (userRes.rows.length) {
        const { user_id, email, name, invoice_no } = userRes.rows[0];
        if (status === 4) {
          // Auto-generate and send delivery OTP when Out for Delivery
          try {
            const otp = Math.floor(100000 + Math.random() * 900000).toString()
            await pool.query(`UPDATE orders SET delivery_otp=$1 WHERE id=$2`, [otp, id])
            const phoneRes = await pool.query(`SELECT u.phone FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=$1`, [id])
            if (phoneRes.rows[0]?.phone) {
              sendDeliveryOTPSms(phoneRes.rows[0].phone, otp, invoice_no || `#${id}`).catch(() => {})
            }
          } catch (otpErr) {
            console.error('[DELIVERY OTP]', otpErr.message)
          }
        }
        if (status === 3) {
          sendOrderShippedEmail({ email, name, orderId: id, invoiceNo: invoice_no, trackingNumber: order.tracking_number, carrier: order.courier_name });
        } else if (status === 5) {
          sendOrderDeliveredEmail({ email, name, orderId: id, invoiceNo: invoice_no });
        } else {
          sendOrderStatusMail({ email, name, orderId: id, status });
        }
        const statusLabel = orderstatus[status] || String(status)
        emitToUser(user_id, 'order_status_updated', {
          order_id: id,
          status,
          status_label: statusLabel,
        });
        createNotification(
          user_id,
          'order_update',
          `Order #${id} — ${statusLabel}`,
          `Your order status has been updated to: ${statusLabel}`,
          { order_id: id, status }
        );
        sendPushToUser(
          user_id,
          `Order Update 📦`,
          `Order #${id} is now: ${statusLabel}`,
          { type: 'order_update', order_id: id, status }
        );
        // Send SMS for key status changes
        const phoneRow = await pool.query(`SELECT phone FROM users WHERE id=$1`, [user_id])
        const phone = phoneRow.rows[0]?.phone
        if (phone && [2, 3, 4, 5, 6, 9].includes(status)) {
          sendOrderStatusSMS(phone, invoice_no || `#${id}`, statusLabel).catch(() => {})
        }
      }
      emitToAdmin('order_status_changed', { order_id: id, new_status: status });
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


/* ================= BULK ORDER STATUS UPDATE ================= */
exports.adminBulkUpdateOrderStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    let { orderIds, status } = req.body;
    status = Number(status);

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ success: false, message: 'orderIds must be a non-empty array' });
    }
    if (isNaN(status) || status < 0 || status > 9) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const ids = orderIds.map(Number).filter(n => !isNaN(n));
    if (ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid order IDs provided' });
    }

    await client.query('BEGIN');

    // Fetch current state for all orders
    const existing = await client.query(
      `SELECT id, status, user_id, payment_method FROM orders WHERE id = ANY($1::int[])`,
      [ids]
    );
    const existingMap = {};
    for (const row of existing.rows) existingMap[row.id] = row;

    const updated = [];
    const skipped = [];

    for (const id of ids) {
      const order = existingMap[id];
      if (!order) { skipped.push(id); continue; }

      await client.query(
        `UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2`,
        [status, id]
      );

      if (status === 5) {
        await client.query(`UPDATE orders SET delivered_at=NOW() WHERE id=$1`, [id]);
        if (order.payment_method === 'cod') {
          await client.query(`UPDATE orders SET payment_status='paid' WHERE id=$1`, [id]);
        }
      }

      await client.query(
        `INSERT INTO order_status_logs (order_id, old_status, new_status, changed_by, note)
         VALUES ($1,$2,$3,$4,$5)`,
        [id, order.status, status, req.user?.id || null, 'bulk update']
      );

      updated.push(id);
    }

    await client.query('COMMIT');

    // Post-commit: send notifications (best-effort)
    const statusLabel = orderstatus[status] || String(status);
    for (const id of updated) {
      try {
        const order = existingMap[id];
        const userRes = await pool.query(
          `SELECT u.id as user_id, u.email, u.name, o.invoice_no FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=$1 LIMIT 1`,
          [id]
        );
        if (userRes.rows.length) {
          const { user_id, email, name, invoice_no } = userRes.rows[0];
          if (status === 5) {
            sendOrderDeliveredEmail({ email, name, orderId: id, invoiceNo: invoice_no });
          } else {
            sendOrderStatusMail({ email, name, orderId: id, status });
          }
          emitToUser(user_id, 'order_status_updated', { order_id: id, status, status_label: statusLabel });
          createNotification(user_id, 'order_update', `Order #${id} — ${statusLabel}`,
            `Your order status has been updated to: ${statusLabel}`, { order_id: id, status });
          sendPushToUser(user_id, `Order Update 📦`, `Order #${id} is now: ${statusLabel}`,
            { type: 'order_update', order_id: id, status });
        }
        emitToAdmin('order_status_changed', { order_id: id, new_status: status });
      } catch (notifErr) {
        console.error(`[BULK STATUS NOTIFY ERROR] order ${id}:`, notifErr.message);
      }
    }

    res.json({
      success: true,
      message: `Updated ${updated.length} order(s)${skipped.length ? `, skipped ${skipped.length}` : ''}`,
      updated,
      skipped,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[BULK STATUS ERROR]', err);
    res.status(500).json({ success: false, message: 'Bulk update failed' });
  } finally {
    client.release();
  }
};

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
    const like = `%${search}%`
    const [rows, count] = await Promise.all([
      search
        ? pool.query(
            `SELECT * FROM serviceable_pincodes WHERE pincode ILIKE $3 OR city ILIKE $3 OR state ILIKE $3 ORDER BY id DESC LIMIT $1 OFFSET $2`,
            [Number(limit), offset, like]
          )
        : pool.query(
            `SELECT * FROM serviceable_pincodes ORDER BY id DESC LIMIT $1 OFFSET $2`,
            [Number(limit), offset]
          ),
      search
        ? pool.query(
            `SELECT COUNT(*) FROM serviceable_pincodes WHERE pincode ILIKE $1 OR city ILIKE $1 OR state ILIKE $1`,
            [like]
          )
        : pool.query(`SELECT COUNT(*) FROM serviceable_pincodes`),
    ])
    res.json({ success: true, pincodes: rows.rows, total: Number(count.rows[0].count) })
  } catch (err) {
    console.error('adminListPincodes error:', err)
    res.status(500).json({ success: false, message: 'Failed to list pincodes' })
  }
}

exports.adminCreatePincode = async (req, res) => {
  try {
    const { pincode, city, state, delivery_days, is_active, cod_available } = req.body
    if (!pincode) return res.status(400).json({ success: false, message: 'pincode required' })
    const result = await pool.query(
      `INSERT INTO serviceable_pincodes (pincode, city, state, delivery_days, is_active, cod_available) VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (pincode) DO UPDATE SET city=$2, state=$3, delivery_days=$4, is_active=$5, cod_available=$6 RETURNING *`,
      [pincode, city || null, state || null, delivery_days || 5, is_active !== false, cod_available !== false]
    )
    res.status(201).json({ success: true, pincode: result.rows[0] })
  } catch (err) {
    console.error('[ADMIN CREATE PINCODE]', err)
    res.status(500).json({ success: false, message: 'Failed to save pincode' })
  }
}

exports.adminUpdatePincode = async (req, res) => {
  try {
    const { id } = req.params
    const { city, state, delivery_days, is_active, cod_available } = req.body
    const result = await pool.query(
      `UPDATE serviceable_pincodes SET city=$1, state=$2, delivery_days=$3, is_active=$4, cod_available=$5 WHERE id=$6 RETURNING *`,
      [city, state, delivery_days, is_active, cod_available !== false, id]
    )
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, pincode: result.rows[0] })
  } catch (err) {
    console.error('[ADMIN UPDATE PINCODE]', err)
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
   PRICE AUDIT LOGS — ADMIN VIEW
═══════════════════════════════════════════════════════ */

exports.adminGetPriceLogs = async (req, res) => {
  try {
    const {
      page = 1, limit = 25,
      search = '',
      reason_type = '',
      date_from = '',
      date_to = '',
    } = req.query

    const offset = (Number(page) - 1) * Number(limit)
    const conditions = []
    const params = []

    if (search) {
      params.push(`%${search}%`)
      const n = params.length
      conditions.push(
        `(pl.user_name ILIKE $${n} OR pl.user_email ILIKE $${n} OR pl.user_phone ILIKE $${n}
          OR pl.product_name ILIKE $${n} OR pl.coupon_code ILIKE $${n}
          OR pl.order_id::text = $${params.length + 1})`
      )
      params.push(search.replace(/\D/g, '') || '0')
    }

    if (reason_type) {
      params.push(reason_type)
      conditions.push(`pl.reason_type = $${params.length}`)
    }

    if (date_from) {
      params.push(date_from)
      conditions.push(`pl.created_at >= $${params.length}::date`)
    }

    if (date_to) {
      params.push(date_to)
      conditions.push(`pl.created_at < ($${params.length}::date + INTERVAL '1 day')`)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const [dataRes, countRes, statsRes, summaryRes] = await Promise.all([
      pool.query(
        `SELECT pl.*, fs.title AS flash_sale_title
         FROM price_logs pl
         LEFT JOIN flash_sales fs ON fs.id = pl.flash_sale_id
         ${where}
         ORDER BY pl.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, Number(limit), offset]
      ),
      pool.query(
        `SELECT COUNT(*) FROM price_logs pl ${where}`,
        params
      ),
      pool.query(
        `SELECT reason_type,
                COUNT(*) AS count,
                COALESCE(SUM(total_savings), 0) AS total_savings
         FROM price_logs pl ${where}
         GROUP BY reason_type`,
        params
      ),
      pool.query(
        `SELECT COALESCE(SUM(total_savings), 0) AS grand_total_savings,
                COUNT(DISTINCT order_id) AS affected_orders,
                COUNT(DISTINCT user_id) AS affected_users
         FROM price_logs pl ${where}`,
        params
      ),
    ])

    res.json({
      success: true,
      logs: dataRes.rows,
      total: Number(countRes.rows[0].count),
      stats: statsRes.rows,
      summary: summaryRes.rows[0],
    })
  } catch (err) {
    console.error('Price logs error:', err)
    res.status(500).json({ success: false, message: 'Failed to load price logs' })
  }
}

exports.adminBulkUploadPincodes = async (req, res) => {
  const client = await pool.connect()
  try {
    const { rows } = req.body
    if (!Array.isArray(rows) || !rows.length)
      return res.status(400).json({ success: false, message: 'No rows provided' })

    const results = { inserted: 0, updated: 0, errors: [] }

    await client.query('BEGIN')

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const pincode = String(r.pincode || '').trim()
      const city    = String(r.city    || '').trim()
      const state   = String(r.state   || '').trim()
      const days    = parseInt(r.delivery_days) || 3
      const rawActive = String(r.is_active || 'true').toLowerCase()
      const isActive  = rawActive === 'false' || rawActive === '0' || rawActive === 'no' ? false : true

      if (!/^\d{6}$/.test(pincode)) {
        results.errors.push({ row: i + 2, pincode: pincode || '(empty)', reason: 'Invalid pincode — must be exactly 6 digits' })
        continue
      }
      if (!city) {
        results.errors.push({ row: i + 2, pincode, reason: 'City is required' })
        continue
      }
      if (isNaN(days) || days < 1 || days > 30) {
        results.errors.push({ row: i + 2, pincode, reason: `delivery_days must be 1–30 (got: ${r.delivery_days})` })
        continue
      }

      const existing = await client.query('SELECT id FROM serviceable_pincodes WHERE pincode=$1', [pincode])
      if (existing.rows.length) {
        await client.query(
          `UPDATE serviceable_pincodes SET city=$1, state=$2, delivery_days=$3, is_active=$4 WHERE pincode=$5`,
          [city, state || null, days, isActive, pincode]
        )
        results.updated++
      } else {
        await client.query(
          `INSERT INTO serviceable_pincodes (pincode, city, state, delivery_days, is_active) VALUES ($1,$2,$3,$4,$5)`,
          [pincode, city, state || null, days, isActive]
        )
        results.inserted++
      }
    }

    await client.query('COMMIT')
    res.json({ success: true, ...results })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Bulk pincode upload error:', err)
    res.status(500).json({ success: false, message: 'Bulk upload failed' })
  } finally {
    client.release()
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
      `SELECT
        o.id,
        o.invoice_no,
        u.name         AS customer,
        u.email,
        u.phone,
        o.shipping_address,
        o.total_amount,
        o.payment_method,
        o.payment_status,
        o.status,
        o.created_at,
        o.courier_name,
        o.tracking_number,
        inv.tax        AS gst_amount,
        json_agg(
          json_build_object(
            'name', p.name,
            'qty',  oi.quantity,
            'price',oi.price
          ) ORDER BY oi.id
        ) AS items
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN products p ON p.id = oi.product_id
       LEFT JOIN invoices inv ON inv.order_id = o.id
       ${where}
       GROUP BY o.id, u.name, u.email, u.phone, inv.tax
       ORDER BY o.created_at DESC`, params
    )

    const parseAddr = (raw) => {
      try {
        const a = typeof raw === 'string' ? JSON.parse(raw) : raw
        return [a?.name, a?.phone, a?.address || `${a?.street || ''}, ${a?.city || ''}, ${a?.state || ''} ${a?.pincode || ''}`.trim()].filter(Boolean).join(' | ')
      } catch { return String(raw || '') }
    }

    const formatItems = (items) => {
      try {
        const arr = typeof items === 'string' ? JSON.parse(items) : items
        return (arr || []).map(i => `${i.name} x${i.qty} @₹${i.price}`).join('; ')
      } catch { return '' }
    }

    const STATUS_LABELS = { 0:'Pending',1:'Confirmed',2:'Processing',3:'Shipped',4:'Out for Delivery',5:'Delivered',6:'Cancelled',7:'Return Requested',8:'Refund',9:'Refunded' }

    const headers = ['Invoice No','Customer','Email','Phone','Shipping Address','Items','Total (₹)','GST (₹)','Payment Method','Payment Status','Order Status','Date','Courier','Tracking']
    const rows = r.rows.map(o => [
      o.invoice_no || `ORD-${o.id}`,
      o.customer || '',
      o.email || '',
      o.phone || '',
      parseAddr(o.shipping_address),
      formatItems(o.items),
      Number(o.total_amount).toFixed(2),
      o.gst_amount ? Number(o.gst_amount).toFixed(2) : '',
      o.payment_method || '',
      o.payment_status || '',
      STATUS_LABELS[o.status] || String(o.status),
      new Date(o.created_at).toISOString().slice(0, 10),
      o.courier_name || '',
      o.tracking_number || '',
    ])

    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="orders_${Date.now()}.csv"`)
    res.send(csv)
  } catch (err) {
    console.error('[exportOrdersCSV]', err)
    res.status(500).json({ message: 'Export failed' })
  }
}

/* ================= TRACKING SEARCH (admin: lookup by tracking number) ================= */

exports.searchByTracking = async (req, res) => {
  try {
    const { q } = req.query
    if (!q || !q.trim()) return res.status(400).json({ success: false, message: 'Tracking number required' })

    const result = await pool.query(
      `SELECT o.id, o.order_number, o.courier_name, o.tracking_number, o.shipped_at,
              o.status, osm.label as status_label, o.total_amount, o.payment_method,
              o.payment_status, o.created_at,
              u.name as customer_name, u.phone, u.email, u.id as user_id,
              o.shipping_address
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       LEFT JOIN order_status_master osm ON osm.code = o.status
       WHERE o.tracking_number ILIKE $1
       ORDER BY o.created_at DESC`,
      [`%${q.trim()}%`]
    )

    res.json({ success: true, orders: result.rows })
  } catch (err) {
    console.error('[searchByTracking]', err)
    res.status(500).json({ success: false, message: 'Server error' })
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
              r.admin_reply, r.admin_replied_at,
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

/* ─── ADMIN REPLY TO REVIEW ─── */
exports.adminReplyReview = async (req, res) => {
  try {
    const { id } = req.params
    const { reply } = req.body
    if (!reply || !reply.trim()) return res.status(400).json({ message: 'Reply text is required' })
    const r = await pool.query(
      `UPDATE reviews SET admin_reply=$1, admin_replied_at=NOW() WHERE id=$2 RETURNING id`,
      [reply.trim(), id]
    )
    if (!r.rowCount) return res.status(404).json({ message: 'Review not found' })
    console.log(`[ADMIN REPLY] Review #${id} replied`)
    res.json({ success: true })
  } catch (err) {
    console.error('[ADMIN REPLY REVIEW]', err)
    res.status(500).json({ message: 'Failed to save reply' })
  }
}

/* ─── ABANDONED CARTS ─── */
exports.getAbandonedCarts = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT c.user_id, u.name, u.email,
        COUNT(c.id) AS item_count,
        SUM(p.price * c.quantity) AS cart_value,
        MAX(c.created_at) AS last_updated
       FROM cart c
       JOIN users u ON u.id = c.user_id
       JOIN products p ON p.id = c.product_id
       WHERE c.created_at < NOW() - INTERVAL '1 hour'
         AND c.created_at > NOW() - INTERVAL '48 hours'
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

    // Send OTP to customer via SMS
    const orderInfo = await pool.query(
      `SELECT o.invoice_no, u.phone FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=$1`,
      [id]
    )
    if (orderInfo.rows[0]?.phone) {
      sendDeliveryOTPSms(orderInfo.rows[0].phone, otp, orderInfo.rows[0].invoice_no || `#${id}`)
        .catch(() => {})
    }

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
              o.return_type, o.return_requested_at, o.replacement_dispatched_at, o.replacement_tracking,
              o.created_at, o.updated_at, o.payment_method, o.refund_status, o.refund_amount,
              u.name AS user_name, u.email AS user_email, u.id AS user_id,
              (SELECT json_agg(json_build_object('name',p.name,'qty',oi.quantity,'price',oi.price,'image',p.images->>0))
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
    // refund_method: 'wallet' (default) | 'razorpay' | 'replacement'
    const { refund_method = 'wallet' } = req.body
    await client.query('BEGIN')
    const ord = await client.query(
      `SELECT id, status, total_amount, user_id, payment_method, razorpay_payment_id, refund_status, return_type FROM orders WHERE id=$1`,
      [id]
    )
    if (!ord.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Order not found' }) }
    if (ord.rows[0].status !== 7) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Order is not in Return Requested state' }) }

    // Helper: restore inventory for all items in this order
    const restoreInventory = async () => {
      const items = await client.query(
        `SELECT product_id, variant_id, quantity FROM order_items WHERE order_id=$1`, [id]
      )
      for (const item of items.rows) {
        if (item.variant_id) {
          await client.query(
            `UPDATE product_variants SET inventory=inventory+$1, updated_at=NOW() WHERE id=$2`,
            [item.quantity, item.variant_id]
          )
        } else {
          await client.query(
            `UPDATE products SET inventory=inventory+$1, updated_at=NOW() WHERE id=$2`,
            [item.quantity, item.product_id]
          )
        }
      }
    }

    // Helper: deduct loyalty points that were earned when this order was delivered
    const deductEarnedLoyalty = async (userId) => {
      const lpRes = await client.query(
        `SELECT COALESCE(SUM(points), 0) AS pts FROM loyalty_points WHERE order_id=$1 AND type='earn' AND source='order'`,
        [id]
      )
      const pts = Number(lpRes.rows[0]?.pts || 0)
      if (pts > 0) {
        await client.query(
          `UPDATE users SET loyalty_points_balance = GREATEST(0, loyalty_points_balance - $1) WHERE id=$2`,
          [pts, userId]
        )
        await client.query(
          `INSERT INTO loyalty_points (user_id, points, type, source, order_id, description) VALUES ($1,$2,'redeem','return',$3,$4)`,
          [userId, pts, id, `Loyalty points revoked — order #${id} returned`]
        )
      }
    }

    // Handle replacement approval
    if (refund_method === 'replacement') {
      await client.query(`UPDATE orders SET status=8, return_type='replacement', updated_at=NOW() WHERE id=$1`, [id])
      await restoreInventory()
      await deductEarnedLoyalty(ord.rows[0].user_id)
      await client.query('COMMIT')
      try {
        const uRow = await pool.query(`SELECT u.name, u.email, o.invoice_no FROM users u JOIN orders o ON o.user_id=u.id WHERE o.id=$1`, [id])
        if (uRow.rows[0]?.email) {
          const { sendReplacementApprovedEmail } = require('../../../services/email/orderStatusEmail')
          sendReplacementApprovedEmail({ email: uRow.rows[0].email, name: uRow.rows[0].name, orderId: id, invoiceNo: uRow.rows[0].invoice_no })
        }
      } catch (_) {}
      return res.json({ success: true, message: 'Return approved for replacement. Dispatch the replacement item when ready.' })
    }

    const order = ord.rows[0]
    await client.query(`UPDATE orders SET status=8, updated_at=NOW() WHERE id=$1`, [id])
    await restoreInventory()
    await deductEarnedLoyalty(order.user_id)

    if (refund_method === 'razorpay' && order.payment_method === 'online' && order.razorpay_payment_id && order.refund_status !== 'processed') {
      // Trigger Razorpay bank refund immediately
      try {
        const refundAmount = Math.round(Number(order.total_amount) * 100)
        const refund = await razorpay.payments.refund(order.razorpay_payment_id, {
          amount: refundAmount,
          speed: 'normal',
          notes: { order_id: id, type: 'return_refund' }
        })
        await client.query(
          `UPDATE orders SET status=9, refund_id=$1, refund_amount=$2, refund_status='processed', payment_status='refunded', updated_at=NOW() WHERE id=$3`,
          [refund.id, Number(order.total_amount), id]
        )
        await client.query('COMMIT')
        try {
          const uRow = await pool.query(`SELECT u.name, u.email, o.invoice_no, o.total_amount FROM users u JOIN orders o ON o.user_id=u.id WHERE o.id=$1`, [id])
          if (uRow.rows[0]?.email) sendReturnApprovedEmail({ email: uRow.rows[0].email, name: uRow.rows[0].name, orderId: id, invoiceNo: uRow.rows[0].invoice_no, refundAmount: uRow.rows[0].total_amount, refundTo: 'bank' })
        } catch (_) {}
        return res.json({ success: true, message: 'Return approved and Razorpay refund initiated. Amount will reflect in 5-7 business days.' })
      } catch (rzErr) {
        console.error('[RETURN RAZORPAY REFUND ERROR]', rzErr.message)
        // Fall through to wallet credit if Razorpay refund fails
      }
    }

    // Default: wallet credit
    const amount = Number(order.total_amount)
    const userId = order.user_id
    await client.query(
      `INSERT INTO wallet_transactions (user_id, amount, type, source, order_id, description) VALUES ($1,$2,'credit','refund',$3,'Return refund for order #' || $3)`,
      [userId, amount, id]
    )
    await client.query(`UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id=$2`, [amount, userId])
    await client.query('COMMIT')
    try {
      const uRow = await pool.query(`SELECT u.name, u.email, o.invoice_no FROM users u JOIN orders o ON o.user_id=u.id WHERE o.id=$1`, [id])
      if (uRow.rows[0]?.email) sendReturnApprovedEmail({ email: uRow.rows[0].email, name: uRow.rows[0].name, orderId: id, invoiceNo: uRow.rows[0].invoice_no, refundAmount: amount, refundTo: 'wallet' })
    } catch (_) {}
    res.json({ success: true, message: 'Return approved, wallet refund credited.' })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[APPROVE RETURN ERROR]', err.message)
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
    await pool.query(`UPDATE orders SET status=5, return_reject_reason=$1, updated_at=NOW() WHERE id=$2`, [reason, id])
    try {
      const uRow = await pool.query(`SELECT u.name, u.email, o.invoice_no FROM users u JOIN orders o ON o.user_id=u.id WHERE o.id=$1`, [id])
      if (uRow.rows[0]?.email) sendReturnRejectedEmail({ email: uRow.rows[0].email, name: uRow.rows[0].name, orderId: id, invoiceNo: uRow.rows[0].invoice_no, reason })
    } catch (_) {}
    res.json({ success: true, message: 'Return rejected' })
  } catch (err) {
    res.status(500).json({ message: 'Rejection failed' })
  }
}

exports.adminCompleteRefund = async (req, res) => {
  const client = await pool.connect()
  try {
    const { id } = req.params
    await client.query('BEGIN')

    const ord = await client.query(
      `SELECT status, razorpay_payment_id, total_amount, payment_method, refund_status FROM orders WHERE id=$1 FOR UPDATE`,
      [id]
    )
    if (!ord.rows.length) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Order not found' })
    }
    if (ord.rows[0].status !== 8) {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: 'Order is not in Returned state' })
    }

    const order = ord.rows[0]
    await client.query(`UPDATE orders SET status=9, updated_at=NOW() WHERE id=$1`, [id])

    // Razorpay refund for online orders not yet refunded
    if (order.payment_method === 'online' && order.razorpay_payment_id && order.refund_status !== 'processed') {
      try {
        const refundAmount = Math.round(Number(order.total_amount) * 100)
        const refund = await razorpay.payments.refund(order.razorpay_payment_id, {
          amount: refundAmount,
          speed: 'normal',
          notes: { order_id: id, type: 'return_refund' }
        })
        await client.query(
          `UPDATE orders SET refund_id=$1, refund_amount=$2, refund_status='processed', payment_status='refunded', updated_at=NOW() WHERE id=$3`,
          [refund.id, Number(order.total_amount), id]
        )
      } catch (refundErr) {
        console.error('[COMPLETE REFUND RAZORPAY ERROR]', refundErr.message)
        await client.query(`UPDATE orders SET refund_status='failed', updated_at=NOW() WHERE id=$1`, [id])
      }
    }

    await client.query('COMMIT')
    res.json({ success: true, message: 'Refund completed' })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[adminCompleteRefund]', err)
    res.status(500).json({ message: 'Failed' })
  } finally {
    client.release()
  }
}

exports.adminDispatchReplacement = async (req, res) => {
  try {
    const { id } = req.params
    const { tracking_number = null } = req.body
    const ord = await pool.query(`SELECT status, return_type, user_id FROM orders WHERE id=$1`, [id])
    if (!ord.rows.length) return res.status(404).json({ message: 'Order not found' })
    if (ord.rows[0].status !== 8) return res.status(400).json({ message: 'Order must be in Returned state' })
    if (ord.rows[0].return_type !== 'replacement') return res.status(400).json({ message: 'This return was not requested as a replacement' })

    await pool.query(
      `UPDATE orders SET replacement_dispatched_at=NOW(), replacement_tracking=$1, updated_at=NOW() WHERE id=$2`,
      [tracking_number, id]
    )

    // Email + notification (fire-and-forget)
    try {
      const uRow = await pool.query(`SELECT u.name, u.email, o.invoice_no FROM users u JOIN orders o ON o.user_id=u.id WHERE o.id=$1`, [id])
      if (uRow.rows[0]?.email) {
        const { sendReplacementDispatchedEmail } = require('../../../services/email/orderStatusEmail')
        sendReplacementDispatchedEmail({ email: uRow.rows[0].email, name: uRow.rows[0].name, orderId: id, invoiceNo: uRow.rows[0].invoice_no, trackingNumber: tracking_number })
      }
    } catch (_) {}

    try {
      const { createNotification } = require('../../../services/notification.service')
      createNotification(ord.rows[0].user_id, 'order', `Replacement Dispatched — Order #${id}`,
        `Your replacement has been dispatched.${tracking_number ? ` Tracking: ${tracking_number}` : ''}`, { order_id: Number(id) })
    } catch (_) {}

    res.json({ success: true, message: 'Replacement dispatched and customer notified' })
  } catch (err) {
    console.error('[DISPATCH REPLACEMENT]', err)
    res.status(500).json({ message: 'Failed to dispatch replacement' })
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

/* ─── PRODUCT PERFORMANCE ANALYTICS ─── */
exports.getProductPerformance = async (req, res) => {
  try {
    const { from, to, limit: lim = 20, sort = 'revenue' } = req.query
    let where = `WHERE o.status NOT IN (6)` // exclude cancelled
    const params = []
    if (from) { params.push(from); where += ` AND o.created_at >= $${params.length}` }
    if (to)   { params.push(to);   where += ` AND o.created_at <= $${params.length}` }

    const orderByMap = {
      revenue: 'total_revenue DESC',
      units:   'total_units DESC',
      orders:  'order_count DESC',
      returns: 'return_count DESC',
    }
    const orderBy = orderByMap[sort] || 'total_revenue DESC'

    const r = await pool.query(`
      SELECT
        p.id,
        p.name,
        p.price,
        p.inventory,
        p.images->0  AS image,
        p.category_name,
        p.averagerating,
        p.reviewcount,
        COUNT(DISTINCT oi.order_id)                  AS order_count,
        COALESCE(SUM(oi.quantity), 0)                AS total_units,
        COALESCE(SUM(oi.quantity * oi.price), 0)     AS total_revenue,
        COUNT(CASE WHEN o.status IN (7,8) THEN 1 END) AS return_count
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o       ON o.id = oi.order_id ${where}
      GROUP BY p.id
      ORDER BY ${orderBy}
      LIMIT ${Number(lim)}
    `, params)

    res.json({ success: true, data: r.rows })
  } catch (err) {
    console.error('[ProductPerf]', err)
    res.status(500).json({ success: false, message: 'Failed' })
  }
}

/* ─── CHECKOUT FUNNEL ANALYTICS ─── */
exports.getFunnelAnalytics = async (req, res) => {
  try {
    const { from, to } = req.query
    let dateFilter = ''
    const params = []
    if (from) { params.push(from); dateFilter += ` AND created_at >= $${params.length}` }
    if (to)   { params.push(to);   dateFilter += ` AND created_at <= $${params.length}` }

    const [pageViews, cartAdds, checkoutStarts, ordersPlaced, ordersDelivered] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS c FROM analytics_events WHERE event_type='page_view'${dateFilter}`, params),
      pool.query(`SELECT COUNT(*) AS c FROM analytics_events WHERE event_type='add_to_cart'${dateFilter}`, params).catch(() => ({ rows: [{ c: 0 }] })),
      pool.query(`SELECT COUNT(*) AS c FROM analytics_events WHERE event_type='checkout_start'${dateFilter}`, params).catch(() => ({ rows: [{ c: 0 }] })),
      pool.query(`SELECT COUNT(*) AS c FROM orders WHERE 1=1${dateFilter}`, params),
      pool.query(`SELECT COUNT(*) AS c FROM orders WHERE status=5${dateFilter}`, params),
    ])

    const browse = Number(pageViews.rows[0]?.c || 0)
    const cart   = Number(cartAdds.rows[0]?.c || 0)
    const checkout = Number(checkoutStarts.rows[0]?.c || 0)
    const orders = Number(ordersPlaced.rows[0]?.c || 0)
    const delivered = Number(ordersDelivered.rows[0]?.c || 0)

    res.json({
      success: true,
      funnel: [
        { stage: 'Browse', count: browse, pct: 100 },
        { stage: 'Add to Cart', count: cart, pct: browse ? +((cart / browse) * 100).toFixed(1) : 0 },
        { stage: 'Checkout', count: checkout, pct: browse ? +((checkout / browse) * 100).toFixed(1) : 0 },
        { stage: 'Order Placed', count: orders, pct: browse ? +((orders / browse) * 100).toFixed(1) : 0 },
        { stage: 'Delivered', count: delivered, pct: orders ? +((delivered / orders) * 100).toFixed(1) : 0 },
      ],
    })
  } catch (err) {
    console.error('[Funnel]', err)
    res.status(500).json({ success: false, message: 'Failed' })
  }
}

exports.serverStats = async (req, res) => {
  try {
    res.json({ success: true, data: getLiveStats() })
  } catch (err) {
    res.status(500).json({ success: false })
  }
}

exports.customerSegments = async (req, res) => {
  try {
    const [newUsers, loyal, highValue, inactive, vip, topSpenders] = await Promise.all([
      // New users (registered in last 30 days, no orders yet)
      pool.query(`SELECT COUNT(*) AS count FROM users WHERE role=3 AND created_at >= NOW()-INTERVAL '30 days'
        AND id NOT IN (SELECT DISTINCT user_id FROM orders WHERE user_id IS NOT NULL)`),
      // Loyal (3+ orders, status=5 delivered)
      pool.query(`SELECT COUNT(*) AS count FROM (
        SELECT user_id FROM orders WHERE status=5 GROUP BY user_id HAVING COUNT(*)>=3) t`),
      // High-value (single order >5000)
      pool.query(`SELECT COUNT(DISTINCT user_id) AS count FROM orders WHERE total_amount::numeric > 5000`),
      // Inactive (registered > 60 days, last order > 90 days ago or never ordered)
      pool.query(`SELECT COUNT(*) AS count FROM users u WHERE role=3 AND u.created_at < NOW()-INTERVAL '60 days'
        AND (NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id=u.id)
          OR (SELECT MAX(created_at) FROM orders o WHERE o.user_id=u.id) < NOW()-INTERVAL '90 days')`),
      // VIP (lifetime spend >10000)
      pool.query(`SELECT COUNT(*) AS count FROM (
        SELECT user_id FROM orders WHERE status=5 GROUP BY user_id HAVING SUM(total_amount::numeric)>10000) t`),
      // Top 10 spenders
      pool.query(`SELECT u.id, u.name, u.email, COUNT(o.id) AS orders, SUM(o.total_amount::numeric) AS total_spent
        FROM orders o JOIN users u ON u.id=o.user_id WHERE o.status=5
        GROUP BY u.id, u.name, u.email ORDER BY total_spent DESC LIMIT 10`),
    ])
    res.json({
      success: true,
      segments: {
        new_users: Number(newUsers.rows[0].count),
        loyal: Number(loyal.rows[0].count),
        high_value: Number(highValue.rows[0].count),
        inactive: Number(inactive.rows[0].count),
        vip: Number(vip.rows[0].count),
      },
      top_spenders: topSpenders.rows,
    })
  } catch (err) {
    console.error('[customerSegments]', err.message)
    res.status(500).json({ success: false })
  }
}

/* ================= ROLES ================= */

exports.getRoles = async (req, res) => {
  try {
    const r = await pool.query(`SELECT id, name FROM roles ORDER BY id ASC`)
    res.json({ success: true, roles: r.rows })
  } catch (err) {
    console.error('[getRoles]', err.message)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/* ================= PAYMENT LOGS ================= */

exports.getPaymentLogs = async (req, res) => {
  try {
    const {
      order_id,
      event_type,
      initiated_by,
      status,
      from,
      to,
      page = 1,
      limit = 50,
    } = req.query

    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
    const offset = (pageNum - 1) * limitNum

    let where = 'WHERE 1=1'
    const values = []
    let i = 1

    if (order_id) {
      where += ` AND pl.order_id = $${i++}`
      values.push(parseInt(order_id))
    }
    if (event_type) {
      where += ` AND pl.event_type = $${i++}`
      values.push(event_type)
    }
    if (initiated_by) {
      where += ` AND pl.initiated_by = $${i++}`
      values.push(initiated_by)
    }
    if (status) {
      where += ` AND pl.status = $${i++}`
      values.push(status)
    }
    if (from) {
      where += ` AND pl.created_at >= $${i++}`
      values.push(from)
    }
    if (to) {
      where += ` AND pl.created_at <= $${i++}`
      values.push(to)
    }

    const [logs, countRes] = await Promise.all([
      pool.query(
        `SELECT pl.id, pl.order_id, pl.event_type, pl.amount, pl.status,
                pl.gateway_payment_id, pl.gateway_order_id, pl.gateway_refund_id,
                pl.gateway_event, pl.initiated_by, pl.metadata, pl.notes, pl.created_at,
                o.invoice_no, u.name AS user_name, u.email AS user_email
         FROM payment_logs pl
         LEFT JOIN orders o ON o.id = pl.order_id
         LEFT JOIN users u ON u.id = o.user_id
         ${where}
         ORDER BY pl.created_at DESC
         LIMIT $${i++} OFFSET $${i++}`,
        [...values, limitNum, offset]
      ),
      pool.query(
        `SELECT COUNT(*) FROM payment_logs pl ${where}`,
        values
      ),
    ])

    const total = parseInt(countRes.rows[0].count)
    res.json({
      success: true,
      data: logs.rows,
      meta: { total, page: pageNum, pages: Math.ceil(total / limitNum), limit: limitNum },
    })
  } catch (err) {
    console.error('[getPaymentLogs]', err.message)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
