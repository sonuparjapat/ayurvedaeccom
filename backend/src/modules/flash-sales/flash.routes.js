const express = require('express')
const router = express.Router()
const ctrl = require('./flash.controller')
const { auth } = require('../../middlewares/auth')
const { admin } = require('../../middlewares/admin')

// Public
router.get('/active', ctrl.getActiveFlashSales)

// Admin
router.get('/admin', auth, admin, ctrl.adminList)
router.get('/admin/:id', auth, admin, ctrl.adminGet)
router.post('/admin', auth, admin, ctrl.adminCreate)
router.put('/admin/:id', auth, admin, ctrl.adminUpdate)
router.delete('/admin/:id', auth, admin, ctrl.adminDelete)

module.exports = router
