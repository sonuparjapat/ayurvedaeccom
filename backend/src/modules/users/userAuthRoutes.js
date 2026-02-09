const express = require("express")
const router = express.Router()

const controller=require("./userAuthController");
const { auth } = require("../../middlewares/auth");





router.post("/register", controller.userRegister);

router.post("/login", controller.userLogin)

router.post("/logout",controller.logout)
router.post("/verify-email", controller.verifyEmail)
router.get("/me", auth, (req, res) => {
  res.json(req.user)
})

module.exports = router