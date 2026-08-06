const express = require('express')
const router = express.Router()
const ctrl = require('./quiz.controller')
const { auth } = require('../../middlewares/auth')
const { admin } = require('../../middlewares/admin')

/* ── Static Dosha Quiz (legacy) ── */
router.get('/questions', ctrl.getQuestions)
router.post('/result', ctrl.submitResult)
router.get('/recommendations/:dosha', ctrl.getDoshaProducts)

/* ── Dynamic Quizzes — Public ── */
router.get('/active', ctrl.getActiveQuizzes)
router.get('/play/:id', ctrl.getQuizForPlay)
router.post('/play/:id/submit', ctrl.submitDynamicQuiz)

/* ── Dynamic Quizzes — Admin CRUD ── */
router.get('/admin/list', auth, admin, ctrl.adminListQuizzes)
router.get('/admin/:id', auth, admin, ctrl.adminGetQuiz)
router.post('/admin/create', auth, admin, ctrl.adminCreateQuiz)
router.put('/admin/:id', auth, admin, ctrl.adminUpdateQuiz)
router.delete('/admin/:id', auth, admin, ctrl.adminDeleteQuiz)

/* ── Questions ── */
router.post('/admin/questions', auth, admin, ctrl.adminAddQuestion)
router.put('/admin/questions/:id', auth, admin, ctrl.adminUpdateQuestion)
router.delete('/admin/questions/:id', auth, admin, ctrl.adminDeleteQuestion)

/* ── Options ── */
router.post('/admin/options', auth, admin, ctrl.adminAddOption)
router.put('/admin/options/:id', auth, admin, ctrl.adminUpdateOption)
router.delete('/admin/options/:id', auth, admin, ctrl.adminDeleteOption)

/* ── Analytics ── */
router.get('/admin/:id/attempts', auth, admin, ctrl.adminGetAttempts)
router.get('/admin/reward-logs/all', auth, admin, ctrl.adminGetRewardLogs)

module.exports = router
