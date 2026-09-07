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
`name,slug,price,compareprice,inventory,sku,category_id,gst_percent,hsn_code,cess_percent,brand,status,shortdescription,longdescription,meta_title,meta_description,meta_keywords,images,brand_id,tags,is_featured,is_bestseller,cost_price,weight_grams,length_cm,width_cm,height_cm,barcode,low_stock_threshold,product_type,unit,tax_included,shipping_class,allow_backorder,highlights,ingredients,benefits,usage_instructions,storage_instructions,warnings,video_url,fssai_number,coa_url,focus_keyword,min_order_qty,max_order_qty,is_returnable,return_window_days,replacement_available,sort_order,specifications,faqs,safety_tags
Ashwagandha Tablets,ashwagandha-tablets,499,599,50,AYU001,1,,,0,Himalaya,active,Short text,Long text,Meta title,Meta desc,triphala organic ayurveda,https://site.com/a.jpg|https://site.com/b.jpg,,immunity|wellness,false,false,300,200,10,8,12,,10,simple,tablets,false,standard,false,Boosts immunity|Reduces stress,Ashwagandha extract,Stress relief,Take 2 tablets daily,Store in cool dry place,Not for pregnant women,,,,,1,100,true,7,false,0,"[{""key"":""Shelf Life"",""value"":""24 months""},{""key"":""Country of Origin"",""value"":""India""}]","[{""question"":""Is this organic?"",""answer"":""Yes, 100% certified organic.""}]","Vegan|Gluten Free"`

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
exports.downloadReferenceKit = async (req, res) => {
  try {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`

    const [catRes, brandRes] = await Promise.all([
      pool.query(
        `SELECT id, name, gst_percent, hsn_code, cess_percent
         FROM categories WHERE is_active = TRUE ORDER BY name ASC`
      ),
      pool.query(
        `SELECT id, name, slug FROM brands WHERE is_active = TRUE ORDER BY name ASC`
      ),
    ])

    // ── 1_categories.csv ──────────────────────────────────────────────────────
    let catCsv = 'id,name,gst_percent,hsn_code,cess_percent\n'
    if (!catRes.rows.length) {
      catCsv += '# No active categories found — add categories from Admin > Categories first\n'
    } else {
      catRes.rows.forEach(r => {
        catCsv += `${r.id},${esc(r.name)},${r.gst_percent ?? 18},${esc(r.hsn_code || '')},${r.cess_percent ?? 0}\n`
      })
    }

    // ── 2_brands.csv ──────────────────────────────────────────────────────────
    let brandCsv = 'id,name,slug\n'
    if (!brandRes.rows.length) {
      brandCsv += '# No active brands found — add brands from Admin > Brands first\n'
    } else {
      brandRes.rows.forEach(r => {
        brandCsv += `${r.id},${esc(r.name)},${esc(r.slug)}\n`
      })
    }

    // ── 3_field_guide.csv ────────────────────────────────────────────────────
    const fieldGuide = [
      'column,type,required,valid_values,example,notes',
      `name,text,YES,any text,${esc('Ashwagandha Tablets')},Full product name`,
      `slug,text,NO,url-safe text,${esc('ashwagandha-tablets')},Auto-generated from SKU if blank`,
      `price,number,YES,">0",499,Selling price in INR`,
      `compareprice,number,NO,">=0",599,${esc('Original / MRP price — shown as strikethrough')}`,
      `inventory,number,YES,">=0",50,Current stock quantity`,
      `sku,text,YES,unique code,AYU001,Unique product code — must not already exist`,
      `category_id,number,YES,see 1_categories.csv,1,Use the id column from 1_categories.csv`,
      `gst_percent,number,NO,0–100,12,GST tax rate % — auto-filled from category if blank`,
      `hsn_code,text,NO,2–8 digits only,3004,HSN code for GST — auto-filled from category if blank`,
      `cess_percent,number,NO,0–100,0,Cess % — auto-filled from category if blank`,
      `brand,text,NO,any text,Himalaya,Brand name as free text (shown on product page)`,
      `brand_id,number,NO,see 2_brands.csv,5,Use id from 2_brands.csv — links to brand record`,
      `status,text,YES,${esc('active / inactive / draft')},active,${esc('active=visible; draft=hidden; inactive=disabled')}`,
      `shortdescription,text,NO,any text,${esc('Natural supplement for stress')},Short description shown in listing`,
      `longdescription,text,NO,any text,${esc('Full detailed description...')},Long description on product page`,
      `meta_title,text,NO,any text,${esc('Buy Ashwagandha Online')},SEO page title`,
      `meta_description,text,NO,any text,${esc('Best ayurvedic supplement...')},SEO meta description`,
      `meta_keywords,text,NO,comma-separated,${esc('triphala,organic,ayurveda')},SEO keywords`,
      `images,text,NO,pipe-separated URLs,${esc('https://cdn.com/a.jpg|https://cdn.com/b.jpg')},${esc('First URL = primary card image shown on listings & search. Separate multiple with |. For ZIP: name SKU-1.jpg (primary), SKU-2.jpg etc.')}`,
      `tags,text,NO,pipe-separated,${esc('immunity|wellness')},Product tags for search and filtering`,
      `is_featured,boolean,NO,true / false,false,true = show in Featured section on homepage`,
      `is_bestseller,boolean,NO,true / false,false,true = show Bestseller badge`,
      `cost_price,number,NO,">=0",300,Your purchase cost (not shown to customers)`,
      `weight_grams,number,NO,">0",200,Gross package weight in grams`,
      `length_cm,number,NO,">0",10,Package length in cm`,
      `width_cm,number,NO,">0",8,Package width in cm`,
      `height_cm,number,NO,">0",12,Package height in cm`,
      `barcode,text,NO,any,8901234567890,Barcode / EAN13 / UPC`,
      `low_stock_threshold,number,NO,">=0",10,Show alert when inventory falls below this`,
      `product_type,text,NO,${esc('simple / variable / bundle / digital')},simple,simple=one SKU; variable=has variants`,
      `unit,text,NO,any text,${esc('tablets / ml / g / pcs')},Unit of sale shown on product page`,
      `tax_included,boolean,NO,true / false,false,true = entered price already includes GST`,
      `shipping_class,text,NO,${esc('standard / express / free')},standard,Controls which shipping rate applies`,
      `allow_backorder,boolean,NO,true / false,false,true = allow purchase when out of stock`,
      `highlights,text,NO,pipe-separated,${esc('Boosts immunity|Reduces stress')},Key selling points shown as bullet list`,
      `ingredients,text,NO,any text,${esc('Ashwagandha extract 500mg')},Full ingredients list`,
      `benefits,text,NO,any text,${esc('Stress relief|Energy boost')},Benefits section on product page`,
      `usage_instructions,text,NO,any text,${esc('Take 2 tablets daily with water')},How to use`,
      `storage_instructions,text,NO,any text,${esc('Store in cool dry place')},Storage guidance`,
      `warnings,text,NO,any text,${esc('Not for pregnant women')},Warnings and contraindications`,
      `video_url,text,NO,URL,${esc('https://youtube.com/watch?v=abc')},Product demo video URL`,
      `fssai_number,text,NO,14 digits,12345678901234,FSSAI licence number (required for food/supplement products)`,
      `coa_url,text,NO,URL,${esc('https://cdn.com/coa.pdf')},Certificate of Analysis document URL`,
      `focus_keyword,text,NO,any text,${esc('ashwagandha stress relief')},Primary SEO keyword`,
      `min_order_qty,number,NO,">=1",1,Minimum quantity per order`,
      `max_order_qty,number,NO,">=1 or blank",100,Maximum quantity per order (blank = no limit)`,
      `is_returnable,boolean,NO,true / false,true,true = product accepts returns`,
      `return_window_days,number,NO,0–365,7,Days after delivery within which customer can return`,
      `replacement_available,boolean,NO,true / false,false,true = offer replacement instead of refund`,
      `sort_order,number,NO,any integer,0,Display order (lower = shown first)`,
      `specifications,JSON,NO,JSON array,${esc('[{"key":"Shelf Life","value":"24 months"}]')},Product spec table — JSON array of key/value objects`,
      `faqs,JSON,NO,JSON array,${esc('[{"question":"Is organic?","answer":"Yes."}]')},FAQ section — JSON array of question/answer objects`,
      `safety_tags,text,NO,pipe-separated,${esc('Vegan|Gluten Free|No Added Sugar')},Safety/certification badges shown on product page`,
    ].join('\n')

    // ── Build ZIP ─────────────────────────────────────────────────────────────
    const AdmZipLib = require('adm-zip')
    const zip = new AdmZipLib()
    zip.addFile('1_categories.csv', Buffer.from(catCsv, 'utf8'))
    zip.addFile('2_brands.csv', Buffer.from(brandCsv, 'utf8'))
    zip.addFile('3_field_guide.csv', Buffer.from(fieldGuide, 'utf8'))

    const zipBuffer = zip.toBuffer()
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', 'attachment; filename=bulk-upload-reference.zip')
    return res.send(zipBuffer)

  } catch (err) {
    console.error('[downloadReferenceKit]', err)
    return res.status(500).json({ success: false, message: 'Reference kit generation failed' })
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

// ─── BULK COUPON CREATE ────────────────────────────────────────────────────

exports.downloadCouponTemplate = (req, res) => {
  const csv =
`code,type,value,min_order,max_discount,usage_limit,usage_per_user,valid_from,valid_to,description,is_active
SAVE10,percent,10,500,200,100,1,2025-01-01,2025-12-31,10% off on orders above ₹500,true
FLAT50,flat,50,300,0,0,2,,,₹50 flat discount,true
VIP100,flat,100,1000,100,50,1,2025-06-01,2025-06-30,VIP exclusive coupon,true`

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename=bulk-coupons-template.csv')
  return res.send(csv)
}

exports.bulkCouponCreate = async (req, res) => {
  try {

    if (!req.files?.file?.[0]) {
      return res.status(400).json({ success: false, message: 'CSV file required' })
    }

    const csvFile = req.files.file[0]
    const stamp = Date.now() + '-' + Math.round(Math.random() * 100000)

    const csvPath = await uploadTempFileToAWS(
      csvFile.buffer,
      `${stamp}-coupons.csv`,
      'text/csv'
    )

    const job = await createJob({
      jobType: 'bulk_coupon',
      payload: { csvPath },
      userId: req.user?.id || null,
    })

    return res.status(200).json({
      success: true,
      message: 'Bulk coupon creation queued successfully',
      data: { jobId: job.id, status: job.status },
    })

  } catch {

    return res.status(500).json({
      success: false,
      message: 'Bulk coupon creation failed',
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