const express = require("express")
const router = express.Router()

const controller=require("./userAuthController");
const { auth } = require("../../middlewares/auth");





router.post("/register", controller.userRegister);

router.post("/login", controller.userLogin)

router.post("/logout",controller.logout)
router.post("/verify-email", controller.verifyEmail)
/* ================= CURRENT USER ================= */
router.get('/me',auth,controller.getMe)

module.exports = router