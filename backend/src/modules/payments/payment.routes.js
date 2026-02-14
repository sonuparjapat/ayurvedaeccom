const express = require("express");
const router = express.Router();

const controller = require("./payment.controller");

const auth = require("../../middlewares/auth");
const { admin } = require("../../middlewares/admin");

router.use(admin)

router.get('/', controller.getPayments)

module.exports = router;