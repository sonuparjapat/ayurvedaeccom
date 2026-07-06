const express = require('express');
const router = express.Router();
const controller = require('./coupon.controller');
const { auth, optionalAuth } = require('../../middlewares/auth');
const { admin } = require('../../middlewares/admin');

// Public — available offers (optionalAuth so logged-in users see their personal coupons)
router.get('/public', optionalAuth, controller.getActiveCoupons);

// User — apply coupon (optionalAuth: works for guests, per-user check when logged in)
router.post('/apply', optionalAuth, controller.applyCoupon);

// Admin CRUD
router.get('/admin', auth, admin, controller.adminList);
router.post('/admin', auth, admin, controller.adminCreate);
router.put('/admin/:id', auth, admin, controller.adminUpdate);
router.delete('/admin/:id', auth, admin, controller.adminDelete);

// Admin — search users for user-specific coupon assignment
router.get('/admin/users-search', auth, admin, controller.adminSearchUsers);

module.exports = router;
