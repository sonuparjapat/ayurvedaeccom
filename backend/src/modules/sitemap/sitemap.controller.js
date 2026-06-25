const pool = require('../../config/db')

exports.generateSitemap = async (req, res) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'https://oroganix.com'

    // blog_posts table may not exist yet — catch individually
    const [products, categories] = await Promise.all([
      pool.query("SELECT slug, updated_at FROM products WHERE status='active' ORDER BY updated_at DESC"),
      pool.query("SELECT slug FROM categories WHERE is_active=TRUE"),
    ])

    let blogPosts = { rows: [] }
    try {
      blogPosts = await pool.query("SELECT slug, updated_at FROM blog_posts WHERE status='published' ORDER BY published_at DESC")
    } catch (_) {
      // blog_posts table doesn't exist yet — skip
    }

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    // Static pages
    const staticPages = ['', '/products', '/blog', '/about', '/contact', '/faq']
    for (const p of staticPages) {
      xml += `  <url><loc>${baseUrl}${p}</loc><changefreq>weekly</changefreq><priority>${p === '' ? '1.0' : '0.8'}</priority></url>\n`
    }

    // Products
    for (const p of products.rows) {
      xml += `  <url><loc>${baseUrl}/product/${p.slug}</loc><lastmod>${new Date(p.updated_at).toISOString().split('T')[0]}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>\n`
    }

    // Categories
    for (const c of categories.rows) {
      xml += `  <url><loc>${baseUrl}/category/${c.slug}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`
    }

    // Blog
    for (const b of blogPosts.rows) {
      xml += `  <url><loc>${baseUrl}/blog/${b.slug}</loc><lastmod>${new Date(b.updated_at).toISOString().split('T')[0]}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>\n`
    }

    xml += '</urlset>'

    res.set('Content-Type', 'application/xml')
    res.send(xml)
  } catch (err) {
    console.error('[Sitemap] Error:', err)
    res.status(500).send('Sitemap generation failed')
  }
}
