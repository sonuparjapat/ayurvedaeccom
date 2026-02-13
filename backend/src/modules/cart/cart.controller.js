const pool = require("../../config/db");


/* ================= ADD TO CART ================= */

exports.addToCart = async (req, res) => {
  try {

    const userId = req.user.id; // from auth middleware
    const { productId, quantity } = req.body;
console.log(req.body,"body coming")
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


    // Insert or Update cart
    await pool.query(
      `
      INSERT INTO cart (user_id, product_id, quantity)
      VALUES ($1,$2,$3)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET quantity = cart.quantity + EXCLUDED.quantity
      `,
      [userId, productId, qty]
    );

    res.json({ message: "Added to cart" });

  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ message: "Server error" });
  }
};



/* ================= GET USER CART ================= */

exports.getCart = async (req,res)=>{

  const userId=req.user.id

  const data = await pool.query(`

    SELECT
      c.product_id,
      c.quantity,
      p.name,
      p.price,
      p.images,
      p.inventory

    FROM cart c
    JOIN products p
    ON p.id=c.product_id
    WHERE c.user_id=$1

  `,[userId])

  const subtotal = data.rows.reduce(
    (a,b)=>a + b.price*b.quantity,0
  )

  res.json({
    success:true,
    items:data.rows,
    subtotal
  })
}



/* ================= UPDATE CART QTY ================= */

exports.updateCartQty = async (req, res) => {
  try {

    const userId = req.user.id;
    const { productId, quantity } = req.body;
console.log(req.body,"body coming")
    if (!productId || quantity < 1) {
      return res.status(400).json({ message: "Invalid data" });
    }

    await pool.query(
      `
      UPDATE cart
      SET quantity = $1
      WHERE user_id = $2 AND product_id = $3
      `,
      [quantity, userId, productId]
    );

    res.json({ message: "Cart updated" });

  } catch (err) {
    console.error("Update cart error:", err);
    res.status(500).json({ message: "Server error" });
  }
};



/* ================= REMOVE ITEM ================= */

exports.removeFromCart = async (req, res) => {
  try {

    const userId = req.user.id;
    const { productId } = req.params;

    await pool.query(
      `
      DELETE FROM cart
      WHERE user_id = $1 AND product_id = $2
      `,
      [userId, productId]
    );

    res.json({ message: "Item removed" });

  } catch (err) {
    console.error("Remove cart error:", err);
    res.status(500).json({ message: "Server error" });
  }
};



/* ================= CLEAR CART ================= */

exports.clearCart = async (req, res) => {
  try {

    const userId = req.user.id;

    await pool.query(
      "DELETE FROM cart WHERE user_id=$1",
      [userId]
    );

    res.json({ message: "Cart cleared" });

  } catch (err) {
    console.error("Clear cart error:", err);
    res.status(500).json({ message: "Server error" });
  }
};