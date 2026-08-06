const express = require("express");
const router = express.Router();

const controller = require("./tracking.controller");

const { auth } = require("../../middlewares/auth");
const { admin } = require("../../middlewares/admin");

// Public — no auth required
router.get("/public/:token", controller.getTrackingByToken);

// User
router.get("/:orderId", auth, controller.getTracking);

// Admin
router.post("/", auth, admin, controller.createTracking);
router.put("/:orderId", auth, admin, controller.updateTracking);

module.exports = router;