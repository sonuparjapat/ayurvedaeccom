const {
  deleteFromAWS
} = require('./awsImageUpload')

const pool =
require('../config/db')

module.exports =
async function safeDeleteAws(
  url,
  meta = {}
) {

  try {

    await deleteFromAWS(url)

    return true

  } catch (err) {

    try {

      await pool.query(
        `
        INSERT INTO file_cleanup_queue (
          file_url,
          source,
          ref_id,
          last_error
        )
        VALUES ($1,$2,$3,$4)
        `,
        [
          url,
          meta.source || 'unknown',
          meta.refId || null,
          err.message || 'Delete failed'
        ]
      )

    } catch {}

    return false
  }
}