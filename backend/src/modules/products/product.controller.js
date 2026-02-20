const pool = require('../../config/db')
const { v4: uuid } = require('uuid')
const { deleteFromAWS, uploadImageToAWS } = require('../../utils/awsImageUpload')




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

  const userId = req.user.id
  const { productId, rating, comment } = req.body

console.log(req.body, "chec")
  await pool.query(`

    INSERT INTO reviews
    (user_id,product_id,rating,comment)

    VALUES($1,$2,$3,$4)

    ON CONFLICT(user_id,product_id)

    DO UPDATE SET
      rating=$3,
      comment=$4

  `, [
    userId,
    productId,
    Number(rating),
    comment||"",
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

    const { orderId, productId } = req.params;

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
        AND o.status=4
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

exports.getProductReviews = async (req, res) => {

  try {
    console.log(req.query)

    const productId = parseInt(req?.query?.productId, 10);
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

    let whereClause =req.query.me? "r.product_id= ANY($1) ": " r.product_id = $1 ";
    let params = [req.query.me?req?.body?.productId:productId];

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

    const reviewsQuery = `
      SELECT
        r.id,
        r.rating,
        r.comment,
        r.images,
        r.created_at,
        r.product_id,
r.order_id,
        u.name AS user_name,

        (r.user_id = $${reviewQueryParams.length}) AS is_mine

      FROM reviews r

      JOIN users u
        ON r.user_id = u.id

      WHERE ${whereClause}

      ORDER BY r.created_at DESC

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
