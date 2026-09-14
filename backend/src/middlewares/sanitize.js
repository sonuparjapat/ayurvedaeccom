// Skip these fields entirely — must arrive untouched (bcrypt, token verification)
const SKIP_KEYS = new Set([
  'password', 'newPassword', 'oldPassword', 'confirmPassword',
  'token', 'id_token', 'access_token', 'reset_token',
  'verification_token', 'unlock_token', 'otp_code',
])

function sanitizeString(val) {
  return val
    .trim()
    // Remove <script> blocks and their contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove <iframe>, <object>, <embed> blocks
    .replace(/<(iframe|object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')
    // Remove event handler attributes (onclick=, onload=, onerror=, …)
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Remove javascript: and vbscript: URIs
    .replace(/(?:javascript|vbscript)\s*:/gi, '')
    // Remove data:text/html XSS vectors
    .replace(/data\s*:\s*text\/html/gi, '')
}

function sanitizeValue(key, val) {
  if (SKIP_KEYS.has(key)) return val
  return sanitizeString(val)
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(item => {
    if (typeof item === 'string') return sanitizeString(item)
    return sanitizeObject(item)
  })
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      out[k] = sanitizeValue(k, v)
    } else if (v && typeof v === 'object') {
      out[k] = sanitizeObject(v)
    } else {
      out[k] = v
    }
  }
  return out
}

module.exports = function sanitizeInputs(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body)
  }
  // Sanitize query string values too (skip token-like params)
  if (req.query && typeof req.query === 'object') {
    for (const [k, v] of Object.entries(req.query)) {
      if (typeof v === 'string' && !SKIP_KEYS.has(k)) {
        req.query[k] = sanitizeString(v)
      }
    }
  }
  next()
}
