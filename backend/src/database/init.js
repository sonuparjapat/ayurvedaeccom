const pool = require("../config/db");

const initDB = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /* ================= ROLES ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(30) UNIQUE NOT NULL
      )
    `);

    /* ================= USERS ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        role INTEGER DEFAULT 3 REFERENCES roles(id),
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

    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);

    /* ================= CATEGORIES ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        gst_percent NUMERIC(5,2) DEFAULT 18 CHECK (gst_percent >= 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    /* ================= PRODUCTS ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        shortdescription TEXT,
        longdescription TEXT,
        price NUMERIC(10,2) NOT NULL CHECK (price > 0),
        compareprice NUMERIC(10,2) CHECK (compareprice >= 0),
        inventory INT DEFAULT 0 CHECK (inventory >= 0),
        sku VARCHAR(100),
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        category_name VARCHAR(150),
        brand VARCHAR(100),
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','active','inactive')),
        images JSONB,
        averagerating NUMERIC(2,1) DEFAULT 0 CHECK (averagerating BETWEEN 0 AND 5),
        reviewcount INT DEFAULT 0 CHECK (reviewcount >= 0),
        meta_title VARCHAR(255),
        meta_description TEXT,
        meta_keywords TEXT,
        gst_percent NUMERIC(5,2) DEFAULT 18 CHECK (gst_percent >= 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);`);

    /* ================= WISHLIST ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      )
    `);

    /* ================= REVIEWS ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        rating INT CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id),images JSONB DEFAULT '[]'
      )
    `);

    /* ================= CART ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS cart (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity INT DEFAULT 1 CHECK (quantity > 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      )
    `);

    /* ================= ORDER STATUS MASTER ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_status_master (
        id SERIAL PRIMARY KEY,
        code INT UNIQUE NOT NULL,
        key VARCHAR(30) UNIQUE NOT NULL,
        label VARCHAR(50) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    /* ================= ORDERS ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        status INT DEFAULT 0,
        total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
        payment_method VARCHAR(20),
        payment_status VARCHAR(30) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid','failed','refunded')),
        razorpay_order_id VARCHAR(200),
        razorpay_payment_id VARCHAR(200),
        razorpay_signature TEXT,
        shipping_address JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        tracking_number VARCHAR(100),
        shipped_at TIMESTAMP,
        invoice_no VARCHAR(50),
        invoice_date TIMESTAMP,
        is_invoiced BOOLEAN DEFAULT FALSE,
        courier_name VARCHAR(50)
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);`);

    /* ================= ORDER ITEMS ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        quantity INT NOT NULL CHECK (quantity > 0),
        price NUMERIC(10,2) NOT NULL CHECK (price >= 0)
      )
    `);

    /* ================= PAYMENTS ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        order_id INTEGER UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
        razorpay_order_id VARCHAR(200),
        razorpay_payment_id VARCHAR(200),
        razorpay_signature TEXT,
        amount NUMERIC(10,2) CHECK (amount >= 0),
        status VARCHAR(30),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    /* ================= APP SETTINGS ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        type VARCHAR(20) DEFAULT 'string' CHECK (type IN ('string','number','boolean','json')),
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    /* ================= INVOICES ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        invoice_no VARCHAR(50) UNIQUE NOT NULL,
        invoice_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
        tax NUMERIC(10,2) DEFAULT 0 CHECK (tax >= 0),
        total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
        pdf_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    /* ================= INVOICE ITEMS ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
        product_id INTEGER,
        product_name VARCHAR(255),
        quantity INT NOT NULL CHECK (quantity > 0),
        price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
        line_total NUMERIC(10,2) NOT NULL CHECK (line_total >= 0)
      )
    `);

    await client.query("COMMIT");
    console.log("✅ Production-Ready DB Initialized Successfully");

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ DB Init Error:", err);
  } finally {
    client.release();
  }
};

module.exports = initDB;
