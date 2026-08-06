const pool = require('../../config/db')
const { v4: uuid } = require('uuid')
const { deleteFromAWS, uploadImageToAWS } = require('../../utils/awsImageUpload')

async function resolveProductId(idOrSlug) {
  if (/^\d+$/.test(String(idOrSlug))) return Number(idOrSlug)
  const r = await pool.query('SELECT id FROM products WHERE slug=$1 LIMIT 1', [idOrSlug])
  return r.rows[0]?.id || null
}

/* GET ALL PUBLIC PRODUCTS - ADVANCED FILTER VERSION */

exports.getAllPublic = async (req, res) => {

  try {
    /* ================= VALIDATION ================= */

    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 9))

    const search = req.query.search?.trim() || ''
    const category = req.query.category || 'all'
    const category_id=req.query.category_id||null
    const brand = req.query.brand || null
    const brand_id = req.query.brand_id || null
    const is_featured_filter = req.query.is_featured || null
    const is_bestseller_filter = req.query.is_bestseller || null

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
     if (category_id || req.query.category_slug) {
      let resolvedCatId = category_id
      if (!resolvedCatId && req.query.category_slug) {
        const slugLookup = await pool.query('SELECT id FROM categories WHERE slug=$1 LIMIT 1', [req.query.category_slug])
        resolvedCatId = slugLookup.rows[0]?.id
      }
      if (resolvedCatId) {
        where += ` AND category_id IN (
          WITH RECURSIVE cat_tree AS (
            SELECT id FROM categories WHERE id = $${i}
            UNION ALL
            SELECT c.id FROM categories c JOIN cat_tree ct ON c.parent_id = ct.id
          )
          SELECT id FROM cat_tree
        )`
        values.push(resolvedCatId)
        i++
      }
    }

    if (brand) {
      where += ` AND brand = $${i}`
      values.push(brand)
      i++
    }

    if (brand_id) {
      where += ` AND brand_id = $${i}`
      values.push(brand_id)
      i++
    }

    if (is_featured_filter === 'true') {
      where += ` AND is_featured = TRUE`
    }

    if (is_bestseller_filter === 'true') {
      where += ` AND is_bestseller = TRUE`
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
    const total = Number(count.rows[0].count)

    // Spell correction: if search term returned 0 results, suggest closest product name
    let suggestion = null
    if (search && total === 0) {
      try {
        const suggestRes = await pool.query(
          `SELECT name FROM products WHERE status='active'
           ORDER BY similarity(name, $1) DESC LIMIT 1`,
          [search]
        )
        if (suggestRes.rows.length && suggestRes.rows[0].name) {
          suggestion = suggestRes.rows[0].name
        }
      } catch (_) {}
    }

    res.json({
      success: true,
      products: data.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      suggestion,
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
try{
const isNumeric = /^\d+$/.test(id)
const data= await pool.query(
  `SELECT p.*, b.name AS brand_display_name, b.slug AS brand_slug, b.logo_url AS brand_logo_url
   FROM products p
   LEFT JOIN brands b ON p.brand_id = b.id
   WHERE ${isNumeric ? 'p.id=$1' : 'p.slug=$1'}`,
  [isNumeric ? Number(id) : id]
)
if(data?.rows?.length>=1){
  res?.status(200).json({data:data?.rows[0],status:200})
}else{
  res.status(404).json({msg:"Product not found"})
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





/* ===============================
   TOGGLE WISHLIST (ADD / REMOVE)
================================= */

exports.toggleWishlist = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user?.id;
    const { productId } = req.body;

    /* ================= VALIDATION ================= */

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if ((!productId || isNaN(productId))&&!req.query.me) {
      return res.status(400).json({
        success: false,
        message: "Invalid product id",
      });
    }

    await client.query("BEGIN");

    /* ================= CHECK PRODUCT ================= */

    const productCheck = await client.query(
      `SELECT id FROM products WHERE id=$1 AND status='active'`,
      [productId]
    );

    if (!productCheck.rowCount) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    /* ================= CHECK EXIST ================= */

    const exist = await client.query(
      `SELECT id FROM wishlist WHERE user_id=$1 AND product_id=$2`,
      [userId, productId]
    );

    /* ================= REMOVE ================= */

    if (exist.rowCount > 0) {
      await client.query(
        `DELETE FROM wishlist WHERE user_id=$1 AND product_id=$2`,
        [userId, productId]
      );

      await client.query("COMMIT");

      return res.status(200).json({
        success: true,
        liked: false,
        message: "Removed from wishlist",
      });
    }

    /* ================= INSERT ================= */

    await client.query(
      `INSERT INTO wishlist (user_id, product_id) VALUES ($1,$2)`,
      [userId, productId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      liked: true,
      message: "Added to wishlist",
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Wishlist Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });

  } finally {
    client.release();
  }
};

/* ===============================
   GET USER WISHLIST
================================= */

exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user?.id;

    let { page = 1, limit = 10, search = "" } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const offset = (page - 1) * limit;

    /* ================= QUERY ================= */

    const query = `
      SELECT
        w.id AS wishlist_id,

        p.id,
        p.name,
        p.slug,
        p.price,
        p.compareprice,
        p.images,
        p.inventory,
        p.status,
        p.averagerating,
        p.category_name,
        p.reviewcount

      FROM wishlist w

      JOIN products p
        ON w.product_id = p.id

      WHERE
        w.user_id = $1
        AND p.status='active'
        AND p.name ILIKE $2

      ORDER BY w.created_at DESC

      LIMIT $3 OFFSET $4
    `;

    const result = await pool.query(query, [
      userId,
      `%${search}%`,
      limit,
      offset,
    ]);

    /* ================= COUNT ================= */

    const countQuery = `
      SELECT COUNT(*)
      FROM wishlist w
      JOIN products p ON w.product_id=p.id
      WHERE w.user_id=$1
      AND p.status='active'
      AND p.name ILIKE $2
    `;

    const countResult = await pool.query(countQuery, [
      userId,
      `%${search}%`,
    ]);

    const total = parseInt(countResult.rows[0].count);

    res.status(200).json({
      success: true,
      data: result.rows,

      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error("Get Wishlist Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
exports.removeWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const result = await pool.query(
      `DELETE FROM wishlist
       WHERE user_id=$1 AND product_id=$2
       RETURNING id`,
      [userId, productId]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Removed",
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/* ================== RATINGS ================== */

exports.addReview = async (req, res) => {
  let uploaded = []
  try {
    const userId = req.user.id
    const { productId: rawProductId, rating, comment, oldImages = '[]' } = req.body

    if (!rawProductId || !rating) {
      return res.status(400).json({ success: false, message: 'productId and rating are required' })
    }

    const productId = await resolveProductId(rawProductId)
    if (!productId) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }

    // Verify the user has a delivered order containing this product
    const purchaseCheck = await pool.query(
      `SELECT 1 FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status = 5 LIMIT 1`,
      [userId, productId]
    )
    if (!purchaseCheck.rowCount) {
      return res.status(403).json({ success: false, message: 'You can only review products you have purchased and received.' })
    }

    // Load existing images to delete removed ones
    const exist = await pool.query(
      `SELECT images FROM reviews WHERE user_id=$1 AND product_id=$2`,
      [userId, productId]
    )
    const dbImages = exist.rowCount ? (exist.rows[0].images || []) : []

    let oldImgs = []
    try { oldImgs = JSON.parse(oldImages) } catch { oldImgs = [] }
    if (!Array.isArray(oldImgs)) oldImgs = []

    const toDelete = dbImages.filter(img => !oldImgs.includes(img))
    for (const img of toDelete) await deleteFromAWS(img)

    // Upload new files
    let newImages = []
    if (req.files?.length) {
      for (const file of req.files) {
        const url = await uploadImageToAWS(file)
        uploaded.push(url)
        newImages.push(url)
      }
    }

    const finalImages = [...oldImgs, ...newImages].slice(0, 5)

    await pool.query(`
      INSERT INTO reviews (user_id, product_id, rating, comment, images)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET rating = $3, comment = $4, images = $5
    `, [userId, productId, Number(rating), comment || '', JSON.stringify(finalImages)])

    await pool.query(`
      UPDATE products SET
        averagerating = (SELECT AVG(rating) FROM reviews WHERE product_id = $1),
        reviewcount   = (SELECT COUNT(*)    FROM reviews WHERE product_id = $1)
      WHERE id = $1
    `, [productId])

    res.json({ success: true })
  } catch (err) {
    for (const url of uploaded) await deleteFromAWS(url).catch(() => {})
    console.error('[addReview]', err.message)
    res.status(500).json({ success: false, message: 'Failed to submit review' })
  }
}
exports.addOrUpdateReview = async (req, res) => {

  const client = await pool.connect();
  let uploaded = [];

  try {

    /* ================= AUTH ================= */

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    /* ================= INPUT ================= */

    const { orderId } = req.params;
    const productId = await resolveProductId(req.params.productId);

    let {
      rating,
      comment,
      oldImages = "[]"
    } = req.body;

    if (!orderId || !productId || !rating) {
      return res.status(400).json({
        message: "Order, product & rating required"
      });
    }

    rating = Number(rating);

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Invalid rating"
      });
    }

    /* ================= SAFE PARSE ================= */

    let oldImgs = [];

    try {
      oldImgs = JSON.parse(oldImages || "[]");
    } catch {
      oldImgs = [];
    }

    if (!Array.isArray(oldImgs)) {
      oldImgs = [];
    }

    const newCount = req.files?.length || 0;

    if (oldImgs.length + newCount > 5) {
      return res.status(400).json({
        message: "Max 5 images allowed"
      });
    }

    await client.query("BEGIN");

    /* ================= VERIFY ORDER ================= */

    const purchase = await client.query(`
      SELECT 1
      FROM orders o
      JOIN order_items oi ON oi.order_id=o.id
      WHERE
        o.id=$1
        AND o.user_id=$2
        AND oi.product_id=$3
        AND o.status=5
      LIMIT 1
    `, [orderId, userId, productId]);

    if (!purchase.rowCount) {
      throw new Error("Invalid order or product");
    }

    /* ================= GET OLD REVIEW ================= */

    const exist = await client.query(`
      SELECT images
      FROM reviews
      WHERE order_id=$1 AND product_id=$2
      FOR UPDATE
    `, [orderId, productId]);

    const dbImages = exist.rowCount
      ? exist.rows[0].images || []
      : [];

    /* ================= DELETE REMOVED ================= */

    const toDelete = dbImages.filter(
      img => !oldImgs.includes(img)
    );

    for (const img of toDelete) {
      await deleteFromAWS(img);
    }

    /* ================= UPLOAD ================= */

    let newImages = [];

    if (req.files?.length) {

      for (const file of req.files) {

        const url = await uploadImageToAWS(file);

        uploaded.push(url);
        newImages.push(url);
      }
    }

    const finalImages = [
      ...oldImgs,
      ...newImages
    ];

    /* ================= UPSERT ================= */

    await client.query(`
      INSERT INTO reviews
      (user_id, order_id, product_id, rating, comment, images)

      VALUES($1,$2,$3,$4,$5,$6)

      ON CONFLICT(order_id, product_id)

      DO UPDATE SET
        rating=$4,
        comment=$5,
        images=$6,
        created_at=NOW()
    `, [
      userId,
      orderId,
      productId,
      rating,
      comment?.trim() || "",
      JSON.stringify(finalImages)
    ]);

    /* ================= UPDATE PRODUCT ================= */

    await client.query(`
      UPDATE products SET

        averagerating = ROUND((
          SELECT AVG(rating)
          FROM reviews
          WHERE product_id=$1
        ),1),

        reviewcount = (
          SELECT COUNT(*)
          FROM reviews
          WHERE product_id=$1
        )

      WHERE id=$1
    `, [productId]);

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Review saved successfully"
    });

  } catch (err) {

    await client.query("ROLLBACK");

    console.error("REVIEW ERROR:", err);

    for (const url of uploaded) {
      await deleteFromAWS(url);
    }

    res.status(500).json({
      message: err.message || "Review failed"
    });

  } finally {

    client.release();
  }
};

/* ================= GET PRODUCT REVIEWS ================= */


exports.getAllReviews = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      rating,
      productId,
      userId,
      from,
      to,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    /* ================= VALID SORT ================= */

    const allowedSortFields = ['created_at', 'rating'];
    const allowedOrder = ['asc', 'desc'];

    const finalSortField = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'created_at';

    const finalSortOrder = allowedOrder.includes(sortOrder?.toLowerCase())
      ? sortOrder
      : 'desc';

    /* ================= DYNAMIC CONDITIONS ================= */

    let conditions = [];
    let values = [];
    let index = 1;

    if (search) {
      conditions.push(`
        (
          p.name ILIKE $${index}
          OR u.name ILIKE $${index}
          OR r.comment ILIKE $${index}
        )
      `);
      values.push(`%${search}%`);
      index++;
    }

    if (rating) {
      conditions.push(`r.rating = $${index}`);
      values.push(Number(rating));
      index++;
    }

    if (productId) {
      conditions.push(`r.product_id = $${index}`);
      values.push(productId);
      index++;
    }

    if (userId) {
      conditions.push(`r.user_id = $${index}`);
      values.push(userId);
      index++;
    }

    if (from && to) {
      conditions.push(`r.created_at BETWEEN $${index} AND $${index + 1}`);
      values.push(from, to);
      index += 2;
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    /* ================= MAIN QUERY ================= */

    const dataQuery = `
      SELECT 
        r.id,
        r.rating,
        r.comment,
        r.images,
        r.created_at,

        u.id AS user_id,
        u.name AS user_name,

        p.id AS product_id,
        p.name AS product_name,
        p.slug AS product_slug

      FROM reviews r
      JOIN users u ON u.id = r.user_id
      JOIN products p ON p.id = r.product_id

      ${whereClause}

      ORDER BY r.${finalSortField} ${finalSortOrder}
      LIMIT $${index}
      OFFSET $${index + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) 
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      JOIN products p ON p.id = r.product_id
      ${whereClause}
    `;

    const dataResult = await client.query(
      dataQuery,
      [...values, Number(limit), offset]
    );

    const countResult = await client.query(countQuery, values);

    const total = Number(countResult.rows[0].count);

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("GET REVIEWS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews"
    });
  } finally {
    client.release();
  }
};
exports.getProductReviews = async (req, res) => {

  try {
    console.log(req.query)

    const rawProductId = req?.query?.productId || req?.params?.productId;
    const productId = rawProductId ? await resolveProductId(rawProductId) : null;
    const userId = req.user?.id || null; // optional
    const onlyMe = req.query.me === "1";

    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 10;

    if (limit > 50) limit = 50;
    if (page < 1) page = 1;

    if ((!productId || productId <= 0)&&!req.query.me) {
      return res.status(400).json({
        success: false,
        message: "Invalid product id",
      });
    }

    if (onlyMe && !userId) {
      return res.status(401).json({
        success: false,
        message: "Login required",
      });
    }

    const offset = (page - 1) * limit;

    /* ================= WHERE ================= */

    const isBulk = Array.isArray(req.body?.productId);
    let whereClause = isBulk ? "r.product_id = ANY($1)" : "r.product_id = $1";
    let params = [isBulk ? req.body.productId : productId];

    if (onlyMe) {
      whereClause += " AND r.user_id = $2";
      params.push(userId);
    }

    /* ================= COUNT ================= */

    const countQuery = `
      SELECT COUNT(*)
      FROM reviews r
      WHERE ${whereClause}
    `;

    const countResult = await pool.query(countQuery, params);

    const totalReviews = Number(countResult.rows[0].count);
    const totalPages = Math.ceil(totalReviews / limit);

    /* ================= DATA ================= */

    let reviewQueryParams = [...params];

    reviewQueryParams.push(limit);
    reviewQueryParams.push(offset);

    // Add userId for is_mine detection (even if null)
    reviewQueryParams.push(userId || 0);

    const sortMode = req.query.sort || 'newest'
    const orderClause = sortMode === 'helpful'
      ? `r.helpful_count DESC, r.created_at DESC`
      : sortMode === 'highest'
      ? `r.rating DESC, r.created_at DESC`
      : sortMode === 'lowest'
      ? `r.rating ASC, r.created_at DESC`
      : `r.created_at DESC`

    const reviewsQuery = `
      SELECT
        r.id,
        r.rating,
        r.comment,
        r.images,
        r.created_at,
        r.product_id,
        r.order_id,
        r.helpful_count,
        u.name AS user_name,
        (r.user_id = $${reviewQueryParams.length}) AS is_mine,
        EXISTS (
          SELECT 1 FROM order_items oi
          JOIN orders o ON o.id = oi.order_id
          WHERE oi.product_id = r.product_id
            AND o.user_id = r.user_id
            AND o.status = 5
        ) AS is_verified_purchase,
        EXISTS (
          SELECT 1 FROM review_helpful_votes rhv
          WHERE rhv.review_id = r.id AND rhv.user_id = $${reviewQueryParams.length}
        ) AS user_found_helpful,
        r.admin_reply,
        r.admin_replied_at

      FROM reviews r

      JOIN users u
        ON r.user_id = u.id

      WHERE ${whereClause}

      ORDER BY ${orderClause}

      LIMIT $${reviewQueryParams.length - 2}
      OFFSET $${reviewQueryParams.length - 1}
    `;

    const reviewsResult = await pool.query(
      reviewsQuery,
      reviewQueryParams
    );

    return res.status(200).json({

      success: true,

      pagination: {
        totalReviews,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },

      data: reviewsResult.rows,
    });

  } catch (error) {

    console.error("❌ Get Reviews Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching reviews",
    });
  }
};

/* ================= DELETE ================= */

exports.deleteReview = async (req, res) => {
  const userId = req.user.id;
  const id = req.params.id;

  try {
    const review = await pool.query(
      `
      DELETE FROM reviews
      WHERE id=$1 AND user_id=$2
      RETURNING images, product_id
    `,
      [id, userId]
    );

    if (!review.rowCount) {
      return res.status(404).json({
        message: "Not found",
      });
    }

    /* delete aws images */
    for (const img of review.rows[0].images || []) {
      await deleteFromAWS(img);
    }

    /* update rating */
    await pool.query(
      `
      UPDATE products SET

        averagerating = (
          SELECT COALESCE(AVG(rating),0)
          FROM reviews
          WHERE product_id=$1
        ),

        reviewcount = (
          SELECT COUNT(*)
          FROM reviews
          WHERE product_id=$1
        )

      WHERE id=$1
    `,
      [review.rows[0].product_id]
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Delete failed",
    });
  }
};

/* ================== CART ================== */

exports.addToCart = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' })
    const { productId, quantity } = req.body

    await pool.query(`
      INSERT INTO cart (id,user_id,product_id,quantity)
      VALUES($1,$2,$3,$4)
      ON CONFLICT(user_id,product_id)
      DO UPDATE SET quantity = cart.quantity + $4
    `, [uuid(), userId, productId, quantity || 1])

    res.json({ success: true })
  } catch (err) {
    console.error('[addToCart]', err)
    res.status(500).json({ success: false, message: 'Failed to add to cart' })
  }
}


/* ================== GET CART ================== */

exports.getCart = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' })

    const data = await pool.query(`
      SELECT c.*, p.name, p.price, p.images, p.inventory
      FROM cart c
      JOIN products p ON p.id = c.product_id
      WHERE c.user_id=$1
    `, [userId])

    res.json({ items: data.rows })
  } catch (err) {
    console.error('[getCart]', err)
    res.status(500).json({ success: false, message: 'Failed to fetch cart' })
  }
}

/* ─────────────────────────────────────────────────────────
   SEARCH AUTOCOMPLETE SUGGESTIONS
───────────────────────────────────────────────────────── */
exports.searchSuggestions = async (req, res) => {
  try {
    const q = (req.query.q || '').trim()
    if (!q || q.length < 2) return res.json({ products: [], categories: [] })

    const [products, categories] = await Promise.all([
      pool.query(`
        SELECT id, name, slug, price, compareprice, images, category_name, averagerating
        FROM products
        WHERE status = 'active' AND (name ILIKE $1 OR category_name ILIKE $1 OR tags::text ILIKE $1)
        ORDER BY averagerating DESC NULLS LAST, reviewcount DESC NULLS LAST
        LIMIT 8
      `, [`%${q}%`]),
      pool.query(`
        SELECT id, name, slug, image_url FROM categories
        WHERE is_active = TRUE AND name ILIKE $1
        LIMIT 4
      `, [`%${q}%`]),
    ])

    res.json({
      products: products.rows.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        compareprice: p.compareprice,
        images: p.images || [],
        category_name: p.category_name,
        rating: p.averagerating,
      })),
      categories: categories.rows,
    })
  } catch (err) {
    console.error('[SEARCH SUGGESTIONS]', err)
    res.status(500).json({ products: [], categories: [] })
  }
}

/* ─────────────────────────────────────────────────────────
   RELATED PRODUCTS (same category, exclude self)
───────────────────────────────────────────────────────── */
exports.getRelatedProducts = async (req, res) => {
  try {
    const pid = await resolveProductId(req.params.id)
    if (!pid) return res.json({ products: [] })
    const id = pid
    const product = await pool.query(
      `SELECT category_id, price FROM products WHERE id=$1 AND status='active'`, [id]
    )
    if (!product.rows.length) return res.json({ products: [] })

    const { category_id, price } = product.rows[0]
    const related = await pool.query(`
      SELECT id, name, slug, price, compareprice, images, averagerating, reviewcount, inventory, category_name, is_bestseller
      FROM products
      WHERE status = 'active'
        AND id != $1
        AND (category_id = $2 OR (price BETWEEN $3 AND $4))
      ORDER BY
        CASE WHEN category_id = $2 THEN 0 ELSE 1 END,
        averagerating DESC
      LIMIT 8
    `, [id, category_id, Number(price) * 0.5, Number(price) * 2])

    res.json({ products: related.rows })
  } catch (err) {
    console.error('[RELATED PRODUCTS]', err)
    res.status(500).json({ products: [] })
  }
}

/* ─────────────────────────────────────────────────────────
   PRODUCT VARIANTS
───────────────────────────────────────────────────────── */
exports.getProductVariants = async (req, res) => {
  try {
    const pid = await resolveProductId(req.params.id)
    if (!pid) return res.json({ variants: [] })
    const result = await pool.query(`
      SELECT * FROM product_variants
      WHERE product_id = $1 AND is_active = TRUE
      ORDER BY sort_order ASC, price ASC
    `, [pid])
    res.json({ variants: result.rows })
  } catch (err) {
    res.status(500).json({ variants: [] })
  }
}

/* ─────────────────────────────────────────────────────────
   NOTIFY ME WHEN BACK IN STOCK
───────────────────────────────────────────────────────── */
exports.notifyMe = async (req, res) => {
  try {
    const { productId, variantId } = req.body
    const userId = req.user?.id || null
    let email = req.body.email || null
    if (!email && userId) {
      const uRes = await pool.query('SELECT email FROM users WHERE id=$1', [userId])
      email = uRes.rows[0]?.email || null
    }

    if (!productId || !email) {
      return res.status(400).json({ success: false, message: 'productId and email required' })
    }

    // Check if product is actually OOS
    const pRes = await pool.query(
      `SELECT inventory FROM products WHERE id=$1`, [productId]
    )
    if (!pRes.rows.length) return res.status(404).json({ success: false, message: 'Product not found' })

    if (pRes.rows[0].inventory > 0 && !variantId) {
      return res.status(400).json({ success: false, message: 'Product is currently in stock' })
    }

    await pool.query(`
      INSERT INTO stock_notifications (product_id, variant_id, email, user_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (product_id, COALESCE(variant_id, 0), email) DO NOTHING
    `, [productId, variantId || null, email.toLowerCase(), userId])

    res.json({ success: true, message: "We'll notify you when this is back in stock!" })
  } catch (err) {
    console.error('[NOTIFY ME]', err)
    res.status(500).json({ success: false, message: 'Failed to save notification' })
  }
}

/* ─────────────────────────────────────────────────────────
   PINCODE DELIVERY CHECK
───────────────────────────────────────────────────────── */
exports.checkPincode = async (req, res) => {
  try {
    const pincode = (req.query.pincode || '').trim()
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ success: false, message: 'Invalid pincode' })
    }

    // Check specific pincode
    const result = await pool.query(
      `SELECT city, state, delivery_days FROM serviceable_pincodes WHERE pincode=$1 AND is_active=TRUE`,
      [pincode]
    )

    if (result.rows.length) {
      const { city, state, delivery_days } = result.rows[0]
      const deliveryDate = new Date()
      deliveryDate.setDate(deliveryDate.getDate() + delivery_days)
      const formatted = deliveryDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
      return res.json({
        success: true, serviceable: true,
        city, state, delivery_days,
        delivery_by: formatted,
        message: `Delivery by ${formatted}`,
      })
    }

    // Generic estimate for all Indian pincodes (basic check)
    const firstTwo = pincode.substring(0, 2)
    const nonServiceable = ['00', '99']
    if (nonServiceable.includes(firstTwo)) {
      return res.json({ success: true, serviceable: false, message: 'Delivery not available to this pincode' })
    }

    // Default: all valid Indian pincodes get 5-7 day estimate
    const deliveryDate = new Date()
    deliveryDate.setDate(deliveryDate.getDate() + 6)
    const formatted = deliveryDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
    res.json({
      success: true, serviceable: true,
      delivery_days: 6, delivery_by: formatted,
      message: `Estimated delivery by ${formatted}`,
    })
  } catch (err) {
    console.error('[PINCODE CHECK]', err)
    res.status(500).json({ success: false, message: 'Check failed' })
  }
}

/* ─────────────────────────────────────────────────────────
   RATING BREAKDOWN (per-star counts + average)
───────────────────────────────────────────────────────── */
exports.getRatingBreakdown = async (req, res) => {
  try {
    const pid = await resolveProductId(req.params.id)
    if (!pid) return res.json({ breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, total: 0, average: 0 })
    const result = await pool.query(`
      SELECT
        rating,
        COUNT(*) as count
      FROM reviews
      WHERE product_id = $1
      GROUP BY rating
      ORDER BY rating DESC
    `, [pid])

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    let total = 0
    let weightedSum = 0

    result.rows.forEach((r) => {
      breakdown[r.rating] = Number(r.count)
      total += Number(r.count)
      weightedSum += r.rating * Number(r.count)
    })

    res.json({
      breakdown,
      total,
      average: total > 0 ? +(weightedSum / total).toFixed(1) : 0,
    })
  } catch (err) {
    res.status(500).json({ breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, total: 0, average: 0 })
  }
}

/* ─────────────────────────────────────────────────────────
   RECENTLY VIEWED (log + get for logged-in users)
───────────────────────────────────────────────────────── */
exports.logRecentlyViewed = async (req, res) => {
  try {
    const userId = req.user?.id
    const { productId } = req.body
    if (!userId || !productId) return res.json({ success: true })

    await pool.query(`
      INSERT INTO recently_viewed (user_id, product_id, viewed_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id, product_id) DO UPDATE SET viewed_at = NOW()
    `, [userId, productId])

    // Keep only last 20
    await pool.query(`
      DELETE FROM recently_viewed
      WHERE user_id = $1
        AND product_id NOT IN (
          SELECT product_id FROM recently_viewed
          WHERE user_id = $1
          ORDER BY viewed_at DESC
          LIMIT 20
        )
    `, [userId])

    res.json({ success: true })
  } catch (err) {
    res.json({ success: true })
  }
}

exports.getRecentlyViewed = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.json({ products: [] })

    const result = await pool.query(`
      SELECT p.id, p.name, p.slug, p.price, p.compareprice, p.images, p.averagerating, p.inventory, p.category_name, p.is_bestseller
      FROM recently_viewed rv
      JOIN products p ON p.id = rv.product_id
      WHERE rv.user_id = $1 AND p.status = 'active'
      ORDER BY rv.viewed_at DESC
      LIMIT 10
    `, [userId])

    res.json({ products: result.rows })
  } catch (err) {
    res.status(500).json({ products: [] })
  }
}

/* ─────────────────────────────────────────────────────────
   TRENDING PRODUCTS
   Scored by (reviewcount * 0.4 + avg_rating * 20 * 0.6),
   limited to in-stock active products.
───────────────────────────────────────────────────────── */
exports.getTrending = async (req, res) => {
  try {
    const limit = Math.min(20, parseInt(req.query.limit) || 8)
    const result = await pool.query(`
      SELECT id, name, slug, price, compareprice, images,
             averagerating, reviewcount, inventory, category_name, is_bestseller
      FROM products
      WHERE status = 'active' AND inventory > 0
      ORDER BY
        (COALESCE(reviewcount,0) * 0.4 + COALESCE(averagerating,0) * 20 * 0.6) DESC,
        created_at DESC
      LIMIT $1
    `, [limit])
    res.json({ success: true, products: result.rows })
  } catch (err) {
    console.error('[TRENDING]', err)
    res.status(500).json({ success: false, products: [] })
  }
}

/* ================= REVIEW HELPFUL VOTE ================= */
exports.voteReviewHelpful = async (req, res) => {
  const userId = req.user?.id
  const reviewId = parseInt(req.params.id)
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' })
  if (!reviewId) return res.status(400).json({ success: false, message: 'Invalid review' })
  const client = await pool.connect()
  try {
    // Check review exists and is approved
    const rev = await client.query(`SELECT id FROM reviews WHERE id=$1 AND status='approved'`, [reviewId])
    if (!rev.rows.length) return res.status(404).json({ success: false, message: 'Review not found' })

    // Check if already voted
    const existing = await client.query(
      `SELECT id FROM review_helpful_votes WHERE review_id=$1 AND user_id=$2`, [reviewId, userId]
    )
    if (existing.rows.length) {
      // Toggle off
      await client.query(`DELETE FROM review_helpful_votes WHERE review_id=$1 AND user_id=$2`, [reviewId, userId])
      await client.query(`UPDATE reviews SET helpful_count = GREATEST(0, helpful_count - 1) WHERE id=$1`, [reviewId])
      const r = await client.query(`SELECT helpful_count FROM reviews WHERE id=$1`, [reviewId])
      return res.json({ success: true, voted: false, helpful_count: r.rows[0].helpful_count })
    }

    await client.query(`INSERT INTO review_helpful_votes (review_id, user_id) VALUES ($1, $2)`, [reviewId, userId])
    await client.query(`UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id=$1`, [reviewId])
    const r = await client.query(`SELECT helpful_count FROM reviews WHERE id=$1`, [reviewId])
    res.json({ success: true, voted: true, helpful_count: r.rows[0].helpful_count })
  } catch (err) {
    console.error('[voteReviewHelpful]', err.message)
    res.status(500).json({ success: false, message: 'Failed to vote' })
  } finally {
    client.release()
  }
}

/* ================= GET USER HELPFUL VOTES (for a product) ================= */
exports.getUserHelpfulVotes = async (req, res) => {
  const userId = req.user?.id
  const productId = parseInt(req.params.productId)
  if (!userId) return res.json({ success: true, voted_review_ids: [] })
  try {
    const result = await pool.query(
      `SELECT rhv.review_id FROM review_helpful_votes rhv
       JOIN reviews r ON r.id = rhv.review_id
       WHERE r.product_id=$1 AND rhv.user_id=$2`,
      [productId, userId]
    )
    res.json({ success: true, voted_review_ids: result.rows.map(r => r.review_id) })
  } catch (err) {
    res.json({ success: true, voted_review_ids: [] })
  }
}
