const express = require("express")
const router = express.Router()

const { register,login,logout }=require("./userAuthController")


const auth = require("../../middlewares/auth")

router.post("/register", register)

router.post("/login", login)

router.post("/logout", logout)

router.get("/me", auth, (req, res) => {
  res.json(req.user)
})

module.exports = router