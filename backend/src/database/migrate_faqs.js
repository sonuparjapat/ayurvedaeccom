/**
 * One-time migration: create the faqs table if it doesn't exist.
 * Run with: node src/database/migrate_faqs.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })
const pool = require('../config/db')

;(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS faqs (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        category VARCHAR(100) NOT NULL DEFAULT 'General',
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs(is_active, sort_order)`)
    console.log('✅ faqs table created (or already existed)')
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
  } finally {
    await pool.end()
  }
})()
