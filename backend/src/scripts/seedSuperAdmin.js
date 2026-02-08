require("dotenv").config()

const pool = require("../config/db")
const bcrypt = require("bcryptjs")

;(async () => {

  try {

    const email = "sonu@gmail.com"
    const password = "admin123" // change after login
    const name = "Founder"

    /* Check if exists */

    const exists = await pool.query(
      "SELECT id FROM users WHERE email=$1",
      [email]
    )

    if (exists.rows.length) {
      console.log("✅ SuperAdmin already exists")
      await pool.end()
      process.exit(0)
    }

    /* Hash */

    const hash = await bcrypt.hash(password, 12)
    console.log(hash,"hashing")

    /* Insert */

    await pool.query(
      `
      INSERT INTO users
      (name,email,password,role,is_verified)
      VALUES($1,$2,$3,1,true)
      `,
      [name, email, hash]
    )

    console.log("✅ SuperAdmin Created Successfully")

    await pool.end()
    process.exit(0)

  } catch (err) {

    console.error("❌ Seed Error:", err)

    await pool.end()
    process.exit(1)
  }

})()