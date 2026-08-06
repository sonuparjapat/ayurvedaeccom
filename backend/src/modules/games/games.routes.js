const express = require('express')
const router = express.Router()
const ctrl = require('./games.controller')
const { auth } = require('../../middlewares/auth')
const { admin } = require('../../middlewares/admin')

/* ── Scratch Cards — Admin ── */
router.get('/scratch/admin/list', auth, admin, ctrl.adminListScratchCards)
router.post('/scratch/admin/create', auth, admin, ctrl.adminCreateScratchCard)
router.put('/scratch/admin/:id', auth, admin, ctrl.adminUpdateScratchCard)
router.delete('/scratch/admin/:id', auth, admin, ctrl.adminDeleteScratchCard)

/* ── Scratch Cards — User (auth required to claim) ── */
router.get('/scratch/active', auth, ctrl.getActiveScratchCards)
router.post('/scratch/:id/claim', auth, ctrl.claimScratchCard)

/* ── Spin Wheel — Admin ── */
router.get('/spin/admin/list', auth, admin, ctrl.adminListWheels)
router.post('/spin/admin/create', auth, admin, ctrl.adminCreateWheel)
router.put('/spin/admin/:id', auth, admin, ctrl.adminUpdateWheel)
router.delete('/spin/admin/:id', auth, admin, ctrl.adminDeleteWheel)
router.post('/spin/admin/segments', auth, admin, ctrl.adminUpsertSegment)
router.put('/spin/admin/segments/:segId', auth, admin, ctrl.adminUpsertSegment)
router.delete('/spin/admin/segments/:segId', auth, admin, ctrl.adminDeleteSegment)

/* ── Spin Wheel — User ── */
router.get('/spin/active', auth, ctrl.getActiveWheels)
router.post('/spin/:id/play', auth, ctrl.spinWheel)

/* ── History ── */
router.get('/my-history', auth, ctrl.getUserGameHistory)

module.exports = router
