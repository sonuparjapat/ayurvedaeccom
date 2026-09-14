/* Verify actual file magic bytes after multer stores the buffer in memory.
   Prevents MIME-type spoofing (e.g. a PHP shell renamed to image.jpg). */

const SIGNATURES = [
  { ext: 'jpg',  bytes: [0xFF, 0xD8, 0xFF] },
  { ext: 'png',  bytes: [0x89, 0x50, 0x4E, 0x47] },
  // WebP: first 4 bytes are "RIFF", bytes 8-11 are "WEBP"
]

function isWebP(buf) {
  if (!buf || buf.length < 12) return false
  return buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
         buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
}

function checkMagic(buffer) {
  if (!buffer || buffer.length < 4) return false
  for (const sig of SIGNATURES) {
    if (sig.bytes.every((b, i) => buffer[i] === b)) return true
  }
  return isWebP(buffer)
}

/* Single file: validates req.file */
function validateFileMagic(req, res, next) {
  if (!req.file) return next()
  if (!checkMagic(req.file.buffer)) {
    return res.status(400).json({ success: false, message: 'Invalid file type. Only JPEG, PNG, and WebP images are accepted.' })
  }
  next()
}

/* Multiple files: validates all files in req.files (array or object) */
function validateFilesMagic(req, res, next) {
  const files = req.files
    ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat())
    : []
  for (const f of files) {
    if (!checkMagic(f.buffer)) {
      return res.status(400).json({ success: false, message: 'Invalid file type. Only JPEG, PNG, and WebP images are accepted.' })
    }
  }
  next()
}

module.exports = { validateFileMagic, validateFilesMagic }
