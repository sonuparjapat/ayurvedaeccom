const pool = require('../../config/db')
const {
  uploadImageToAWS,
  deleteFromAWS
} = require('../../utils/awsImageUpload')

/* ═══════════════════════════════════════════════════════
   PUBLIC — GET ALL ACTIVE BUNDLES
═══════════════════════════════════════════════════════ */

exports.getPublicBundles = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT pb.*,
        (
          SELECT json_agg(json_build_object(
            'product_id', p.id,
            'name', p.name,
            'slug', p.slug,
            'price', p.price,
            'compareprice', p.compareprice,
            'images', p.images,
            'quantity', bp.quantity
          ))
          FROM bundle_products bp
          JOIN products p ON p.id = bp.product_id
          WHERE bp.bundle_id = pb.id
        ) AS products,
        (SELECT COUNT(*) FROM bundle_products WHERE bundle_id = pb.id) AS product_count
      FROM product_bundles pb
      WHERE pb.is_active = TRUE
      ORDER BY pb.created_at DESC
    `)

    res.json({ success: true, bundles: result.rows })
  } catch (err) {
    console.error('[Bundles] getPublicBundles error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch bundles' })
  }
}

/* ═══════════════════════════════════════════════════════
   PUBLIC — GET SINGLE BUNDLE
═══════════════════════════════════════════════════════ */

exports.getBundleById = async (req, res) => {
  try {
    const { id } = req.params

    const bundle = await pool.query(`
      SELECT pb.*,
        (
          SELECT json_agg(json_build_object(
            'product_id', p.id,
            'name', p.name,
            'slug', p.slug,
            'price', p.price,
            'compareprice', p.compareprice,
            'images', p.images,
            'inventory', p.inventory,
            'quantity', bp.quantity
          ))
          FROM bundle_products bp
          JOIN products p ON p.id = bp.product_id
          WHERE bp.bundle_id = pb.id
        ) AS products
      FROM product_bundles pb
      WHERE pb.id = $1
    `, [id])

    if (!bundle.rows.length) {
      return res.status(404).json({ success: false, message: 'Bundle not found' })
    }

    res.json({ success: true, bundle: bundle.rows[0] })
  } catch (err) {
    console.error('[Bundles] getBundleById error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch bundle' })
  }
}

/* ═══════════════════════════════════════════════════════
   ADMIN — LIST ALL BUNDLES (PAGINATED)
═══════════════════════════════════════════════════════ */

exports.adminListBundles = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 20
    const offset = (page - 1) * limit

    const [data, count] = await Promise.all([
      pool.query(`
        SELECT pb.*,
          (SELECT COUNT(*) FROM bundle_products WHERE bundle_id = pb.id) AS product_count
        FROM product_bundles pb
        ORDER BY pb.created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]),
      pool.query('SELECT COUNT(*) FROM product_bundles')
    ])

    res.json({
      success: true,
      bundles: data.rows,
      total: Number(count.rows[0].count),
      page,
      limit
    })
  } catch (err) {
    console.error('[Bundles] adminListBundles error:', err)
    res.status(500).json({ success: false, message: 'Failed to list bundles' })
  }
}

/* ═══════════════════════════════════════════════════════
   ADMIN — CREATE BUNDLE
═══════════════════════════════════════════════════════ */

exports.adminCreateBundle = async (req, res) => {
  const client = await pool.connect()
  let uploadedImage = null

  try {
    const { name, description, discount_type, discount_value, is_active, product_ids } = req.body

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Bundle name is required' })
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now()

    // Upload image if provided
    let image_url = null
    if (req.file) {
      image_url = await uploadImageToAWS(req.file, 'bundles')
      uploadedImage = image_url
    }

    await client.query('BEGIN')

    const bundleRes = await client.query(`
      INSERT INTO product_bundles (name, slug, description, discount_type, discount_value, image_url, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      name.trim(),
      slug,
      description || null,
      discount_type || 'percent',
      Number(discount_value) || 0,
      image_url,
      is_active !== 'false' && is_active !== false
    ])

    const bundleId = bundleRes.rows[0].id

    // Insert bundle products
    const pids = typeof product_ids === 'string' ? JSON.parse(product_ids) : (product_ids || [])
    for (const pid of pids) {
      await client.query(
        'INSERT INTO bundle_products (bundle_id, product_id, quantity) VALUES ($1, $2, 1)',
        [bundleId, Number(pid)]
      )
    }

    await client.query('COMMIT')

    res.status(201).json({ success: true, bundle: bundleRes.rows[0], message: 'Bundle created' })
  } catch (err) {
    await client.query('ROLLBACK')
    if (uploadedImage) await deleteFromAWS(uploadedImage)
    console.error('[Bundles] adminCreateBundle error:', err)
    res.status(500).json({ success: false, message: 'Failed to create bundle' })
  } finally {
    client.release()
  }
}

/* ═══════════════════════════════════════════════════════
   ADMIN — UPDATE BUNDLE
═══════════════════════════════════════════════════════ */

exports.adminUpdateBundle = async (req, res) => {
  const client = await pool.connect()
  let uploadedImage = null

  try {
    const { id } = req.params
    const { name, description, discount_type, discount_value, is_active, product_ids, remove_image } = req.body

    const existing = await client.query('SELECT * FROM product_bundles WHERE id=$1', [id])
    if (!existing.rows.length) {
      return res.status(404).json({ success: false, message: 'Bundle not found' })
    }

    const oldImageUrl = existing.rows[0].image_url
    let image_url = oldImageUrl

    // Handle image upload — file wins over remove_image to avoid deleting the new upload
    if (req.file) {
      image_url = await uploadImageToAWS(req.file, 'bundles')
      uploadedImage = image_url
      if (oldImageUrl) await deleteFromAWS(oldImageUrl).catch(err => console.error('[Bundles] S3 delete failed:', err.message))
    } else if (remove_image === 'true') {
      if (image_url) await deleteFromAWS(image_url).catch(err => console.error('[Bundles] S3 delete failed:', err.message))
      image_url = null
    }

    const slug = name
      ? name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + id
      : existing.rows[0].slug

    await client.query('BEGIN')

    await client.query(`
      UPDATE product_bundles SET
        name = $1, slug = $2, description = $3, discount_type = $4,
        discount_value = $5, image_url = $6, is_active = $7, updated_at = NOW()
      WHERE id = $8
    `, [
      name?.trim() || existing.rows[0].name,
      slug,
      description ?? existing.rows[0].description,
      discount_type || existing.rows[0].discount_type,
      Number(discount_value) || existing.rows[0].discount_value,
      image_url,
      is_active !== undefined ? (is_active !== 'false' && is_active !== false) : existing.rows[0].is_active,
      id
    ])

    // Update bundle products if provided
    if (product_ids !== undefined) {
      await client.query('DELETE FROM bundle_products WHERE bundle_id=$1', [id])
      const pids = typeof product_ids === 'string' ? JSON.parse(product_ids) : (product_ids || [])
      for (const pid of pids) {
        await client.query(
          'INSERT INTO bundle_products (bundle_id, product_id, quantity) VALUES ($1, $2, 1)',
          [id, Number(pid)]
        )
      }
    }

    await client.query('COMMIT')

    res.json({ success: true, message: 'Bundle updated' })
  } catch (err) {
    await client.query('ROLLBACK')
    if (uploadedImage) await deleteFromAWS(uploadedImage)
    console.error('[Bundles] adminUpdateBundle error:', err)
    res.status(500).json({ success: false, message: 'Failed to update bundle' })
  } finally {
    client.release()
  }
}

/* ═══════════════════════════════════════════════════════
   ADMIN — DELETE BUNDLE
═══════════════════════════════════════════════════════ */

exports.adminDeleteBundle = async (req, res) => {
  try {
    const { id } = req.params
    const existing = await pool.query('SELECT image_url FROM product_bundles WHERE id=$1', [id])
    if (existing.rows[0]?.image_url) {
      await deleteFromAWS(existing.rows[0].image_url)
    }
    await pool.query('DELETE FROM product_bundles WHERE id=$1', [id])
    res.json({ success: true, message: 'Bundle deleted' })
  } catch (err) {
    console.error('[Bundles] adminDeleteBundle error:', err)
    res.status(500).json({ success: false, message: 'Failed to delete bundle' })
  }
}

/* ═══════════════════════════════════════════════════════
   AUTH — ADD BUNDLE TO CART
═══════════════════════════════════════════════════════ */

exports.addBundleToCart = async (req, res) => {
  const client = await pool.connect()
  try {
    const userId = req.user.id
    const { bundle_id } = req.body

    if (!bundle_id) {
      return res.status(400).json({ success: false, message: 'bundle_id required' })
    }

    // Get bundle + products
    const bundle = await client.query('SELECT * FROM product_bundles WHERE id=$1 AND is_active=TRUE', [bundle_id])
    if (!bundle.rows.length) {
      return res.status(404).json({ success: false, message: 'Bundle not found or inactive' })
    }

    const bundleProducts = await client.query(`
      SELECT bp.product_id, bp.quantity, p.price, p.inventory, p.name
      FROM bundle_products bp
      JOIN products p ON p.id = bp.product_id
      WHERE bp.bundle_id = $1 AND p.status = 'active'
    `, [bundle_id])

    if (!bundleProducts.rows.length) {
      return res.status(400).json({ success: false, message: 'No active products in this bundle' })
    }

    // Check stock
    for (const bp of bundleProducts.rows) {
      if (bp.inventory < bp.quantity) {
        return res.status(400).json({
          success: false,
          message: `"${bp.name}" is out of stock`
        })
      }
    }

    await client.query('BEGIN')

    // Add each bundle product to cart
    let addedCount = 0
    for (const bp of bundleProducts.rows) {
      await client.query(`
        INSERT INTO cart (user_id, product_id, quantity)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, product_id)
        DO UPDATE SET quantity = cart.quantity + $3
      `, [userId, bp.product_id, bp.quantity])
      addedCount++
    }

    await client.query('COMMIT')

    // Calculate bundle discount info
    const { discount_type, discount_value } = bundle.rows[0]
    const totalOriginal = bundleProducts.rows.reduce((sum, bp) => sum + Number(bp.price) * bp.quantity, 0)
    let discountAmount = 0
    if (discount_type === 'percent') {
      discountAmount = totalOriginal * Number(discount_value) / 100
    } else {
      discountAmount = Number(discount_value)
    }

    res.json({
      success: true,
      message: `${addedCount} products added to cart`,
      data: {
        original_total: totalOriginal,
        discount: Math.min(discountAmount, totalOriginal),
        bundle_price: Math.max(0, totalOriginal - discountAmount)
      }
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[Bundles] addBundleToCart error:', err)
    res.status(500).json({ success: false, message: 'Failed to add bundle to cart' })
  } finally {
    client.release()
  }
}

/* ═══════════════════════════════════════════════════════
   PUBLIC — BUNDLES CONTAINING A SPECIFIC PRODUCT
═══════════════════════════════════════════════════════ */
exports.getBundlesByProduct = async (req, res) => {
  try {
    const { productId } = req.params
    const result = await pool.query(`
      SELECT pb.*,
        (
          SELECT json_agg(json_build_object(
            'product_id', p.id,
            'name', p.name,
            'slug', p.slug,
            'price', p.price,
            'compareprice', p.compareprice,
            'images', p.images,
            'quantity', bp.quantity
          ) ORDER BY bp.id)
          FROM bundle_products bp
          JOIN products p ON p.id = bp.product_id
          WHERE bp.bundle_id = pb.id
        ) AS products,
        (SELECT COUNT(*) FROM bundle_products WHERE bundle_id = pb.id) AS product_count
      FROM product_bundles pb
      WHERE pb.is_active = TRUE
        AND EXISTS (
          SELECT 1 FROM bundle_products bp2
          WHERE bp2.bundle_id = pb.id AND bp2.product_id = $1
        )
      ORDER BY pb.created_at DESC
      LIMIT 4
    `, [productId])
    res.json({ success: true, bundles: result.rows })
  } catch (err) {
    console.error('[Bundles] getBundlesByProduct error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch bundles' })
  }
}
