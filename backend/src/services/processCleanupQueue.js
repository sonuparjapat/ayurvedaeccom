const pool =
require('../config/db')

const {
  deleteFromAWS
} = require('../utils/awsImageUpload')

module.exports =
async function processCleanupQueue() {

  const result =
    await pool.query(
      `
      SELECT *
      FROM file_cleanup_queue
      WHERE status='pending'
      ORDER BY id ASC
      LIMIT 20
      `
    )

  for (const row of result.rows) {

    try {

      await deleteFromAWS(
        row.file_url
      )

      await pool.query(
        `
        UPDATE file_cleanup_queue
        SET status='completed',
            updated_at=NOW()
        WHERE id=$1
        `,
        [row.id]
      )

    } catch (err) {

      await pool.query(
        `
        UPDATE file_cleanup_queue
        SET retry_count=retry_count+1,
            last_error=$2,
            updated_at=NOW()
        WHERE id=$1
        `,
        [
          row.id,
          err.message
        ]
      )
    }
  }
}