const stream = require('stream')
const csv = require('csv-parser')
const pool = require('../config/db')
const { addAdminLog } = require('../utils/adminLogger')
const { downloadFileFromUrl } = require('../utils/awsImageUpload')
const safeDeleteAws = require('../utils/safeDeleteAws')

const VALID_TYPES = ['percent', 'flat']

module.exports = async function processBulkFlashSaleJob(job) {
  const payload = job.payload || {}

  const csvBuffer = await downloadFileFromUrl(payload.csvPath)

  const rows = await new Promise((resolve, reject) => {
    const results = []
    const readable = stream.Readable.from(csvBuffer)
    readable
      .pipe(csv())
      .on('data', row => results.push(row))
      .on('end', () => resolve(results))
      .on('error', reject)
  })

  let created = 0
  const failed = []

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const rowNo = i + 2

    try {
      const title = (r.title || '').trim()
      const discount_type = (r.discount_type || 'percent').trim().toLowerCase()
      const discount_value = parseFloat(r.discount_value)
      const starts_at = (r.starts_at || '').trim()
      const ends_at = (r.ends_at || '').trim()
      const description = (r.description || '').trim() || null
      const max_uses = parseInt(r.max_uses) || null
      const is_active = (r.is_active || '').trim().toLowerCase() !== 'false'

      if (!title) throw new Error('title is required')
      if (!VALID_TYPES.includes(discount_type)) throw new Error('discount_type must be percent or flat')
      if (isNaN(discount_value) || discount_value <= 0) throw new Error('discount_value must be a positive number')
      if (discount_type === 'percent' && discount_value > 100) throw new Error('percent discount_value cannot exceed 100')
      if (!starts_at) throw new Error('starts_at is required (YYYY-MM-DD HH:MM)')
      if (!ends_at) throw new Error('ends_at is required (YYYY-MM-DD HH:MM)')

      const startDate = new Date(starts_at)
      const endDate = new Date(ends_at)
      if (isNaN(startDate.getTime())) throw new Error('starts_at is not a valid date')
      if (isNaN(endDate.getTime())) throw new Error('ends_at is not a valid date')
      if (endDate <= startDate) throw new Error('ends_at must be after starts_at')

      await pool.query(
        `INSERT INTO flash_sales (title, description, discount_type, discount_value, starts_at, ends_at, max_uses, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [title, description, discount_type, discount_value, startDate, endDate, max_uses, is_active]
      )
      created++
    } catch (err) {
      failed.push({
        row: rowNo,
        title: (r.title || '').trim(),
        error: err.message || 'Failed',
      })
    }
  }

  await addAdminLog({
    adminId: job.created_by,
    action: 'BULK_FLASH_SALE_CREATE',
    module: 'FLASH_SALES',
    details: { created, failed: failed.length, total: rows.length },
    ip: 'QUEUE',
  })

  try {
    await safeDeleteAws(payload.csvPath, { source: 'bulk_temp', refId: job.id })
  } catch {}

  return {
    summary: { created, failed: failed.length, total: rows.length },
    failed,
  }
}
