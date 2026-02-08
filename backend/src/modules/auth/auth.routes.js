const express = require("express");
const router = express.Router();

const controller = require("./auth.controller");
const { allowRoles } = require("../../middlewares/role");

router.post('/register',allowRoles(1),controller.createAdmin)
router.post('/login', controller.login)
router.post("/logout", controller.logout)
module.exports = router;