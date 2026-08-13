const pool = require('../../config/db')
const mailer = require('../../config/mail')
const templates = require('../../utils/emailTemplates')

const SENDER = () => ({
  email: process.env.MAIL_FROM || 'hello@oroganix.com',
  name: process.env.APP_NAME || 'Oroganix',
})

/* ── send to a single address ── */
const sendMail = async (to, subject, htmlContent) => {
  await mailer.sendTransacEmail({
    sender: SENDER(),
    to: [{ email: to }],
    subject,
    htmlContent,
  })
}

/* ── send to ALL active subscribers in batches of 50 ── */
const broadcastToSubscribers = async (subject, htmlContent) => {
  const result = await pool.query(
    'SELECT email FROM newsletter_subscribers WHERE is_active = TRUE'
  )
  const emails = result.rows.map(r => r.email)
  if (!emails.length) return 0

  const BATCH = 50
  for (let i = 0; i < emails.length; i += BATCH) {
    const chunk = emails.slice(i, i + BATCH)
    await mailer.sendTransacEmail({
      sender: SENDER(),
      to: chunk.map(e => ({ email: e })),
      subject,
      htmlContent,
    })
  }
  return emails.length
}

/* ── PUBLIC: subscribe ── */
exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email required' })
    }
    const clean = email.toLowerCase().trim()
    const exists = await pool.query(
      'SELECT id, is_active FROM newsletter_subscribers WHERE email = $1',
      [clean]
    )

    if (exists.rows.length) {
      if (!exists.rows[0].is_active) {
        await pool.query(
          'UPDATE newsletter_subscribers SET is_active = TRUE, subscribed_at = NOW() WHERE id = $1',
          [exists.rows[0].id]
        )
        // send welcome back
        try {
          const { subject, html } = templates.newsletterWelcome({ email: clean })
          await sendMail(clean, subject, html)
        } catch {}
        return res.json({ success: true, message: 'Welcome back! You have been re-subscribed.' })
      }
      return res.json({ success: true, message: 'You are already subscribed!' })
    }

    await pool.query('INSERT INTO newsletter_subscribers (email) VALUES ($1)', [clean])

    // send welcome email
    try {
      const { subject, html } = templates.newsletterWelcome({ email: clean })
      await sendMail(clean, subject, html)
    } catch (mailErr) {
      console.error('[Newsletter welcome mail]', mailErr.message)
    }

    res.json({ success: true, message: 'Successfully subscribed! 🌿' })
  } catch (err) {
    console.error('[Newsletter]', err)
    res.status(500).json({ success: false, message: 'Subscription failed' })
  }
}

/* ── PUBLIC: unsubscribe ── */
exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ success: false, message: 'Email required' })
    await pool.query(
      'UPDATE newsletter_subscribers SET is_active = FALSE WHERE email = $1',
      [email.toLowerCase().trim()]
    )
    res.json({ success: true, message: 'Unsubscribed successfully' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed' })
  }
}

/* ── ADMIN: list subscribers ── */
exports.adminList = async (req, res) => {
  try {
    const { page = 1, limit = 50, status = 'all' } = req.query
    const pg = Math.max(1, parseInt(page) || 1)
    const lim = Math.min(200, Math.max(1, parseInt(limit) || 50))
    const offset = (pg - 1) * lim
    let where = ''
    if (status === 'active') where = 'WHERE is_active = TRUE'
    else if (status === 'inactive') where = 'WHERE is_active = FALSE'
    const [countRes, result] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE is_active=TRUE) AS active_count FROM newsletter_subscribers ${where}`
      ),
      pool.query(
        `SELECT * FROM newsletter_subscribers ${where} ORDER BY subscribed_at DESC LIMIT $1 OFFSET $2`,
        [lim, offset]
      ),
    ])
    res.json({
      success: true,
      data: result.rows,
      total: Number(countRes.rows[0].total),
      activeCount: Number(countRes.rows[0].active_count),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Failed' })
  }
}

/* ── ADMIN: export CSV ── */
exports.adminExportCSV = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT email, is_active, subscribed_at FROM newsletter_subscribers WHERE is_active = TRUE ORDER BY subscribed_at DESC'
    )
    const csv = [
      'Email,Subscribed At',
      ...result.rows.map(r => `${r.email},${new Date(r.subscribed_at).toISOString().slice(0, 10)}`),
    ].join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="subscribers_${Date.now()}.csv"`)
    res.send(csv)
  } catch (err) {
    res.status(500).json({ success: false, message: 'Export failed' })
  }
}

/* ── ADMIN: delete subscriber ── */
exports.adminDelete = async (req, res) => {
  try {
    await pool.query('DELETE FROM newsletter_subscribers WHERE id = $1', [req.params.id])
    res.json({ success: true, message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed' })
  }
}

/* ── ADMIN: send campaign ── */
exports.adminSendCampaign = async (req, res) => {
  try {
    const { type, subject, heading, body, ctaText, ctaUrl, couponCode, discountType, discountValue, minOrder, validTo, description } = req.body

    if (!type) return res.status(400).json({ success: false, message: 'Campaign type required' })

    let emailSubject, emailHtml

    if (type === 'custom') {
      if (!subject || !body) return res.status(400).json({ success: false, message: 'Subject and body required' })
      const tmpl = templates.customCampaign({ subject, heading, body, ctaText, ctaUrl })
      emailSubject = tmpl.subject
      emailHtml = tmpl.html

    } else if (type === 'coupon') {
      if (!couponCode) return res.status(400).json({ success: false, message: 'Coupon code required' })
      const tmpl = templates.couponCampaign({ subject, couponCode, description, discountType, discountValue: discountValue || 0, minOrder: minOrder || 0, validTo })
      emailSubject = tmpl.subject
      emailHtml = tmpl.html

    } else {
      return res.status(400).json({ success: false, message: 'Unknown campaign type' })
    }

    // Respond immediately; broadcast runs async so large lists don't timeout the request
    res.json({ success: true, message: 'Campaign queued — emails are being sent to subscribers.' })
    broadcastToSubscribers(emailSubject, emailHtml).catch(e => console.error('[Newsletter broadcast]', e.message))
  } catch (err) {
    console.error('[Newsletter campaign]', err)
    res.status(500).json({ success: false, message: 'Failed to send campaign' })
  }
}

/* ── internal: broadcast flash sale (called from flash.controller.js) ── */
exports.broadcastFlashSale = async ({ title, description, discountType, discountValue, endsAt, saleUrl }) => {
  try {
    const { subject, html } = templates.flashSaleAnnouncement({ title, description, discountType, discountValue, endsAt, saleUrl })
    const count = await broadcastToSubscribers(subject, html)
    console.log(`[Newsletter] Flash sale broadcast sent to ${count} subscribers`)
    return count
  } catch (err) {
    console.error('[Newsletter flash broadcast]', err.message)
    return 0
  }
}
