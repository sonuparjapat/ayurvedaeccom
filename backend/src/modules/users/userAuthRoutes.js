const express = require("express")
const router = express.Router()
const rateLimit = require('express-rate-limit')

const controller=require("./userAuthController");
const { auth } = require("../../middlewares/auth");
const usercontroller=require("./userController")
const {exportData}=require("./user.export.controller")
const {
  getSettings,
  updateSettings,
} = require("./user.settings.controller");

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many registration attempts. Please try again later.' },
})

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
})

router.post("/register", registerLimiter, controller.userRegister);

router.post("/login", loginLimiter, controller.userLogin)
router.post("/google-login", controller.googleLogin)
router.post("/google-login-userinfo", controller.googleLoginUserinfo)

router.post("/logout",controller.logout)
router.post("/verify-email", controller.verifyEmail)
// route.put('/users/profile',auth,controller.updateUserProfile)
// profile routes 
router.put("/profile", auth, usercontroller.updateProfile);
router.delete("/account", auth, usercontroller.deleteAccount);

router.put("/change-password", auth, usercontroller.changePassword);
// address routes
router.post("/address", auth, usercontroller.addAddress);

router.get("/address", auth, usercontroller.getMyAddresses);

router.put("/address/:id", auth, usercontroller.updateAddress);

router.delete("/address/:id", auth, usercontroller.deleteAddress);

router.put("/address/default/:id", auth, usercontroller.setDefaultAddress);

// ========================user settings =========================
router.get("/settings", auth, getSettings);

router.put("/settings", auth, updateSettings);
// via mobile
router.post('/users/verify-mobile-otp',controller.verifyMobileOtp)
// resend verification link
router.post(`/users/resend-verification`,controller.resendVerification)
router.post('/users/send-mobile-otp',controller.sendMobileOtp)
// viaemail
router.post('/send-login-otp',controller.sendLoginOtp)
router.post('/verify-login-otp',controller.verifyLoginOtp)
router.post("/forgot-password", controller.forgotPassword);
router.post('/reset-password',controller.resetPassword)
// ========================export data =======================
router.get("/export", auth, exportData);
/* ================= CURRENT USER ================= */
router.get('/me',auth,controller.getMe)

/* ================= REFERRAL STATS ================= */
router.get('/referral', auth, usercontroller.getReferralStats)

module.exports = router