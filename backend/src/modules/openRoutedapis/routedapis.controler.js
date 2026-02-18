const pool = require("../../config/db")


/* ================= HELPERS ================= */

const sendError = (res, code, msg) => {

  return res.status(code).json({
    success: false,
    message: msg,
  })

}


const sendSuccess = (res, data, message = 'Success') => {

  return res.status(200).json({
    success: true,
    message,
    data,
  })

}


/* ================= GET ALL ================= */

exports.getCategories = async (req, res) => {

  try {

    const {
      page = 1,
      limit = 50,
      search = '',
    } = req.query


    const offset = (page - 1) * limit


    /* Count */

    const countResult = await pool.query(
      `
      SELECT COUNT(*) 
      FROM categories
      WHERE LOWER(name) LIKE LOWER($1)
    `,
      [`%${search}%`]
    )


    const total = Number(countResult.rows[0].count)


    /* Data */

    const result = await pool.query(
      `
      SELECT id, name,gst_percent
      FROM categories
      WHERE LOWER(name) LIKE LOWER($1)
      ORDER BY id DESC
      LIMIT $2 OFFSET $3
    `,
      [`%${search}%`, limit, offset]
    )


    return sendSuccess(res, {
      rows: result.rows,
      total,
      page: Number(page),
      limit: Number(limit),
    })


  } catch (err) {

    console.error('Get Categories Error:', err)

    return sendError(
      res,
      500,
      'Failed to fetch categories'
    )

  }

}


/* ================= GET ONE ================= */

exports.getCategoryById = async (req, res) => {

  try {

    const { id } = req.params


    if (!id || isNaN(id)) {

      return sendError(
        res,
        400,
        'Invalid category id'
      )

    }


    const result = await pool.query(
      `
      SELECT id, name,gst_percent
      FROM categories
      WHERE id = $1
    `,
      [id]
    )


    if (!result.rows.length) {

      return sendError(
        res,
        404,
        'Category not found'
      )

    }


    return sendSuccess(res, result.rows[0])


  } catch (err) {

    console.error(err)

    return sendError(
      res,
      500,
      'Fetch failed'
    )

  }

}


/* ================= CREATE ================= */

exports.createCategory = async (req, res) => {

  try {

    const { name,gst_percent } = req.body


    if (!name || !name.trim()) {

      return sendError(
        res,
        400,
        'Please provide Required Details'
      )

    }


    if (name.length < 2 || name.length > 50) {

      return sendError(
        res,
        400,
        'Name must be 2-50 characters'
      )

    }


    /* Check duplicate */

    const exists = await pool.query(
      `
      SELECT id FROM categories
      WHERE LOWER(name) = LOWER($1)
    `,
      [name.trim()]
    )


    if (exists.rows.length) {

      return sendError(
        res,
        409,
        'Category already exists'
      )

    }


    /* Insert */

    const result = await pool.query(
      `
      INSERT INTO categories (name,gst_percent)
      VALUES ($1,$2)
      RETURNING id, name
    `,
      [name.trim(),gst_percent||0]
    )


    return sendSuccess(
      res,
      result.rows[0],
      'Category created'
    )


  } catch (err) {

    console.error('Create Error:', err)

    return sendError(
      res,
      500,
      'Create failed'
    )

  }

}


/* ================= UPDATE ================= */

exports.updateCategory = async (req, res) => {

  try {

    const { id } = req.params
    const { name,gst_percent } = req.body


    if (!id || isNaN(id)) {

      return sendError(
        res,
        400,
        'Invalid id'
      )

    }


    if (!name || !name.trim()) {

      return sendError(
        res,
        400,
        'Name required'
      )

    }


    /* Exists? */

    const old = await pool.query(
      `SELECT id FROM categories WHERE id=$1`,
      [id]
    )


    if (!old.rows.length) {

      return sendError(
        res,
        404,
        'Category not found'
      )

    }


    /* Duplicate? */

    const dup = await pool.query(
      `
      SELECT id FROM categories
      WHERE LOWER(name)=LOWER($1)
      AND id<>$2
    `,
      [name.trim(), id]
    )


    if (dup.rows.length) {

      return sendError(
        res,
        409,
        'Name already used'
      )

    }


    /* Update */

    const result = await pool.query(
      `
      UPDATE categories
      SET name=$1, gst_percent=$2
      WHERE id=$3
      RETURNING id, name
    `,
      [name.trim(),gst_percent||0, id]
    )


    return sendSuccess(
      res,
      result.rows[0],
      'Category updated'
    )


  } catch (err) {

    console.error('Update Error:', err)

    return sendError(
      res,
      500,
      'Update failed'
    )

  }

}


/* ================= DELETE ================= */

exports.deleteCategory = async (req, res) => {

  try {

    const { id } = req.params


    if (!id || isNaN(id)) {

      return sendError(
        res,
        400,
        'Invalid id'
      )

    }


    /* Exists? */

    const check = await pool.query(
      `SELECT id FROM categories WHERE id=$1`,
      [id]
    )


    if (!check.rows.length) {

      return sendError(
        res,
        404,
        'Not found'
      )

    }


    /* Protect if used */

    const used = await pool.query(
      `
      SELECT id FROM products
      WHERE category_id=$1
      LIMIT 1
    `,
      [id]
    )


    if (used.rows.length) {

      return sendError(
        res,
        400,
        'Category is in use'
      )

    }


    /* Delete */

    await pool.query(
      `DELETE FROM categories WHERE id=$1`,
      [id]
    )


    return sendSuccess(
      res,
      null,
      'Deleted'
    )


  } catch (err) {

    console.error('Delete Error:', err)

    return sendError(
      res,
      500,
      'Delete failed'
    )

  }

}