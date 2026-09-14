const crypto = require('crypto')

module.exports = function requestId(req, res, next) {
  // Honour existing request ID from reverse proxy (e.g. Vercel, nginx) if present
  const id = req.headers['x-request-id'] || crypto.randomUUID()
  req.id = id
  res.setHeader('X-Request-Id', id)
  next()
}
