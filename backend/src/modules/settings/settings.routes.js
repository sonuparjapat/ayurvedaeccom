const express = require('express')
const router = express.Router()

const ctrl = require('../settings/settings.controller')
const { admin } = require('../../middlewares/admin')

router.get('/', ctrl.getAllSettings)          // public — read by auth-context on all pages
router.post('/', admin, ctrl.createSetting)
router.put('/:id', admin, ctrl.updateSetting)
router.delete('/:id', admin, ctrl.deleteSetting)

module.exports = router
