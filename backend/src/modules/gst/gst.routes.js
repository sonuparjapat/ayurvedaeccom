const express = require('express')
const router = express.Router()
const { auth } = require('../../middlewares/auth')
const { admin } = require('../../middlewares/admin')
const gstCtrl = require('./gst.controller')

router.use(auth, admin)

router.get('/dashboard', gstCtrl.gstDashboard)
router.get('/gstr1', gstCtrl.gstr1Summary)
router.get('/export', gstCtrl.gstr1Export)

module.exports = router
