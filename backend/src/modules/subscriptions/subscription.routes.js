const router = require('express').Router()
const controller = require('./subscription.controller')
const { auth } = require('../../middlewares/auth')
const { admin } = require('../../middlewares/admin')

router.post('/', auth, controller.createSubscription)
router.get('/my', auth, controller.getMySubscriptions)
router.put('/:id', auth, controller.updateSubscription)
router.delete('/:id', auth, controller.cancelSubscription)
router.get('/admin', auth, admin, controller.adminListSubscriptions)

module.exports = router
