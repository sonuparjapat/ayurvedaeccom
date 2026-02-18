const pool = require('../../config/db')
const { v4: uuid } = require('uuid')




/* GET ALL PUBLIC PRODUCTS - ADVANCED FILTER VERSION */

exports.getAllPublic = async (req, res) => {
  try {
    /* ================= VALIDATION ================= */

    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 9))

    const search = req.query.search?.trim() || ''
    const category = req.query.category || 'all'
    const brand = req.query.brand || null

    const minPrice = parseFloat(req.query.minPrice) || 0
    const maxPrice = parseFloat(req.query.maxPrice) || null

    const rating = parseFloat(req.query.rating) || 0
    const inStock = req.query.inStock === 'true'
    const discountOnly = req.query.discount === 'true'

    const sortBy = req.query.sortBy || 'created_at'
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC'

    const offset = (page - 1) * limit

    /* ================= SAFE SORT WHITELIST ================= */

    const allowedSortFields = [
      'created_at',
      'price',
      'averagerating',
      'name',
    ]

    const orderField = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'created_at'

    /* ================= QUERY BUILD ================= */

    let where = `WHERE status = 'active'`
    let values = []
    let i = 1

    if (search) {
      where += ` AND name ILIKE $${i}`
      values.push(`%${search}%`)
      i++
    }

    if (category !== 'all') {
      where += ` AND category_name = $${i}`
      values.push(category)
      i++
    }

    if (brand) {
      where += ` AND brand = $${i}`
      values.push(brand)
      i++
    }

    if (minPrice) {
      where += ` AND price >= $${i}`
      values.push(minPrice)
      i++
    }

    if (maxPrice) {
      where += ` AND price <= $${i}`
      values.push(maxPrice)
      i++
    }

    if (rating) {
      where += ` AND averagerating >= $${i}`
      values.push(rating)
      i++
    }

    if (inStock) {
      where += ` AND inventory > 0`
    }

    if (discountOnly) {
      where += ` AND compareprice IS NOT NULL AND compareprice > price`
    }

    /* ================= DATA QUERY ================= */

    const dataQuery = `
      SELECT *
      FROM products
      ${where}
      ORDER BY ${orderField} ${sortOrder}
      LIMIT $${i} OFFSET $${i + 1}
    `

    const data = await pool.query(dataQuery, [
      ...values,
      limit,
      offset,
    ])

    /* ================= COUNT QUERY ================= */

    const countQuery = `
      SELECT COUNT(*)
      FROM products
      ${where}
    `

    const count = await pool.query(countQuery, values)

    res.json({
      success: true,
      products: data.rows,
      total: Number(count.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(Number(count.rows[0].count) / limit),
    })

  } catch (err) {
    console.error('Product Fetch Error:', err)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
    })
  }
}

exports.getsingleproduct=async(req,res)=>{
  const {id}=req.params
  console.log(id,"id coming")
try{
const data= await pool.query('select * from products where id=$1',[id])
if(data?.rows?.length>=1){
  res?.status(200).json({data:data?.rows[0],status:200})
}else{
  res?.status(204).json({msg:"No Data found",status:204})
}
}catch(err){
    console.error(err)

    res.status(500).json({
      message: 'Fetch failed'
    })
}
}
/* GET ALL CATEGORIES */

exports.getCategories = async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT DISTINCT category_name
      FROM products
      WHERE category_name IS NOT NULL
      ORDER BY category_name
    `)

    const categories = result.rows.map(
      r => r.category_name
    )

    res.json({ categories })

  } catch (err) {

    console.error(err)

    res.status(500).json({
      message: 'Category fetch failed'
    })

  }
}

/* GET PRODUCTS (FILTER + SEARCH + PAGINATION) */

exports.getAllPublic = async (req, res) => {

  try {

    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 9

    const search = req.query.search || ''
    const category = req.query.category || 'all'

    const offset = (page - 1) * limit


    /* ================= FILTER ================= */

    let where = `WHERE 1=1`
    let values = []
    let i = 1


    if (search) {
      where += ` AND name ILIKE $${i}`
      values.push(`%${search}%`)
      i++
    }


    if (category !== 'all') {
      where += ` AND category_name = $${i}`
      values.push(category)
      i++
    }


    /* ================= DATA ================= */

    const data = await pool.query(`

      SELECT *
      FROM products

      ${where}

      ORDER BY created_at DESC

      LIMIT $${i} OFFSET $${i + 1}

    `, [
      ...values,
      limit,
      offset,
    ])


    /* ================= COUNT ================= */

    const count = await pool.query(`

      SELECT COUNT(*)
      FROM products

      ${where}

    `, values)


    res.json({

      products: data.rows,

      total: Number(count.rows[0].count),

      page,

      limit,

    })

  } catch (err) {

    console.error(err)

    res.status(500).json({
      message: 'Fetch failed'
    })

  }

}



/* ================== WISHLIST ================== */

// Toggle Like
exports.toggleWishlist = async (req, res) => {

  const userId = req.user.id
  const { productId } = req.body


  const exist = await pool.query(
    `SELECT * FROM wishlist WHERE user_id=$1 AND product_id=$2`,
    [userId, productId]
  )


  if (exist.rowCount) {

    await pool.query(
      `DELETE FROM wishlist WHERE user_id=$1 AND product_id=$2`,
      [userId, productId]
    )

    return res.json({ liked: false })

  }


  await pool.query(
    `INSERT INTO wishlist VALUES($1,$2,$3)`,
    [uuid(), userId, productId]
  )

  res.json({ liked: true })

}


/* ================== RATINGS ================== */

exports.addReview = async (req, res) => {

  const userId = req.user.id
  const { productId, rating, comment } = req.body


  await pool.query(`

    INSERT INTO reviews
    (id,user_id,product_id,rating,comment)

    VALUES($1,$2,$3,$4,$5)

    ON CONFLICT(user_id,product_id)

    DO UPDATE SET
      rating=$4,
      comment=$5

  `, [
    uuid(),
    userId,
    productId,
    rating,
    comment,
  ])


  // Update avg rating
  await pool.query(`

    UPDATE products
    SET
      averagerating = (
        SELECT AVG(rating)
        FROM reviews
        WHERE product_id=$1
      ),

      reviewcount = (
        SELECT COUNT(*)
        FROM reviews
        WHERE product_id=$1
      )

    WHERE id=$1

  `, [productId])


  res.json({ success: true })

}


/* ================== CART ================== */

exports.addToCart = async (req, res) => {

  const userId = req.user.id
  const { productId, quantity } = req.body


  await pool.query(`

    INSERT INTO cart
    (id,user_id,product_id,quantity)

    VALUES($1,$2,$3,$4)

    ON CONFLICT(user_id,product_id)

    DO UPDATE SET
      quantity = cart.quantity + $4

  `, [
    uuid(),
    userId,
    productId,
    quantity || 1,
  ])


  res.json({ success: true })

}


/* ================== GET CART ================== */

exports.getCart = async (req, res) => {

  const userId = req.user.id


  const data = await pool.query(`

    SELECT
      c.*,
      p.name,
      p.price,
      p.images,
      p.inventory

    FROM cart c

    JOIN products p
    ON p.id = c.product_id

    WHERE c.user_id=$1

  `, [userId])


  res.json({
    items: data.rows,
  })

}
