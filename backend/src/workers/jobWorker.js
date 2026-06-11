const pool =
require('../config/db')

const processCleanupQueue =
require('../services/processCleanupQueue')

const expireUnpaidOrders =
require('../services/expireUnpaidOrders')

const abandonedCartRecovery =
require('../services/abandonedCartRecovery')

const {
  updateJob
} = require('../utils/jobQueue')

const processBulkImagesJob =
require('../services/processBulkImagesJob')

const processBulkStockJob =
require('../services/processBulkStockJob')

const processBulkCategoryJob =
require('../services/processBulkCategoryJob')

const processBulkPriceJob =
require('../services/processBulkPriceJob')

const processBulkStatusJob =
require('../services/processBulkStatusJob')

const processBulkImportJob =
require('../services/processBulkImportJob')

const processBulkUploadJob =
require('../services/processBulkUploadJob')

let running = false

async function runWorker() {

  if (running) return

  running = true

  try {

    const result =
      await pool.query(`
        SELECT *
        FROM admin_jobs
        WHERE status='pending'
        ORDER BY id ASC
        LIMIT 1
      `)

    /* NO JOB FOUND */
    if (!result.rowCount) {

      await processCleanupQueue()
      await expireUnpaidOrders()
      await abandonedCartRecovery()

      running = false
      return
    }

    const job =
      result.rows[0]

    await updateJob(
      job.id,
      {
        status:'processing',
        progress:10,
        started_at:
          new Date()
      }
    )

    try {

      let output = null

      if (
        job.job_type ===
        'bulk_images'
      ) {
        output =
          await processBulkImagesJob(job)
      }

      else if (
        job.job_type ===
        'bulk_stock'
      ) {
        output =
          await processBulkStockJob(job)
      }

      else if (
        job.job_type ===
        'bulk_category'
      ) {
        output =
          await processBulkCategoryJob(job)
      }

      else if (
        job.job_type ===
        'bulk_price'
      ) {
        output =
          await processBulkPriceJob(job)
      }

      else if (
        job.job_type ===
        'bulk_status'
      ) {
        output =
          await processBulkStatusJob(job)
      }

      else if (
        job.job_type ===
        'bulk_import'
      ) {
        output =
          await processBulkImportJob(job)
      }

      else if (
        job.job_type ===
        'bulk_upload'
      ) {
        output =
          await processBulkUploadJob(job)
      }

      else {
        throw new Error(
          'Unknown job type'
        )
      }

      await updateJob(
        job.id,
        {
          status:'completed',
          progress:100,
          result:output,
          completed_at:
            new Date()
        }
      )

    } catch (err) {

      await updateJob(
        job.id,
        {
          status:'failed',
          error_text:
            err.message,
          completed_at:
            new Date()
        }
      )

    }

    /* ALWAYS RUN CLEANUP AFTER JOB */
    await processCleanupQueue()
    await expireUnpaidOrders()

  } catch (err) {

    console.error(
      'Worker error:',
      err
    )

  }

  running = false
}

module.exports =
function startWorker() {

  setInterval(
    runWorker,
    5000
  )

  console.log(
    '✅ Job worker started'
  )
}