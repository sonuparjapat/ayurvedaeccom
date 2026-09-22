const winston = require('winston')
const path = require('path')

const { combine, timestamp, errors, json, colorize, simple } = winston.format

const isProduction = process.env.NODE_ENV === 'production'

// Daily rotating file transport (only in production / when LOG_DIR is set)
// In-memory ring buffer for the last 200 errors — powers GET /admin/error-logs
class MemoryErrorTransport extends winston.Transport {
  constructor(opts = {}) {
    super({ ...opts, level: 'error' })
    this._max = opts.max || 200
    this._buf = []
  }
  log(info, callback) {
    this._buf.push({ level: info.level, message: info.message, stack: info.stack || null, timestamp: info.timestamp || new Date().toISOString() })
    if (this._buf.length > this._max) this._buf.shift()
    callback()
  }
  recent(n = 50) {
    return this._buf.slice(-Math.min(n, this._max)).reverse()
  }
}
const memErrorTransport = new MemoryErrorTransport({ max: 200 })

const transports = [
  new winston.transports.Console({
    format: isProduction
      ? combine(timestamp(), errors({ stack: true }), json())
      : combine(colorize(), simple()),
    silent: process.env.LOG_SILENT === 'true',
  }),
  memErrorTransport,
]

if (process.env.LOG_DIR) {
  const DailyRotate = require('winston-daily-rotate-file')
  transports.push(
    new DailyRotate({
      dirname: process.env.LOG_DIR,
      filename: 'app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      maxSize: '20m',
      format: combine(timestamp(), errors({ stack: true }), json()),
    })
  )
  transports.push(
    new DailyRotate({
      dirname: process.env.LOG_DIR,
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d',
      format: combine(timestamp(), errors({ stack: true }), json()),
    })
  )
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports,
  exitOnError: false,
})

// Drop-in replacement for console.error — keeps existing call sites working
logger.patchConsole = () => {
  const orig = {
    error: console.error,
    warn:  console.warn,
    log:   console.log,
  }
  console.error = (...args) => logger.error(args.map(a => (a instanceof Error ? a.message : String(a))).join(' '), { stack: args.find(a => a instanceof Error)?.stack })
  console.warn  = (...args) => logger.warn(args.map(String).join(' '))
  return orig
}

// Expose recent errors for the admin error-log viewer
logger.recentErrors = (n = 50) => memErrorTransport.recent(n)

module.exports = logger
