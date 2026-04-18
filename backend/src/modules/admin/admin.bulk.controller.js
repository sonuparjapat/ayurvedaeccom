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

const pool = require('../../config/db')
const fs =
require('fs')

const path =
require('path')

const {
  createJob
} = require('../../utils/jobQueue')
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
exports.bulkStockUpdate =
async (req, res) => {
  try {

    if (!req.files?.file?.[0]) {
      return res.status(400).json({
        success: false,
        message:
          'CSV file required'
      })
    }

    const fs =
      require('fs')

    const path =
      require('path')

    const {
      createJob
    } = require('../../utils/jobQueue')

    const csvFile =
      req.files.file[0]

    const tempDir =
      path.join(
        process.cwd(),
        'uploads',
        'temp'
      )

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(
        tempDir,
        { recursive:true }
      )
    }

    const stamp =
      Date.now() +
      '-' +
      Math.round(
        Math.random() * 100000
      )

    const csvPath =
      path.join(
        tempDir,
        `${stamp}-stock.csv`
      )

    fs.writeFileSync(
      csvPath,
      csvFile.buffer
    )

    const job =
      await createJob({
        jobType:
          'bulk_stock',
        payload:{
          csvPath
        },
        userId:
          req.user?.id || null
      })

    return res.status(200).json({
      success: true,
      message:
        'Bulk stock queued successfully',
      data:{
        jobId:
          job.id,
        status:
          job.status
      }
    })

  } catch (err) {

    console.error(
      'bulkStockUpdate:',
      err
    )

    return res.status(500).json({
      success:false,
      message:
        'Stock update failed'
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
exports.bulkPriceUpdate =
async (req, res) => {
  try {

    if (!req.files?.file?.[0]) {
      return res.status(400).json({
        success: false,
        message:
          'CSV file required'
      })
    }

    const fs =
      require('fs')

    const path =
      require('path')

    const {
      createJob
    } = require('../../utils/jobQueue')

    const csvFile =
      req.files.file[0]

    const tempDir =
      path.join(
        process.cwd(),
        'uploads',
        'temp'
      )

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(
        tempDir,
        { recursive:true }
      )
    }

    const stamp =
      Date.now() +
      '-' +
      Math.round(
        Math.random() * 100000
      )

    const csvPath =
      path.join(
        tempDir,
        `${stamp}-price.csv`
      )

    fs.writeFileSync(
      csvPath,
      csvFile.buffer
    )

    const job =
      await createJob({
        jobType:
          'bulk_price',
        payload:{
          csvPath
        },
        userId:
          req.user?.id || null
      })

    return res.status(200).json({
      success: true,
      message:
        'Bulk price queued successfully',
      data:{
        jobId:
          job.id,
        status:
          job.status
      }
    })

  } catch (err) {

    console.error(
      'bulkPriceUpdate:',
      err
    )

    return res.status(500).json({
      success:false,
      message:
        'Price update failed'
    })

  }
}

// bulk status update 
exports.bulkStatusUpdate =
async (req, res) => {
  try {

    if (!req.files?.file?.[0]) {
      return res.status(400).json({
        success:false,
        message:
          'CSV file required'
      })
    }

    const fs =
      require('fs')

    const path =
      require('path')

    const {
      createJob
    } = require('../../utils/jobQueue')

    const csvFile =
      req.files.file[0]

    const tempDir =
      path.join(
        process.cwd(),
        'uploads',
        'temp'
      )

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(
        tempDir,
        { recursive:true }
      )
    }

    const stamp =
      Date.now() +
      '-' +
      Math.round(
        Math.random() * 100000
      )

    const csvPath =
      path.join(
        tempDir,
        `${stamp}-status.csv`
      )

    fs.writeFileSync(
      csvPath,
      csvFile.buffer
    )

    const job =
      await createJob({
        jobType:
          'bulk_status',
        payload:{
          csvPath
        },
        userId:
          req.user?.id || null
      })

    return res.status(200).json({
      success:true,
      message:
        'Bulk status queued successfully',
      data:{
        jobId:
          job.id,
        status:
          job.status
      }
    })

  } catch (err) {

    console.error(
      'bulkStatusUpdate:',
      err
    )

    return res.status(500).json({
      success:false,
      message:
        'Status update failed'
    })

  }
}

// bulk categories update
exports.bulkCategoryUpdate =
async (req, res) => {
  try {

    if (!req.files?.file?.[0]) {
      return res.status(400).json({
        success: false,
        message:
          'CSV file required'
      })
    }

    const fs =
      require('fs')

    const path =
      require('path')

    const {
      createJob
    } = require('../../utils/jobQueue')

    const csvFile =
      req.files.file[0]

    const tempDir =
      path.join(
        process.cwd(),
        'uploads',
        'temp'
      )

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(
        tempDir,
        { recursive:true }
      )
    }

    const stamp =
      Date.now() +
      '-' +
      Math.round(
        Math.random() * 100000
      )

    const csvPath =
      path.join(
        tempDir,
        `${stamp}-category.csv`
      )

    fs.writeFileSync(
      csvPath,
      csvFile.buffer
    )

    const job =
      await createJob({
        jobType:
          'bulk_category',
        payload:{
          csvPath
        },
        userId:
          req.user?.id || null
      })

    return res.status(200).json({
      success: true,
      message:
        'Bulk category queued successfully',
      data:{
        jobId:
          job.id,
        status:
          job.status
      }
    })

  } catch (err) {

    console.error(
      'bulkCategoryUpdate:',
      err
    )

    return res.status(500).json({
      success:false,
      message:
        'Category update failed'
    })

  }
}


exports.bulkImagesUpdate =
async (req, res) => {
  try {

    if (!req.files?.file?.[0]) {
      return res.status(400).json({
        success: false,
        message:
          'CSV file required'
      })
    }

    const fs =
      require('fs')

    const path =
      require('path')

    const {
      createJob
    } = require('../../utils/jobQueue')

    const csvFile =
      req.files.file[0]

    const zipFile =
      req.files?.zip?.[0] || null

    const tempDir =
      path.join(
        process.cwd(),
        'uploads',
        'temp'
      )

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(
        tempDir,
        { recursive:true }
      )
    }

    const stamp =
      Date.now() +
      '-' +
      Math.round(
        Math.random() * 100000
      )

    const csvPath =
      path.join(
        tempDir,
        `${stamp}-bulk.csv`
      )

    fs.writeFileSync(
      csvPath,
      csvFile.buffer
    )

    let zipPath = null

    if (zipFile) {

      zipPath =
        path.join(
          tempDir,
          `${stamp}-images.zip`
        )

      fs.writeFileSync(
        zipPath,
        zipFile.buffer
      )
    }

    const job =
      await createJob({
        jobType:
          'bulk_images',
        payload: {
          csvPath,
          zipPath
        },
        userId:
          req.user?.id || null
      })

    return res.status(200).json({
      success: true,
      message:
        'Bulk images queued successfully',
      data: {
        jobId:
          job.id,
        status:
          job.status,
        hasZip:
          !!zipPath
      }
    })

  } catch (err) {

    console.error(
      'bulkImagesUpdate:',
      err
    )

    return res.status(500).json({
      success: false,
      message:
        'Failed to queue bulk images'
    })

  }
}

// jobs 
exports.getJobs = async (
  req,
  res
) => {
  try {

    const page =
      Number(
        req.query.page || 1
      )

    const limit =
      Number(
        req.query.limit || 20
      )

    const offset =
      (page - 1) * limit

    const countResult =
      await pool.query(`
        SELECT COUNT(*)::int AS total
        FROM admin_jobs
      `)

    const total =
      countResult.rows[0].total

    const result =
      await pool.query(
        `
        SELECT
          id,
          job_type,
          status,
          progress,
          payload,
          result,
          error_text,
          created_by,
          created_at,
          started_at,
          completed_at
        FROM admin_jobs
        ORDER BY id DESC
        LIMIT $1
        OFFSET $2
        `,
        [
          limit,
          offset
        ]
      )

    return res.json({
      success: true,
      data:
        result.rows,
      pagination: {
        page,
        limit,
        total,
        pages:
          Math.ceil(
            total / limit
          )
      }
    })

  } catch (err) {

    console.error(err)

    return res.status(500).json({
      success:false,
      message:
        'Failed to load jobs'
    })

  }
}

exports.getJobById = async (
  req,
  res
) => {
  try {

    const { id } =
      req.params

    const result =
      await pool.query(
        `
        SELECT *
        FROM admin_jobs
        WHERE id=$1
        LIMIT 1
        `,
        [id]
      )

    if (
      !result.rowCount
    ) {
      return res.status(404).json({
        success:false,
        message:
          'Job not found'
      })
    }

    return res.json({
      success:true,
      data:
        result.rows[0]
    })

  } catch (err) {

    console.error(err)

    return res.status(500).json({
      success:false,
      message:
        'Failed to load job'
    })

  }
}