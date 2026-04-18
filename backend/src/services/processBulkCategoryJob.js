const fs = require('fs')
const stream = require('stream')
const csv = require('csv-parser')

const pool =
require('../config/db')

const {
  addAdminLog
} = require('../utils/adminLogger')

module.exports =
async function processBulkCategoryJob(job) {

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

  const catRes =
    await pool.query(
      `
      SELECT
        id,
        name,
        gst_percent
      FROM categories
      `
    )

  const byId = {}
  const byName = {}

  catRes.rows.forEach(
    (c) => {
      byId[c.id] = c
      byName[
        c.name.toLowerCase()
      ] = c
    }
  )

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

      const categoryId =
        (
          r.category_id || ''
        ).trim()

      const categoryName =
        (
          r.category_name || ''
        ).trim()

      if (!sku) {
        throw new Error(
          'SKU missing'
        )
      }

      let category = null

      if (categoryId) {
        category =
          byId[
            Number(
              categoryId
            )
          ]
      } else if (
        categoryName
      ) {
        category =
          byName[
            categoryName
            .toLowerCase()
          ]
      }

      if (!category) {
        throw new Error(
          'Category not found'
        )
      }

      const result =
        await pool.query(
          `
          UPDATE products
          SET
            category_id=$1,
            category_name=$2,
            gst_percent=$3
          WHERE LOWER(sku)=LOWER($4)
          RETURNING id
          `,
          [
            category.id,
            category.name,
            category.gst_percent || 0,
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
      'BULK_CATEGORY_UPDATE',
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