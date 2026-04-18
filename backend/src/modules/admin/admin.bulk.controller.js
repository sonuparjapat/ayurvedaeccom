const multer = require('multer')
const csv = require('csv-parser')
const AdmZip = require('adm-zip')
const stream = require('stream')
const {
 addAdminLog
} = require('../../utils/adminLogger')
const {
  uploadImageToAWS,
  deleteFromAWS,
    uploadImageFromUrl

} = require('../../utils/awsImageUpload')
const path = require('path')

const getMimeType = (fileName = '') => {
  const ext = path
    .extname(fileName)
    .toLowerCase()

  if (ext === '.png')
    return 'image/png'

  if (ext === '.webp')
    return 'image/webp'

  return 'image/jpeg'
}
/* =========================
   Separate Multer for Bulk
========================= */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
})

exports.uploadBulkFiles = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'imagesZip', maxCount: 1 },
])

/* =========================
   Template Download
========================= */

exports.downloadTemplate = async (req, res) => {
  try {
    const csvContent =
`name,slug,price,compareprice,inventory,sku,category_name,brand,status,shortdescription,longdescription,meta_title,meta_description,meta_keywords,images
iPhone 15,iphone-15,79999,89999,10,APL001,Mobiles,Apple,active,Short text,Long text,Meta title,Meta desc,iphone,mobile1.jpg|mobile2.jpg`

    res.setHeader(
      'Content-Type',
      'text/csv'
    )

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=bulk-products-template.csv'
    )

    return res.send(csvContent)

  } catch {
    return res.status(500).json({
      success: false,
      message: 'Template failed',
    })
  }
}

/* =========================
   Bulk Upload
========================= */

exports.bulkUpload = async (req, res) => {
  try {
    if (!req.files?.file?.[0]) {
      return res.status(400).json({
        success: false,
        message: 'CSV file required',
      })
    }

    const csvFile = req.files.file[0]
    const rows = []

    const readable = new stream.Readable()
    readable.push(csvFile.buffer)
    readable.push(null)

    readable
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', async () => {

        /* ================= ZIP FILES ================= */
        let zipEntries = []

        if (req.files?.imagesZip?.[0]) {
          const zip = new AdmZip(
            req.files.imagesZip[0].buffer
          )

          zipEntries = zip
            .getEntries()
            .filter(
              (f) => !f.isDirectory
            )
        }

        /* ================= CATEGORY MAP ================= */

        const catRes = await pool.query(
          `SELECT id,name,gst_percent FROM categories`
        )

        const categoryMap = {}

        catRes.rows.forEach((c) => {
          categoryMap[
            c.name.toLowerCase()
          ] = c
        })

        /* ================= EXISTING SKU ================= */

        const skuRes = await pool.query(
          `SELECT sku FROM products WHERE sku IS NOT NULL`
        )

        const existingSku = new Set(
          skuRes.rows.map((r) =>
            String(r.sku).trim().toLowerCase()
          )
        )

        const csvSku = new Set()

        const errors = []
        const validRows = []

        /* ================= LOOP ================= */

        for (let i = 0; i < rows.length; i++) {
          const rowNo = i + 2
          const r = rows[i]

          const rowErrors = []

          const name = (r.name || '').trim()
          const sku = (r.sku || '').trim()
          const price = Number(r.price || 0)
          const inventory = Number(
            r.inventory || 0
          )

          const category_name =
            (r.category_name || '').trim()

          const status =
            (r.status || 'draft')
              .trim()
              .toLowerCase()

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
            !['draft', 'active', 'inactive']
              .includes(status)
          ) {
            rowErrors.push(
              'Invalid status'
            )
          }

          const cat =
            categoryMap[
              category_name.toLowerCase()
            ]

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

          /* Image Check */

          const matchedImages =
            zipEntries.filter((f) =>
              f.entryName
                .toLowerCase()
                .startsWith(
                  sku.toLowerCase() + '-'
                )
            )

          if (
            req.files?.imagesZip?.[0] &&
            matchedImages.length === 0
          ) {
            rowErrors.push(
              'No image found in ZIP'
            )
          }

          if (rowErrors.length) {
            errors.push({
              row: rowNo,
              sku,
              errors: rowErrors,
            })
          } else {
            validRows.push({
              raw: r,
              category: cat,
              images: matchedImages,
            })
          }
        }

        /* ================= RESPONSE ================= */

        return res.status(200).json({
          success: true,
          message:
            errors.length
              ? 'Validation completed with issues'
              : 'Validation successful',
          summary: {
            totalRows: rows.length,
            validRows:
              validRows.length,
            failedRows:
              errors.length,
          },
          errors,
        })
      })

  } catch (err) {
    console.error(err)

    return res.status(500).json({
      success: false,
      message:
        'Bulk validation failed',
    })
  }
}


exports.bulkImport = async (req, res) => {
  try {
    if (!req.files?.file?.[0]) {
      return res.status(400).json({
        success: false,
        message: 'CSV file required',
      })
    }

    const csvFile = req.files.file[0]
    const rows = []

    const readable = new stream.Readable()
    readable.push(csvFile.buffer)
    readable.push(null)

    readable
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', async () => {

        let zipEntries = []

        if (req.files?.imagesZip?.[0]) {
          const zip = new AdmZip(
            req.files.imagesZip[0].buffer
          )

          zipEntries = zip
            .getEntries()
            .filter((f) => !f.isDirectory)
        }

        const catRes = await pool.query(
          `SELECT id,name,gst_percent FROM categories`
        )

        const categoryMap = {}

        catRes.rows.forEach((c) => {
          categoryMap[
            c.name.toLowerCase()
          ] = c
        })

        let successCount = 0
        let failed = []

        for (let i = 0; i < rows.length; i++) {
          const rowNo = i + 2
          const r = rows[i]

          try {
            const name =
              (r.name || '').trim()

            const slug =
              (r.slug || '')
                .trim()

            const sku =
              (r.sku || '').trim()

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
                category_name.toLowerCase()
              ]

            if (!cat) {
              throw new Error(
                'Category not found'
              )
            }

            /* SKU Exists */
            const skuCheck =
              await pool.query(
                `SELECT id FROM products WHERE LOWER(sku)=LOWER($1) LIMIT 1`,
                [sku]
              )

            if (
              skuCheck.rowCount
            ) {
              throw new Error(
                'SKU already exists'
              )
            }

            /* Images */
            const matched =
              zipEntries.filter(
                (f) =>
                  f.entryName
                    .toLowerCase()
                    .startsWith(
                      sku.toLowerCase() + '-'
                    )
              )

            const imageUrls = []

            for (const img of matched) {
              const buffer =
                img.getData()

              const file = {
                buffer,
                originalname:
                  img.entryName,
mimetype: getMimeType(img.entryName),
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
             slug || `${sku.toLowerCase()}-${Date.now()}-${i}`,
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
                JSON.stringify(
                  imageUrls
                ),
                r.meta_title || '',
                r.meta_description || '',
                r.meta_keywords || '',
                cat.gst_percent || 0,
              ]
            )

            successCount++

          } catch (err) {
            for (const url of imageUrls || []) {
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
                'Failed',
            })
          }
        }
await addAdminLog({
  adminId:
    req.user?.id || null,
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
  ip:req.ip
})
        return res.json({
          success: true,
          message:
            'Bulk import completed',
          summary: {
            imported:
              successCount,
            failed:
              failed.length,
            total:
              rows.length,
          },
          failed,
        })
      })

  } catch (err) {
    console.error(err)

    return res.status(500).json({
      success: false,
      message:
        'Import failed',
    })
  }
}
exports.bulkStockUpdate = async (
  req,
  res
) => {
  try {
    if (!req.files?.file?.[0]) {
      return res.status(400).json({
        success: false,
        message: 'CSV file required',
      })
    }

    const csvFile =
      req.files.file[0]

    const rows = []

    const readable =
      new stream.Readable()

    readable.push(
      csvFile.buffer
    )

    readable.push(null)

    readable
      .pipe(csv())
      .on(
        'data',
        (row) =>
          rows.push(row)
      )

      .on(
        'end',
        async () => {

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

            const inventory =
              Number(
                r.inventory
              )

            if (!sku) {
              throw new Error(
                'SKU missing'
              )
            }

            if (
              inventory < 0 ||
              Number.isNaN(
                inventory
              )
            ) {
              throw new Error(
                'Invalid inventory'
              )
            }

            const result =
              await pool.query(
                `
                UPDATE products
                SET inventory=$1
                WHERE LOWER(sku)=LOWER($2)
                RETURNING id
                `,
                [
                  inventory,
                  sku,
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
                'Failed',
            })

          }
        }

        return res.json({
          success: true,
          message:
            'Stock update completed',
          summary: {
            updated,
            failed:
              failed.length,
            total:
              rows.length,
          },
          failed,
        })

      })

  } catch (err) {
    console.error(err)

    return res.status(500).json({
      success: false,
      message:
        'Stock update failed',
    })
  }
}

// /////////////////////logs/////////////
exports.getAdminLogs = async (
  req,
  res
) => {
  try {
    const page =
      Number(req.query.page) || 1

    const limit =
      Number(req.query.limit) || 20

    const search =
      (
        req.query.search || ''
      ).trim()

    const moduleFilter =
      (
        req.query.module || ''
      ).trim()

    const offset =
      (page - 1) * limit

    let where =
      ` WHERE 1=1 `

    let values = []
    let i = 1

    if (search) {
      where += `
      AND (
        action ILIKE $${i}
        OR module ILIKE $${i}
      )`

      values.push(
        `%${search}%`
      )

      i++
    }

    if (moduleFilter) {
      where += `
      AND module = $${i}
      `

      values.push(
        moduleFilter
      )

      i++
    }

    const count =
      await pool.query(
        `
        SELECT COUNT(*)
        FROM admin_logs
        ${where}
        `,
        values
      )

    const rows =
      await pool.query(
        `
        SELECT *
        FROM admin_logs
        ${where}
        ORDER BY id DESC
        LIMIT $${i}
        OFFSET $${i + 1}
        `,
        [
          ...values,
          limit,
          offset,
        ]
      )

    return res.json({
      success: true,
      data: rows.rows,
      pagination: {
        total:
          Number(
            count.rows[0]
            .count
          ),
        page,
        pages:
          Math.ceil(
            Number(
              count.rows[0]
              .count
            ) / limit
          ),
        limit,
      },
    })

  } catch (err) {
    console.error(err)

    return res.status(500).json({
      success:false,
      message:
        'Failed to load logs'
    })
  }
}

// bulk update
exports.bulkPriceUpdate = async (
  req,
  res
) => {
  try {
    if (!req.files?.file?.[0]) {
      return res.status(400).json({
        success: false,
        message: 'CSV file required',
      })
    }

    const csvFile =
      req.files.file[0]

    const rows = []

    const readable =
      new stream.Readable()

    readable.push(
      csvFile.buffer
    )

    readable.push(null)

    readable
      .pipe(csv())
      .on(
        'data',
        (row) =>
          rows.push(row)
      )
      .on(
        'end',
        async () => {

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
              Number.isNaN(compareprice)
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
                'Failed',
            })

          }
        }

        await addAdminLog({
          adminId:
            req.user?.id || null,
          action:
            'BULK_PRICE_UPDATE',
          module:
            'PRICE',
          details: {
            updated,
            failed:
              failed.length,
            total:
              rows.length,
          },
          ip: req.ip,
        })

        return res.json({
          success: true,
          message:
            'Price update completed',
          summary: {
            updated,
            failed:
              failed.length,
            total:
              rows.length,
          },
          failed,
        })

      })

  } catch (err) {
    console.error(err)

    return res.status(500).json({
      success: false,
      message:
        'Price update failed',
    })
  }
}

// bulk status update 
exports.bulkStatusUpdate = async (
  req,
  res
) => {
  try {
    if (!req.files?.file?.[0]) {
      return res.status(400).json({
        success: false,
        message: 'CSV file required',
      })
    }

    const csvFile =
      req.files.file[0]

    const rows = []

    const readable =
      new stream.Readable()

    readable.push(
      csvFile.buffer
    )

    readable.push(null)

    readable
      .pipe(csv())
      .on(
        'data',
        (row) =>
          rows.push(row)
      )
      .on(
        'end',
        async () => {

        let updated = 0
        let failed = []

        const allowed =
          [
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
                'Failed',
            })

          }
        }

        await addAdminLog({
          adminId:
            req.user?.id || null,
          action:
            'BULK_STATUS_UPDATE',
          module:
            'PRODUCTS',
          details: {
            updated,
            failed:
              failed.length,
            total:
              rows.length,
          },
          ip: req.ip,
        })

        return res.json({
          success: true,
          message:
            'Status update completed',
          summary: {
            updated,
            failed:
              failed.length,
            total:
              rows.length,
          },
          failed,
        })

      })

  } catch (err) {
    console.error(err)

    return res.status(500).json({
      success: false,
      message:
        'Status update failed',
    })
  }
}

// bulk categories update
exports.bulkCategoryUpdate = async (
  req,
  res
) => {
  try {
    if (!req.files?.file?.[0]) {
      return res.status(400).json({
        success: false,
        message: 'CSV file required',
      })
    }

    const csvFile =
      req.files.file[0]

    const rows = []

    const readable =
      new stream.Readable()

    readable.push(
      csvFile.buffer
    )

    readable.push(null)

    readable
      .pipe(csv())
      .on(
        'data',
        (row) =>
          rows.push(row)
      )
      .on(
        'end',
        async () => {

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
              c.name
              .toLowerCase()
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

            let category =
              null

            if (
              categoryId
            ) {
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
                'Failed',
            })

          }
        }

        await addAdminLog({
          adminId:
            req.user?.id || null,
          action:
            'BULK_CATEGORY_UPDATE',
          module:
            'PRODUCTS',
          details: {
            updated,
            failed:
              failed.length,
            total:
              rows.length,
          },
          ip: req.ip,
        })

        return res.json({
          success: true,
          message:
            'Category update completed',
          summary: {
            updated,
            failed:
              failed.length,
            total:
              rows.length,
          },
          failed,
        })

      })

  } catch (err) {
    console.error(err)

    return res.status(500).json({
      success: false,
      message:
        'Category update failed',
    })
  }
}


exports.bulkImagesUpdate = async (
  req,
  res
) => {
  try {
    if (!req.files?.file?.[0]) {
      return res.status(400).json({
        success:false,
        message:'CSV file required'
      })
    }

    const csvFile =
      req.files.file[0]

    const zipFile =
      req.files?.zip?.[0] || null

    const rows = []

    const readable =
      new stream.Readable()

    readable.push(
      csvFile.buffer
    )

    readable.push(null)

    readable
      .pipe(csv())
      .on(
        'data',
        row => rows.push(row)
      )
      .on(
        'end',
        async () => {

        let zipEntries = []

        if (zipFile) {
          const zip =
            new AdmZip(
              zipFile.buffer
            )

          zipEntries =
            zip.getEntries()
        }

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

            const mode =
              (
                r.mode || 'replace'
              )
              .trim()
              .toLowerCase()

            const imageUrls =
              (
                r.image_urls || ''
              )
              .trim()

            if (!sku) {
              throw new Error(
                'SKU missing'
              )
            }

            let newImages = []

            /* ZIP Images */
            const skuFiles =
              zipEntries.filter(
                e =>
                  !e.isDirectory &&
                  e.entryName
                  .toLowerCase()
                  .startsWith(
                    sku.toLowerCase()
                  )
              )

            for (const f of skuFiles) {

              const buffer =
                f.getData()

              const fakeFile = {
                buffer,
                originalname:
                  f.entryName,
                mimetype:
                  'image/jpeg'
              }

              const url =
                await uploadImageToAWS(
                  fakeFile,
                  'products'
                )

              newImages.push(url)
            }

            /* URL Images */
            if (
              newImages.length === 0 &&
              imageUrls
            ) {
              const links =
                imageUrls
                  .split('|')
                  .map(x =>
                    x.trim()
                  )
                  .filter(Boolean)

              for (const link of links) {
                const url =
                  await uploadImageFromUrl(
                    link,
                    'products'
                  )

                newImages.push(url)
              }
            }

            if (
              newImages.length === 0
            ) {
              throw new Error(
                'No images found'
              )
            }

            const old =
              await pool.query(
                `
                SELECT images
                FROM products
                WHERE LOWER(sku)=LOWER($1)
                `,
                [sku]
              )

            if (
              !old.rowCount
            ) {
              throw new Error(
                'SKU not found'
              )
            }

            let finalImages =
              newImages

            if (
              mode === 'append'
            ) {
              finalImages = [
                ...(old.rows[0]
                  .images || []),
                ...newImages
              ]
            }

            await pool.query(
              `
              UPDATE products
              SET images=$1
              WHERE LOWER(sku)=LOWER($2)
              `,
              [
                finalImages,
                sku
              ]
            )

            updated++

          } catch (err) {

            failed.push({
              row: rowNo,
              sku:
                r.sku || '',
              error:
                err.message
            })

          }
        }

        await addAdminLog({
          adminId:
            req.user?.id || null,
          action:
            'BULK_IMAGES_UPDATE',
          module:
            'PRODUCTS',
          details:{
            updated,
            failed:
              failed.length,
            total:
              rows.length
          },
          ip:req.ip
        })

        return res.json({
          success:true,
          message:
            'Images updated successfully',
          summary:{
            updated,
            failed:
              failed.length,
            total:
              rows.length
          },
          failed
        })

      })

  } catch (err) {
    console.error(err)

    return res.status(500).json({
      success:false,
      message:
        'Bulk image update failed'
    })
  }
}