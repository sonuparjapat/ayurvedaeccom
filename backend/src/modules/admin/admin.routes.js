const express = require('express')
const router = express.Router()
const auth = require('../../middlewares/auth')
const admin = require('../../middlewares/admin')
const controller = require('../admin/admin.controller')

const upload = require('../../config/multer')
router.post('/login', controller.login)
router.get('/stats', auth, admin, controller.stats)

router.get('/recent-orders', auth, admin, controller.recentOrders)
router.get('/products', auth, admin, controller.getAll)

router.post(
  '/products',
  auth,
  admin,
  upload.array('images', 20),
  controller.create
)


router.put(
  '/products/:id',
  auth,
  admin,
  upload.array('images', 20), // ✅ allow images
  controller.update
)

router.put('/products/:id', auth, admin, controller.update)

router.delete('/products/:id', auth, admin, controller.remove)
router.get('/top-products', auth, admin, controller.topProducts)


module.exports = router