const express = require('express');
const router = express.Router();
const controller = require('./coupon.controller');
const { auth, optionalAuth } = require('../../middlewares/auth');
const { admin } = require('../../middlewares/admin');

// Public — available offers
router.get('/public', controller.getActiveCoupons);

// User — apply coupon (optionalAuth: works for guests, per-user check when logged in)
router.post('/apply', optionalAuth, controller.applyCoupon);

// Admin CRUD
router.get('/admin', auth, admin, controller.adminList);
router.post('/admin', auth, admin, controller.adminCreate);
router.put('/admin/:id', auth, admin, controller.adminUpdate);
router.delete('/admin/:id', auth, admin, controller.adminDelete);

module.exports = router;
