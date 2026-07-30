const express = require('express')
const router = express.Router()


const controller = require('../admin/admin.controller')
const bulkController = require('../admin/admin.bulk.controller')
const upload = require('../../config/multer')
const { allowRoles } = require('../../middlewares/role')
const { auth } = require('../../middlewares/auth')
const { admin } = require('../../middlewares/admin')
const invoicecontroller=require("../admin/admin.invoice.controller")
const shipingcontroller=require('../admin/admin.shipping.controller')
const analyticscontroller=require('../admin/analystics/analytics.controller')
const deptCtrl = require('../departments/department.controller')
const checkPermission = require('../../middlewares/checkPermission')
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
router.get('/server-stats', auth, admin, controller.serverStats)
router.get('/customer-segments', auth, admin, controller.customerSegments)
router.get('/sparklines', auth, admin, controller.sparklines)

router.get('/recent-orders', auth, admin, controller.recentOrders)
router.get('/products', auth, admin, controller.getAll)
router.get(
  '/products/bulk-template',
  auth,
  admin,
  bulkController.downloadTemplate
)
router.get(
  '/products/category-template',
  auth,
  admin,
  bulkController.downloadCategoryTemplate
)

router.post(
  '/products/bulk-upload',
  auth,
  admin,
  bulkController.uploadBulkFiles,
  bulkController.bulkUpload
)
router.post(
  '/products/bulk-import',
  auth,
  admin,
  express.json(),
  bulkController.bulkImport
)
router.post(
  '/products/bulk-stock',
  auth,
  admin,
  bulkController.uploadBulkFiles,
  bulkController.bulkStockUpdate
)
router.post(
  '/products/bulk-price',
  auth,
  admin,
  bulkController.uploadBulkFiles,
  bulkController.bulkPriceUpdate
)
router.post(
  '/products/bulk-status',
  auth,
  admin,
  bulkController.uploadBulkFiles,
  bulkController.bulkStatusUpdate
)
router.post(
  '/products/bulk-category',
  auth,
  admin,
  bulkController.uploadBulkFiles,
  bulkController.bulkCategoryUpdate
)
router.post(
  '/products/bulk-images',
  auth,
  admin,
  bulkController.uploadBulkFiles,
  bulkController.bulkImagesUpdate
)
router.get(
  '/logs',
  auth,
  admin,
  bulkController.getAdminLogs
)
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

router.delete('/products/:id', auth, admin, controller.remove)
router.get('/top-products', auth, admin, controller.topProducts)
router.get('/low-stock', auth, admin, controller.getLowStockProducts)

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
router.get(
  '/jobs',
  auth,
  admin,
  bulkController.getJobs
)

router.get(
  '/jobs/:id',
  auth,
  admin,
  bulkController.getJobById
)
router.put('/orders/bulk-status', auth, admin, controller.adminBulkUpdateOrderStatus)

router.get('/orders/:id', auth, admin, controller.getOrderById)

router.put('/orders/:id/status', controller.updateOrderStatus)








// router.post('/orders/:id/invoice', invoicecontroller.generateInvoice)

router.post('/orders/:id/tracking', shipingcontroller.addTracking)
router.get('/tracking/search', auth, admin, controller.searchByTracking)

/* ─── PRODUCT VARIANTS ADMIN CRUD ─── */
router.get('/variants/:productId', auth, admin, controller.adminGetVariants)
router.post('/variants/:productId', auth, admin, controller.adminCreateVariant)
router.put('/variants/:id', auth, admin, controller.adminUpdateVariant)
router.delete('/variants/:id', auth, admin, controller.adminDeleteVariant)

/* ─── PRICE AUDIT LOGS ─── */
router.get('/price-logs', auth, admin, controller.adminGetPriceLogs)

/* ─── PINCODE SERVICEABILITY ADMIN ─── */
router.get('/pincodes', auth, admin, controller.adminListPincodes)
router.post('/pincodes', auth, admin, controller.adminCreatePincode)
router.post('/pincodes/bulk', auth, admin, controller.adminBulkUploadPincodes)
router.put('/pincodes/:id', auth, admin, controller.adminUpdatePincode)
router.delete('/pincodes/:id', auth, admin, controller.adminDeletePincode)

/* ─── STOCK NOTIFICATIONS ADMIN ─── */
router.get('/stock-notifications', auth, admin, controller.adminListStockNotifications)

/* ─── LOW STOCK ALERTS ─── */
router.get('/low-stock-alerts', auth, admin, controller.checkLowStock)

/* ─── ORDER TIMELINE ─── */
router.get('/orders/:id/timeline', auth, admin, controller.getOrderTimeline)

/* ─── CSV EXPORTS ─── */
router.get('/export/orders', auth, admin, controller.exportOrdersCSV)
router.get('/export/users', auth, admin, controller.exportUsersCSV)

/* ─── REVIEWS MODERATION ─── */
router.get('/reviews', auth, admin, controller.adminListReviews)
router.put('/reviews/:id', auth, admin, controller.adminUpdateReview)
router.delete('/reviews/:id', auth, admin, controller.adminDeleteReview)

/* ─── ABANDONED CARTS ─── */
router.get('/abandoned-carts', auth, admin, controller.getAbandonedCarts)

/* ─── LOYALTY POINTS ─── */
router.post('/loyalty/credit', auth, admin, controller.adminCreditLoyalty)

/* ─── COD DELIVERY OTP ─── */
router.post('/orders/:id/delivery-otp', auth, admin, controller.generateDeliveryOTP)
router.post('/orders/:id/verify-otp', controller.verifyDeliveryOTP)

/* ─── REVENUE CHART ─── */
router.get('/revenue-chart', auth, admin, analyticscontroller.getRevenueChart)

/* ─── RETURNS MANAGEMENT ─── */
router.get('/returns', auth, admin, controller.adminGetReturns)
router.put('/returns/:id/approve', auth, admin, controller.adminApproveReturn)
router.put('/returns/:id/reject', auth, admin, controller.adminRejectReturn)
router.put('/returns/:id/complete-refund', auth, admin, controller.adminCompleteRefund)

/* ─── BRAND CRUD ─── */
router.get('/brands', auth, admin, controller.adminListBrands)
router.post('/brands', auth, admin, upload.single('logo'), controller.adminCreateBrand)
router.put('/brands/:id', auth, admin, upload.single('logo'), controller.adminUpdateBrand)
router.delete('/brands/:id', auth, admin, controller.adminDeleteBrand)

/* ─── PRODUCT PERFORMANCE + FUNNEL ANALYTICS ─── */
router.get('/analytics/products', auth, admin, controller.getProductPerformance)
router.get('/analytics/funnel', auth, admin, controller.getFunnelAnalytics)

/* ─── RBAC: PERMISSIONS ─── */
router.get('/my-permissions', auth, admin, deptCtrl.getMyPermissions)
router.get('/permissions/all', auth, admin, deptCtrl.getAllPermissions)

/* ─── RBAC: DEPARTMENTS (superadmin only for create/update/delete) ─── */
router.get('/departments', auth, admin, deptCtrl.listDepartments)
router.post('/departments', auth, allowRoles(1), deptCtrl.createDepartment)
router.put('/departments/:id', auth, allowRoles(1), deptCtrl.updateDepartment)
router.delete('/departments/:id', auth, allowRoles(1), deptCtrl.deleteDepartment)
router.get('/departments/:id/permissions', auth, admin, deptCtrl.getDepartmentPermissions)
router.put('/departments/:id/permissions', auth, allowRoles(1), deptCtrl.setDepartmentPermissions)

/* ─── RBAC: ASSIGN USER TO DEPARTMENT ─── */
router.put('/user/:id/department', auth, allowRoles(1), deptCtrl.assignUserDepartment)

/* ─── ADMIN MANUAL REFUND ─── */
const orderCtrl = require('../orders/order.controller')
router.post('/orders/:id/refund', auth, admin, orderCtrl.adminRefundOrder)

module.exports = router