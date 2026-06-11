const express = require('express')
const router = express.Router()
const ctrl = require('./wallet.controller')
const { auth } = require('../../middlewares/auth')
const { admin } = require('../../middlewares/admin')

router.get('/', auth, ctrl.getWallet)
router.post('/apply', auth, ctrl.applyWallet)
router.post('/admin/credit', auth, admin, ctrl.adminCreditWallet)
router.get('/admin/list', auth, admin, ctrl.adminListWallets)

module.exports = router
