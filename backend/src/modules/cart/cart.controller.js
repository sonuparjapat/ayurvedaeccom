const pool = require("../../config/db");
const crypto = require("crypto");
const validateGuestSession = async (sessionId) => {
  if (!sessionId) {
    return {
      valid: false,
      expired: false
    };
  }

  const check = await pool.query(
    `
    SELECT session_id, expires_at, is_active
    FROM guest_sessions
    WHERE session_id = $1
    LIMIT 1
  `,
    [sessionId]
  );

  if (!check.rows.length) {
    return {
      valid: false,
      expired: false
    };
  }

  const row = check.rows[0];

if (!row.is_active) {
  return {
    valid: false,
    expired: false
  };
}

  const expired =
    new Date(row.expires_at) < new Date();

  if (expired) {
    return {
      valid: false,
      expired: true
    };
  }

  // rolling expiry extend
  await pool.query(
    `
    UPDATE guest_sessions
    SET
      expires_at = NOW() + INTERVAL '30 days',
      updated_at = NOW()
    WHERE session_id = $1
  `,
    [sessionId]
  );

  return {
    valid: true,
    expired: false
  };
};

/* ================= ADD TO CART ================= */

exports.addToCart = async (req, res) => {
  try {

    const userId = req?.user?.id; // from auth middleware
  const { productId, quantity, sessionId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID required" });
    }

    const qty = quantity && quantity > 0 ? quantity : 1;


    // Check product exists & stock
    const product = await pool.query(
      "SELECT inventory FROM products WHERE id=$1",
      [productId]
    );

    if (!product.rows.length) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.rows[0].inventory < qty) {
      return res.status(400).json({ message: "Not enough stock" });
    }
   /* logged in user */
    if (userId) {
      await pool.query(`
        INSERT INTO cart (user_id, product_id, quantity)
        VALUES ($1,$2,$3)
        ON CONFLICT (user_id, product_id)
        DO UPDATE SET quantity = cart.quantity + EXCLUDED.quantity
      `, [userId, productId, qty]);

      return res.json({ message: "wooah!!.. product added to cart" });
    }

    /* guest user */
    
    if (!sessionId) {
      return res.status(400).json({ message: "Guest session required" });
    }
const sessionCheck =
  await validateGuestSession(sessionId);

if (!sessionCheck.valid) {
  return res.status(
    sessionCheck.expired ? 410 : 400
  ).json({
    code: sessionCheck.expired
      ? "SESSION_EXPIRED"
      : "INVALID_SESSION",
    message: sessionCheck.expired
      ? "Guest session expired"
      : "Invalid guest session"
  });
}
    await pool.query(`
      INSERT INTO guest_cart (guest_session_id, product_id, quantity)
      VALUES ($1,$2,$3)
      ON CONFLICT (guest_session_id, product_id)
      DO UPDATE SET quantity = guest_cart.quantity + EXCLUDED.quantity
    `, [sessionId, productId, qty]);

    res.json({ message: "Product Added to guest cart" });

  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createGuestSession = async (req, res) => {
  try {
    const sessionId = "gst_" + crypto.randomBytes(24).toString("hex");

    await pool.query(`
      INSERT INTO guest_sessions(
        session_id,
        expires_at,
        ip_address,
        user_agent
      )
      VALUES($1, NOW() + INTERVAL '30 days', $2, $3)
    `, [
      sessionId,
      req.ip,
      req.headers["user-agent"] || null
    ]);

    res.json({
      success: true,
      sessionId
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET USER CART ================= */

exports.getCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.query.sessionId;

    let data;

    if (userId) {
      data = await pool.query(`
        SELECT
          c.product_id,
          c.quantity,
          p.name,
          p.price,
          p.images,
          p.inventory,
          p.gst_percent,
          p.category_name,
          p.category_id
        FROM cart c
        JOIN products p ON p.id = c.product_id
        WHERE c.user_id=$1
      `, [userId]);

    } 
  else {

  // first-time guest user
  if (!sessionId) {
    return res.json({
      success: true,
      items: [],
      subtotal: 0
    });
  }

  const sessionCheck =
    await validateGuestSession(sessionId);

  if (!sessionCheck.valid) {
    return res.status(
      sessionCheck.expired ? 410 : 400
    ).json({
      code: sessionCheck.expired
        ? "SESSION_EXPIRED"
        : "INVALID_SESSION",
      message: sessionCheck.expired
        ? "Guest session expired"
        : "Invalid guest session"
    });
  }

  data = await pool.query(`
    SELECT
      c.product_id,
      c.quantity,
      p.name,
      p.price,
      p.images,
      p.inventory,
      p.gst_percent,
      p.category_name,
      p.category_id
    FROM guest_cart c
    JOIN products p
      ON p.id = c.product_id
    WHERE c.guest_session_id = $1
  `, [sessionId]);
}

    const subtotal = data.rows.reduce(
      (a, b) => a + Number(b.price) * Number(b.quantity),
      0
    );

    res.json({
      success: true,
      items: data.rows,
      subtotal
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};



/* ================= UPDATE CART QTY ================= */

exports.updateCartQty = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { productId, quantity, sessionId } = req.body;

    if (!productId || quantity < 1) {
      return res.status(400).json({ message: "Invalid data" });
    }
const product =
 await pool.query(
   "SELECT inventory FROM products WHERE id=$1",
   [productId]
 );

if (!product.rows.length) {
 return res.status(404).json({
   message:
   "Product not found"
 });
}

if (
 quantity >
 product.rows[0].inventory
) {
 return res.status(400).json({
   message:
   "Not enough stock"
 });
}
    if (userId) {
      await pool.query(`
        UPDATE cart
        SET quantity=$1
        WHERE user_id=$2 AND product_id=$3
      `, [quantity, userId, productId]);

    } else {
      const sessionCheck =
  await validateGuestSession(sessionId);

if (!sessionCheck.valid) {
  return res.status(
    sessionCheck.expired ? 410 : 400
  ).json({
    code: sessionCheck.expired
      ? "SESSION_EXPIRED"
      : "INVALID_SESSION",
    message: sessionCheck.expired
      ? "Guest session expired"
      : "Invalid guest session"
  });
}
      await pool.query(`
        UPDATE guest_cart
        SET quantity=$1
        WHERE guest_session_id=$2 AND product_id=$3
      `, [quantity, sessionId, productId]);
    }

    res.json({ message: "Woah..Cart updated Successfully" });

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

    if (userId) {
      await pool.query(`
        DELETE FROM cart
        WHERE user_id=$1 AND product_id=$2
      `, [userId, productId]);

    } else {
   const sessionCheck =
  await validateGuestSession(sessionId);

if (!sessionCheck.valid) {
  return res.status(
    sessionCheck.expired ? 410 : 400
  ).json({
    code: sessionCheck.expired
      ? "SESSION_EXPIRED"
      : "INVALID_SESSION",
    message: sessionCheck.expired
      ? "Guest session expired"
      : "Invalid guest session"
  });
}
      await pool.query(`
        DELETE FROM guest_cart
        WHERE guest_session_id=$1 AND product_id=$2
      `, [sessionId, productId]);
    }

    res.json({ message: "Item Removed Successfully" });

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
      await pool.query(
        "DELETE FROM cart WHERE user_id=$1",
        [userId]
      );

    } else {
     const sessionCheck =
  await validateGuestSession(sessionId);

if (!sessionCheck.valid) {
  return res.status(
    sessionCheck.expired ? 410 : 400
  ).json({
    code: sessionCheck.expired
      ? "SESSION_EXPIRED"
      : "INVALID_SESSION",
    message: sessionCheck.expired
      ? "Guest session expired"
      : "Invalid guest session"
  });
}
      await pool.query(
        "DELETE FROM guest_cart WHERE guest_session_id=$1",
        [sessionId]
      );
    }

    res.json({ message: "Cart cleared" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.mergeGuestCart = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userId = req?.user?.id;
    const { sessionId } = req.body;

    if (!userId) {
      await client.query("ROLLBACK");
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    if (!sessionId) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Guest session required"
      });
    }

  

const guestCheck =
  await validateGuestSession(sessionId);

if (!guestCheck.valid) {
  await client.query("ROLLBACK");

  return res.status(
    guestCheck.expired ? 410 : 400
  ).json({
    code: guestCheck.expired
      ? "SESSION_EXPIRED"
      : "INVALID_SESSION",
    message: guestCheck.expired
      ? "Guest session expired"
      : "Invalid guest session"
  });
}

    /* get guest cart items */
    const items = await client.query(`
      SELECT product_id, quantity
      FROM guest_cart
      WHERE guest_session_id = $1
    `, [sessionId]);

    for (const item of items.rows) {
      /* product stock check */
      const product = await client.query(`
        SELECT inventory
        FROM products
        WHERE id = $1
        LIMIT 1
      `, [item.product_id]);

      /* skip deleted product */
      if (!product.rows.length) {
        continue;
      }

      const stock = Number(
        product.rows[0].inventory
      );

      if (stock < 1) {
        continue;
      }

      const allowedQty = Math.min(
        Number(item.quantity),
        stock
      );

      await client.query(`
        INSERT INTO cart (
          user_id,
          product_id,
          quantity
        )
        VALUES ($1,$2,$3)

        ON CONFLICT (
          user_id,
          product_id
        )

        DO UPDATE SET quantity =
        LEAST(
          cart.quantity +
          EXCLUDED.quantity,
          $4
        )
      `, [
        userId,
        item.product_id,
        allowedQty,
        stock
      ]);
    }

    /* delete guest cart */
    await client.query(`
      DELETE FROM guest_cart
      WHERE guest_session_id = $1
    `, [sessionId]);

    /* deactivate session */
    await client.query(`
      UPDATE guest_sessions
      SET
        is_active = false,
        updated_at = NOW()
      WHERE session_id = $1
    `, [sessionId]);

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Cart merged successfully"
    });

  } catch (err) {
    await client.query("ROLLBACK");

    console.error(
      "Merge guest cart error:",
      err
    );

    return res.status(500).json({
      message: "Server error"
    });

  } finally {
    client.release();
  }
};