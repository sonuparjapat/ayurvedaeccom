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

const {
  downloadFileFromUrl
} = require('../utils/awsImageUpload')

module.exports =
async function processBulkUploadJob(job) {

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

  await updateJob(
    job.id,
    { progress:20 }
  )

  let zipEntries = []

  if (payload.zipPath) {

    const zipBuffer =
      await downloadFileFromUrl(
        payload.zipPath
      )

    const zip =
      new AdmZip(
        zipBuffer
      )

    zipEntries =
      zip.getEntries()
      .filter(
        f => !f.isDirectory
      )
  }

  const zipMap = {}

  zipEntries.forEach(f => {

    const key =
      f.entryName
        .toLowerCase()
        .split('-')[0]
        .split('.')[0]

    zipMap[key] =
      zipMap[key] || []

    zipMap[key].push(f)
  })

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
      const gst_percent =
  String(r.gst_percent || '').trim()

const hsn_code =
  String(r.hsn_code || '').trim()

const cess_percent =
  String(r.cess_percent || '').trim()

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

    if (!cat)
      rowErrors.push(
        'Invalid category_id'
      )
if (gst_percent !== '') {
  const gst = Number(gst_percent)

  if (isNaN(gst) || gst < 0 || gst > 100) {
    rowErrors.push('Invalid gst_percent')
  }
}

if (cess_percent !== '') {
  const cess = Number(cess_percent)

  if (isNaN(cess) || cess < 0 || cess > 100) {
    rowErrors.push('Invalid cess_percent')
  }
}

if (hsn_code && hsn_code.length > 30) {
  rowErrors.push('Invalid hsn_code')
}
    if (
      sku &&
      csvSku.has(
        sku.toLowerCase()
      )
    ) {
      rowErrors.push(
        'Duplicate SKU in CSV'
      )
    }

    if (
      sku &&
      existingSku.has(
        sku.toLowerCase()
      )
    ) {
      rowErrors.push(
        'SKU already exists'
      )
    }

    if (sku) {
      csvSku.add(
        sku.toLowerCase()
      )
    }

    if (
      payload.zipPath &&
      sku &&
      !(zipMap[
        sku.toLowerCase()
      ] || []).length
    ) {

      const hasCsvImages =
        String(
          r.images || ''
        ).trim()

      if (!hasCsvImages) {
        rowErrors.push(
          'No image found in ZIP or CSV images column'
        )
      }
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
            (i / Math.max(rows.length,1)) * 55
          )
        )

      await updateJob(
        job.id,
        { progress:percent }
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