// const { Pool } = require("pg");
// require("dotenv").config();

// const pool = new Pool({
//   host: process.env.DB_HOST,
//   port: process.env.DB_PORT,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   max: 20,
// });

// pool.on("connect", () => {
//   console.log("✅ PostgreSQL Connected");
// });

// module.exports = pool;
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
  max: 20,                    // max connections in the pool (default is 10)
  idleTimeoutMillis: 30000,   // release idle connections after 30s
  connectionTimeoutMillis: 5000, // fail fast if pool is exhausted
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL Connected");
});

module.exports = pool;