const pool = require('../../config/db')

/* ─── PUBLIC: active flash sales with their products ─── */
exports.getActiveFlashSales = async (req, res) => {
  try {
    const now = new Date()
    const salesRes = await pool.query(
      `SELECT fs.*,
        EXTRACT(EPOCH FROM (fs.ends_at - NOW()))::int AS seconds_remaining
       FROM flash_sales fs
       WHERE fs.is_active = TRUE AND fs.starts_at <= NOW() AND fs.ends_at > NOW()
         AND (fs.max_uses IS NULL OR fs.uses_count < fs.max_uses)
       ORDER BY fs.ends_at ASC`
    )
    if (!salesRes.rows.length) return res.json({ sales: [] })

    const salesWithProducts = await Promise.all(salesRes.rows.map(async (sale) => {
      const prodRes = await pool.query(
        `SELECT fsp.*, p.name, p.images, p.price, p.compareprice, p.inventory,
                p.slug, p.gst_percent,
                COALESCE(fsp.special_price,
                  CASE WHEN $2 = 'percent'
                    THEN p.price * (1 - $3::numeric/100)
                    ELSE p.price - $3::numeric
                  END
                ) AS flash_price,
                ROUND((
                  p.price - COALESCE(fsp.special_price,
                    CASE WHEN $2 = 'percent'
                      THEN p.price * (1 - $3::numeric/100)
                      ELSE p.price - $3::numeric
                    END
                  )
                ) / NULLIF(p.price, 0) * 100) AS discount_percent
         FROM flash_sale_products fsp
         JOIN products p ON p.id = fsp.product_id
         WHERE fsp.flash_sale_id = $1 AND p.status = 'active'
         AND (fsp.stock_limit IS NULL OR fsp.sold_count < fsp.stock_limit)`,
        [sale.id, sale.discount_type, sale.discount_value]
      )

      const products = prodRes.rows.map(p => ({
        product_id: p.product_id,
        product_name: p.name,
        image: p.images?.[0] || null,
        flash_price: Number(p.flash_price || p.price),
        original_price: Number(p.price),
        discount_percent: Number(p.discount_percent || 0),
        stock_limit: p.stock_limit,
        sold_count: p.sold_count || 0,
        slug: p.slug,
      }))

      return { ...sale, products }
    }))

    res.json({ sales: salesWithProducts })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/* ─── ADMIN: list all ─── */
exports.adminList = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT fs.*,
        (SELECT COUNT(*) FROM flash_sale_products WHERE flash_sale_id = fs.id) AS product_count
       FROM flash_sales fs ORDER BY fs.created_at DESC`
    )
    res.json({ sales: r.rows })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/* ─── ADMIN: get single with products ─── */
exports.adminGet = async (req, res) => {
  try {
    const { id } = req.params
    const saleRes = await pool.query('SELECT * FROM flash_sales WHERE id = $1', [id])
    if (!saleRes.rows.length) return res.status(404).json({ message: 'Not found' })

    const prodRes = await pool.query(
      `SELECT fsp.*, p.name, p.price, p.compareprice, p.images
       FROM flash_sale_products fsp
       JOIN products p ON p.id = fsp.product_id
       WHERE fsp.flash_sale_id = $1`,
      [id]
    )
    res.json({ sale: { ...saleRes.rows[0], products: prodRes.rows } })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/* ─── ADMIN: create ─── */
exports.adminCreate = async (req, res) => {
  const client = await pool.connect()
  try {
    const { title, description, discount_type, discount_value, starts_at, ends_at, max_uses } = req.body
    let products = req.body.products
    if (typeof products === 'string') try { products = JSON.parse(products) } catch { products = [] }
    let banner_image = req.body.banner_image || null
    if (req.file) {
      const { uploadImageToAWS } = require('../../utils/awsImageUpload')
      banner_image = await uploadImageToAWS(req.file, 'flash-sales')
    }
    await client.query('BEGIN')

    const r = await client.query(
      `INSERT INTO flash_sales (title, description, discount_type, discount_value, starts_at, ends_at, max_uses, banner_image)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, description, discount_type || 'percent', discount_value, starts_at, ends_at, max_uses || null, banner_image]
    )
    const sale = r.rows[0]

    if (Array.isArray(products) && products.length) {
      for (const p of products) {
        await client.query(
          `INSERT INTO flash_sale_products (flash_sale_id, product_id, special_price, stock_limit)
           VALUES ($1,$2,$3,$4) ON CONFLICT (flash_sale_id, product_id) DO UPDATE
           SET special_price=$3, stock_limit=$4`,
          [sale.id, p.product_id, p.special_price || null, p.stock_limit || null]
        )
      }
    }

    await client.query('COMMIT')
    res.status(201).json({ success: true, sale })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ success: false, message: 'Create failed' })
  } finally {
    client.release()
  }
}

/* ─── ADMIN: update ─── */
exports.adminUpdate = async (req, res) => {
  const client = await pool.connect()
  try {
    const { id } = req.params
    const { title, description, discount_type, discount_value, starts_at, ends_at, max_uses, is_active } = req.body
    let products = req.body.products
    if (typeof products === 'string') try { products = JSON.parse(products) } catch { products = [] }
    let banner_image = req.body.banner_image || null
    if (req.file) {
      const { uploadImageToAWS } = require('../../utils/awsImageUpload')
      banner_image = await uploadImageToAWS(req.file, 'flash-sales')
    }
    await client.query('BEGIN')

    await client.query(
      `UPDATE flash_sales SET title=$1, description=$2, discount_type=$3, discount_value=$4,
        starts_at=$5, ends_at=$6, max_uses=$7, banner_image=$8, is_active=$9
       WHERE id=$10`,
      [title, description, discount_type, discount_value, starts_at, ends_at, max_uses || null, banner_image, is_active !== false && is_active !== 'false', id]
    )

    if (Array.isArray(products)) {
      await client.query('DELETE FROM flash_sale_products WHERE flash_sale_id=$1', [id])
      for (const p of products) {
        await client.query(
          `INSERT INTO flash_sale_products (flash_sale_id, product_id, special_price, stock_limit)
           VALUES ($1,$2,$3,$4)`,
          [id, p.product_id, p.special_price || null, p.stock_limit || null]
        )
      }
    }

    await client.query('COMMIT')
    res.json({ success: true })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ success: false, message: 'Update failed' })
  } finally {
    client.release()
  }
}

/* ─── ADMIN: delete ─── */
exports.adminDelete = async (req, res) => {
  try {
    await pool.query('DELETE FROM flash_sales WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed' })
  }
}
