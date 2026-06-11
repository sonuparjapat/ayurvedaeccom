const express = require("express");
const router = express.Router();

const controller = require("./order.controller");


const admin = require("../../middlewares/admin");
const { auth } = require("../../middlewares/auth");

router.post("/create", auth, controller.createOrder);
router.post("/verify", auth, controller.verifyPayment);
router.get("/my-orders", auth, controller.getMyOrders);
router.get("/:id/payment-page", auth, controller.getPaymentPage);
router.get("/:id", auth, controller.getOrderById);
router.post("/:id/cancel", auth, controller.cancelOrder);
router.post("/:id/return", auth, controller.returnOrder);
router.get("/:id/timeline", auth, controller.getOrderTimeline);
router.post("/:id/retry-payment", auth, controller.retryPayment);
module.exports = router;