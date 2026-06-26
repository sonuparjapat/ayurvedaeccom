const pool = require("../../config/db");
const crypto = require("crypto");

const validateGuestSession = async (sessionId) => {
  if (!sessionId) return { valid: false, expired: false };

  const check = await pool.query(
    `SELECT session_id, expires_at, is_active FROM guest_sessions WHERE session_id=$1 LIMIT 1`,
    [sessionId]
  );
  if (!check.rows.length) return { valid: false, expired: false };

  const row = check.rows[0];
  if (!row.is_active) return { valid: false, expired: false };
  if (new Date(row.expires_at) < new Date()) return { valid: false, expired: true };

  await pool.query(
    `UPDATE guest_sessions SET expires_at=NOW()+INTERVAL '30 days', updated_at=NOW() WHERE session_id=$1`,
    [sessionId]
  );
  return { valid: true, expired: false };
};

const sessionErrorResponse = (res, check) =>
  res.status(check.expired ? 410 : 400).json({
    code: check.expired ? "SESSION_EXPIRED" : "INVALID_SESSION",
    message: check.expired ? "Guest session expired" : "Invalid guest session",
  });

/* ── upsert helpers (handle NULL variant_id correctly) ── */

async function upsertUserCart(client, userId, productId, variantId, qty, maxStock) {
  const existing = await client.query(
    `SELECT id, quantity FROM cart
     WHERE user_id=$1 AND product_id=$2
     AND (variant_id=$3 OR (variant_id IS NULL AND $3::int IS NULL))`,
    [userId, productId, variantId ?? null]
  );
  if (existing.rows.length) {
    const currentQty = parseInt(existing.rows[0].quantity);
    const newQty = Math.min(currentQty + qty, maxStock);
    await client.query(
      `UPDATE cart SET quantity=$1, updated_at=NOW() WHERE id=$2`,
      [newQty, existing.rows[0].id]
    );
    return true;
  } else {
    await client.query(
      `INSERT INTO cart (user_id, product_id, variant_id, quantity) VALUES ($1,$2,$3,$4)`,
      [userId, productId, variantId ?? null, qty]
    );
    return false;
  }
}

async function upsertGuestCart(client, sessionId, productId, variantId, qty, maxStock) {
  const existing = await client.query(
    `SELECT id, quantity FROM guest_cart
     WHERE guest_session_id=$1 AND product_id=$2
     AND (variant_id=$3 OR (variant_id IS NULL AND $3::int IS NULL))`,
    [sessionId, productId, variantId ?? null]
  );
  if (existing.rows.length) {
    const currentQty = parseInt(existing.rows[0].quantity);
    const newQty = Math.min(currentQty + qty, maxStock);
    await client.query(
      `UPDATE guest_cart SET quantity=$1 WHERE id=$2`,
      [newQty, existing.rows[0].id]
    );
    return true;
  } else {
    await client.query(
      `INSERT INTO guest_cart (guest_session_id, product_id, variant_id, quantity) VALUES ($1,$2,$3,$4)`,
      [sessionId, productId, variantId ?? null, qty]
    );
    return false;
  }
}

/* ================= ADD TO CART ================= */

exports.addToCart = async (req, res) => {
  try {
    const userId = req?.user?.id;
    const { productId, quantity, sessionId, variantId } = req.body;

    if (!productId) return res.status(400).json({ message: "Product ID required" });
    const qty = quantity && quantity > 0 ? parseInt(quantity) : 1;
    const vid = variantId ? parseInt(variantId) : null;

    /* stock check: variant overrides product */
    let maxStock;
    if (vid) {
      const variant = await pool.query(
        `SELECT id, inventory FROM product_variants
         WHERE id=$1 AND product_id=$2 AND is_active=true`,
        [vid, productId]
      );
      if (!variant.rows.length)
        return res.status(404).json({ message: "Variant not found" });
      maxStock = parseInt(variant.rows[0].inventory);
      if (maxStock < qty)
        return res.status(400).json({ message: "Not enough stock for this variant" });
    } else {
      const product = await pool.query(
        "SELECT inventory, min_order_qty, max_order_qty FROM products WHERE id=$1",
        [productId]
      );
      if (!product.rows.length)
        return res.status(404).json({ message: "Product not found" });
      maxStock = parseInt(product.rows[0].inventory);
      if (maxStock < qty)
        return res.status(400).json({ message: "Not enough stock" });

      // Min/Max order quantity validation
      const minQty = Number(product.rows[0].min_order_qty) || 1;
      const maxQty = Number(product.rows[0].max_order_qty) || 100;
      if (qty < minQty) return res.status(400).json({ success: false, message: `Minimum order quantity is ${minQty}` });
      if (qty > maxQty) return res.status(400).json({ success: false, message: `Maximum order quantity is ${maxQty}` });
    }

    if (userId) {
      const wasInCart = await upsertUserCart(pool, userId, productId, vid, qty, maxStock);
      return res.json({ message: "Product added to cart", inCart: wasInCart });
    }

    if (!sessionId) return res.status(400).json({ message: "Guest session required" });
    const check = await validateGuestSession(sessionId);
    if (!check.valid) return sessionErrorResponse(res, check);

    const wasInCart = await upsertGuestCart(pool, sessionId, productId, vid, qty, maxStock);
    return res.json({ message: "Product added to guest cart", inCart: wasInCart });

  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createGuestSession = async (req, res) => {
  try {
    const sessionId = "gst_" + crypto.randomBytes(24).toString("hex");
    await pool.query(
      `INSERT INTO guest_sessions(session_id, expires_at, ip_address, user_agent)
       VALUES($1, NOW()+INTERVAL '30 days', $2, $3)`,
      [sessionId, req.ip, req.headers["user-agent"] || null]
    );
    res.json({ success: true, sessionId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET CART ================= */

exports.getCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.query.sessionId;
    let data;

    const cartSelect = `
      c.id as cart_item_id,
      c.product_id,
      c.variant_id,
      c.quantity,
      p.name,
      p.price as base_price,
      p.compareprice as base_compareprice,
      p.images,
      p.inventory as base_inventory,
      p.gst_percent,
      p.category_name,
      p.category_id,
      pv.label as variant_label,
      pv.price as variant_price,
      pv.compareprice as variant_compareprice,
      pv.inventory as variant_inventory,
      pv.attributes as variant_attributes,
      COALESCE(pv.price, p.price) as effective_price,
      COALESCE(pv.compareprice, p.compareprice) as effective_compareprice,
      COALESCE(pv.inventory, p.inventory) as effective_inventory
    `;

    if (userId) {
      data = await pool.query(
        `SELECT ${cartSelect}
         FROM cart c
         JOIN products p ON p.id = c.product_id
         LEFT JOIN product_variants pv ON pv.id = c.variant_id
         WHERE c.user_id=$1
         ORDER BY c.created_at DESC`,
        [userId]
      );
    } else {
      if (!sessionId) return res.json({ success: true, items: [], subtotal: 0 });
      const check = await validateGuestSession(sessionId);
      if (!check.valid) return sessionErrorResponse(res, check);

      data = await pool.query(
        `SELECT ${cartSelect}
         FROM guest_cart c
         JOIN products p ON p.id = c.product_id
         LEFT JOIN product_variants pv ON pv.id = c.variant_id
         WHERE c.guest_session_id=$1
         ORDER BY c.created_at DESC`,
        [sessionId]
      );
    }

    const items = data.rows.map((r) => ({
      cart_item_id: r.cart_item_id,
      product_id: r.product_id,
      variant_id: r.variant_id,
      variant_label: r.variant_label,
      variant_attributes: r.variant_attributes,
      name: r.name,
      price: parseFloat(r.effective_price),
      compareprice: r.effective_compareprice ? parseFloat(r.effective_compareprice) : null,
      images: r.images,
      inventory: parseInt(r.effective_inventory),
      gst_percent: r.gst_percent,
      category_name: r.category_name,
      category_id: r.category_id,
      quantity: r.quantity,
    }));

    const subtotal = items.reduce((a, b) => a + b.price * b.quantity, 0);
    res.json({ success: true, items, subtotal });

  } catch (err) {
    console.error("Get cart error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE CART QTY ================= */

exports.updateCartQty = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { productId, quantity, sessionId, variantId } = req.body;
    const qty = parseInt(quantity);
    const vid = variantId ? parseInt(variantId) : null;

    if (!productId || qty < 1) return res.status(400).json({ message: "Invalid data" });

    /* stock check */
    let maxStock;
    if (vid) {
      const v = await pool.query(
        `SELECT inventory FROM product_variants WHERE id=$1 AND product_id=$2`,
        [vid, productId]
      );
      if (!v.rows.length) return res.status(404).json({ message: "Variant not found" });
      maxStock = parseInt(v.rows[0].inventory);
    } else {
      const p = await pool.query("SELECT inventory, min_order_qty, max_order_qty FROM products WHERE id=$1", [productId]);
      if (!p.rows.length) return res.status(404).json({ message: "Product not found" });
      maxStock = parseInt(p.rows[0].inventory);

      // Min/Max order quantity validation
      const minQty = Number(p.rows[0].min_order_qty) || 1;
      const maxQty = Number(p.rows[0].max_order_qty) || 100;
      if (qty < minQty) return res.status(400).json({ success: false, message: `Minimum order quantity is ${minQty}` });
      if (qty > maxQty) return res.status(400).json({ success: false, message: `Maximum order quantity is ${maxQty}` });
    }

    if (qty > maxStock) return res.status(400).json({ message: "Not enough stock" });

    if (userId) {
      await pool.query(
        `UPDATE cart SET quantity=$1, updated_at=NOW()
         WHERE user_id=$2 AND product_id=$3
         AND (variant_id=$4 OR (variant_id IS NULL AND $4::int IS NULL))`,
        [qty, userId, productId, vid]
      );
    } else {
      const check = await validateGuestSession(sessionId);
      if (!check.valid) return sessionErrorResponse(res, check);
      await pool.query(
        `UPDATE guest_cart SET quantity=$1
         WHERE guest_session_id=$2 AND product_id=$3
         AND (variant_id=$4 OR (variant_id IS NULL AND $4::int IS NULL))`,
        [qty, sessionId, productId, vid]
      );
    }

    res.json({ message: "Cart updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= REMOVE ITEM ================= */

exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { productId } = req.params;
    const sessionId = req.query.sessionId;
    const vid = req.query.variantId ? parseInt(req.query.variantId) : null;

    if (userId) {
      await pool.query(
        `DELETE FROM cart
         WHERE user_id=$1 AND product_id=$2
         AND (variant_id=$3 OR (variant_id IS NULL AND $3::int IS NULL))`,
        [userId, productId, vid]
      );
    } else {
      const check = await validateGuestSession(sessionId);
      if (!check.valid) return sessionErrorResponse(res, check);
      await pool.query(
        `DELETE FROM guest_cart
         WHERE guest_session_id=$1 AND product_id=$2
         AND (variant_id=$3 OR (variant_id IS NULL AND $3::int IS NULL))`,
        [sessionId, productId, vid]
      );
    }

    res.json({ message: "Item removed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= CLEAR CART ================= */

exports.clearCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.body;

    if (userId) {
      await pool.query("DELETE FROM cart WHERE user_id=$1", [userId]);
    } else {
      const check = await validateGuestSession(sessionId);
      if (!check.valid) return sessionErrorResponse(res, check);
      await pool.query("DELETE FROM guest_cart WHERE guest_session_id=$1", [sessionId]);
    }

    res.json({ message: "Cart cleared" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= MERGE GUEST CART ================= */

exports.mergeGuestCart = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userId = req?.user?.id;
    const { sessionId } = req.body;

    if (!userId) {
      await client.query("ROLLBACK");
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!sessionId) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Guest session required" });
    }

    const guestCheck = await validateGuestSession(sessionId);
    if (!guestCheck.valid) {
      await client.query("ROLLBACK");
      return sessionErrorResponse(res, guestCheck);
    }

    const items = await client.query(
      `SELECT product_id, variant_id, quantity FROM guest_cart WHERE guest_session_id=$1`,
      [sessionId]
    );

    for (const item of items.rows) {
      const vid = item.variant_id;
      let stock;

      if (vid) {
        const v = await client.query(
          `SELECT inventory FROM product_variants WHERE id=$1 FOR UPDATE`,
          [vid]
        );
        if (!v.rows.length) continue;
        stock = parseInt(v.rows[0].inventory);
      } else {
        const p = await client.query(
          `SELECT inventory FROM products WHERE id=$1 FOR UPDATE`,
          [item.product_id]
        );
        if (!p.rows.length) continue;
        stock = parseInt(p.rows[0].inventory);
      }

      if (stock < 1) continue;
      const allowedQty = Math.min(parseInt(item.quantity), stock);
      await upsertUserCart(client, userId, item.product_id, vid, allowedQty, stock);
    }

    await client.query(`DELETE FROM guest_cart WHERE guest_session_id=$1`, [sessionId]);
    await client.query(
      `UPDATE guest_sessions SET is_active=false, updated_at=NOW() WHERE session_id=$1`,
      [sessionId]
    );
    await client.query("COMMIT");

    return res.json({ success: true, message: "Cart merged successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Merge guest cart error:", err);
    return res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};
