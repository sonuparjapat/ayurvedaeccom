const fs = require('fs')
const stream = require('stream')
const csv = require('csv-parser')

const pool =
require('../config/db')

const {
  addAdminLog
} = require('../utils/adminLogger')

module.exports =
async function processBulkStatusJob(job) {

  const payload =
    job.payload || {}

  const csvBuffer =
    fs.readFileSync(
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

  })

  let updated = 0
  let failed = []

  const allowed = [
    'draft',
    'active',
    'inactive'
  ]

  for (
    let i = 0;
    i < rows.length;
    i++
  ) {
    const rowNo = i + 2
    const r = rows[i]

    try {

      const sku =
        (
          r.sku || ''
        ).trim()

      const status =
        (
          r.status || ''
        )
        .trim()
        .toLowerCase()

      if (!sku) {
        throw new Error(
          'SKU missing'
        )
      }

      if (
        !allowed.includes(
          status
        )
      ) {
        throw new Error(
          'Invalid status'
        )
      }

      const result =
        await pool.query(
          `
          UPDATE products
          SET status=$1
          WHERE LOWER(sku)=LOWER($2)
          RETURNING id
          `,
          [
            status,
            sku
          ]
        )

      if (
        !result.rowCount
      ) {
        throw new Error(
          'SKU not found'
        )
      }

      updated++

    } catch (err) {

      failed.push({
        row: rowNo,
        sku:
          r.sku || '',
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
      'BULK_STATUS_UPDATE',
    module:
      'PRODUCTS',
    details:{
      updated,
      failed:
        failed.length,
      total:
        rows.length
    },
    ip:'QUEUE'
  })

  try {
    if (
      payload.csvPath &&
      fs.existsSync(
        payload.csvPath
      )
    ) {
      fs.unlinkSync(
        payload.csvPath
      )
    }
  } catch {}

  return {
    updated,
    failed,
    total:
      rows.length
  }
}