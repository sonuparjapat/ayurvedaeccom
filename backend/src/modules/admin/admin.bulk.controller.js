const multer = require('multer')
const csv = require('csv-parser')
const AdmZip = require('adm-zip')
const stream = require('stream')
const {
  uploadTempFileToAWS
} = require('../../utils/awsImageUpload')

const fs =
  require('fs')

const path =
  require('path')

const {
  createJob
} = require('../../utils/jobQueue')
const {
  addAdminLog
} = require('../../utils/adminLogger')
const {
  uploadImageToAWS,
  deleteFromAWS,
  uploadImageFromUrl

} = require('../../utils/awsImageUpload')

const pool = require('../../config/db')

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
`name,slug,price,compareprice,inventory,sku,category_id,gst_percent,hsn_code,cess_percent,brand,status,shortdescription,longdescription,meta_title,meta_description,meta_keywords,images,brand_id,tags,is_featured,is_bestseller,cost_price,weight_grams,barcode,low_stock_threshold
Ashwagandha Tablets,ashwagandha-tablets,499,599,50,AYU001,1,,,0,Himalaya,active,Short text,Long text,Meta title,Meta desc,keywords,https://site.com/a.jpg|https://site.com/b.jpg,,immunity|wellness,false,false,300,200,,10`

    res.setHeader(
      'Content-Type',
      'text/csv'
    )

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=bulk-products-template.csv'
    )

    return res.send(csvContent)

  } catch (err) {

    return res.status(500).json({
      success: false,
      message: 'Template failed'
    })

  }
}
exports.downloadCategoryTemplate = async (req, res) => {
  try {

    const result = await pool.query(`
     SELECT
  id,
  name,
  gst_percent,
  hsn_code,
  cess_percent
FROM categories
      WHERE is_active = true
      ORDER BY id ASC
    `)

    let csv = 'id,name,gst_percent,hsn_code,cess_percent\n'
    result.rows.forEach(row => {
csv += `${row.id},"${row.name}",${row.gst_percent},"${row.hsn_code || ''}",${row.cess_percent || 0}\n`
    })

    res.setHeader(
      'Content-Type',
      'text/csv'
    )

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=categories-master.csv'
    )

    return res.send(csv)

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to download categories'
    })
  }
}

/* =========================
   Bulk Upload
========================= */

exports.bulkUpload =
  async (req, res) => {
    try {

      if (!req.files?.file?.[0]) {
        return res.status(400).json({
          success: false,
          message:
            'CSV file required'
        })
      }

      const csvFile =
        req.files.file[0]

      const zipFile =
        req.files?.imagesZip?.[0] || null

      const {
        uploadTempFileToAWS
      } = require('../../utils/awsImageUpload')

      const stamp =
        Date.now() +
        '-' +
        Math.round(
          Math.random() * 100000
        )

      const csvPath =
        await uploadTempFileToAWS(
          csvFile.buffer,
          `${stamp}-validate.csv`,
          'text/csv'
        )

      let zipPath = null

      if (zipFile) {

        zipPath =
          await uploadTempFileToAWS(
            zipFile.buffer,
            `${stamp}-validate.zip`,
            'application/zip'
          )
      }

      const job =
        await createJob({
          jobType:
            'bulk_upload',
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
          'Bulk validation queued successfully',
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
        'bulkUpload:',
        err
      )

      return res.status(500).json({
        success: false,
        message:
          'Bulk validation failed'
      })

    }
  }


exports.bulkImport =
  async (req, res) => {
    try {

      const validationJobId =
        Number(
          req.body.validationJobId || 0
        )

      if (!validationJobId) {
        return res.status(400).json({
          success: false,
          message: 'validationJobId required'
        })
      }

      const oldJob =
        await pool.query(
          `
        SELECT *
        FROM admin_jobs
        WHERE id=$1
        AND job_type='bulk_upload'
        AND status='completed'
        LIMIT 1
        `,
          [validationJobId]
        )

      if (!oldJob.rowCount) {
        return res.status(404).json({
          success: false,
          message: 'Validation job not found'
        })
      }

      const oldResult =
        oldJob.rows[0].result || {}

      if (
        !oldResult.csvPath
      ) {
        return res.status(400).json({
          success: false,
          message: 'Validated files missing'
        })
      }

      const job =
        await createJob({
          jobType: 'bulk_import',
          payload: {
            csvPath:
              oldResult.csvPath,
            zipPath:
              oldResult.zipPath || null
          },
          userId:
            req.user?.id || null
        })

      return res.status(200).json({
        success: true,
        message: 'Import started',
        data: {
          jobId: job.id,
          status: job.status
        }
      })

    } catch (err) {

      return res.status(500).json({
        success: false,
        message: 'Import failed'
      })

    }
  }
exports.bulkStockUpdate =
  async (req, res) => {
    try {

      if (!req.files?.file?.[0]) {
        return res.status(400).json({
          success:false,
          message:'CSV file required'
        })
      }

      const csvFile =
        req.files.file[0]

      const stamp =
        Date.now() + '-' +
        Math.round(
          Math.random() * 100000
        )

      const csvPath =
        await uploadTempFileToAWS(
          csvFile.buffer,
          `${stamp}-stock.csv`,
          'text/csv'
        )

      const job =
        await createJob({
          jobType:'bulk_stock',
          payload:{ csvPath },
          userId:req.user?.id || null
        })

      return res.status(200).json({
        success:true,
        message:'Bulk stock queued successfully',
        data:{
          jobId:job.id,
          status:job.status
        }
      })

    } catch (err) {

      return res.status(500).json({
        success:false,
        message:'Stock update failed'
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
      success: false,
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
          success:false,
          message:'CSV file required'
        })
      }

      const csvFile =
        req.files.file[0]

      const stamp =
        Date.now() + '-' +
        Math.round(
          Math.random() * 100000
        )

      const csvPath =
        await uploadTempFileToAWS(
          csvFile.buffer,
          `${stamp}-price.csv`,
          'text/csv'
        )

      const job =
        await createJob({
          jobType:'bulk_price',
          payload:{ csvPath },
          userId:req.user?.id || null
        })

      return res.status(200).json({
        success:true,
        message:'Bulk price queued successfully',
        data:{
          jobId:job.id,
          status:job.status
        }
      })

    } catch {

      return res.status(500).json({
        success:false,
        message:'Price update failed'
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
          message:'CSV file required'
        })
      }

      const csvFile =
        req.files.file[0]

      const stamp =
        Date.now() + '-' +
        Math.round(
          Math.random() * 100000
        )

      const csvPath =
        await uploadTempFileToAWS(
          csvFile.buffer,
          `${stamp}-status.csv`,
          'text/csv'
        )

      const job =
        await createJob({
          jobType:'bulk_status',
          payload:{ csvPath },
          userId:req.user?.id || null
        })

      return res.status(200).json({
        success:true,
        message:'Bulk status queued successfully',
        data:{
          jobId:job.id,
          status:job.status
        }
      })

    } catch {

      return res.status(500).json({
        success:false,
        message:'Status update failed'
      })

    }
  }

// bulk categories update
exports.bulkCategoryUpdate =
  async (req, res) => {
    try {

      if (!req.files?.file?.[0]) {
        return res.status(400).json({
          success:false,
          message:'CSV file required'
        })
      }

      const csvFile =
        req.files.file[0]

      const stamp =
        Date.now() + '-' +
        Math.round(
          Math.random() * 100000
        )

      const csvPath =
        await uploadTempFileToAWS(
          csvFile.buffer,
          `${stamp}-category.csv`,
          'text/csv'
        )

      const job =
        await createJob({
          jobType:'bulk_category',
          payload:{ csvPath },
          userId:req.user?.id || null
        })

      return res.status(200).json({
        success:true,
        message:'Bulk category queued successfully',
        data:{
          jobId:job.id,
          status:job.status
        }
      })

    } catch {

      return res.status(500).json({
        success:false,
        message:'Category update failed'
      })

    }
  }

exports.bulkImagesUpdate =
  async (req, res) => {
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
        req.files?.imagesZip?.[0] || null

      const stamp =
        Date.now() + '-' +
        Math.round(
          Math.random() * 100000
        )

      const csvPath =
        await uploadTempFileToAWS(
          csvFile.buffer,
          `${stamp}-bulk.csv`,
          'text/csv'
        )

      let zipPath = null

      if (zipFile) {
        zipPath =
          await uploadTempFileToAWS(
            zipFile.buffer,
            `${stamp}-images.zip`,
            'application/zip'
          )
      }

      const job =
        await createJob({
          jobType:'bulk_images',
          payload:{
            csvPath,
            zipPath
          },
          userId:req.user?.id || null
        })

      return res.status(200).json({
        success:true,
        message:'Bulk images queued successfully',
        data:{
          jobId:job.id,
          status:job.status,
          hasZip:!!zipPath
        }
      })

    } catch {

      return res.status(500).json({
        success:false,
        message:'Failed to queue bulk images'
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
      success: false,
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
        success: false,
        message:
          'Job not found'
      })
    }

    return res.json({
      success: true,
      data:
        result.rows[0]
    })

  } catch (err) {

    console.error(err)

    return res.status(500).json({
      success: false,
      message:
        'Failed to load job'
    })

  }
}