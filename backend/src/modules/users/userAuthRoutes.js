const express = require("express")
const router = express.Router()

const controller=require("./userAuthController");
const { auth } = require("../../middlewares/auth");
const usercontroller=require("./userController")
const {exportData}=require("./user.export.controller")
const {
  getSettings,
  updateSettings,
} = require("./user.settings.controller");



router.post("/register", controller.userRegister);

router.post("/login", controller.userLogin)

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


// ========================export data =======================
router.get("/export", auth, exportData);
/* ================= CURRENT USER ================= */
router.get('/me',auth,controller.getMe)

module.exports = router