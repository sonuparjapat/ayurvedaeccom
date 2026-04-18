const fs = require('fs')
const stream = require('stream')
const csv = require('csv-parser')
const AdmZip = require('adm-zip')

const pool =
require('../config/db')

const {
  addAdminLog
} = require('../utils/adminLogger')

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
    await pool.query(
      `
      SELECT id,name,gst_percent
      FROM categories
      `
    )

  const categoryMap = {}
  const categoryById = {}

  catRes.rows.forEach(c => {

    categoryMap[
      String(c.name)
      .trim()
      .toLowerCase()
    ] = c

    categoryById[
      Number(c.id)
    ] = c
  })

  const skuRes =
    await pool.query(
      `
      SELECT sku
      FROM products
      WHERE sku IS NOT NULL
      `
    )

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
      Number(
        r.price || 0
      )

    const inventory =
      Number(
        r.inventory || 0
      )

    const status =
      (r.status || 'draft')
      .trim()
      .toLowerCase()

    const category_name =
      (
        r.category_name || ''
      ).trim()

    const category_id =
      (
        r.category_id || ''
      ).trim()

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

    let cat = null

    if (category_id) {
      cat =
        categoryById[
          Number(
            category_id
          )
        ]
    }

    if (
      !cat &&
      category_name
    ) {
      cat =
        categoryMap[
          category_name
          .toLowerCase()
        ]
    }

    if (!cat) {
      rowErrors.push(
        'Category not found'
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

  try {
    if (
      payload.csvPath &&
      fs.existsSync(
        payload.csvPath
      )
    ) fs.unlinkSync(
      payload.csvPath
    )

    if (
      payload.zipPath &&
      fs.existsSync(
        payload.zipPath
      )
    ) fs.unlinkSync(
      payload.zipPath
    )
  } catch {}

  return {
    totalRows:
      rows.length,
    validRows,
    failedRows:
      errors.length,
    errors
  }
}