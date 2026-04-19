const fs = require('fs')
const stream = require('stream')
const csv = require('csv-parser')
const AdmZip = require('adm-zip')

const pool =
require('../config/db')

const {
  addAdminLog
} = require('../utils/adminLogger')

const {
  updateJob
} = require('../utils/jobQueue')

module.exports =
async function processBulkUploadJob(job) {

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

  await updateJob(
    job.id,
    { progress:20 }
  )

  let zipEntries = []

  if (
    payload.zipPath &&
    fs.existsSync(
      payload.zipPath
    )
  ) {

    const zip =
      new AdmZip(
        payload.zipPath
      )

    zipEntries =
      zip.getEntries()
      .filter(
        f => !f.isDirectory
      )
  }

  const catRes =
    await pool.query(`
      SELECT id,name,gst_percent
      FROM categories
    `)

  const categoryById = {}

  catRes.rows.forEach(c => {
    categoryById[
      Number(c.id)
    ] = c
  })

  const skuRes =
    await pool.query(`
      SELECT sku
      FROM products
      WHERE sku IS NOT NULL
    `)

  const existingSku =
    new Set(
      skuRes.rows.map(r =>
        String(r.sku)
        .trim()
        .toLowerCase()
      )
    )

  const csvSku =
    new Set()

  const errors = []
  let validRows = 0

  await updateJob(
    job.id,
    { progress:35 }
  )

  for (
    let i = 0;
    i < rows.length;
    i++
  ) {

    const rowNo = i + 2
    const r = rows[i]

    const rowErrors = []

    const name =
      (r.name || '').trim()

    const sku =
      (r.sku || '').trim()

    const price =
      Number(r.price || 0)

    const inventory =
      Number(
        r.inventory || 0
      )

    const status =
      (r.status || 'draft')
      .trim()
      .toLowerCase()

    const category_id =
      Number(
        r.category_id || 0
      )

    const cat =
      categoryById[
        category_id
      ]

    if (!name)
      rowErrors.push(
        'Name required'
      )

    if (!sku)
      rowErrors.push(
        'SKU required'
      )

    if (price <= 0)
      rowErrors.push(
        'Valid price required'
      )

    if (inventory < 0)
      rowErrors.push(
        'Invalid inventory'
      )

    if (
      ![
        'draft',
        'active',
        'inactive'
      ].includes(status)
    ) {
      rowErrors.push(
        'Invalid status'
      )
    }

    if (!cat) {
      rowErrors.push(
        'Invalid category_id'
      )
    }

    if (
      csvSku.has(
        sku.toLowerCase()
      )
    ) {
      rowErrors.push(
        'Duplicate SKU in CSV'
      )
    }

    if (
      existingSku.has(
        sku.toLowerCase()
      )
    ) {
      rowErrors.push(
        'SKU already exists'
      )
    }

    csvSku.add(
      sku.toLowerCase()
    )

    const matched =
      zipEntries.filter(
        f =>
          f.entryName
          .toLowerCase()
          .startsWith(
            sku.toLowerCase() + '-'
          )
      )

    if (
      payload.zipPath &&
      matched.length === 0
    ) {
      rowErrors.push(
        'No image found in ZIP'
      )
    }

    if (
      rowErrors.length
    ) {

      errors.push({
        row: rowNo,
        sku,
        errors: rowErrors
      })

    } else {

      validRows++

    }

    if (
      i % 10 === 0
    ) {

      const percent =
        Math.min(
          90,
          35 +
          Math.floor(
            (i / rows.length) * 55
          )
        )

      await updateJob(
        job.id,
        {
          progress:percent
        }
      )
    }
  }

  await addAdminLog({
    adminId:
      job.created_by,
    action:
      'BULK_UPLOAD_VALIDATE',
    module:
      'PRODUCTS',
    details:{
      totalRows:
        rows.length,
      validRows,
      failedRows:
        errors.length
    },
    ip:'QUEUE'
  })

  await updateJob(
    job.id,
    { progress:100 }
  )

  return {
    totalRows:
      rows.length,
    validRows,
    failedRows:
      errors.length,
    errors,
    csvPath:
      payload.csvPath,
    zipPath:
      payload.zipPath || null
  }
}