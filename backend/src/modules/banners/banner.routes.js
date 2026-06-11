const express = require('express');
const router = express.Router();
const controller = require('./banner.controller');
const { auth } = require('../../middlewares/auth');
const { admin } = require('../../middlewares/admin');

// Public
router.get('/public', controller.getPublicBanners);

// Admin CRUD
router.get('/admin', auth, admin, controller.adminList);
router.post('/admin', auth, admin, controller.adminCreate);
router.put('/admin/:id', auth, admin, controller.adminUpdate);
router.delete('/admin/:id', auth, admin, controller.adminDelete);

module.exports = router;
