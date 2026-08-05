const pool = require('../config/db')

let _cache = null
let _cacheAt = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

const DEFAULTS = {
  delivery_charge: 0,
  platform_fee: 0,
  free_delivery_limit: 500,
}

exports.getAppSettings = async () => {
  if (_cache && Date.now() - _cacheAt < CACHE_TTL) return _cache

  try {
    const { rows } = await pool.query(
      `SELECT key, value, type FROM app_settings WHERE is_active = true`
    )
    const settings = { ...DEFAULTS }
    for (const row of rows) {
      if (row.type === 'number') settings[row.key] = Number(row.value)
      else if (row.type === 'boolean') settings[row.key] = row.value === 'true'
      else settings[row.key] = row.value
    }
    _cache = settings
    _cacheAt = Date.now()
    return settings
  } catch {
    return DEFAULTS
  }
}

exports.invalidateCache = () => {
  _cache = null
  _cacheAt = 0
}
