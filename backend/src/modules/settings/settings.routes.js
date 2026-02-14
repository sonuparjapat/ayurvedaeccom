const express = require('express')
const router = express.Router()

const ctrl = require('../settings/settings.controller')
const { admin } = require('../../middlewares/admin')

router.use(admin)

router.get('/', ctrl.getAllSettings)
router.post('/', ctrl.createSetting)
router.put('/:id', ctrl.updateSetting)
router.delete('/:id', ctrl.deleteSetting)

module.exports = router
