const router = require('express').Router()
const controller = require('./analytics.controller')
const { auth } = require('../../middlewares/auth')
const { admin } = require('../../middlewares/admin')

router.post('/pageview', controller.trackPageView)
router.get('/visitors', auth, admin, controller.getVisitorStats)

module.exports = router
