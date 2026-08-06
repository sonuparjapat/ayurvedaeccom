const express = require('express')
const router = express.Router()
const ctrl = require('./push.controller')
const { auth } = require('../../middlewares/auth')
const { admin } = require('../../middlewares/admin')

router.post('/token', auth, ctrl.saveToken)
router.delete('/token', auth, ctrl.deleteToken)
router.get('/notifications', auth, ctrl.userNotifications)
router.post('/admin/broadcast', auth, admin, ctrl.adminBroadcast)
router.get('/admin/stats', auth, admin, ctrl.adminStats)
router.get('/admin/history', auth, admin, ctrl.adminHistory)

module.exports = router
