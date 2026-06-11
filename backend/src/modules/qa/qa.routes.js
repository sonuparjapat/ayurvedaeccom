const express = require('express')
const router = express.Router()
const ctrl = require('./qa.controller')
const { auth, optionalAuth } = require('../../middlewares/auth')
const { admin } = require('../../middlewares/admin')

router.get('/product/:productId', ctrl.getProductQA)
router.post('/product/:productId/ask', optionalAuth, ctrl.askQuestion)
router.post('/question/:questionId/answer', auth, ctrl.answerQuestion)

router.get('/admin/questions', auth, admin, ctrl.adminListQuestions)
router.put('/admin/questions/:id', auth, admin, ctrl.adminUpdateQuestion)
router.delete('/admin/questions/:id', auth, admin, ctrl.adminDeleteQuestion)

module.exports = router
