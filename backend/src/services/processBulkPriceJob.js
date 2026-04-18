const fs = require('fs')
const stream = require('stream')
const csv = require('csv-parser')

const pool =
require('../config/db')

const {
  addAdminLog
} = require('../utils/adminLogger')

module.exports =
async function processBulkPriceJob(job) {

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

      const price =
        Number(r.price)

      const compareprice =
        Number(
          r.compareprice || 0
        )

      if (!sku) {
        throw new Error(
          'SKU missing'
        )
      }

      if (
        price <= 0 ||
        Number.isNaN(price)
      ) {
        throw new Error(
          'Invalid price'
        )
      }

      if (
        compareprice < 0 ||
        Number.isNaN(
          compareprice
        )
      ) {
        throw new Error(
          'Invalid compare price'
        )
      }

      const result =
        await pool.query(
          `
          UPDATE products
          SET price=$1,
              compareprice=$2
          WHERE LOWER(sku)=LOWER($3)
          RETURNING id
          `,
          [
            price,
            compareprice,
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
      'BULK_PRICE_UPDATE',
    module:
      'PRICE',
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