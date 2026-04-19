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

const safeDeleteAws =
require('../utils/safeDeleteAws')

module.exports =
async function processBulkImagesJob(job) {

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
        e => !e.isDirectory
      )
  }

  let updated = 0
  const failed = []

  for (
    let i = 0;
    i < rows.length;
    i++
  ) {

    const rowNo = i + 2
    const r = rows[i]

    let uploadedUrls = []

    try {

      const sku =
        (r.sku || '')
        .trim()

      const mode =
        (r.mode || 'replace')
        .trim()
        .toLowerCase()

      const imageUrls =
        (r.image_urls || '')
        .trim()

      if (!sku) {
        throw new Error(
          'SKU missing'
        )
      }

      let newImages = []

      /* ZIP images */
      const skuFiles =
        zipEntries.filter(f => {

          const name =
            f.entryName
            .toLowerCase()
            .split('.')[0]

          const key =
            sku.toLowerCase()

          return (
            name === key ||
            name.startsWith(
              key + '-'
            )
          )
        })

      for (
        const f of skuFiles
      ) {

        const fakeFile = {
          buffer:
            f.getData(),
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
        uploadedUrls.push(url)
      }

      /* URL images */
      if (
        newImages.length === 0 &&
        imageUrls
      ) {

        const links =
          imageUrls
          .split('|')
          .map(x => x.trim())
          .filter(Boolean)

        for (
          const link of links
        ) {

          const url =
            await uploadImageFromUrl(
              link,
              'products'
            )

          if (url) {
            newImages.push(url)
            uploadedUrls.push(url)
          }
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
        await pool.query(`
          SELECT images
          FROM products
          WHERE LOWER(sku)=LOWER($1)
        `,[sku])

      if (!old.rowCount) {
        throw new Error(
          'SKU not found'
        )
      }

      let oldImages = []

      if (
        old.rows[0].images
      ) {

        if (
          Array.isArray(
            old.rows[0].images
          )
        ) {
          oldImages =
            old.rows[0].images
        } else {
          try {
            oldImages =
              JSON.parse(
                old.rows[0].images
              )
          } catch {
            oldImages = []
          }
        }
      }

      let finalImages =
        newImages

      if (
        mode === 'append'
      ) {
        finalImages = [
          ...oldImages,
          ...newImages
        ]
      }

      finalImages =
        [...new Set(
          finalImages
        )]

      await pool.query(`
        UPDATE products
        SET images=$1
        WHERE LOWER(sku)=LOWER($2)
      `,[
        JSON.stringify(
          finalImages
        ),
        sku
      ])

      updated++

    } catch (err) {

      for (
        const url of uploadedUrls
      ) {
        await safeDeleteAws(
          url,
          {
            source:'bulk_images',
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
  }

  await addAdminLog({
    adminId:
      job.created_by,
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
    updated,
    failed,
    total:
      rows.length
  }
}