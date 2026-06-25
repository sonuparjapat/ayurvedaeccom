const router = require('express').Router()
const controller = require('./sitemap.controller')
router.get('/sitemap.xml', controller.generateSitemap)
module.exports = router
