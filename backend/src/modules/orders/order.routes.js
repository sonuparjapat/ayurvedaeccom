const express = require("express");
const router = express.Router();

const controller = require("./order.controller");

const auth = require("../../middlewares/auth");
const admin = require("../../middlewares/admin");

// User
// router.post("/", auth, controller.createOrder);
// router.get("/my", auth, controller.getMyOrders);

// // Admin
// router.get("/", auth, admin, controller.getAllOrders);
// router.put("/:id/status", auth, admin, controller.updateStatus);

module.exports = router;