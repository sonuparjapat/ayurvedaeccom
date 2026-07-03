const express = require('express')
const router = express.Router()
const ctrl = require('./wallet.controller')
const { auth } = require('../../middlewares/auth')
const { admin } = require('../../middlewares/admin')

// User routes
router.get('/', auth, ctrl.getWallet)
router.post('/apply', auth, ctrl.applyWallet)
router.get('/settings', ctrl.getSettings)            // public — used by checkout & wallet tab

// Admin routes
router.get('/admin/list', auth, admin, ctrl.adminListWallets)
router.get('/admin/user/:id', auth, admin, ctrl.adminUserDetail)
router.post('/admin/credit', auth, admin, ctrl.adminCreditWallet)
router.post('/admin/debit', auth, admin, ctrl.adminDebitWallet)
router.post('/admin/loyalty/credit', auth, admin, ctrl.adminCreditLoyalty)
router.post('/admin/loyalty/debit', auth, admin, ctrl.adminDebitLoyalty)
router.get('/admin/loyalty-settings', auth, admin, ctrl.adminGetLoyaltySettings)
router.put('/admin/loyalty-settings', auth, admin, ctrl.adminSaveLoyaltySettings)

module.exports = router
