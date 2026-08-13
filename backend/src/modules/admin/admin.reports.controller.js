const pool = require('../../config/db')

function dateParams(req) {
  const { from, to } = req.query
  if (from && to) return { clause: `AND o.created_at BETWEEN $1 AND $2`, params: [from, to] }
  return { clause: '', params: [] }
}

/* ── Top Products by Revenue ── */
exports.topProductsByRevenue = async (req, res) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit) || 10)
    const { clause, params } = dateParams(req)
    const i = params.length
    const result = await pool.query(`
      SELECT
        p.id, p.name, p.images->>0 AS image, p.category_name,
        SUM(oi.quantity) AS total_units_sold,
        SUM(oi.quantity * oi.price) AS total_revenue,
        COUNT(DISTINCT oi.order_id) AS order_count
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status = 5 ${clause}
      GROUP BY p.id
      ORDER BY total_revenue DESC
      LIMIT $${i + 1}
    `, [...params, limit])
    res.json({ success: true, data: result.rows })
  } catch (err) {
    console.error('[REPORT topProducts]', err)
    res.status(500).json({ success: false, message: 'Failed to generate report' })
  }
}

/* ── Category-wise Revenue ── */
exports.categoryRevenue = async (req, res) => {
  try {
    const { clause, params } = dateParams(req)
    const result = await pool.query(`
      SELECT
        p.category_name,
        COUNT(DISTINCT oi.order_id) AS order_count,
        SUM(oi.quantity) AS total_units_sold,
        SUM(oi.quantity * oi.price) AS total_revenue
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status = 5 AND p.category_name IS NOT NULL ${clause}
      GROUP BY p.category_name
      ORDER BY total_revenue DESC
    `, params)
    res.json({ success: true, data: result.rows })
  } catch (err) {
    console.error('[REPORT categoryRevenue]', err)
    res.status(500).json({ success: false, message: 'Failed to generate report' })
  }
}

/* ── State-wise Orders ── */
exports.stateRevenue = async (req, res) => {
  try {
    const { clause, params } = dateParams(req)
    const result = await pool.query(`
      SELECT
        o.shipping_address->>'state' AS state,
        COUNT(*) AS order_count,
        SUM(o.total_amount) AS total_revenue,
        AVG(o.total_amount)::numeric(10,2) AS avg_order_value
      FROM orders o
      WHERE o.status = 5
        AND o.shipping_address->>'state' IS NOT NULL
        AND o.shipping_address->>'state' != ''
        ${clause}
      GROUP BY state
      ORDER BY total_revenue DESC
    `, params)
    res.json({ success: true, data: result.rows })
  } catch (err) {
    console.error('[REPORT stateRevenue]', err)
    res.status(500).json({ success: false, message: 'Failed to generate report' })
  }
}

/* ── Profit Margin Report (requires cost_price on products) ── */
exports.profitMarginReport = async (req, res) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit) || 20)
    const { clause, params } = dateParams(req)
    const i = params.length
    const result = await pool.query(`
      SELECT
        p.id, p.name, p.category_name,
        ROUND(p.cost_price::numeric, 2) AS cost_price,
        ROUND(p.price::numeric, 2) AS selling_price,
        ROUND(((p.price - COALESCE(p.cost_price, 0)) / NULLIF(p.price, 0) * 100)::numeric, 2) AS margin_pct,
        SUM(oi.quantity) AS units_sold,
        ROUND(SUM(oi.quantity * (oi.price - COALESCE(p.cost_price, 0)))::numeric, 2) AS total_profit
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status = 5 AND p.cost_price IS NOT NULL ${clause}
      GROUP BY p.id
      ORDER BY total_profit DESC
      LIMIT $${i + 1}
    `, [...params, limit])
    res.json({ success: true, data: result.rows })
  } catch (err) {
    console.error('[REPORT profitMargin]', err)
    res.status(500).json({ success: false, message: 'Failed to generate report' })
  }
}

/* ── Monthly Revenue Trend ── */
exports.monthlyRevenueTrend = async (req, res) => {
  try {
    const months = Math.min(24, parseInt(req.query.months) || 12)
    const result = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
        COUNT(*) AS order_count,
        SUM(total_amount)::numeric(12,2) AS revenue,
        AVG(total_amount)::numeric(10,2) AS avg_order_value
      FROM orders
      WHERE status = 5
        AND created_at >= NOW() - ($1::text || ' months')::INTERVAL
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `, [months])
    res.json({ success: true, data: result.rows })
  } catch (err) {
    console.error('[REPORT monthlyTrend]', err)
    res.status(500).json({ success: false, message: 'Failed to generate report' })
  }
}

/* ── Coupon Usage Report ── */
exports.couponUsageReport = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.code, c.type, c.value,
        COUNT(cu.id) AS times_used,
        SUM(cu.discount_amount) AS total_discount_given,
        c.valid_from, c.valid_to
      FROM coupons c
      LEFT JOIN coupon_uses cu ON cu.coupon_id = c.id
      GROUP BY c.id
      ORDER BY times_used DESC
    `)
    res.json({ success: true, data: result.rows })
  } catch (err) {
    console.error('[REPORT couponUsage]', err)
    res.status(500).json({ success: false, message: 'Failed to generate report' })
  }
}
