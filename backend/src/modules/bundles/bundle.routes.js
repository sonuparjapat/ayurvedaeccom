const router = require('express').Router()
const controller = require('./bundle.controller')
const { auth } = require('../../middlewares/auth')
const { admin } = require('../../middlewares/admin')
const upload = require('../../config/multer')

router.get('/public', controller.getPublicBundles)
router.get('/public/:id', controller.getBundleById)
router.get('/admin', auth, admin, controller.adminListBundles)
router.post('/admin', auth, admin, upload.single('image'), controller.adminCreateBundle)
router.put('/admin/:id', auth, admin, upload.single('image'), controller.adminUpdateBundle)
router.delete('/admin/:id', auth, admin, controller.adminDeleteBundle)
router.post('/add-to-cart', auth, controller.addBundleToCart)

module.exports = router
