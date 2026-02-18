const pool = require('../../config/db')

/* ================= GET ALL ================= */

exports.getAllSettings = async (req, res) => {
  console.log("HIIIIIIIIIIIIIIIIIIIIIIIIII")
  try {

    const { rows } = await pool.query(
      `SELECT * FROM app_settings ORDER BY id DESC`
    )

    res.status(200).json({
      success: true,
      data: rows
    })

  } catch (err) {

    console.error(err)

    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}


/* ================= CREATE ================= */

exports.createSetting = async (req, res) => {
  try {

    const { key, value, type, description } = req.body

    if (!key || !value) {
      return res.status(400).json({
        success: false,
        message: 'Key and Value required'
      })
    }

    const result = await pool.query(
      `
      INSERT INTO app_settings
      (key,value,type,description)
      VALUES($1,$2,$3,$4)
      RETURNING *
      `,
      [key, value, type, description]
    )

    res.status(201).json({
      success: true,
      data: result.rows[0]
    })

  } catch (err) {

    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Key already exists'
      })
    }

    res.status(500).json({
      success: false,
      message: 'Create failed'
    })
  }
}


/* ================= UPDATE ================= */

exports.updateSetting = async (req, res) => {
  try {

    const { id } = req.params
    const { value, type, description, is_active } = req.body

    const result = await pool.query(
      `
      UPDATE app_settings
      SET
        value=$1,
        type=$2,
        description=$3,
        is_active=$4,
        updated_at=NOW()
      WHERE id=$5
      RETURNING *
      `,
      [value, type, description, is_active, id]
    )

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      })
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    })

  } catch {

    res.status(500).json({
      success: false,
      message: 'Update failed'
    })
  }
}


/* ================= DELETE ================= */

exports.deleteSetting = async (req, res) => {
  try {

    const { id } = req.params

    const result = await pool.query(
      `DELETE FROM app_settings WHERE id=$1`,
      [id]
    )

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        message: 'Not found'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Deleted'
    })

  } catch {

    res.status(500).json({
      success: false,
      message: 'Delete failed'
    })
  }
}
