const express = require("express");
const router = express.Router();

const controller = require("./auth.controller");
const { allowRoles } = require("../../middlewares/role");
const { auth } = require("../../middlewares/auth");

router.post('/register', auth, allowRoles(1), controller.createAdmin)
router.post('/login', controller.login)
router.post("/logout", controller.logout)
module.exports = router;