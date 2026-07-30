const pool = require("../../config/db");
const { uploadImageToAWS, deleteFromAWS } = require("../../utils/awsImageUpload");


/* ================= HELPERS ================= */

const sendError = (res, code, msg) => {
  return res.status(code).json({
    success: false,
    message: msg,
  });
};

const sendSuccess = (res, data, message = "Success") => {
  return res.status(200).json({
    success: true,
    message,
    data,
  });
};


/* ================= GET ALL ================= */

exports.getCategories = async (req, res) => {

  try {

    const {
      page = 1,
      limit = 50,
      search = "",
    } = req.query;

    const offset = (page - 1) * limit;

  /* Build optional parent_id filter */
  const { parent_id } = req.query;
  let parentFilter = '';
  let countParentFilter = '';
  const countParams = [`%${search}%`];
  const queryParams = [`%${search}%`];
  let paramIdx = 2;

  if (parent_id === 'null' || parent_id === 'root') {
    parentFilter = ' AND c.parent_id IS NULL';
    countParentFilter = ' AND parent_id IS NULL';
  } else if (parent_id) {
    let resolvedParentId = parent_id;
    if (!/^\d+$/.test(String(parent_id))) {
      const slugLookup = await pool.query('SELECT id FROM categories WHERE slug=$1 LIMIT 1', [parent_id]);
      resolvedParentId = slugLookup.rows[0]?.id || parent_id;
    }
    parentFilter = ` AND c.parent_id = $${paramIdx}`;
    countParentFilter = ` AND parent_id = $2`;
    countParams.push(resolvedParentId);
    queryParams.push(resolvedParentId);
    paramIdx++;
  }

    /* Count */

    const countResult = await pool.query(
      `
      SELECT COUNT(*)
      FROM categories
      WHERE LOWER(name) LIKE LOWER($1)
      ${countParentFilter}
      `,
      countParams
    );

    const total = Number(countResult.rows[0].count);


    /* Data */

  queryParams.push(limit, offset);

  const result = await pool.query(
  `
  SELECT
    c.id,
    c.name,
    c.gst_percent,
    c.color_class,
    c.image_url,
    c.description,
    c.hsn_code,
    c.cess_percent,
    c.parent_id,
    c.slug,
    c.level,
    c.sort_order,
    c.is_featured,
    c.banner_url,

    COUNT(p.id) AS product_count

  FROM categories c

  LEFT JOIN products p
    ON c.id = p.category_id

  WHERE LOWER(c.name) LIKE LOWER($1)
  ${parentFilter}

  GROUP BY
    c.id,
    c.name,
    c.gst_percent,
    c.color_class,
    c.image_url,
    c.hsn_code,
    c.cess_percent,
    c.description,
    c.parent_id,
    c.slug,
    c.level,
    c.sort_order,
    c.is_featured,
    c.banner_url

  ORDER BY c.sort_order ASC, c.id DESC

  LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `,
  queryParams
);

    return sendSuccess(res, {
      rows: result.rows,
      total,
      page: Number(page),
      limit: Number(limit),
    });

  } catch (err) {

    console.error("Get Categories Error:", err);

    return sendError(
      res,
      500,
      "Failed to fetch categories"
    );

  }

};


/* ================= GET ONE ================= */

exports.getCategoryById = async (req, res) => {

  try {

    const { id } = req.params;

    if (!id) {
      return sendError(res, 400, "Invalid category id");
    }

    const isNumeric = /^\d+$/.test(id);

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        gst_percent,
        color_class,
        image_url,
        description,
        hsn_code,
        cess_percent,
        parent_id,
        slug,
        level,
        sort_order,
        is_featured,
        banner_url
      FROM categories
      WHERE ${isNumeric ? 'id = $1' : 'slug = $1'}
      `,
      [isNumeric ? Number(id) : id]
    );


    if (!result.rows.length) {
      return sendError(res, 404, "Category not found");
    }

    /* Fetch subcategories */
    const subcategories = await pool.query(
      `SELECT id, name, slug, image_url FROM categories WHERE parent_id = $1 AND is_active = TRUE ORDER BY sort_order`,
      [result.rows[0].id]
    );

    return sendSuccess(res, { ...result.rows[0], subcategories: subcategories.rows });

  } catch (err) {

    console.error("Get One Error:", err);

    return sendError(
      res,
      500,
      "Fetch failed"
    );

  }

};


/* ================= CREATE ================= */

exports.createCategory = async (req, res) => {

  try {

   const {
  name,
  gst_percent,
  color_class,
  description,
  hsn_code,
  cess_percent,
  parent_id,
  slug,
  sort_order,
  is_featured,
  banner_url,
} = req.body;


    /* ================= VALIDATION ================= */

    if (!name || !name.trim()) {
      return sendError(res, 400, "Category name required");
    }

    const cleanName = name.trim();

    if (cleanName.length < 2 || cleanName.length > 50) {
      return sendError(res, 400, "Name must be 2–50 characters");
    }

    const gst = Number(gst_percent) || 0;

    if (gst < 0 || gst > 100) {
      return sendError(res, 400, "GST must be between 0–100");
    }
    const cess = Number(cess_percent) || 0;

if (cess < 0 || cess > 100) {
  return sendError(res, 400, "CESS must be between 0–100");
}

    /* Auto-generate slug from name if not provided */
    const autoSlug = slug?.trim() || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    /* Compute level based on parent */
    let level = 0;
    if (parent_id) {
      const parentRow = await pool.query('SELECT level FROM categories WHERE id = $1', [parent_id]);
      if (parentRow.rows.length) {
        level = (parentRow.rows[0].level || 0) + 1;
      }
    }


    /* ================= DUPLICATE CHECK ================= */

    const exists = await pool.query(
      `
      SELECT id
      FROM categories
      WHERE LOWER(name) = LOWER($1)
      `,
      [cleanName]
    );

    if (exists.rows.length) {
      return sendError(res, 409, "Category already exists");
    }


    /* ================= IMAGE UPLOAD ================= */

    let imageUrl = null;

    if (req.file) {

      try {

        imageUrl = await uploadImageToAWS(
          req.file,
          "categories"
        );

      } catch (uploadErr) {

        console.error("Image Upload Error:", uploadErr);

        return sendError(
          res,
          500,
          "Image upload failed"
        );

      }

    }


    /* ================= INSERT ================= */

    const result = await pool.query(
      `
      INSERT INTO categories
      (
  name,
  gst_percent,
  hsn_code,
  cess_percent,
  color_class,
  image_url,
  description,
  parent_id,
  slug,
  level,
  sort_order,
  is_featured,
  banner_url
      )
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING
        id,
        name,
        gst_percent,
        color_class,
        image_url,
        description,
        hsn_code,
        cess_percent,
        parent_id,
        slug,
        level,
        sort_order,
        is_featured,
        banner_url
      `,
   [
  cleanName,
  gst,
  hsn_code?.trim() || null,
  cess,
  color_class || null,
  imageUrl,
  description || null,
  parent_id || null,
  autoSlug,
  level,
  Number(sort_order) || 0,
  is_featured === 'true' || is_featured === true,
  banner_url || null,
]
    );


    return sendSuccess(
      res,
      result.rows[0],
      "Category created successfully"
    );

  } catch (err) {

    console.error("Create Error:", err);

    return sendError(
      res,
      500,
      "Create failed"
    );

  }

};


/* ================= UPDATE ================= */

exports.updateCategory = async (req, res) => {

  try {

    const { id } = req.params;

 const {
  name,
  gst_percent,
  color_class,
  description,
  remove_image,
  hsn_code,
  cess_percent,
  parent_id,
  slug,
  sort_order,
  is_featured,
} = req.body;


    /* ================= VALIDATION ================= */

    if (!id || isNaN(id)) {
      return sendError(res, 400, "Invalid id");
    }

    if (!name || !name.trim()) {
      return sendError(res, 400, "Name required");
    }

    const cleanName = name.trim();

    if (cleanName.length < 2 || cleanName.length > 50) {
      return sendError(res, 400, "Name must be 2–50 characters");
    }

    const gst = Number(gst_percent) || 0;

    if (gst < 0 || gst > 100) {
      return sendError(res, 400, "GST must be between 0–100");
    }
const cess = Number(cess_percent) || 0;

if (cess < 0 || cess > 100) {
  return sendError(res, 400, "CESS must be between 0–100");
}

    /* ================= EXISTS ================= */

    const old = await pool.query(
      `SELECT * FROM categories WHERE id=$1`,
      [id]
    );

    if (!old.rows.length) {
      return sendError(res, 404, "Category not found");
    }


    /* ================= DUPLICATE ================= */

    const dup = await pool.query(
      `
      SELECT id
      FROM categories
      WHERE LOWER(name)=LOWER($1)
      AND id<>$2
      `,
      [cleanName, id]
    );

    if (dup.rows.length) {
      return sendError(res, 409, "Name already used");
    }

    /* ================= CIRCULAR REFERENCE CHECK ================= */
    if (parent_id !== undefined && parent_id !== null) {
      if (String(parent_id) === String(id)) {
        return sendError(res, 400, "Category cannot be its own parent");
      }
      /* Check if parent_id is a descendant of this category */
      let checkId = parent_id;
      const visited = new Set();
      while (checkId) {
        if (visited.has(checkId)) break;
        visited.add(checkId);
        const ancestor = await pool.query('SELECT parent_id FROM categories WHERE id = $1', [checkId]);
        if (!ancestor.rows.length) break;
        if (String(ancestor.rows[0].parent_id) === String(id)) {
          return sendError(res, 400, "Cannot set parent: would create a circular reference");
        }
        checkId = ancestor.rows[0].parent_id;
      }
    }

    /* ================= IMAGE LOGIC ================= */

    let imageUrl = old.rows[0].image_url;


    // Replace image
    if (req.file) {

      if (imageUrl) {
        await deleteFromAWS(imageUrl);
      }

      imageUrl = await uploadImageToAWS(
        req.file,
        "categories"
      );
    }


    // Remove image
    if (remove_image === "true") {

      if (imageUrl) {
        await deleteFromAWS(imageUrl);
      }

      imageUrl = null;
    }


    /* ================= UPDATE ================= */

    /* Compute slug for update */
    const updateSlug = slug?.trim() || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

   const result = await pool.query(
  `
  UPDATE categories
  SET
    name=$1,
    gst_percent=$2,
    hsn_code=$3,
    cess_percent=$4,
    color_class=$5,
    image_url=$6,
    description=$7,
    parent_id=$9,
    slug=$10,
    sort_order=$11,
    is_featured=$12,
    updated_at=NOW()
  WHERE id=$8

  RETURNING
    id,
    name,
    gst_percent,
    hsn_code,
    cess_percent,
    color_class,
    image_url,
    description,
    parent_id,
    slug,
    level,
    sort_order,
    is_featured,
    banner_url
  `,
  [
    cleanName,
    gst,
    hsn_code?.trim() || null,
    cess || 0,
    color_class || null,
    imageUrl,
    description || null,
    id,
    parent_id !== undefined ? (parent_id || null) : old.rows[0].parent_id,
    updateSlug,
    sort_order !== undefined ? (Number(sort_order) || 0) : old.rows[0].sort_order,
    is_featured !== undefined ? (is_featured === 'true' || is_featured === true) : old.rows[0].is_featured,
  ]
);


    return sendSuccess(
      res,
      result.rows[0],
      "Category updated successfully"
    );

  } catch (err) {

    console.error("Update Error:", err);

    return sendError(
      res,
      500,
      "Update failed"
    );

  }

};


/* ================= DELETE ================= */

/* ================= CATEGORY TREE ================= */

exports.getCategoryTree = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, slug, parent_id, level, sort_order, image_url, is_active, is_featured FROM categories WHERE is_active = TRUE ORDER BY sort_order, id'
    );
    const rows = result.rows;
    const map = {};
    rows.forEach(r => { map[r.id] = { ...r, children: [] }; });
    const tree = [];
    rows.forEach(r => {
      if (r.parent_id && map[r.parent_id]) {
        map[r.parent_id].children.push(map[r.id]);
      } else {
        tree.push(map[r.id]);
      }
    });
    return sendSuccess(res, tree);
  } catch (err) {
    console.error("Category Tree Error:", err);
    return sendError(res, 500, "Failed to fetch category tree");
  }
};

/* ================= GET CATEGORY BY SLUG ================= */

exports.getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug) return sendError(res, 400, "Slug required");

    const result = await pool.query(
      `SELECT id, name, slug, parent_id, level, sort_order, gst_percent, hsn_code, cess_percent,
              color_class, image_url, banner_url, description, is_active, is_featured
       FROM categories WHERE slug = $1`,
      [slug]
    );

    if (!result.rows.length) return sendError(res, 404, "Category not found");

    const category = result.rows[0];

    const subcategories = await pool.query(
      `SELECT id, name, slug, image_url, sort_order FROM categories
       WHERE parent_id = $1 AND is_active = TRUE ORDER BY sort_order`,
      [category.id]
    );

    return sendSuccess(res, { ...category, subcategories: subcategories.rows });
  } catch (err) {
    console.error("Get Category By Slug Error:", err);
    return sendError(res, 500, "Fetch failed");
  }
};

/* ================= PUBLIC BRANDS ================= */

exports.getPublicBrands = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, slug, logo_url FROM brands WHERE is_active = TRUE ORDER BY sort_order, name'
    );
    return sendSuccess(res, result.rows);
  } catch (err) {
    console.error("Public Brands Error:", err);
    return sendError(res, 500, "Failed to fetch brands");
  }
};

exports.getPublicBrandBySlug = async (req, res) => {
  try {
    const { slug } = req.params
    const brandRes = await pool.query(
      'SELECT id, name, slug, logo_url, description FROM brands WHERE slug=$1 AND is_active=TRUE LIMIT 1',
      [slug]
    )
    if (!brandRes.rows.length) return sendError(res, 404, 'Brand not found')
    const brand = brandRes.rows[0]
    const stats = await pool.query(
      `SELECT COUNT(*) AS total_products, AVG(averagerating) AS avg_rating FROM products WHERE brand_id=$1 AND status='active'`,
      [brand.id]
    )
    return sendSuccess(res, { ...brand, total_products: Number(stats.rows[0].total_products), avg_rating: parseFloat(stats.rows[0].avg_rating || 0).toFixed(1) })
  } catch (err) {
    console.error('Brand by slug error:', err)
    return sendError(res, 500, 'Failed to fetch brand')
  }
};


/* ================= DELETE ================= */

exports.deleteCategory = async (req, res) => {

  try {

    const { id } = req.params;

    if (!id || isNaN(id)) {
      return sendError(res, 400, "Invalid id");
    }


    /* ================= EXISTS ================= */

    const check = await pool.query(
      `SELECT * FROM categories WHERE id=$1`,
      [id]
    );

    if (!check.rows.length) {
      return sendError(res, 404, "Not found");
    }


    /* ================= SUBCATEGORY CHECK ================= */

    const subCheck = await pool.query(
      `SELECT id FROM categories WHERE parent_id = $1 LIMIT 1`,
      [id]
    );

    if (subCheck.rows.length) {
      return sendError(res, 400, "Cannot delete: category has subcategories. Delete or reassign them first.");
    }

    /* ================= IN USE ================= */

    const used = await pool.query(
      `SELECT id FROM products WHERE category_id IN (
        WITH RECURSIVE cat_tree AS (
          SELECT id FROM categories WHERE id = $1
          UNION ALL
          SELECT c.id FROM categories c JOIN cat_tree ct ON c.parent_id = ct.id
        ) SELECT id FROM cat_tree
      ) LIMIT 1`,
      [id]
    );

    if (used.rows.length) {
      return sendError(res, 400, "Category or its subcategories have products. Remove or reassign them first.");
    }


    /* ================= DELETE IMAGE ================= */

    const imageUrl = check.rows[0].image_url;

    if (imageUrl) {
      await deleteFromAWS(imageUrl);
    }


    /* ================= DELETE ================= */

    await pool.query(
      `DELETE FROM categories WHERE id=$1`,
      [id]
    );


    return sendSuccess(
      res,
      null,
      "Category deleted"
    );

  } catch (err) {

    console.error("Delete Error:", err);

    return sendError(
      res,
      500,
      "Delete failed"
    );

  }

};