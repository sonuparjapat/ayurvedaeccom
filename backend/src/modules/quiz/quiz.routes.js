const express = require('express')
const router = express.Router()
const ctrl = require('./quiz.controller')

// console.log("Hii")
// Public — no auth required to take quiz or submit
router.get('/questions', ctrl.getQuestions)
router.post('/result', ctrl.submitResult)

module.exports = router
