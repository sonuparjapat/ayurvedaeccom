const pool = require("../../config/db");

function parseUA(ua) {
  if (!ua) return { device: 'unknown', browser: 'unknown' }
  const device = /mobile|android|iphone|ipad/i.test(ua) ? 'mobile' : /tablet/i.test(ua) ? 'tablet' : 'desktop'
  let browser = 'other'
  if (/chrome/i.test(ua) && !/edg/i.test(ua)) browser = 'Chrome'
  else if (/firefox/i.test(ua)) browser = 'Firefox'
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari'
  else if (/edg/i.test(ua)) browser = 'Edge'
  else if (/opera|opr/i.test(ua)) browser = 'Opera'
  return { device, browser }
}

exports.trackPageView = async (req, res) => {
  try {
    const { path, referrer, session_id } = req.body
    if (!path) return res.status(400).json({ success: false, message: 'Path required' })

    const ua = req.headers['user-agent'] || ''
    const { device, browser } = parseUA(ua)
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || ''
    const user_id = req.user?.id || null

    await pool.query(
      `INSERT INTO page_views (path, referrer, user_agent, ip_address, device_type, browser, user_id, session_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [path, referrer || null, ua.substring(0, 500), ip, device, browser, user_id, session_id || null]
    )

    res.json({ success: true })
  } catch (err) {
    console.error('[Analytics] Track error:', err)
    res.status(500).json({ success: false })
  }
}

exports.getVisitorStats = async (req, res) => {
  try {
    const { period = '7d' } = req.query
    let interval = '7 days'
    if (period === '24h') interval = '1 day'
    else if (period === '30d') interval = '30 days'
    else if (period === '90d') interval = '90 days'

    const [
      totalViews, uniqueVisitors, todayViews, todayUnique,
      topPages, deviceBreakdown, browserBreakdown, dailyChart, liveCount
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM page_views WHERE created_at >= NOW() - INTERVAL '${interval}'`),
      pool.query(`SELECT COUNT(DISTINCT COALESCE(session_id, ip_address)) FROM page_views WHERE created_at >= NOW() - INTERVAL '${interval}'`),
      pool.query(`SELECT COUNT(*) FROM page_views WHERE created_at >= CURRENT_DATE`),
      pool.query(`SELECT COUNT(DISTINCT COALESCE(session_id, ip_address)) FROM page_views WHERE created_at >= CURRENT_DATE`),
      pool.query(`SELECT path, COUNT(*) as views, COUNT(DISTINCT COALESCE(session_id, ip_address)) as unique_visitors
                  FROM page_views WHERE created_at >= NOW() - INTERVAL '${interval}'
                  GROUP BY path ORDER BY views DESC LIMIT 15`),
      pool.query(`SELECT device_type, COUNT(*) as count FROM page_views WHERE created_at >= NOW() - INTERVAL '${interval}' GROUP BY device_type ORDER BY count DESC`),
      pool.query(`SELECT browser, COUNT(*) as count FROM page_views WHERE created_at >= NOW() - INTERVAL '${interval}' GROUP BY browser ORDER BY count DESC`),
      pool.query(`SELECT DATE(created_at) as date, COUNT(*) as views, COUNT(DISTINCT COALESCE(session_id, ip_address)) as visitors
                  FROM page_views WHERE created_at >= NOW() - INTERVAL '${interval}'
                  GROUP BY DATE(created_at) ORDER BY date`),
      pool.query(`SELECT COUNT(DISTINCT COALESCE(session_id, ip_address)) FROM page_views WHERE created_at >= NOW() - INTERVAL '5 minutes'`),
    ])

    res.json({
      success: true,
      data: {
        totalViews: Number(totalViews.rows[0].count),
        uniqueVisitors: Number(uniqueVisitors.rows[0].count),
        todayViews: Number(todayViews.rows[0].count),
        todayUnique: Number(todayUnique.rows[0].count),
        liveVisitors: Number(liveCount.rows[0].count),
        topPages: topPages.rows,
        deviceBreakdown: deviceBreakdown.rows,
        browserBreakdown: browserBreakdown.rows,
        dailyChart: dailyChart.rows,
        period,
      }
    })
  } catch (err) {
    console.error('[Analytics] Stats error:', err)
    res.status(500).json({ success: false, message: 'Failed to load analytics' })
  }
}
