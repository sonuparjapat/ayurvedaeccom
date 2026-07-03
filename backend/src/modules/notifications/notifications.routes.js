const express = require('express')
const router = express.Router()
const ctrl = require('./notifications.controller')
const { auth } = require('../../middlewares/auth')

router.get('/', auth, ctrl.list)
router.get('/unread-count', auth, ctrl.unreadCount)
router.put('/read-all', auth, ctrl.readAll)
router.put('/:id/read', auth, ctrl.readOne)

module.exports = router
