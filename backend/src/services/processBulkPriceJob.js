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

const VALID_MODES = ['set', 'percent_increase', 'percent_decrease']

module.exports =
async function processBulkPriceJob(job) {

  const payload =
    job.payload || {}

  const csvBuffer =
    await downloadFileFromUrl(
      payload.csvPath
    )

  const rows = []

  const readable =
    new stream.Readable()

  readable.push(csvBuffer)
  readable.push(null)

  await new Promise(
    (resolve, reject) => {

      readable
        .pipe(csv())
        .on(
          'data',
          row => rows.push(row)
        )
        .on('end', resolve)
        .on('error', reject)

    }
  )

  let updated = 0
  const failed = []

  for (
    let i = 0;
    i < rows.length;
    i++
  ) {

    const rowNo = i + 2
    const r = rows[i]

    try {

      const sku =
        (r.sku || '')
        .trim()

      const mode =
        (r.mode || 'set')
        .trim()
        .toLowerCase()

      if (!sku) {
        throw new Error('SKU missing')
      }

      if (!VALID_MODES.includes(mode)) {
        throw new Error('Invalid mode — must be set, percent_increase, or percent_decrease')
      }

      let finalPrice, finalCompare, finalCost

      if (mode === 'set') {

        const price = Number(r.price)
        const compareprice = Number(r.compareprice || 0)
        const costPrice = r.cost_price ? Number(r.cost_price) : null

        if (price <= 0 || Number.isNaN(price)) {
          throw new Error('Invalid price')
        }
        if (compareprice < 0 || Number.isNaN(compareprice)) {
          throw new Error('Invalid compare price')
        }

        finalPrice = price
        finalCompare = compareprice
        finalCost = costPrice

      } else {

        /* percent_increase / percent_decrease — read current prices first */
        const pct = Number(r.price)
        if (pct <= 0 || pct > 100 || Number.isNaN(pct)) {
          throw new Error('Invalid percent — must be between 1 and 100')
        }

        const existing = await pool.query(
          `SELECT price, compareprice, cost_price FROM products WHERE LOWER(sku)=LOWER($1) LIMIT 1`,
          [sku]
        )

        if (!existing.rowCount) {
          throw new Error('SKU not found')
        }

        const cur = existing.rows[0]
        const factor = mode === 'percent_increase'
          ? 1 + pct / 100
          : 1 - pct / 100

        finalPrice = Math.max(1, Math.round(Number(cur.price) * factor * 100) / 100)
        finalCompare = cur.compareprice
          ? Math.round(Number(cur.compareprice) * factor * 100) / 100
          : 0
        finalCost = cur.cost_price
          ? Math.round(Number(cur.cost_price) * factor * 100) / 100
          : null
      }

      const result =
        await pool.query(`
          UPDATE products
          SET price = $1,
              compareprice = $2,
              cost_price = COALESCE($3, cost_price)
          WHERE LOWER(sku) = LOWER($4)
          RETURNING id
        `, [
          finalPrice,
          finalCompare,
          finalCost,
          sku
        ])

      if (!result.rowCount) {
        throw new Error('SKU not found')
      }

      updated++

    } catch (err) {

      failed.push({
        row: rowNo,
        sku: r.sku || '',
        error:
          err.message ||
          'Failed'
      })
    }
  }

  await addAdminLog({
    adminId:
      job.created_by,
    action:
      'BULK_PRICE_UPDATE',
    module:
      'PRICE',
    details: {
      updated,
      failed:
        failed.length,
      total:
        rows.length
    },
    ip: 'QUEUE'
  })

  try {

    await safeDeleteAws(
      payload.csvPath,
      {
        source: 'bulk_temp',
        refId: job.id
      }
    )

  } catch {}

  return {
    updated,
    failed,
    total:
      rows.length
  }
}
