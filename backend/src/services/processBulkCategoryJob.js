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

module.exports =
async function processBulkCategoryJob(job) {

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
const catRes =
  await pool.query(`
      SELECT
        id,
        name,
        gst_percent,
        hsn_code,
        cess_percent
      FROM categories
    `)

  const byId = {}

  catRes.rows.forEach(c => {
    byId[
      Number(c.id)
    ] = c
  })

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

      const categoryId =
        Number(
          r.category_id || 0
        )

      if (!sku) {
        throw new Error(
          'SKU missing'
        )
      }

      const category =
        byId[
          categoryId
        ]

      if (!category) {
        throw new Error(
          'Invalid category_id'
        )
      }

      const result =
        await pool.query(`
UPDATE products
SET
  category_id=$1,
  category_name=$2,
  gst_percent=$3,
  hsn_code=$4,
  cess_percent=$5,
  updated_at=NOW()
WHERE LOWER(sku)=LOWER($6)
RETURNING id
        `,[
  category.id,
  category.name,
  category.gst_percent || 0,
  category.hsn_code || '',
  category.cess_percent || 0,
  sku
])

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
        row:rowNo,
        sku:r.sku || '',
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

    await safeDeleteAws(
      payload.csvPath,
      {
        source:'bulk_temp',
        refId:job.id
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