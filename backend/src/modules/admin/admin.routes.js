const express = require('express')
const router = express.Router()


const controller = require('../admin/admin.controller')

const upload = require('../../config/multer')
const { allowRoles } = require('../../middlewares/role')
const { auth } = require('../../middlewares/auth')
const { admin } = require('../../middlewares/admin')
const invoicecontroller=require("../admin/admin.invoice.controller")
const shipingcontroller=require('../admin/admin.shipping.controller')
const analyticscontroller=require('../admin/analystics/analytics.controller')
router.use(admin)
router.put(
  "/user/:id",
  auth,
  allowRoles(1, 2),
  controller.updateUser
)
router.post(
  "/create",
  auth,
  allowRoles(1, 2),
  controller.createUser
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

router.get('/orders', controller.getOrders)
router.get('/invoices', admin, invoicecontroller.getInvoices)
router.get('/', controller.getCarts)
router.post(
  '/invoices/generate/:orderId',
  admin,
  invoicecontroller.generateInvoice
)
router.get(
  '/invoices/:id/pdf',
  admin,
 invoicecontroller.downloadInvoice
)
// ===================analytics routes =========================
router.get('/overview',auth,admin, analyticscontroller.getOverviewAnalytics);
// get status code 
router.get('/status_codes',auth,controller.getstauscodes)
router.get('/:id', controller.getOrderById)

router.put('/orders/:id/status', controller.updateOrderStatus)








// router.post('/orders/:id/invoice', invoicecontroller.generateInvoice)

router.post('/orders/:id/tracking', shipingcontroller.addTracking)

module.exports = router