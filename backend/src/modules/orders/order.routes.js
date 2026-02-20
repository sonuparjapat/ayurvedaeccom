const express = require("express");
const router = express.Router();

const controller = require("./order.controller");


const admin = require("../../middlewares/admin");
const { auth } = require("../../middlewares/auth");

router.post("/create", auth, controller.createOrder);
router.post("/verify", auth, controller.verifyPayment);
router.get("/my-orders", auth, controller.getMyOrders);
module.exports = router;