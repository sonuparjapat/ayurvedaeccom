require('../config/db')

exports.addAdminLog =
async ({
  adminId = null,
  action = '',
  module = '',
  details = {},
  ip = '',
}) => {

  try {
    await pool.query(
      `
      INSERT INTO admin_logs
      (
        admin_id,
        action,
        module,
        details,
        ip_address
      )
      VALUES ($1,$2,$3,$4,$5)
      `,
      [
        adminId,
        action,
        module,
        JSON.stringify(details),
        ip,
      ]
    )
  } catch (err) {
    console.log(
      'Admin log error',
      err.message
    )
  }
}