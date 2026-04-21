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


    /* Count */

    const countResult = await pool.query(
      `
      SELECT COUNT(*)
      FROM categories
      WHERE LOWER(name) LIKE LOWER($1)
      `,
      [`%${search}%`]
    );

    const total = Number(countResult.rows[0].count);


    /* Data */

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

    COUNT(p.id) AS product_count

  FROM categories c

  LEFT JOIN products p
    ON c.id = p.category_id

  WHERE LOWER(c.name) LIKE LOWER($1)

  GROUP BY
    c.id,
    c.name,
    c.gst_percent,
    c.color_class,
    c.image_url,
    c.hsn_code,
c.tax_name,
c.cess_percent,
    c.description

  ORDER BY c.id DESC

  LIMIT $2 OFFSET $3
  `,
  [`%${search}%`, limit, offset]
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

    if (!id || isNaN(id)) {
      return sendError(res, 400, "Invalid category id");
    }


    const result = await pool.query(
      `
      SELECT
        id,
        name,
        gst_percent,
        color_class,
        image_url,
        description,hsn_code,
tax_name,
cess_percent
      FROM categories
      WHERE id = $1
      `,
      [id]
    );


    if (!result.rows.length) {
      return sendError(res, 404, "Category not found");
    }


    return sendSuccess(res, result.rows[0]);

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
description
      )
  VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING
        id,
        name,
        gst_percent,
        color_class,
        image_url,
        description,hsn_code,
cess_percent,
hsn_code
      `,
   [
  cleanName,
  gst,
  hsn_code?.trim() || null,
  cess,
  color_class || null,
  imageUrl,
  description || null,
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
description=$7
WHERE id=$8
      RETURNING
        id,
        name,
        gst_percent,
        color_class,
        image_url,
        description,hsn_code,

cess_percent,
      `,
     [
  cleanName,
  gst,
  hsn_code?.trim() || null,

  cess,
  color_class || null,
  imageUrl,
  description || null,
  id,
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


    /* ================= IN USE ================= */

    const used = await pool.query(
      `
      SELECT id
      FROM products
      WHERE category_id=$1
      LIMIT 1
      `,
      [id]
    );

    if (used.rows.length) {
      return sendError(res, 400, "Category is in use");
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