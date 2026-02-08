const express = require("express");
const router = express.Router();

const controller = require("./payment.controller");

const auth = require("../../middlewares/auth");

// router.post("/create", auth, controller.createPayment);
// router.post("/verify", auth, controller.verifyPayment);

module.exports = router;