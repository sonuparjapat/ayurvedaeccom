const express = require('express')
const router = express.Router()
const controller = require('./faq.controller')
const { auth } = require('../../middlewares/auth')
const { admin } = require('../../middlewares/admin')

// Public
router.get('/', controller.getPublic)

// Admin
router.get('/admin', admin, controller.adminList)
router.post('/admin', admin, controller.create)
router.put('/admin/:id', admin, controller.update)
router.delete('/admin/:id', admin, controller.remove)

module.exports = router
