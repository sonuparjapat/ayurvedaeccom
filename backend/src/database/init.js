const pool = require("../config/db");

const initDB = async () => {
  try {

    /* ================= USERS ================= */

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (

        id SERIAL PRIMARY KEY,

        role INTEGER DEFAULT 3,

        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        phone VARCHAR(20),

        password TEXT NOT NULL,

        address1 TEXT,
        address2 TEXT,
        pincode VARCHAR(10),
        state VARCHAR(50),
        country VARCHAR(50),

        is_verified BOOLEAN DEFAULT FALSE,
        verification_token TEXT,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);


    /* ================= ROLES ================= */

    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (

        id SERIAL PRIMARY KEY,

        name VARCHAR(30) UNIQUE NOT NULL
      )
    `);


    /* ================= PRODUCTS ================= */

    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (

        id SERIAL PRIMARY KEY,

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


    /* ================= WISHLIST ================= */

    await pool.query(`
      CREATE TABLE IF NOT EXISTS wishlist (

        id SERIAL PRIMARY KEY,

        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE(user_id, product_id)
      )
    `);


    /* ================= REVIEWS ================= */

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (

        id SERIAL PRIMARY KEY,

        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,

        rating INT CHECK (rating BETWEEN 1 AND 5),

        comment TEXT,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE(user_id, product_id)
      )
    `);


    /* ================= CART ================= */

    await pool.query(`
      CREATE TABLE IF NOT EXISTS cart (

        id SERIAL PRIMARY KEY,

        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,

        quantity INT DEFAULT 1,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE(user_id, product_id)
      )
    `);


    /* ================= ORDERS ================= */

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (

        id SERIAL PRIMARY KEY,

        user_id INTEGER REFERENCES users(id),

        status VARCHAR(30) DEFAULT 'pending',

        total_amount NUMERIC(10,2) NOT NULL,

        payment_method VARCHAR(20),

        payment_status VARCHAR(30) DEFAULT 'unpaid',

        razorpay_order_id VARCHAR(200),

        razorpay_payment_id VARCHAR(200),

        razorpay_signature TEXT,

        shipping_address JSONB,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);


    /* ================= ORDER ITEMS ================= */

    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (

        id SERIAL PRIMARY KEY,

        order_id INTEGER
          REFERENCES orders(id)
          ON DELETE CASCADE,

        product_id INTEGER
          REFERENCES products(id),

        quantity INT NOT NULL,

        price NUMERIC(10,2) NOT NULL
      )
    `);


    /* ================= PAYMENTS ================= */

    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (

        id SERIAL PRIMARY KEY,

        order_id INTEGER UNIQUE
          REFERENCES orders(id)
          ON DELETE CASCADE,

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
