/**
 * One-time migration: create payment_logs table and indexes.
 * Run once: node src/database/migrate_payment_logs.js
 */
const { Pool } = require('pg')
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_logs (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        event_type VARCHAR(80) NOT NULL,
        amount NUMERIC(12,2),
        status VARCHAR(30),
        gateway_payment_id VARCHAR(200),
        gateway_order_id VARCHAR(200),
        gateway_refund_id VARCHAR(200),
        gateway_event VARCHAR(100),
        initiated_by VARCHAR(30) DEFAULT 'system',
        metadata JSONB,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payment_logs_order ON payment_logs(order_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payment_logs_event ON payment_logs(event_type)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payment_logs_created ON payment_logs(created_at DESC)`)
    console.log('✅ payment_logs table created (or already existed)')
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
