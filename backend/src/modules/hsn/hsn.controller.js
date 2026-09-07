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

/* ─── Normalise raw HSN value from CSV (handles "10011090.00" → "10011090") ─── */
function normaliseHsn(raw) {
  let s = raw.toString().trim().replace(/,/g, '') // strip commas (1,001 → 1001)

  if (s.includes('.')) {
    const [intPart, decPart] = s.split('.')
    if (/^0+$/.test(decPart)) {
      s = intPart // ".00" / ".000" → strip cleanly
    } else {
      // Non-zero decimal → return original so caller can report it
      return { code: null, raw: s, reason: `"${s}" has a non-zero decimal part — HSN codes must be whole numbers` }
    }
  }

  if (!/^\d+$/.test(s))
    return { code: null, raw: s, reason: `"${s}" contains non-numeric characters` }

  if (s.length < 2 || s.length > 8)
    return { code: null, raw: s, reason: `"${s}" is ${s.length} digits — HSN codes must be 2–8 digits` }

  return { code: s, raw: s, reason: null }
}

/* ─── Validate already-normalised HSN ─── */
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
          mapHeaders: ({ header }) =>
            header.trim().toLowerCase().replace(/\s+/g, '_'),
        }))
        .on('data', (row) => {
          rowNum++
          const rawHsn     = (row.hsn_code || '').toString().trim()
          const description = (row.description || '').toString().trim()

          if (!rawHsn && !description) return // skip blank rows silently

          if (!rawHsn) {
            parseErrors.push({ row: rowNum, hsn_code: '', reason: 'Missing "Hsn code" value' })
            return
          }

          // Normalise: strips decimal zeros, validates digits + length
          const norm = normaliseHsn(rawHsn)
          if (!norm.code) {
            parseErrors.push({ row: rowNum, hsn_code: rawHsn, reason: norm.reason })
            return
          }

          if (!description) {
            parseErrors.push({ row: rowNum, hsn_code: norm.code, reason: 'Missing "Description" value' })
            return
          }

          parsed.push({ hsn_code: norm.code, description, _row: rowNum })
        })
        .on('end', resolve)
        .on('error', reject)
    })

    if (rowNum === 0) {
      return res.status(400).json({ success: false, message: 'CSV has no data rows. Required columns: "Hsn code" and "Description"' })
    }

    /* Deduplicate within CSV: track all duplicate occurrences */
    const seenRows = new Map() // hsn_code → first row number
    const dupErrors = []
    const unique = []

    for (const r of parsed) {
      if (seenRows.has(r.hsn_code)) {
        dupErrors.push({
          row: r._row,
          hsn_code: r.hsn_code,
          reason: `Duplicate in CSV — HSN ${r.hsn_code} already appeared at row ${seenRows.get(r.hsn_code)} (last value kept)`,
        })
        // Update to keep last occurrence
        const idx = unique.findIndex(u => u.hsn_code === r.hsn_code)
        if (idx !== -1) unique[idx] = r
      } else {
        seenRows.set(r.hsn_code, r._row)
        unique.push(r)
      }
    }

    /* Upsert to DB */
    let inserted = 0
    let updated = 0
    const processedRows = []
    const dbErrors = []

    for (const row of unique) {
      try {
        const existing = await pool.query('SELECT id FROM hsn_codes WHERE hsn_code=$1', [row.hsn_code])
        if (existing.rowCount) {
          const upd = await pool.query(
            'UPDATE hsn_codes SET description=$1, updated_at=NOW() WHERE hsn_code=$2 RETURNING *',
            [row.description, row.hsn_code]
          )
          updated++
          processedRows.push({ ...upd.rows[0], action: 'updated' })
        } else {
          const ins = await pool.query(
            'INSERT INTO hsn_codes (hsn_code, description) VALUES ($1, $2) RETURNING *',
            [row.hsn_code, row.description]
          )
          inserted++
          processedRows.push({ ...ins.rows[0], action: 'inserted' })
        }
      } catch (e) {
        dbErrors.push({ row: row._row, hsn_code: row.hsn_code, reason: e.message })
      }
    }

    const allSkipped = [...parseErrors, ...dupErrors, ...dbErrors]

    return res.json({
      success: true,
      message: `Import done — ${inserted} added, ${updated} updated${allSkipped.length ? `, ${allSkipped.length} row(s) skipped` : ''}`,
      summary: {
        total:    rowNum,
        inserted,
        updated,
        skipped:  allSkipped.length,
      },
      processed: processedRows,
      errors:    allSkipped,
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
