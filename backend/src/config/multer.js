const multer = require("multer");
const { validateFileMagic, validateFilesMagic } = require('../middlewares/validateFileMagic')

const storage = multer.memoryStorage();

const _multer = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Only JPG, PNG, WEBP allowed"), false)
    }
  },
})

function chain(multerMiddleware, magicCheck) {
  return function (req, res, next) {
    multerMiddleware(req, res, (err) => {
      if (err) return next(err)
      magicCheck(req, res, next)
    })
  }
}

const upload = {
  single: (field) => chain(_multer.single(field), validateFileMagic),
  array:  (field, max) => chain(_multer.array(field, max), validateFilesMagic),
  fields: (fields) => chain(_multer.fields(fields), validateFilesMagic),
  none:   () => _multer.none(),
}

module.exports = upload
