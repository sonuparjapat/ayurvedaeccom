const express = require("express");
const router = express.Router();

const controller = require("./order.controller");


const admin = require("../../middlewares/admin");
const { auth } = require("../../middlewares/auth");
const upload = require("../../config/multer");

router.post("/buy-now", auth, controller.buyNow);
router.post("/create", auth, controller.createOrder);
router.post("/buy-now", auth, controller.buyNow);
router.post("/verify", auth, controller.verifyPayment);
router.get("/my-orders", auth, controller.getMyOrders);
router.get("/payment-redirect", controller.paymentRedirect);
router.get("/:id/payment-page", auth, controller.getPaymentPage);
router.get("/:id/invoice", auth, controller.getUserInvoice);
router.get("/:id", auth, controller.getOrderById);
router.post("/:id/cancel", auth, controller.cancelOrder);
router.post("/:id/return", auth, upload.array("images", 5), controller.returnOrder);
router.get("/:id/timeline", auth, controller.getOrderTimeline);
router.post("/:id/retry-payment", auth, controller.retryPayment);
router.post("/:id/reorder", auth, controller.reorder);
module.exports = router;