const router = require('express').Router()
const controller = require('./newsletter.controller')
const { auth } = require('../../middlewares/auth')
const { admin } = require('../../middlewares/admin')

router.post('/subscribe', controller.subscribe)
router.post('/unsubscribe', controller.unsubscribe)
router.get('/admin', auth, admin, controller.adminList)
router.get('/admin/export', auth, admin, controller.adminExportCSV)
router.post('/admin/send-campaign', auth, admin, controller.adminSendCampaign)
router.delete('/admin/:id', auth, admin, controller.adminDelete)

module.exports = router
