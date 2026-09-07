const pool = require('../../config/db')
const multer = require('multer')
const csv = require('csv-parser')
const { Readable } = require('stream')

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })
exports.uploadMiddleware = upload.single('file')

/* ─── Ensure table exists ─── */
const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hsn_codes (
      id          SERIAL PRIMARY KEY,
      hsn_code    VARCHAR(20) UNIQUE NOT NULL,
      description TEXT NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `)
}

/* ─── Validate HSN format: 2–8 digits ─── */
const isValidHsn = (code) => /^\d{2,8}$/.test(code)

/* ─── GET / (list with pagination + search) ─── */
exports.list = async (req, res) => {
  try {
    await ensureTable()
    const page  = Math.max(1, Number(req.query.page)  || 1)
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20))
    const search = (req.query.search || '').trim()
    const offset = (page - 1) * limit

    let where  = ''
    let params = []

    if (search) {
      where  = 'WHERE hsn_code ILIKE $1 OR description ILIKE $1'
      params = [`%${search}%`]
    }

    const [rows, cnt] = await Promise.all([
      pool.query(
        `SELECT * FROM hsn_codes ${where} ORDER BY hsn_code ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      pool.query(`SELECT COUNT(*)::int AS total FROM hsn_codes ${where}`, params),
    ])

    const total = cnt.rows[0].total
    return res.json({
      success: true,
      data:    rows.rows,
      total,
      page,
      limit,
      pages:   Math.ceil(total / limit),
    })
  } catch (err) {
    console.error('[HSN list]', err)
    return res.status(500).json({ success: false, message: 'Failed to load HSN codes' })
  }
}

/* ─── GET /:id ─── */
exports.getOne = async (req, res) => {
  try {
    await ensureTable()
    const result = await pool.query('SELECT * FROM hsn_codes WHERE id=$1', [req.params.id])
    if (!result.rowCount) return res.status(404).json({ success: false, message: 'HSN code not found' })
    return res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    console.error('[HSN getOne]', err)
    return res.status(500).json({ success: false, message: 'Failed to fetch HSN code' })
  }
}

/* ─── POST / (create) ─── */
exports.create = async (req, res) => {
  try {
    await ensureTable()
    const hsn_code    = (req.body.hsn_code    || '').toString().trim()
    const description = (req.body.description || '').toString().trim()

    if (!hsn_code)    return res.status(400).json({ success: false, message: 'HSN code is required' })
    if (!description) return res.status(400).json({ success: false, message: 'Description is required' })
    if (!isValidHsn(hsn_code))
      return res.status(400).json({ success: false, message: 'HSN code must be 2–8 digits (numbers only)' })

    const result = await pool.query(
      `INSERT INTO hsn_codes (hsn_code, description) VALUES ($1, $2) RETURNING *`,
      [hsn_code, description]
    )
    return res.status(201).json({ success: true, data: result.rows[0], message: 'HSN code created' })
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ success: false, message: `HSN code already exists in the system` })
    console.error('[HSN create]', err)
    return res.status(500).json({ success: false, message: 'Failed to create HSN code' })
  }
}

/* ─── PUT /:id (update) ─── */
exports.update = async (req, res) => {
  try {
    await ensureTable()
    const { id } = req.params
    const hsn_code    = (req.body.hsn_code    || '').toString().trim()
    const description = (req.body.description || '').toString().trim()

    if (!hsn_code)    return res.status(400).json({ success: false, message: 'HSN code is required' })
    if (!description) return res.status(400).json({ success: false, message: 'Description is required' })
    if (!isValidHsn(hsn_code))
      return res.status(400).json({ success: false, message: 'HSN code must be 2–8 digits (numbers only)' })

    const result = await pool.query(
      `UPDATE hsn_codes SET hsn_code=$1, description=$2, updated_at=NOW() WHERE id=$3 RETURNING *`,
      [hsn_code, description, id]
    )
    if (!result.rowCount) return res.status(404).json({ success: false, message: 'HSN code not found' })
    return res.json({ success: true, data: result.rows[0], message: 'HSN code updated' })
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ success: false, message: 'That HSN code is already assigned to another entry' })
    console.error('[HSN update]', err)
    return res.status(500).json({ success: false, message: 'Failed to update HSN code' })
  }
}

/* ─── DELETE /:id ─── */
exports.remove = async (req, res) => {
  try {
    const result = await pool.query(`DELETE FROM hsn_codes WHERE id=$1 RETURNING id, hsn_code`, [req.params.id])
    if (!result.rowCount) return res.status(404).json({ success: false, message: 'HSN code not found' })
    return res.json({ success: true, message: `HSN code ${result.rows[0].hsn_code} deleted` })
  } catch (err) {
    console.error('[HSN remove]', err)
    return res.status(500).json({ success: false, message: 'Failed to delete HSN code' })
  }
}

/* ─── POST /bulk (CSV import) ─── */
exports.bulkImport = async (req, res) => {
  try {
    await ensureTable()
    if (!req.file) return res.status(400).json({ success: false, message: 'CSV file is required' })

    const rawCsv = req.file.buffer.toString('utf-8').trim()
    if (!rawCsv) return res.status(400).json({ success: false, message: 'Uploaded file is empty' })

    /* Parse rows */
    const parsed = []
    const parseErrors = []
    let rowNum = 0

    await new Promise((resolve, reject) => {
      Readable.from(rawCsv)
        .pipe(csv({
          // Normalize header names: lowercase + underscores, handles "Hsn code", "HSN Code", "hsn_code"
          mapHeaders: ({ header }) =>
            header.trim().toLowerCase().replace(/\s+/g, '_'),
        }))
        .on('data', (row) => {
          rowNum++
          // Support both "hsn_code" and "hsn code" → already mapped to "hsn_code"
          const hsnCode    = (row.hsn_code || '').toString().trim()
          const description = (row.description || '').toString().trim()

          if (!hsnCode && !description) return // skip completely blank rows

          if (!hsnCode) {
            parseErrors.push({ row: rowNum, reason: 'Missing "Hsn code" value', data: row })
            return
          }
          if (!isValidHsn(hsnCode)) {
            parseErrors.push({ row: rowNum, hsn_code: hsnCode, reason: `"${hsnCode}" is not valid — HSN codes must be 2–8 digits` })
            return
          }
          if (!description) {
            parseErrors.push({ row: rowNum, hsn_code: hsnCode, reason: 'Missing "Description" value' })
            return
          }

          parsed.push({ hsn_code: hsnCode, description })
        })
        .on('end', resolve)
        .on('error', reject)
    })

    /* Check required columns exist (at least one valid row or explicit error) */
    if (rowNum === 0) {
      return res.status(400).json({ success: false, message: 'CSV has no data rows. Required columns: "Hsn code" and "Description"' })
    }

    /* Deduplicate within the CSV itself (keep last occurrence) */
    const dedupMap = new Map()
    for (const r of parsed) dedupMap.set(r.hsn_code, r)
    const unique = Array.from(dedupMap.values())

    /* Upsert to DB */
    let inserted = 0, updated = 0
    const dbErrors = []

    for (const row of unique) {
      try {
        const existing = await pool.query('SELECT id FROM hsn_codes WHERE hsn_code=$1', [row.hsn_code])
        if (existing.rowCount) {
          await pool.query(
            'UPDATE hsn_codes SET description=$1, updated_at=NOW() WHERE hsn_code=$2',
            [row.description, row.hsn_code]
          )
          updated++
        } else {
          await pool.query(
            'INSERT INTO hsn_codes (hsn_code, description) VALUES ($1, $2)',
            [row.hsn_code, row.description]
          )
          inserted++
        }
      } catch (e) {
        dbErrors.push({ hsn_code: row.hsn_code, reason: e.message })
      }
    }

    const allFailed = [...parseErrors, ...dbErrors]

    return res.json({
      success: true,
      message: `Import done — ${inserted} added, ${updated} updated${allFailed.length ? `, ${allFailed.length} row(s) skipped` : ''}`,
      summary: {
        inserted,
        updated,
        skipped: allFailed.length,
        total:   rowNum,
      },
      errors: allFailed,
    })
  } catch (err) {
    console.error('[HSN bulkImport]', err)
    return res.status(500).json({ success: false, message: 'Bulk import failed — please check your file and try again' })
  }
}

/* ─── GET /template (download blank CSV) ─── */
exports.downloadTemplate = (req, res) => {
  const content = `Hsn code,Description\n30039011,Ayurvedic medicinal preparations with plants extract\n09041110,Pepper (whole)\n10063010,Rice (husked brown rice)\n`
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename=hsn-codes-template.csv')
  return res.send(content)
}
