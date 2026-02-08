const pool = require("../config/db");

const initDB = async () => {
  try {

    /* ================= USERS ================= */

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (

        id UUID PRIMARY KEY,

        name VARCHAR(100),

        email VARCHAR(150) UNIQUE,

        password TEXT,

        role VARCHAR(20) DEFAULT 'USER',

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

      )
    `);


    /* ================= PRODUCTS ================= */

    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (

        id UUID PRIMARY KEY,

        name VARCHAR(255) NOT NULL,

        slug VARCHAR(255) UNIQUE,


        shortdescription TEXT,

        longdescription TEXT,


        price NUMERIC(10,2) NOT NULL,

        compareprice NUMERIC(10,2),


        inventory INT DEFAULT 0,

        sku VARCHAR(100),


        category_name VARCHAR(100),

        brand VARCHAR(100),


        status VARCHAR(20) DEFAULT 'draft',


        images JSONB,


        averagerating NUMERIC(2,1) DEFAULT 0,

        reviewcount INT DEFAULT 0,


        meta_title VARCHAR(255),

        meta_description TEXT,

        meta_keywords TEXT,


        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

      )
    `);

// wishlists
await pool.query(`
  CREATE TABLE IF NOT EXISTS wishlist (

  id UUID PRIMARY KEY,

  user_id UUID REFERENCES users(id),

  product_id UUID REFERENCES products(id),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, product_id)

)`)

// reviews table

await pool.query(`CREATE TABLE IF NOT EXISTS reviews (

  id UUID PRIMARY KEY,

  user_id UUID REFERENCES users(id),

  product_id UUID REFERENCES products(id),

  rating INT CHECK (rating BETWEEN 1 AND 5),

  comment TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, product_id)

)`)

// cart section

await pool.query(`CREATE TABLE IF NOT EXISTS cart (

  id UUID PRIMARY KEY,

  user_id UUID REFERENCES users(id),

  product_id UUID REFERENCES products(id),

  quantity INT DEFAULT 1,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, product_id)

)`)
    /* ================= ORDERS ================= */

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (

        id UUID PRIMARY KEY,

        user_id UUID REFERENCES users(id),

        status VARCHAR(30) DEFAULT 'pending',

        total_amount NUMERIC(10,2) NOT NULL,

        payment_status VARCHAR(30) DEFAULT 'unpaid',

        shipping_address JSONB,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

      )
    `);


    /* ================= ORDER ITEMS ================= */

    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (

        id UUID PRIMARY KEY,

        order_id UUID
          REFERENCES orders(id)
          ON DELETE CASCADE,

        product_id UUID
          REFERENCES products(id),

        quantity INT NOT NULL,

        price NUMERIC(10,2) NOT NULL

      )
    `);


    /* ================= PAYMENTS ================= */

    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (

        id UUID PRIMARY KEY,

        order_id UUID UNIQUE
          REFERENCES orders(id),

        razorpay_order_id VARCHAR(200),

        razorpay_payment_id VARCHAR(200),

        razorpay_signature TEXT,

        amount NUMERIC(10,2),

        status VARCHAR(30),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

      )
    `);


    console.log("✅ All Tables Created Successfully");

  } catch (err) {

    console.error("❌ DB Init Error:", err);

  }
};

module.exports = initDB;