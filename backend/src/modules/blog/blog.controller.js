const pool = require('../../config/db')
const { uploadImageToAWS, deleteFromAWS } = require('../../utils/awsImageUpload')
const { broadcastAll } = require('../../services/pushNotification')

/* ================= HELPERS ================= */

function computeReadTime(content) {
  if (!content) return 1
  const words = content.replace(/<[^>]+>/g, '').trim().split(/\s+/).filter(w => w.length > 0).length
  return Math.max(1, Math.ceil(words / 200))
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function uniqueSlug(base) {
  let slug = slugify(base)
  let suffix = 0
  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`
    const { rows } = await pool.query(
      'SELECT id FROM blog_posts WHERE slug = $1',
      [candidate]
    )
    if (rows.length === 0) return candidate
    suffix++
  }
}

/* ================= PUBLIC ================= */

// GET /api/blog/public — paginated published posts
exports.getPublicPosts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12))
    const offset = (page - 1) * limit
    const { category, tag, search } = req.query

    let where = "WHERE status = 'published'"
    const params = []
    let idx = 1

    if (category) {
      where += ` AND category = $${idx++}`
      params.push(category)
    }

    if (tag) {
      where += ` AND tags @> $${idx++}::jsonb`
      params.push(JSON.stringify([tag]))
    }

    if (search) {
      where += ` AND (title ILIKE $${idx} OR excerpt ILIKE $${idx})`
      params.push(`%${search}%`)
      idx++
    }

    const countQ = `SELECT COUNT(*) FROM blog_posts ${where}`
    const countRes = await pool.query(countQ, params)
    const total = parseInt(countRes.rows[0].count)

    const dataQ = `
      SELECT id, title, slug, excerpt, cover_image, author_name,
             category, tags, views_count, published_at, created_at, content
      FROM blog_posts
      ${where}
      ORDER BY published_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `
    params.push(limit, offset)
    const { rows } = await pool.query(dataQ, params)

    const data = rows.map(({ content, ...rest }) => ({ ...rest, read_time: computeReadTime(content) }))

    res.json({
      success: true,
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (err) {
    console.error('getPublicPosts error:', err.message)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/blog/public/:slug — single post, increment views
exports.getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params

    const { rows } = await pool.query(
      `UPDATE blog_posts
       SET views_count = views_count + 1
       WHERE slug = $1 AND status = 'published'
       RETURNING *`,
      [slug]
    )

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' })
    }

    const post = rows[0]
    res.json({ success: true, data: { ...post, read_time: computeReadTime(post.content) } })
  } catch (err) {
    console.error('getPostBySlug error:', err.message)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/blog/public/categories — distinct categories from published posts
exports.getPublicCategories = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT category FROM blog_posts
       WHERE status = 'published' AND category IS NOT NULL AND category <> ''
       ORDER BY category`
    )
    res.json({ success: true, categories: rows.map(r => r.category) })
  } catch (err) {
    console.error('getPublicCategories error:', err.message)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/blog/public/tags — distinct tags from published posts
exports.getPublicTags = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT jsonb_array_elements_text(tags::jsonb) AS tag
       FROM blog_posts
       WHERE status = 'published' AND tags IS NOT NULL AND tags::text <> '[]'
       ORDER BY tag`
    )
    res.json({ success: true, tags: rows.map(r => r.tag) })
  } catch (err) {
    console.error('getPublicTags error:', err.message)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/* ================= ADMIN ================= */

// GET /api/blog/admin — all posts, paginated with search
exports.adminListPosts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20))
    const offset = (page - 1) * limit
    const { search, status } = req.query

    let where = 'WHERE 1=1'
    const params = []
    let idx = 1

    if (status) {
      where += ` AND status = $${idx++}`
      params.push(status)
    }

    if (search) {
      where += ` AND (title ILIKE $${idx} OR category ILIKE $${idx})`
      params.push(`%${search}%`)
      idx++
    }

    const countQ = `SELECT COUNT(*) FROM blog_posts ${where}`
    const countRes = await pool.query(countQ, params)
    const total = parseInt(countRes.rows[0].count)

    const dataQ = `
      SELECT *
      FROM blog_posts
      ${where}
      ORDER BY created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `
    params.push(limit, offset)
    const { rows } = await pool.query(dataQ, params)

    res.json({
      success: true,
      data: rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (err) {
    console.error('adminListPosts error:', err.message)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/blog/admin — create post with optional cover image
exports.adminCreatePost = async (req, res) => {
  try {
    const {
      title, excerpt, content, author_name, category,
      tags, status, meta_title, meta_description, published_at
    } = req.body

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' })
    }

    const slug = await uniqueSlug(title)

    let cover_image = null
    if (req.file) {
      cover_image = await uploadImageToAWS(req.file, 'blog')
    }

    // Parse tags — accept JSON string or comma-separated
    let parsedTags = []
    if (tags) {
      try {
        parsedTags = JSON.parse(tags)
      } catch {
        parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean)
      }
    }

    const finalStatus = status || 'draft'
    let finalPublishedAt = published_at || null
    if (finalStatus === 'published' && !finalPublishedAt) {
      finalPublishedAt = new Date().toISOString()
    }

    const { rows } = await pool.query(
      `INSERT INTO blog_posts
        (title, slug, excerpt, content, cover_image, author_name, category,
         tags, status, meta_title, meta_description, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        title, slug, excerpt || null, content, cover_image,
        author_name || 'Oroganix Team', category || 'General',
        JSON.stringify(parsedTags), finalStatus,
        meta_title || null, meta_description || null, finalPublishedAt
      ]
    )

    const created = rows[0]
    // Fire push notification to all users when a new post is published
    if (created.status === 'published') {
      broadcastAll(
        '📖 New Article Published',
        created.title,
        { type: 'blog', slug: created.slug }
      ).catch(() => {})
    }
    res.status(201).json({ success: true, data: created, message: 'Post created' })
  } catch (err) {
    console.error('adminCreatePost error:', err.message)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// PUT /api/blog/admin/:id — update post
exports.adminUpdatePost = async (req, res) => {
  try {
    const { id } = req.params
    const {
      title, slug, excerpt, content, author_name, category,
      tags, status, meta_title, meta_description, published_at,
      remove_cover
    } = req.body

    // Check exists
    const existing = await pool.query('SELECT * FROM blog_posts WHERE id = $1', [id])
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' })
    }

    const post = existing.rows[0]

    // Handle cover image
    let cover_image = post.cover_image
    if (req.file) {
      // Delete old image if exists
      if (post.cover_image) await deleteFromAWS(post.cover_image)
      cover_image = await uploadImageToAWS(req.file, 'blog')
    } else if (remove_cover === 'true' || remove_cover === true) {
      if (post.cover_image) await deleteFromAWS(post.cover_image)
      cover_image = null
    }

    // Parse tags
    let parsedTags = post.tags || []
    if (tags !== undefined) {
      try {
        parsedTags = JSON.parse(tags)
      } catch {
        parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean)
      }
    }

    // Handle slug
    let finalSlug = post.slug
    if (slug && slug !== post.slug) {
      finalSlug = await uniqueSlug(slug)
    } else if (title && title !== post.title) {
      finalSlug = await uniqueSlug(title)
    }

    const finalStatus = status || post.status
    let finalPublishedAt = published_at !== undefined ? published_at : post.published_at
    if (finalStatus === 'published' && !finalPublishedAt) {
      finalPublishedAt = new Date().toISOString()
    }

    const { rows } = await pool.query(
      `UPDATE blog_posts SET
        title = $1, slug = $2, excerpt = $3, content = $4, cover_image = $5,
        author_name = $6, category = $7, tags = $8, status = $9,
        meta_title = $10, meta_description = $11, published_at = $12,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $13
       RETURNING *`,
      [
        title || post.title, finalSlug, excerpt !== undefined ? excerpt : post.excerpt,
        content || post.content, cover_image,
        author_name || post.author_name, category || post.category,
        JSON.stringify(parsedTags), finalStatus,
        meta_title !== undefined ? meta_title : post.meta_title,
        meta_description !== undefined ? meta_description : post.meta_description,
        finalPublishedAt, id
      ]
    )

    const updated = rows[0]
    // Fire push notification when a draft is first published
    const wasPublished = post.status !== 'published' && updated.status === 'published'
    if (wasPublished) {
      broadcastAll(
        '📖 New Article Published',
        updated.title,
        { type: 'blog', slug: updated.slug }
      ).catch(() => {})
    }
    res.json({ success: true, data: updated, message: 'Post updated' })
  } catch (err) {
    console.error('adminUpdatePost error:', err.message)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// DELETE /api/blog/admin/:id — delete post + cover image
exports.adminDeletePost = async (req, res) => {
  try {
    const { id } = req.params

    const existing = await pool.query('SELECT cover_image FROM blog_posts WHERE id = $1', [id])
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' })
    }

    // Delete cover image from AWS
    if (existing.rows[0].cover_image) {
      await deleteFromAWS(existing.rows[0].cover_image)
    }

    await pool.query('DELETE FROM blog_posts WHERE id = $1', [id])

    res.json({ success: true, message: 'Post deleted' })
  } catch (err) {
    console.error('adminDeletePost error:', err.message)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
