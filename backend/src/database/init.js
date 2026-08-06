const pool = require("../config/db");

const initDB = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /* ================= EXTENSIONS ================= */
    await client.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

    /* ================= ROLES ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(30) UNIQUE NOT NULL
      )
    `);

    // Seed system roles (idempotent — ON CONFLICT DO NOTHING)
    await client.query(`
      INSERT INTO roles (id, name) VALUES
        (1, 'Super Admin'),
        (2, 'Admin'),
        (3, 'User')
      ON CONFLICT (id) DO NOTHING
    `);
    // Ensure sequence stays ahead of manual inserts
    await client.query(`SELECT setval('roles_id_seq', GREATEST((SELECT MAX(id) FROM roles), 3))`);

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

    /* ================= EMAIL VERIFICATION ================= */
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    email_verified_at TIMESTAMP,

    /* ================= PHONE VERIFICATION ================= */
    phone_verified BOOLEAN DEFAULT FALSE,
    phone_verified_at TIMESTAMP,

    /* ================= OTP LOGIN SYSTEM ================= */
    otp_code VARCHAR(10),
    otp_type VARCHAR(20),
    otp_expiry TIMESTAMP,
    otp_attempts INT DEFAULT 0,

    /* ================= SECURITY ================= */
    login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP,
    last_login TIMESTAMP,
    last_login_ip VARCHAR(50),

    /* ================= PASSWORD RESET ================= */
    reset_token TEXT,
    reset_token_expiry TIMESTAMP,

    /* ================= PROFILE / FUTURE ================= */
    avatar TEXT,
    google_id VARCHAR(255),

    /* ================= STATUS ================= */
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,

    /* ================= TIMESTAMPS ================= */
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);`);
await client.query(`CREATE INDEX IF NOT EXISTS idx_users_verified ON users(is_verified);`);
await client.query(`CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);`);

    /* ================= USER ADDRESSES ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_addresses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) CHECK (type IN ('home','work','other')),
        street TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        pincode VARCHAR(10) NOT NULL,
        email VARCHAR(100) NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_addresses_user
      ON user_addresses(user_id)
    `);

    /* ================= USER SETTINGS ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE
          REFERENCES users(id)
          ON DELETE CASCADE,
        order_updates BOOLEAN DEFAULT TRUE,
        promotions BOOLEAN DEFAULT FALSE,
        price_drops BOOLEAN DEFAULT TRUE,
        new_arrivals BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    /* ================= CATEGORIES ================= */
await client.query(`
  CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(150),
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    level INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,

    gst_percent NUMERIC(5,2) DEFAULT 18
      CHECK (gst_percent >= 0),

    hsn_code VARCHAR(20),
    cess_percent NUMERIC(5,2) DEFAULT 0,

    color_class VARCHAR(100) DEFAULT NULL,
    image_url TEXT DEFAULT NULL,
    banner_url TEXT DEFAULT NULL,
    description TEXT DEFAULT NULL,

    meta_title VARCHAR(150) DEFAULT NULL,
    meta_description TEXT DEFAULT NULL,

    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

    /* ================= BRANDS (must be before products — FK reference) ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL UNIQUE,
        slug VARCHAR(150) UNIQUE NOT NULL,
        logo_url TEXT DEFAULT NULL,
        description TEXT DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_brands_active ON brands(is_active, sort_order)`);

    /* ================= PRODUCTS ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,

        /* ── Type & Classification ── */
        product_type VARCHAR(20) DEFAULT 'simple' CHECK (product_type IN ('simple','variable','bundle')),
        unit VARCHAR(50),

        /* ── Descriptions ── */
        shortdescription TEXT,
        longdescription TEXT,
        highlights TEXT,
        ingredients TEXT,
        benefits TEXT,
        usage_instructions TEXT,
        storage_instructions TEXT,
        warnings TEXT,

        /* ── Pricing ── */
        price NUMERIC(10,2) NOT NULL CHECK (price > 0),
        compareprice NUMERIC(10,2) CHECK (compareprice >= 0),
        cost_price NUMERIC(10,2),
        tax_included BOOLEAN DEFAULT FALSE,

        /* ── Inventory ── */
        inventory INT DEFAULT 0 CHECK (inventory >= 0),
        low_stock_threshold INTEGER DEFAULT 10,
        track_inventory BOOLEAN DEFAULT TRUE,
        allow_backorder BOOLEAN DEFAULT FALSE,
        min_order_qty INTEGER DEFAULT 1,
        max_order_qty INTEGER DEFAULT 100,
        total_sold INTEGER DEFAULT 0,

        /* ── Identifiers ── */
        sku VARCHAR(100),
        barcode VARCHAR(100),

        /* ── Categorization ── */
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        category_name VARCHAR(150),
        brand VARCHAR(100),
        brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
        tags JSONB DEFAULT '[]',

        /* ── Display ── */
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','active','inactive')),
        is_featured BOOLEAN DEFAULT FALSE,
        is_bestseller BOOLEAN DEFAULT FALSE,
        is_returnable BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,

        /* ── Physical / Shipping ── */
        weight_grams NUMERIC(10,2),
        length_cm NUMERIC(8,2),
        width_cm NUMERIC(8,2),
        height_cm NUMERIC(8,2),
        shipping_class VARCHAR(30) DEFAULT 'standard',

        /* ── Media ── */
        images JSONB,
        video_url TEXT,

        /* ── Tax & Compliance ── */
        gst_percent NUMERIC(5,2) DEFAULT 18 CHECK (gst_percent >= 0),
        hsn_code VARCHAR(30),
        cess_percent NUMERIC(5,2) DEFAULT 0,
        fssai_number VARCHAR(30),
        coa_url TEXT,

        /* ── Specifications ── */
        specifications JSONB DEFAULT '[]',

        /* ── FAQs (admin-written) ── */
        faqs JSONB DEFAULT '[]',

        /* ── SEO ── */
        meta_title VARCHAR(255),
        meta_description TEXT,
        meta_keywords TEXT,
        focus_keyword VARCHAR(100),

        /* ── Reviews ── */
        averagerating NUMERIC(2,1) DEFAULT 0 CHECK (averagerating BETWEEN 0 AND 5),
        reviewcount INT DEFAULT 0 CHECK (reviewcount >= 0),

        /* ── Timestamps ── */
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

    /* ================= ORDER STATUS MASTER SEED ================= */
    await client.query(`
      INSERT INTO order_status_master (code, key, label, description) VALUES
        (0, 'pending',           'Pending',           'Order placed, awaiting confirmation'),
        (1, 'confirmed',         'Confirmed',          'Order confirmed by merchant'),
        (2, 'processing',        'Processing',         'Order is being prepared'),
        (3, 'shipped',           'Shipped',            'Order dispatched for delivery'),
        (4, 'out_for_delivery',  'Out for Delivery',   'Order out with delivery agent'),
        (5, 'delivered',         'Delivered',          'Order delivered successfully'),
        (6, 'cancelled',         'Cancelled',          'Order cancelled'),
        (7, 'return_requested',  'Return Requested',   'Customer requested a return'),
        (8, 'returned',          'Returned',           'Product returned by customer'),
        (9, 'refunded',          'Refunded',           'Refund issued to customer')
      ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, key = EXCLUDED.key
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
        courier_name VARCHAR(50),
        subtotal NUMERIC(10,2),
        tax NUMERIC(10,2),
        delivery_charge NUMERIC(10,2),
        platform_fee NUMERIC(10,2),
        discount NUMERIC(10,2) DEFAULT 0,
        grand_total NUMERIC(10,2),
        address_id INTEGER REFERENCES user_addresses(id)
      )
    `);

    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_reason TEXT`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_images TEXT`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS expected_delivery_date DATE`);
    await client.query(`ALTER TABLE users  ADD COLUMN IF NOT EXISTS loyalty_tier VARCHAR(20) DEFAULT 'bronze'`);
    await client.query(`ALTER TABLE users  ADD COLUMN IF NOT EXISTS total_spent NUMERIC(12,2) DEFAULT 0`);
    await client.query(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check`);
    await client.query(`ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('pending','unpaid','paid','failed','refunded'))`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);`);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_payment_created
      ON orders(payment_status, created_at)
    `);

    /* ================= ORDER ITEMS ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        quantity INT NOT NULL CHECK (quantity > 0),
        price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
        gst_percent NUMERIC(5,2),
        tax_amount NUMERIC(10,2),
        line_total NUMERIC(10,2)
      )
    `);

    /* ================= ORDER ITEMS INDEXES ================= */
    await client.query(`CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id)`);

    /* ================= REFUND / RETURN COLUMNS ================= */
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10,2) DEFAULT 0`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_id VARCHAR(200)`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_status VARCHAR(30) DEFAULT NULL`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_approved_at TIMESTAMP`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_reject_reason TEXT`);

    /* ── Return Policy columns on products ── */
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS return_window_days INT DEFAULT 7`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS replacement_available BOOLEAN DEFAULT FALSE`);

    /* ── Return tracking columns on orders ── */
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_type VARCHAR(20) DEFAULT 'refund'`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_requested_at TIMESTAMP`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS replacement_dispatched_at TIMESTAMP`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS replacement_tracking VARCHAR(100)`);

    /* ── Admin reply on reviews ── */
    await client.query(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS admin_reply TEXT`);
    await client.query(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS admin_replied_at TIMESTAMP`);

    /* ── COD availability on pincodes ── */
    await client.query(`ALTER TABLE serviceable_pincodes ADD COLUMN IF NOT EXISTS cod_available BOOLEAN DEFAULT TRUE`);

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

    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_logs (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        event_type VARCHAR(80) NOT NULL,
        amount NUMERIC(12,2),
        status VARCHAR(30),
        gateway_payment_id VARCHAR(200),
        gateway_order_id VARCHAR(200),
        gateway_refund_id VARCHAR(200),
        gateway_event VARCHAR(100),
        initiated_by VARCHAR(30) DEFAULT 'system',
        metadata JSONB,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payment_logs_order ON payment_logs(order_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payment_logs_event ON payment_logs(event_type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payment_logs_created ON payment_logs(created_at DESC)`);

    /* ================= REVIEWS (Moved Here After ORDERS) ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        images JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_review_per_order_product
      ON reviews(order_id, product_id)
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id)`);

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

    /* ================= DEFAULT LOYALTY SETTINGS ================= */
    // INSERT ... ON CONFLICT DO NOTHING so existing admin values are never overwritten
    const defaultSettings = [
      ['loyalty_enabled',           'true',   'boolean', 'Enable or disable the loyalty points program'],
      ['wallet_enabled',            'true',   'boolean', 'Enable or disable the store wallet feature'],
      ['loyalty_earn_rate',         '0.1',    'number',  'Points earned per ₹1 spent (0.1 = 1 pt per ₹10)'],
      ['loyalty_redeem_rate',       '0.1',    'number',  'Rupee value of each loyalty point (0.1 = 10 pts = ₹1)'],
      ['loyalty_min_redeem_points', '50',     'number',  'Minimum points required before redemption is allowed'],
      ['loyalty_max_redeem_percent','20',     'number',  'Maximum % of order total that can be paid via loyalty points'],
      ['max_cod_amount',           '5000',   'number',  'Maximum order value (₹) allowed for Cash on Delivery (0 = unlimited)'],
    ]
    for (const [key, value, type, description] of defaultSettings) {
      await client.query(
        `INSERT INTO app_settings (key, value, type, description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (key) DO NOTHING`,
        [key, value, type, description]
      )
    }

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

    await client.query(`CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1`);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_invoice_no_idx
      ON invoices (invoice_no)
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

    /* ================= COMPANY SETTINGS ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS company_settings (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(150) NOT NULL,
        email VARCHAR(150),
        phone VARCHAR(20),
        alternate_phone VARCHAR(20),
        website VARCHAR(150),
        gst_number VARCHAR(50),
        pan_number VARCHAR(50),
        address_line1 TEXT,
        address_line2 TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100),
        pincode VARCHAR(10),
        logo_url TEXT,
        support_email VARCHAR(150),
        social_links JSONB DEFAULT '{}',
        extra_data JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_company_settings_active
      ON company_settings(is_active)
    `);

  ////////////////////////guest sessions///////////////
await client.query(`CREATE TABLE IF NOT EXISTS guest_sessions (
 id SERIAL PRIMARY KEY,
 session_id VARCHAR(120) UNIQUE NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 expires_at TIMESTAMP,
 is_active BOOLEAN DEFAULT TRUE,
 ip_address VARCHAR(50),
 user_agent TEXT
);`)


// queue table

await client.query(`CREATE TABLE IF NOT EXISTS admin_jobs (
  id SERIAL PRIMARY KEY,
  job_type VARCHAR(100) NOT NULL,
  status VARCHAR(30) DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  payload JSONB DEFAULT '{}',
  result JSONB DEFAULT '{}',
  error_text TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
)`)
await client.query(`
CREATE INDEX IF NOT EXISTS idx_admin_jobs_status
ON admin_jobs(status)
`)
await client.query(`
CREATE INDEX IF NOT EXISTS idx_admin_jobs_created
ON admin_jobs(created_at DESC)
`)
// admin logs
await client.query(`CREATE TABLE IF NOT EXISTS admin_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  module VARCHAR(100) NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(60),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`)
await client.query(`CREATE INDEX IF NOT EXISTS idx_admin_logs_created
ON admin_logs(created_at)`);

await client.query(`CREATE INDEX IF NOT EXISTS idx_admin_logs_admin
ON admin_logs(admin_id)`);

// clenaup queue
await client.query(`CREATE TABLE IF NOT EXISTS file_cleanup_queue (
  id SERIAL PRIMARY KEY,

  file_url TEXT NOT NULL,

  source VARCHAR(50) DEFAULT 'bulk_import',

  ref_id INTEGER,

  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','processing','completed','failed')),

  retry_count INTEGER DEFAULT 0,

  last_error TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`)
await client.query(`
CREATE INDEX IF NOT EXISTS idx_file_cleanup_status
ON file_cleanup_queue(status)
`);

await client.query(`
CREATE INDEX IF NOT EXISTS idx_file_cleanup_created
ON file_cleanup_queue(created_at)
`);

await client.query(`
CREATE INDEX IF NOT EXISTS idx_file_cleanup_source
ON file_cleanup_queue(source)
`)
///////////////////guest cart///////////////////
await client.query(`CREATE TABLE IF NOT EXISTS guest_cart (
 id SERIAL PRIMARY KEY,
 guest_session_id VARCHAR(120) REFERENCES guest_sessions(session_id) ON DELETE CASCADE,
 product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
 quantity INT DEFAULT 1 CHECK(quantity > 0),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(guest_session_id, product_id)
);`)
await client.query(`
  CREATE INDEX IF NOT EXISTS idx_guest_sessions_active
  ON guest_sessions(is_active)
`);

await client.query(`
  CREATE INDEX IF NOT EXISTS idx_guest_sessions_expiry
  ON guest_sessions(expires_at)
`);

await client.query(`
  CREATE INDEX IF NOT EXISTS idx_guest_cart_session
  ON guest_cart(guest_session_id)
`);


// logs

await client.query(`CREATE TABLE IF NOT EXISTS order_status_logs (
    id SERIAL PRIMARY KEY,

    order_id INTEGER NOT NULL,

    old_status INTEGER NOT NULL,
    new_status INTEGER NOT NULL,

    changed_by INTEGER, -- admin/user id (optional)

    note TEXT, -- optional message

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order
      FOREIGN KEY(order_id)
      REFERENCES orders(id)
      ON DELETE CASCADE
)`)
    /* ================= BANNERS ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id SERIAL PRIMARY KEY,
        tag VARCHAR(60),
        title VARCHAR(200) NOT NULL,
        subtitle TEXT,
        image_url TEXT,
        bg_color1 VARCHAR(30) DEFAULT '#1a3a22',
        bg_color2 VARCHAR(30) DEFAULT '#0d1f15',
        cta_text VARCHAR(80) DEFAULT 'Explore Products',
        cta_link VARCHAR(200) DEFAULT '/products',
        sort_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active, sort_order)`);

    /* ================= COUPONS ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        code VARCHAR(30) UNIQUE NOT NULL,
        type VARCHAR(10) NOT NULL CHECK (type IN ('flat','percent')),
        value NUMERIC(10,2) NOT NULL CHECK (value > 0),
        min_order NUMERIC(10,2) DEFAULT 0,
        max_discount NUMERIC(10,2) DEFAULT 0,
        usage_limit INT DEFAULT 0,
        usage_per_user INT DEFAULT 1,
        used_count INT DEFAULT 0,
        valid_from TIMESTAMP,
        valid_to TIMESTAMP,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_code ON coupons(UPPER(code))`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active)`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS coupon_uses (
        id SERIAL PRIMARY KEY,
        coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_coupon_uses_coupon ON coupon_uses(coupon_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_coupon_uses_user ON coupon_uses(user_id)`);

    /* ================= ORDER COUPON COLUMNS ================= */
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0`);

    /* ── user-specific coupons: user_id NULL = global, set = only that user ── */
    await client.query(`ALTER TABLE coupons ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL`);
    /* ── coupon_uses: track which coupon was applied ── */
    await client.query(`ALTER TABLE coupon_uses ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0`);

    /* ================= PRODUCT VARIANTS ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        label VARCHAR(100) NOT NULL,
        sku VARCHAR(100),
        price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
        compareprice NUMERIC(10,2),
        cost_price NUMERIC(10,2) DEFAULT NULL,
        inventory INT DEFAULT 0 CHECK (inventory >= 0),
        weight_grams NUMERIC(10,2) DEFAULT NULL,
        barcode VARCHAR(100) DEFAULT NULL,
        image_url TEXT DEFAULT NULL,
        attributes JSONB DEFAULT '{}',
        sort_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_variants_active ON product_variants(product_id, is_active)`);

    /* ================= VARIANT COLUMNS ON CART / ORDER_ITEMS ================= */
    await client.query(`ALTER TABLE cart ADD COLUMN IF NOT EXISTS variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL`);
    await client.query(`ALTER TABLE guest_cart ADD COLUMN IF NOT EXISTS variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL`);
    await client.query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL`);
    await client.query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_label VARCHAR(100)`);

    /* ================= STOCK NOTIFICATIONS (Notify Me When Back) ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_notifications (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        variant_id INTEGER REFERENCES product_variants(id) ON DELETE CASCADE,
        email VARCHAR(150) NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        notified BOOLEAN DEFAULT FALSE,
        notified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`ALTER TABLE stock_notifications ADD COLUMN IF NOT EXISTS is_notified BOOLEAN DEFAULT FALSE`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_stock_notify_product ON stock_notifications(product_id, is_notified)`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_notify_unique ON stock_notifications(product_id, COALESCE(variant_id, 0), email)`);

    /* ================= RECENTLY VIEWED (server-side log) ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS recently_viewed (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_recently_viewed_user ON recently_viewed(user_id, viewed_at DESC)`);

    /* ================= PINCODE SERVICEABILITY ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS serviceable_pincodes (
        id SERIAL PRIMARY KEY,
        pincode VARCHAR(10) NOT NULL UNIQUE,
        city VARCHAR(100),
        state VARCHAR(100),
        delivery_days INT DEFAULT 5,
        is_active BOOLEAN DEFAULT TRUE
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pincodes_active ON serviceable_pincodes(pincode, is_active)`);

    /* ================= FLASH SALES ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS flash_sales (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        discount_type VARCHAR(20) DEFAULT 'percent' CHECK (discount_type IN ('percent','flat')),
        discount_value NUMERIC(10,2) NOT NULL,
        starts_at TIMESTAMP NOT NULL,
        ends_at TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        max_uses INT,
        uses_count INT DEFAULT 0,
        banner_image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS flash_sale_products (
        id SERIAL PRIMARY KEY,
        flash_sale_id INTEGER NOT NULL REFERENCES flash_sales(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        special_price NUMERIC(10,2),
        stock_limit INT,
        sold_count INT DEFAULT 0,
        UNIQUE(flash_sale_id, product_id)
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_flash_sales_active ON flash_sales(is_active, starts_at, ends_at)`);

    /* ================= WALLET / STORE CREDITS ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount NUMERIC(10,2) NOT NULL,
        type VARCHAR(10) NOT NULL CHECK (type IN ('credit','debit')),
        source VARCHAR(50),
        order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_wallet_user ON wallet_transactions(user_id, created_at DESC)`);

    /* ================= LOYALTY POINTS ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS loyalty_points (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        points INT NOT NULL,
        type VARCHAR(10) NOT NULL CHECK (type IN ('earn','redeem')),
        source VARCHAR(50),
        order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_loyalty_user ON loyalty_points(user_id, created_at DESC)`);

    /* ================= PRODUCT Q&A ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_questions (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        user_name VARCHAR(100),
        question TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_answers (
        id SERIAL PRIMARY KEY,
        question_id INTEGER NOT NULL REFERENCES product_questions(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        user_name VARCHAR(100),
        is_admin BOOLEAN DEFAULT FALSE,
        answer TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_questions_product ON product_questions(product_id, status)`);

    /* ================= PUSH NOTIFICATION TOKENS ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS push_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        device_type VARCHAR(20) DEFAULT 'mobile',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, token)
      )
    `);

    /* ================= PUSH NOTIFICATION LOGS ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS push_notification_logs (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        sent_to INTEGER DEFAULT 0,
        sent_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    /* ================= USER NOTIFICATIONS ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title TEXT NOT NULL,
        body TEXT,
        data JSONB DEFAULT '{}',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_notif_user ON user_notifications(user_id, is_read)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_notif_created ON user_notifications(user_id, created_at DESC)`);

    /* ================= REFERRALS ================= */
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER REFERENCES users(id) ON DELETE SET NULL`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(10,2) DEFAULT 0`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code)`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS referrals (
        id SERIAL PRIMARY KEY,
        referrer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        referred_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','rewarded')),
        reward_amount NUMERIC(10,2) DEFAULT 0,
        rewarded_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(referred_id)
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id)`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS loyalty_points_balance INT DEFAULT 0`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS wallet_discount NUMERIC(10,2) DEFAULT 0`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_discount NUMERIC(10,2) DEFAULT 0`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_points_earned INT DEFAULT 0`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS flash_sale_id INTEGER REFERENCES flash_sales(id) ON DELETE SET NULL`);

    /* ================= COD DELIVERY OTP ================= */
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_otp VARCHAR(6)`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_otp_verified BOOLEAN DEFAULT FALSE`);

    /* ================= REVIEW MODERATION STATUS ================= */
    await client.query(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending','approved','rejected'))`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status)`);

    /* ================= SUPPORT TICKETS ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        user_name VARCHAR(150),
        user_email VARCHAR(150),
        subject VARCHAR(300) NOT NULL,
        category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('general','order','payment','return','product','other')),
        status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
        assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
        order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        closed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tickets_created ON support_tickets(created_at DESC)`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS support_messages (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user','admin')),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_support_msgs_ticket ON support_messages(ticket_id, created_at)`);

    /* ================= CATEGORY INDEXES ================= */
    await client.query(`CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order)`);

    /* ================= PRODUCT FAQs (add if missing on existing table) ================= */
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]'`);

    /* ================= PRODUCT INDEXES ================= */
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = TRUE`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_bestseller ON products(is_bestseller) WHERE is_bestseller = TRUE`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_sort ON products(sort_order)`);

    /* ================= PRODUCT ↔ CATEGORIES (many-to-many) ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_categories (
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        PRIMARY KEY (product_id, category_id)
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_product_categories_cat ON product_categories(category_id)`);

    /* ================= RELATED PRODUCTS ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS related_products (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        related_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        type VARCHAR(30) DEFAULT 'related' CHECK (type IN ('related','cross_sell','upsell')),
        sort_order INTEGER DEFAULT 0,
        UNIQUE(product_id, related_id)
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_related_products_product ON related_products(product_id)`);

    /* ================= VARIANT INDEXES ================= */
    /* variant columns (cost_price, weight_grams, barcode, image_url) now in CREATE TABLE */

    /* ================= VISITOR ANALYTICS ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS page_views (
        id SERIAL PRIMARY KEY,
        path VARCHAR(500) NOT NULL,
        referrer TEXT,
        user_agent TEXT,
        ip_address VARCHAR(45),
        device_type VARCHAR(20) DEFAULT 'desktop',
        browser VARCHAR(50),
        country VARCHAR(50),
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        session_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pageviews_created ON page_views(created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pageviews_path ON page_views(path, created_at)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pageviews_session ON page_views(session_id)`);

    /* ================= BLOG POSTS ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(300) NOT NULL,
        slug VARCHAR(300) UNIQUE NOT NULL,
        excerpt TEXT,
        content TEXT NOT NULL,
        cover_image TEXT,
        author_name VARCHAR(100) DEFAULT 'Oroganix Team',
        category VARCHAR(100) DEFAULT 'General',
        tags JSONB DEFAULT '[]',
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
        views_count INTEGER DEFAULT 0,
        meta_title VARCHAR(300),
        meta_description TEXT,
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_blog_status ON blog_posts(status, published_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug)`);

    /* ================= PRODUCT BUNDLES ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_bundles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        discount_type VARCHAR(20) DEFAULT 'percent' CHECK (discount_type IN ('percent', 'flat')),
        discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
        image_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bundle_products (
        id SERIAL PRIMARY KEY,
        bundle_id INTEGER NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1,
        UNIQUE(bundle_id, product_id)
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bundle_products_bundle ON bundle_products(bundle_id)`);

    /* ================= SUBSCRIPTIONS (Auto-Reorder) ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
        quantity INTEGER DEFAULT 1,
        frequency_days INTEGER NOT NULL DEFAULT 30,
        next_order_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','paused','cancelled')),
        total_orders INTEGER DEFAULT 0,
        last_order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        address_id INTEGER REFERENCES user_addresses(id) ON DELETE SET NULL,
        payment_method VARCHAR(20) DEFAULT 'cod',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_next ON subscriptions(status, next_order_date) WHERE status = 'active'`);

    /* ================= COMPANY POLICY PAGES ================= */
    await client.query(`ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS privacy_policy TEXT`);
    await client.query(`ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS terms_conditions TEXT`);
    await client.query(`ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS shipping_policy TEXT`);
    await client.query(`ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS return_policy TEXT`);

    /* ================= NEWSLETTER SUBSCRIBERS ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(150) NOT NULL UNIQUE,
        is_active BOOLEAN DEFAULT TRUE,
        subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email)`);

    /* ================= PRICE AUDIT LOGS ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS price_logs (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        user_name TEXT,
        user_email TEXT,
        user_phone TEXT,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        product_name TEXT,
        original_price NUMERIC(10,2),
        paid_price NUMERIC(10,2),
        quantity INTEGER DEFAULT 1,
        savings_per_item NUMERIC(10,2) DEFAULT 0,
        total_savings NUMERIC(10,2) DEFAULT 0,
        reason_type VARCHAR(30) NOT NULL,
        reason_detail TEXT,
        flash_sale_id INTEGER REFERENCES flash_sales(id) ON DELETE SET NULL,
        coupon_code TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_price_logs_order ON price_logs(order_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_price_logs_user ON price_logs(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_price_logs_reason ON price_logs(reason_type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_price_logs_created ON price_logs(created_at DESC)`);

    /* ================= REVIEWS: nullable order_id + user-product unique index ================= */
    await client.query(`ALTER TABLE reviews ALTER COLUMN order_id DROP NOT NULL`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS unique_review_per_user_product ON reviews(user_id, product_id)`);

    /* ================= SAFETY TAGS ================= */
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS safety_tags TEXT[] DEFAULT '{}'`);

    /* ================= SITE-WIDE FAQs ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS faqs (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        category VARCHAR(100) NOT NULL DEFAULT 'General',
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs(is_active, sort_order)`);

    /* ================= RBAC: DEPARTMENTS ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    /* ================= RBAC: PERMISSIONS (seed) ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) NOT NULL UNIQUE,
        label VARCHAR(150) NOT NULL,
        group_name VARCHAR(100) NOT NULL,
        description TEXT
      )
    `);

    /* ================= RBAC: DEPARTMENT ↔ PERMISSION ================= */
    await client.query(`
      CREATE TABLE IF NOT EXISTS department_permissions (
        department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
        permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        PRIMARY KEY (department_id, permission_id)
      )
    `);

    /* ================= RBAC: USERS.department_id ================= */
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL`);

    /* ================= SEED PERMISSIONS ================= */
    const PERMS = [
      // Dashboard
      ['dashboard.view',           'View Dashboard',           'Dashboard',     'Access the main admin dashboard'],
      // Orders
      ['orders.view',              'View Orders',              'Orders',        'View all customer orders'],
      ['orders.manage',            'Manage Orders',            'Orders',        'Create, edit, and delete orders'],
      ['orders.status_update',     'Update Order Status',      'Orders',        'Change order status and trigger notifications'],
      // Products
      ['products.view',            'View Products',            'Products',      'Browse the product catalog'],
      ['products.create',          'Create Products',          'Products',      'Add new products to the catalog'],
      ['products.edit',            'Edit Products',            'Products',      'Modify existing product details'],
      ['products.delete',          'Delete Products',          'Products',      'Remove products from the catalog'],
      ['products.bulk',            'Bulk Product Operations',  'Products',      'Upload, stock update, price update in bulk'],
      // Categories
      ['categories.view',          'View Categories',          'Categories',    'View product categories'],
      ['categories.manage',        'Manage Categories',        'Categories',    'Create, edit, and delete categories'],
      // Brands
      ['brands.view',              'View Brands',              'Brands',        'View brand listings'],
      ['brands.manage',            'Manage Brands',            'Brands',        'Create, edit, and delete brands'],
      // Users
      ['users.view',               'View Users',               'Users',         'View customer and admin user list'],
      ['users.manage',             'Manage Users',             'Users',         'Create, edit, and deactivate users'],
      // Coupons
      ['coupons.view',             'View Coupons',             'Coupons',       'View coupon list'],
      ['coupons.manage',           'Manage Coupons',           'Coupons',       'Create, edit, and delete coupons'],
      // Reviews
      ['reviews.view',             'View Reviews',             'Reviews',       'View product reviews'],
      ['reviews.manage',           'Manage Reviews',           'Reviews',       'Approve, reject, or delete reviews'],
      // Analytics
      ['analytics.view',           'View Analytics',           'Analytics',     'Access sales, revenue, and traffic analytics'],
      // Settings
      ['settings.view',            'View Settings',            'Settings',      'View application settings'],
      ['settings.manage',          'Manage Settings',          'Settings',      'Change application-wide settings'],
      // Wallet / Loyalty
      ['wallet.view',              'View Wallet',              'Wallet',        'View wallet transactions and balances'],
      ['wallet.manage',            'Manage Wallet',            'Wallet',        'Credit or debit user wallets'],
      // Returns
      ['returns.view',             'View Returns',             'Returns',       'View return requests'],
      ['returns.manage',           'Manage Returns',           'Returns',       'Approve or reject return requests'],
      // Support
      ['support.view',             'View Support Tickets',     'Support',       'View customer support tickets'],
      ['support.manage',           'Manage Support Tickets',   'Support',       'Reply to and close support tickets'],
      // Blog
      ['blog.view',                'View Blog',                'Blog',          'View blog posts'],
      ['blog.manage',              'Manage Blog',              'Blog',          'Create, edit, and delete blog posts'],
      // Banners
      ['banners.view',             'View Banners',             'Banners',       'View promotional banners'],
      ['banners.manage',           'Manage Banners',           'Banners',       'Create, edit, and delete banners'],
      // Flash Sales
      ['flash_sales.view',         'View Flash Sales',         'Flash Sales',   'View flash sale campaigns'],
      ['flash_sales.manage',       'Manage Flash Sales',       'Flash Sales',   'Create and manage flash sales'],
      // Subscriptions
      ['subscriptions.view',       'View Subscriptions',       'Subscriptions', 'View customer subscription orders'],
      // Notifications
      ['notifications.send',       'Send Notifications',       'Notifications', 'Send push notifications to users'],
      // Export
      ['export.access',            'Export Data',              'Export',        'Download reports and export data'],
      // Invoices
      ['invoices.view',            'View Invoices',            'Invoices',      'View and download order invoices'],
      // Price Logs
      ['price_logs.view',          'View Price Logs',          'Logs',          'View discount and pricing audit logs'],
      // Departments (superadmin-only effectively)
      ['departments.manage',       'Manage Departments',       'Departments',   'Create departments and assign permissions'],
    ];

    for (const [key, label, group_name, description] of PERMS) {
      await client.query(
        `INSERT INTO permissions (key, label, group_name, description) VALUES ($1,$2,$3,$4) ON CONFLICT (key) DO NOTHING`,
        [key, label, group_name, description]
      );
    }

    /* ================= PERFORMANCE INDEXES ================= */

    // Webhook order lookup — runs on every Razorpay payment callback
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL`);

    // orderCleanup cron: WHERE payment_status='unpaid' AND expires_at < NOW()
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_expires ON orders(expires_at, payment_status) WHERE expires_at IS NOT NULL`);

    // autoCancelOrders cron: WHERE status=0 AND created_at < NOW() - interval
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at) WHERE status = 0`);

    // Flash sale rollback: WHERE order_id=$1 AND reason_type='flash_sale' AND flash_sale_id IS NOT NULL
    await client.query(`CREATE INDEX IF NOT EXISTS idx_price_logs_flash_sale ON price_logs(flash_sale_id) WHERE flash_sale_id IS NOT NULL`);

    // Loyalty rollback / return deduction: WHERE order_id=$1 AND type='earn'/'redeem' AND source=...
    await client.query(`CREATE INDEX IF NOT EXISTS idx_loyalty_order ON loyalty_points(order_id, type, source) WHERE order_id IS NOT NULL`);

    // Cart: nearly every API call fetches cart by user_id
    await client.query(`CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(user_id)`);

    // Coupon rollback on cancel: DELETE FROM coupon_uses WHERE order_id=$1
    await client.query(`CREATE INDEX IF NOT EXISTS idx_coupon_uses_order ON coupon_uses(order_id)`);

    // Full-text product search using pg_trgm (extension already created above)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(name gin_trgm_ops)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_desc_trgm ON products USING gin(short_description gin_trgm_ops)`);

    await client.query("COMMIT");
    console.log("✅ Production-Ready DB Initialized Successfully");

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ DB Init Error:", err);
  } finally {
    client.release();
  }

  // Critical column migrations run OUTSIDE the main transaction so they
  // always apply even if the main transaction rolled back (e.g. due to an
  // index creation error on the hosted DB).
  await runSafeColumnMigrations();
};

/* Each statement runs in its own connection so one failure never blocks others. */
async function runSafeColumnMigrations() {
  const migrations = [
    // invoices GST compliance columns
    `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cgst_amount NUMERIC(10,2) DEFAULT 0`,
    `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sgst_amount NUMERIC(10,2) DEFAULT 0`,
    `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS igst_amount NUMERIC(10,2) DEFAULT 0`,
    `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS place_of_supply VARCHAR(100)`,
    `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30)`,
    `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0`,
    `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS seller_gstin VARCHAR(50)`,
    // invoice_items GST columns
    `ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(30)`,
    `ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT 'Nos'`,
    `ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS gst_percent NUMERIC(5,2) DEFAULT 0`,
    `ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS taxable_value NUMERIC(10,2) DEFAULT 0`,
    `ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS cgst_rate NUMERIC(5,2) DEFAULT 0`,
    `ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS cgst_amount NUMERIC(10,2) DEFAULT 0`,
    `ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS sgst_rate NUMERIC(5,2) DEFAULT 0`,
    `ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS sgst_amount NUMERIC(10,2) DEFAULT 0`,
    `ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS igst_rate NUMERIC(5,2) DEFAULT 0`,
    `ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS igst_amount NUMERIC(10,2) DEFAULT 0`,
    // company settings bank & compliance
    `ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS fssai_number VARCHAR(30)`,
    `ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100)`,
    `ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS bank_account VARCHAR(40)`,
    `ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS bank_ifsc VARCHAR(20)`,
    `ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS bank_branch VARCHAR(100)`,
    // push tokens
    `ALTER TABLE push_tokens ADD COLUMN IF NOT EXISTS device_type VARCHAR(20) DEFAULT 'mobile'`,
    // shipment tracking extended columns
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url VARCHAR(500)`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS out_for_delivery_at TIMESTAMP`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_attempts INTEGER DEFAULT 0`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS rto_initiated_at TIMESTAMP`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_gstin VARCHAR(20)`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_igst BOOLEAN DEFAULT FALSE`,
    // invoice void columns (Indian GST compliance - never delete invoices, only void)
    `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_voided BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS voided_at TIMESTAMP`,
    `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS void_reason VARCHAR(200)`,
    `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS credit_note_number VARCHAR(100)`,
    // shipment_events table (created via migration, safe to re-run)
    `CREATE TABLE IF NOT EXISTS shipment_events (
       id SERIAL PRIMARY KEY,
       order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
       status_code VARCHAR(30) NOT NULL,
       status_label VARCHAR(100) NOT NULL,
       description TEXT,
       location VARCHAR(150),
       event_time TIMESTAMP NOT NULL DEFAULT NOW(),
       source VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','webhook','api','system')),
       raw_payload JSONB,
       created_at TIMESTAMP DEFAULT NOW()
     )`,
    `CREATE INDEX IF NOT EXISTS idx_shipment_events_order ON shipment_events(order_id)`,
    `CREATE INDEX IF NOT EXISTS idx_shipment_events_time ON shipment_events(event_time DESC)`,

    // gift cards (safe outside main transaction)
    `CREATE TABLE IF NOT EXISTS gift_cards (
       id SERIAL PRIMARY KEY,
       code VARCHAR(20) UNIQUE NOT NULL,
       amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
       balance NUMERIC(10,2) NOT NULL CHECK (balance >= 0),
       issued_to_email VARCHAR(150),
       issued_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
       purchased_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
       purchased_by_order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
       is_active BOOLEAN DEFAULT TRUE,
       expires_at TIMESTAMP,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       used_at TIMESTAMP
     )`,
    `CREATE INDEX IF NOT EXISTS idx_gift_cards_email ON gift_cards(issued_to_email)`,
    `CREATE INDEX IF NOT EXISTS idx_gift_cards_active ON gift_cards(is_active)`,
    `CREATE TABLE IF NOT EXISTS gift_card_uses (
       id SERIAL PRIMARY KEY,
       gift_card_id INTEGER NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
       order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
       user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
       amount_used NUMERIC(10,2) NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     )`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_card_discount NUMERIC(10,2) DEFAULT 0`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_card_code TEXT`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_token UUID DEFAULT gen_random_uuid()`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_tracking_token ON orders(tracking_token)`,
    // review helpful votes
    `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful_count INT DEFAULT 0`,
    `CREATE TABLE IF NOT EXISTS review_helpful_votes (
       id SERIAL PRIMARY KEY,
       review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
       user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       UNIQUE(review_id, user_id)
     )`,
    `CREATE INDEX IF NOT EXISTS idx_review_helpful_review ON review_helpful_votes(review_id)`,
    `CREATE INDEX IF NOT EXISTS idx_review_helpful_user ON review_helpful_votes(user_id)`,
    // dosha quiz results
    `CREATE TABLE IF NOT EXISTS quiz_results (
       id SERIAL PRIMARY KEY,
       user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
       session_id VARCHAR(120),
       dosha VARCHAR(20) NOT NULL CHECK (dosha IN ('Vata','Pitta','Kapha')),
       vata_score INTEGER DEFAULT 0,
       pitta_score INTEGER DEFAULT 0,
       kapha_score INTEGER DEFAULT 0,
       answers JSONB DEFAULT '[]',
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     )`,
    `CREATE INDEX IF NOT EXISTS idx_quiz_results_user ON quiz_results(user_id)`,
    // shared wishlists
    `CREATE TABLE IF NOT EXISTS shared_wishlists (
       id SERIAL PRIMARY KEY,
       user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       token UUID NOT NULL DEFAULT gen_random_uuid(),
       is_active BOOLEAN NOT NULL DEFAULT TRUE,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       UNIQUE(user_id)
     )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_shared_wishlists_token ON shared_wishlists(token)`,
    // dynamic quizzes (gamification)
    `CREATE TABLE IF NOT EXISTS quizzes (
       id SERIAL PRIMARY KEY,
       title VARCHAR(200) NOT NULL,
       description TEXT,
       type VARCHAR(30) NOT NULL DEFAULT 'scored',
       starts_at TIMESTAMP,
       expires_at TIMESTAMP,
       max_attempts_per_user INTEGER NOT NULL DEFAULT 1,
       pass_score INTEGER NOT NULL DEFAULT 0,
       reward_type VARCHAR(20) DEFAULT 'none',
       reward_value NUMERIC(10,2) DEFAULT 0,
       reward_is_percent BOOLEAN DEFAULT FALSE,
       reward_max_claims INTEGER DEFAULT 0,
       reward_claims_count INTEGER DEFAULT 0,
       is_active BOOLEAN DEFAULT TRUE,
       created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     )`,
    `CREATE TABLE IF NOT EXISTS quiz_questions (
       id SERIAL PRIMARY KEY,
       quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
       question_text TEXT NOT NULL,
       sort_order INTEGER DEFAULT 0,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     )`,
    `CREATE TABLE IF NOT EXISTS quiz_options (
       id SERIAL PRIMARY KEY,
       question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
       option_text TEXT NOT NULL,
       is_correct BOOLEAN DEFAULT FALSE,
       points INTEGER DEFAULT 1,
       sort_order INTEGER DEFAULT 0
     )`,
    `CREATE TABLE IF NOT EXISTS user_quiz_attempts (
       id SERIAL PRIMARY KEY,
       quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
       user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
       session_id VARCHAR(120),
       score INTEGER DEFAULT 0,
       total_possible INTEGER DEFAULT 0,
       answers JSONB DEFAULT '[]',
       passed BOOLEAN DEFAULT FALSE,
       reward_type VARCHAR(20),
       reward_value NUMERIC(10,2),
       reward_given BOOLEAN DEFAULT FALSE,
       reward_ref VARCHAR(100),
       completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     )`,
    `CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_quiz ON user_quiz_attempts(quiz_id)`,
    `CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_user ON user_quiz_attempts(user_id)`,
    // scratch cards (gamification)
    `CREATE TABLE IF NOT EXISTS scratch_cards (
       id SERIAL PRIMARY KEY,
       title VARCHAR(200) NOT NULL,
       description TEXT,
       reward_type VARCHAR(20) NOT NULL DEFAULT 'wallet',
       reward_value NUMERIC(10,2) NOT NULL DEFAULT 0,
       reward_is_percent BOOLEAN DEFAULT FALSE,
       max_claims INTEGER DEFAULT 0,
       claims_count INTEGER DEFAULT 0,
       max_claims_per_user INTEGER DEFAULT 1,
       starts_at TIMESTAMP,
       expires_at TIMESTAMP,
       is_active BOOLEAN DEFAULT TRUE,
       created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     )`,
    `CREATE TABLE IF NOT EXISTS scratch_card_claims (
       id SERIAL PRIMARY KEY,
       scratch_card_id INTEGER NOT NULL REFERENCES scratch_cards(id) ON DELETE CASCADE,
       user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       reward_type VARCHAR(20),
       reward_value NUMERIC(10,2),
       reward_ref VARCHAR(100),
       claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     )`,
    `CREATE INDEX IF NOT EXISTS idx_scratch_card_claims_card ON scratch_card_claims(scratch_card_id)`,
    `CREATE INDEX IF NOT EXISTS idx_scratch_card_claims_user ON scratch_card_claims(user_id, scratch_card_id)`,
    // spin wheel (gamification)
    `CREATE TABLE IF NOT EXISTS spin_wheels (
       id SERIAL PRIMARY KEY,
       title VARCHAR(200) NOT NULL,
       spins_per_user_per_day INTEGER NOT NULL DEFAULT 1,
       is_active BOOLEAN DEFAULT TRUE,
       expires_at TIMESTAMP,
       created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     )`,
    `CREATE TABLE IF NOT EXISTS spin_wheel_segments (
       id SERIAL PRIMARY KEY,
       wheel_id INTEGER NOT NULL REFERENCES spin_wheels(id) ON DELETE CASCADE,
       label VARCHAR(100) NOT NULL,
       reward_type VARCHAR(20) NOT NULL DEFAULT 'none',
       reward_value NUMERIC(10,2) DEFAULT 0,
       probability_weight INTEGER DEFAULT 10,
       color VARCHAR(20) DEFAULT '#3d7a5a',
       sort_order INTEGER DEFAULT 0
     )`,
    `CREATE TABLE IF NOT EXISTS spin_wheel_plays (
       id SERIAL PRIMARY KEY,
       wheel_id INTEGER NOT NULL REFERENCES spin_wheels(id) ON DELETE CASCADE,
       user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       segment_id INTEGER REFERENCES spin_wheel_segments(id) ON DELETE SET NULL,
       segment_label VARCHAR(100),
       reward_type VARCHAR(20),
       reward_value NUMERIC(10,2),
       reward_given BOOLEAN DEFAULT FALSE,
       reward_ref VARCHAR(100),
       played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     )`,
    `CREATE INDEX IF NOT EXISTS idx_spin_wheel_plays_wheel ON spin_wheel_plays(wheel_id)`,
    `CREATE INDEX IF NOT EXISTS idx_spin_wheel_plays_user ON spin_wheel_plays(user_id, wheel_id)`,
    // reward audit log (gamification)
    `CREATE TABLE IF NOT EXISTS reward_logs (
       id SERIAL PRIMARY KEY,
       user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       source_type VARCHAR(50) NOT NULL,
       source_id INTEGER,
       reward_type VARCHAR(20) NOT NULL,
       reward_value NUMERIC(10,2) NOT NULL,
       reward_ref VARCHAR(100),
       description TEXT,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     )`,
    `CREATE INDEX IF NOT EXISTS idx_reward_logs_user ON reward_logs(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_reward_logs_source ON reward_logs(source_type, source_id)`,
  ]
  for (const sql of migrations) {
    const c = await pool.connect()
    try { await c.query(sql) } catch (e) { console.warn('[migration skip]', e.message) } finally { c.release() }
  }
}

module.exports = initDB;