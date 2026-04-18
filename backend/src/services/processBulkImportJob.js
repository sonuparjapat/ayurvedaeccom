const fs = require('fs')
const stream = require('stream')
const csv = require('csv-parser')
const AdmZip = require('adm-zip')

const pool =
require('../config/db')

const {
  uploadImageToAWS,
  deleteFromAWS
} = require('../utils/awsImageUpload')

const {
  addAdminLog
} = require('../utils/adminLogger')

const {
  getMimeType
} = require('../utils/getMimeType')

module.exports =
async function processBulkImportJob(job) {

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
      .filter(f =>
        !f.isDirectory
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

  catRes.rows.forEach(c => {
    categoryMap[
      c.name.toLowerCase()
    ] = c
  })

  let successCount = 0
  let failed = []

  for (
    let i = 0;
    i < rows.length;
    i++
  ) {
    const rowNo = i + 2
    const r = rows[i]

    let imageUrls = []

    try {

      const name =
        (r.name || '').trim()

      const slug =
        (r.slug || '').trim()

      const sku =
        (r.sku || '').trim()

      const price =
        Number(
          r.price || 0
        )

      const compareprice =
        Number(
          r.compareprice || 0
        )

      const inventory =
        Number(
          r.inventory || 0
        )

      const status =
        (r.status || 'draft')
        .trim()
        .toLowerCase()

      const brand =
        (r.brand || '').trim()

      const category_name =
        (
          r.category_name || ''
        ).trim()

      if (
        !name ||
        !sku ||
        price <= 0
      ) {
        throw new Error(
          'Required fields missing'
        )
      }

      const cat =
        categoryMap[
          category_name
          .toLowerCase()
        ]

      if (!cat) {
        throw new Error(
          'Category not found'
        )
      }

      const skuCheck =
        await pool.query(
          `
          SELECT id
          FROM products
          WHERE LOWER(sku)=LOWER($1)
          LIMIT 1
          `,
          [sku]
        )

      if (
        skuCheck.rowCount
      ) {
        throw new Error(
          'SKU already exists'
        )
      }

      const matched =
        zipEntries.filter(
          f =>
            f.entryName
            .toLowerCase()
            .startsWith(
              sku.toLowerCase() + '-'
            )
        )

      for (const img of matched) {

        const file = {
          buffer:
            img.getData(),
          originalname:
            img.entryName,
          mimetype:
            getMimeType(
              img.entryName
            )
        }

        const url =
          await uploadImageToAWS(
            file,
            'products'
          )

        imageUrls.push(url)
      }

      await pool.query(
        `
        INSERT INTO products (
          name,
          slug,
          shortdescription,
          longdescription,
          price,
          compareprice,
          inventory,
          sku,
          category_id,
          category_name,
          brand,
          status,
          images,
          meta_title,
          meta_description,
          meta_keywords,
          gst_percent
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
        )
        `,
        [
          name,
          slug ||
          `${sku.toLowerCase()}-${Date.now()}-${i}`,
          r.shortdescription || '',
          r.longdescription || '',
          price,
          compareprice,
          inventory,
          sku,
          cat.id,
          cat.name,
          brand,
          status,
          JSON.stringify(imageUrls),
          r.meta_title || '',
          r.meta_description || '',
          r.meta_keywords || '',
          cat.gst_percent || 0
        ]
      )

      successCount++

    } catch (err) {

      for (const url of imageUrls) {
        try {
          await deleteFromAWS(url)
        } catch {}
      }

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
      'BULK_IMPORT',
    module:
      'PRODUCTS',
    details:{
      imported:
        successCount,
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
    imported:
      successCount,
    failed,
    total:
      rows.length
  }
}