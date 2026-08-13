const pool =
require('../config/db')

exports.createJob =
async ({
  jobType,
  payload = {},
  userId = null
}) => {

  const result =
    await pool.query(
      `
      INSERT INTO admin_jobs
      (
        job_type,
        payload,
        created_by
      )
      VALUES ($1,$2,$3)
      RETURNING *
      `,
      [
        jobType,
        payload,
        userId
      ]
    )

  return result.rows[0]
}

const ALLOWED_JOB_COLUMNS = new Set([
  'status', 'progress', 'result', 'error_text', 'started_at', 'completed_at'
])

exports.updateJob =
async (
  id,
  data = {}
) => {

  const fields = []
  const values = []
  let i = 1

  for (const key in data) {
    if (!ALLOWED_JOB_COLUMNS.has(key)) {
      throw new Error(`updateJob: column '${key}' is not allowed`)
    }
    fields.push(
      `${key}=$${i}`
    )
    values.push(
      data[key]
    )
    i++
  }

  if (!fields.length) return

  values.push(id)

  await pool.query(
    `
    UPDATE admin_jobs
    SET ${fields.join(',')}
    WHERE id=$${i}
    `,
    values
  )
}