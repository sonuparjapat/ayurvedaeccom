const pool = require('../../../config/db');

exports.getOverviewAnalytics = async (req, res) => {
  try {
    const { from, to } = req.query;

    // Default date range = lifetime
    const dateFilter = from && to
      ? `AND created_at BETWEEN $1 AND $2`
      : '';

    /* ================= REVENUE ================= */

    const revenueQuery = `
      SELECT
        COALESCE(SUM(grand_total),0) AS total_revenue,
        COUNT(*) FILTER (WHERE payment_status='paid') AS paid_orders,
        COUNT(*) FILTER (WHERE payment_status!='paid') AS unpaid_orders,
        COALESCE(AVG(grand_total),0) AS avg_order_value
      FROM orders
      WHERE payment_status='paid'
      AND grand_total >= 0
      ${dateFilter}
    `;

    const revenueResult = from && to
      ? await pool.query(revenueQuery, [from, to])
      : await pool.query(revenueQuery);

    /* ================= TOTAL ORDERS ================= */

    const ordersResult = await pool.query(`
      SELECT COUNT(*) AS total_orders
      FROM orders
    `);

    /* ================= USERS ================= */

    const usersResult = await pool.query(`
      SELECT
        COUNT(*) AS total_users,
        COUNT(*) FILTER (WHERE is_verified=true) AS verified_users,
        COUNT(*) FILTER (WHERE is_active=true) AS active_users,
        COUNT(*) FILTER (
          WHERE DATE_TRUNC('month', created_at)
          = DATE_TRUNC('month', CURRENT_DATE)
        ) AS new_users_this_month
      FROM users
    `);

    /* ================= PRODUCTS ================= */

    const productsResult = await pool.query(`
      SELECT
        COUNT(*) AS total_products,
        COUNT(*) FILTER (WHERE status='active') AS active_products,
        COUNT(*) FILTER (WHERE inventory < 5) AS low_stock_products
      FROM products
    `);

    /* ================= TODAY REVENUE ================= */

    const todayRevenue = await pool.query(`
      SELECT COALESCE(SUM(grand_total),0) AS today_revenue
      FROM orders
      WHERE payment_status='paid'
      AND grand_total >= 0
      AND DATE(created_at)=CURRENT_DATE
    `);

    /* ================= MONTH REVENUE ================= */

    const monthRevenue = await pool.query(`
      SELECT COALESCE(SUM(grand_total),0) AS month_revenue
      FROM orders
      WHERE payment_status='paid'
      AND grand_total >= 0
      AND DATE_TRUNC('month', created_at)
          = DATE_TRUNC('month', CURRENT_DATE)
    `);

    /* ================= LAST MONTH REVENUE (Growth) ================= */

    const lastMonthRevenue = await pool.query(`
      SELECT COALESCE(SUM(grand_total),0) AS last_month_revenue
      FROM orders
      WHERE payment_status='paid'
      AND grand_total >= 0
      AND DATE_TRUNC('month', created_at)
          = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    `);

    const currentMonth = Number(monthRevenue.rows[0].month_revenue);
    const previousMonth = Number(lastMonthRevenue.rows[0].last_month_revenue);

    const growth =
      previousMonth === 0
        ? 100
        : ((currentMonth - previousMonth) / previousMonth) * 100;

    res.json({
      success: true,
      data: {
        revenue: revenueResult.rows[0],
        orders: ordersResult.rows[0],
        users: usersResult.rows[0],
        products: productsResult.rows[0],
        todayRevenue: todayRevenue.rows[0].today_revenue,
        monthRevenue: currentMonth,
        lastMonthRevenue: previousMonth,
        monthlyGrowthPercent: Number(growth.toFixed(2))
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Analytics fetch failed"
    });
  }
};

exports.getRevenueChart = async (req, res) => {
  try {
    const { period = 'daily' } = req.query;

    let trunc, interval;
    if (period === 'weekly') { trunc = 'week'; interval = '12 weeks'; }
    else if (period === 'monthly') { trunc = 'month'; interval = '12 months'; }
    else { trunc = 'day'; interval = '30 days'; }

    const { rows } = await pool.query(`
      SELECT
        DATE_TRUNC($1, created_at) AS period,
        SUM(total_amount) AS revenue,
        COUNT(*) AS orders
      FROM orders
      WHERE status NOT IN (6,9)
        AND created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY 1
      ORDER BY 1 ASC
    `, [trunc]);

    res.json({ success: true, data: rows.map(r => ({
      label: new Date(r.period).toLocaleDateString('en-IN', period === 'monthly' ? { month: 'short', year: '2-digit' } : period === 'weekly' ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short' }),
      revenue: Number(r.revenue),
      orders: Number(r.orders)
    })) });
  } catch (err) {
    console.error('[REVENUE CHART]', err);
    res.status(500).json({ success: false, message: 'Chart fetch failed' });
  }
};