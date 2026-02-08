const express = require('express')
const router = express.Router()


const controller = require('../admin/admin.controller')

const upload = require('../../config/multer')
const { allowRoles } = require('../../middlewares/role')
const { auth } = require('../../middlewares/auth')
const { admin } = require('../../middlewares/admin')

router.put(
  "/user/:id",
  auth,
  allowRoles(1, 2),
  controller.updateUser
)

router.get('/users',auth,
  allowRoles(1, 2),
  controller.users)
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