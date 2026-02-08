const express = require("express");
const router = express.Router();

const controller = require("./tracking.controller");

const auth = require("../../middlewares/auth");
const admin = require("../../middlewares/admin");

// User
router.get("/:orderId", auth, controller.getTracking);

// Admin
router.post("/", auth, admin, controller.createTracking);
router.put("/:orderId", auth, admin, controller.updateTracking);

module.exports = router;