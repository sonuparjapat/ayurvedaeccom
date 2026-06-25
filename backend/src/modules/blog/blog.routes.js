const router = require('express').Router()
const controller = require('./blog.controller')
const { auth } = require('../../middlewares/auth')
const { admin } = require('../../middlewares/admin')
const upload = require('../../config/multer')

router.get('/public', controller.getPublicPosts)
router.get('/public/:slug', controller.getPostBySlug)
router.get('/admin', auth, admin, controller.adminListPosts)
router.post('/admin', auth, admin, upload.single('cover_image'), controller.adminCreatePost)
router.put('/admin/:id', auth, admin, upload.single('cover_image'), controller.adminUpdatePost)
router.delete('/admin/:id', auth, admin, controller.adminDeletePost)

module.exports = router
