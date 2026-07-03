const pool = require('../config/db')

// In-memory cache — avoids a DB query on every single order
let _cache = null
let _cacheAt = 0
const CACHE_TTL = 60 * 1000 // 60 seconds

const DEFAULTS = {
  loyalty_enabled: true,
  wallet_enabled: true,
  loyalty_earn_rate: 0.1,       // points earned per ₹1 spent (0.1 = 1 pt per ₹10)
  loyalty_redeem_rate: 0.1,     // ₹ value per 1 point (0.1 = 10 pts = ₹1)
  loyalty_min_redeem_points: 50,
  loyalty_max_redeem_percent: 20,
}

/**
 * Returns loyalty/wallet settings as a typed object.
 * Cached for 60s. Call invalidate() after admin saves.
 */
exports.getLoyaltySettings = async () => {
  if (_cache && Date.now() - _cacheAt < CACHE_TTL) return _cache

  try {
    const r = await pool.query(
      `SELECT key, value, type FROM app_settings
       WHERE key IN (
         'loyalty_enabled','wallet_enabled',
         'loyalty_earn_rate','loyalty_redeem_rate',
         'loyalty_min_redeem_points','loyalty_max_redeem_percent'
       )`
    )
    const settings = { ...DEFAULTS }
    for (const row of r.rows) {
      if (row.type === 'boolean') settings[row.key] = row.value === 'true'
      else if (row.type === 'number') settings[row.key] = Number(row.value)
      else settings[row.key] = row.value
    }
    _cache = settings
    _cacheAt = Date.now()
    return settings
  } catch {
    return DEFAULTS
  }
}

/** Call after admin updates a loyalty setting to force re-read from DB */
exports.invalidateCache = () => {
  _cache = null
  _cacheAt = 0
}
