const fs = require('fs')
const stream = require('stream')
const csv = require('csv-parser')
const AdmZip = require('adm-zip')

const pool =
require('../config/db')

const {
  uploadImageToAWS,
  uploadImageFromUrl,
  deleteFromAWS
} = require('../utils/awsImageUpload')

const {
  addAdminLog
} = require('../utils/adminLogger')

module.exports =
async function processBulkImagesJob(job) {

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

    let uploadedUrls = []

    try {

      const sku =
        (
          r.sku || ''
        ).trim()

      const mode =
        (
          r.mode ||
          'replace'
        )
        .trim()
        .toLowerCase()

      const imageUrls =
        (
          r.image_urls ||
          ''
        ).trim()

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
          uploadedUrls.push(url)
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

      /* Remove duplicates */
      finalImages =
        [...new Set(finalImages)]

      await pool.query(
        `
        UPDATE products
        SET images=$1
        WHERE LOWER(sku)=LOWER($2)
        `,
        [
          JSON.stringify(
            finalImages
          ),
          sku
        ]
      )

      updated++

    } catch (err) {

      /* Cleanup AWS junk */
      for (const url of uploadedUrls) {
        try {
          await deleteFromAWS(
            url
          )
        } catch {}
      }

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

  /* Cleanup temp files */
  try {
    if (
      payload.csvPath &&
      fs.existsSync(
        payload.csvPath
      )
    ) {
      fs.unlinkSync(
        payload.csvPath
      )
    }

    if (
      payload.zipPath &&
      fs.existsSync(
        payload.zipPath
      )
    ) {
      fs.unlinkSync(
        payload.zipPath
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