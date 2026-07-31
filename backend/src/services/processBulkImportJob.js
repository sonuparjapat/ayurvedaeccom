const stream = require('stream')
const csv = require('csv-parser')
const AdmZip = require('adm-zip')

const pool =
require('../config/db')

const {
  uploadImageToAWS,
  uploadImageFromUrl,
  downloadFileFromUrl
} = require('../utils/awsImageUpload')

const {
  addAdminLog
} = require('../utils/adminLogger')

const {
  getMimeType
} = require('../utils/getMimeType')

const {
  updateJob
} = require('../utils/jobQueue')

const safeDeleteAws =
require('../utils/safeDeleteAws')

module.exports =
async function processBulkImportJob(job) {

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

  let successCount = 0
  const failed = []

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

    let imageUrls = []

    try {

      const name =
        (r.name || '').trim()

      const sku =
        (r.sku || '').trim()

      const slug =
        (r.slug || '').trim()

      const price =
        Number(r.price || 0)

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

      const category_id =
        Number(
          r.category_id || 0
        )

      const cat =
        categoryById[
          category_id
        ]
        const csvGst =
  String(r.gst_percent || '').trim()

const csvHsn =
  String(r.hsn_code || '').trim()

const csvCess =
  String(r.cess_percent || '').trim()

const finalGst =
  csvGst !== ''
    ? Number(csvGst)
    : Number(cat?.gst_percent || 0)

const finalHsn =
  csvHsn || cat?.hsn_code || ''

const finalCess =
  csvCess !== ''
    ? Number(csvCess)
    : Number(cat?.cess_percent || 0)

      if (
        !name ||
        !sku ||
        price <= 0
      ) {
        throw new Error(
          'Required fields missing'
        )
      }

      if (!cat) {
        throw new Error(
          'Invalid category_id'
        )
      }

      const exists =
        await pool.query(`
          SELECT id
          FROM products
          WHERE LOWER(sku)=LOWER($1)
          LIMIT 1
        `,[sku])

      if (exists.rowCount) {
        throw new Error(
          'SKU already exists'
        )
      }

      const csvImages =
        String(
          r.images || ''
        )
        .split('|')
        .map(x => x.trim())
        .filter(Boolean)

      for (
        const url of csvImages
      ) {

        const awsUrl =
          await uploadImageFromUrl(
            url,
            'products'
          )

        if (awsUrl) {
          imageUrls.push(
            awsUrl
          )
        }
      }

      const matched =
        zipMap[
          sku.toLowerCase()
        ] || []

      for (
        const img of matched
      ) {

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

        const awsUrl =
          await uploadImageToAWS(
            file,
            'products'
          )

        imageUrls.push(
          awsUrl
        )
      }

      imageUrls =
        [...new Set(
          imageUrls
        )]

      await pool.query(`
        INSERT INTO products (
          name, slug, shortdescription, longdescription,
          price, compareprice, inventory, sku,
          category_id, category_name, brand, status,
          images, meta_title, meta_description, meta_keywords,
          gst_percent, hsn_code, cess_percent,
          brand_id, tags, is_featured, is_bestseller,
          cost_price, weight_grams, barcode, low_stock_threshold,
          product_type, unit, tax_included, shipping_class,
          allow_backorder, highlights, ingredients, benefits,
          usage_instructions, storage_instructions, warnings,
          video_url, fssai_number, coa_url, focus_keyword,
          min_order_qty, max_order_qty, is_returnable, return_window_days, replacement_available, sort_order
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,
          $9,$10,$11,$12,$13,$14,$15,$16,
          $17,$18,$19,
          $20,$21,$22,$23,$24,$25,$26,$27,
          $28,$29,$30,$31,$32,$33,$34,$35,
          $36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46,$47,$48
        )
      `,[
        name,
        slug || `${sku.toLowerCase()}-${Date.now()}-${i}`,
        r.shortdescription || '',
        r.longdescription || '',
        price, compareprice, inventory, sku,
        cat.id, cat.name, brand, status,
        JSON.stringify(imageUrls),
        r.meta_title || '', r.meta_description || '', r.meta_keywords || '',
        finalGst, finalHsn, finalCess,
        r.brand_id ? Number(r.brand_id) : null,
        r.tags ? JSON.stringify(r.tags.split(',').map(t => t.trim()).filter(Boolean)) : '[]',
        r.is_featured === 'true' || r.is_featured === '1',
        r.is_bestseller === 'true' || r.is_bestseller === '1',
        r.cost_price ? Number(r.cost_price) : null,
        r.weight_grams ? Number(r.weight_grams) : null,
        r.barcode || null,
        r.low_stock_threshold ? Number(r.low_stock_threshold) : 10,
        r.product_type || 'simple',
        r.unit || null,
        r.tax_included === 'true' || r.tax_included === '1',
        r.shipping_class || 'standard',
        r.allow_backorder === 'true' || r.allow_backorder === '1',
        r.highlights || null,
        r.ingredients || null,
        r.benefits || null,
        r.usage_instructions || null,
        r.storage_instructions || null,
        r.warnings || null,
        r.video_url || null,
        r.fssai_number || null,
        r.coa_url || null,
        r.focus_keyword || null,
        r.min_order_qty ? Number(r.min_order_qty) : 1,
        r.max_order_qty ? Number(r.max_order_qty) : null,
        r.is_returnable === 'false' || r.is_returnable === '0' ? false : true,
        r.return_window_days ? Number(r.return_window_days) : 7,
        r.replacement_available === 'true' || r.replacement_available === '1' ? true : false,
        r.sort_order ? Number(r.sort_order) : 0,
      ])

      successCount++

    } catch (err) {

      for (
        const url of imageUrls
      ) {
        await safeDeleteAws(
          url,
          {
            source:'bulk_import',
            refId:job.id
          }
        )
      }

      failed.push({
        row:rowNo,
        sku:r.sku || '',
        error:
          err.message ||
          'Failed'
      })
    }

    if (
      i % 5 === 0
    ) {

      const percent =
        Math.min(
          95,
          35 +
          Math.floor(
            (i / Math.max(rows.length,1)) * 60
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

  await updateJob(
    job.id,
    { progress:100 }
  )

  /* delete temp AWS files */
  try {

    await safeDeleteAws(
      payload.csvPath,
      {
        source:'bulk_temp',
        refId:job.id
      }
    )

    if (payload.zipPath) {
      await safeDeleteAws(
        payload.zipPath,
        {
          source:'bulk_temp',
          refId:job.id
        }
      )
    }

  } catch {}

  return {
    imported:
      successCount,
    failed,
    total:
      rows.length
  }
}