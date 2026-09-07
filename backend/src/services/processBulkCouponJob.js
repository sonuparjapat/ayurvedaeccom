const stream = require('stream')
const csv = require('csv-parser')

const pool =
require('../config/db')

const {
  addAdminLog
} = require('../utils/adminLogger')

const {
  downloadFileFromUrl
} = require('../utils/awsImageUpload')

const safeDeleteAws =
require('../utils/safeDeleteAws')

const VALID_TYPES = ['flat', 'percent']

module.exports =
async function processBulkCouponJob(job) {

  const payload = job.payload || {}

  const csvBuffer =
    await downloadFileFromUrl(
      payload.csvPath
    )

  const rows = []

  const readable = new stream.Readable()
  readable.push(csvBuffer)
  readable.push(null)

  await new Promise(
    (resolve, reject) => {
      readable
        .pipe(csv())
        .on('data', row => rows.push(row))
        .on('end', resolve)
        .on('error', reject)
    }
  )

  let created = 0
  const failed = []

  for (let i = 0; i < rows.length; i++) {

    const rowNo = i + 2
    const r = rows[i]

    try {

      const code = (r.code || '').trim().toUpperCase()
      const type = (r.type || '').trim().toLowerCase()
      const value = parseFloat(r.value)
      const min_order = parseFloat(r.min_order) || 0
      const max_discount = parseFloat(r.max_discount) || 0
      const usage_limit = parseInt(r.usage_limit) || 0
      const usage_per_user = parseInt(r.usage_per_user) || 1
      const valid_from = (r.valid_from || '').trim() || null
      const valid_to = (r.valid_to || '').trim() || null
      const description = (r.description || '').trim() || null
      const is_active = (r.is_active || '').trim().toLowerCase() !== 'false'

      if (!code) throw new Error('code missing')
      if (!VALID_TYPES.includes(type)) throw new Error(`type must be flat or percent`)
      if (isNaN(value) || value <= 0) throw new Error('value must be a positive number')
      if (type === 'percent' && value > 100) throw new Error('percent value cannot exceed 100')

      await pool.query(`
        INSERT INTO coupons
          (code, type, value, min_order, max_discount, usage_limit, usage_per_user,
           valid_from, valid_to, description, is_active)
        VALUES
          (UPPER($1),$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      `, [
        code, type, value, min_order, max_discount, usage_limit, usage_per_user,
        valid_from, valid_to, description, is_active,
      ])

      created++

    } catch (err) {

      const isDuplicate = err.code === '23505'
      failed.push({
        row: rowNo,
        code: (r.code || '').trim(),
        error: isDuplicate ? 'Duplicate code — already exists' : (err.message || 'Failed'),
      })
    }
  }

  await addAdminLog({
    adminId: job.created_by,
    action: 'BULK_COUPON_CREATE',
    module: 'COUPONS',
    details: { created, failed: failed.length, total: rows.length },
    ip: 'QUEUE',
  })

  try {
    await safeDeleteAws(payload.csvPath, { source: 'bulk_temp', refId: job.id })
  } catch {}

  return { created, failed, total: rows.length }
}
