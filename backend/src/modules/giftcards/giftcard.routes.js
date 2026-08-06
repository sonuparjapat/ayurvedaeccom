const express = require('express')
const router = express.Router()
const controller = require('./giftcard.controller')
const { auth } = require('../../middlewares/auth')
const { admin } = require('../../middlewares/admin')

// Public: validate a code
router.get('/validate/:code', controller.validateGiftCard)

// Admin only
router.get('/admin/list', auth, admin, controller.adminListGiftCards)
router.post('/admin/create', auth, admin, controller.adminCreateGiftCard)
router.put('/admin/:id/deactivate', auth, admin, controller.adminDeactivateGiftCard)

module.exports = router
