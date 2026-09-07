const express = require('express')
const router  = express.Router()
const ctrl    = require('./hsn.controller')
const { auth }  = require('../../middlewares/auth')
const { admin } = require('../../middlewares/admin')

router.use(auth, admin)

router.get  ('/',           ctrl.list)
router.get  ('/template',   ctrl.downloadTemplate)
router.get  ('/:id',        ctrl.getOne)
router.post ('/',           ctrl.create)
router.post ('/bulk',       ctrl.uploadMiddleware, ctrl.bulkImport)
router.put  ('/:id',        ctrl.update)
router.delete('/:id',       ctrl.remove)

module.exports = router
