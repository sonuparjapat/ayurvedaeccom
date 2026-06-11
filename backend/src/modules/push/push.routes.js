const express = require('express')
const router = express.Router()
const ctrl = require('./push.controller')
const { auth } = require('../../middlewares/auth')
const { admin } = require('../../middlewares/admin')

router.post('/token', auth, ctrl.saveToken)
router.post('/admin/broadcast', auth, admin, ctrl.adminBroadcast)
router.get('/admin/stats', auth, admin, ctrl.adminStats)

module.exports = router
