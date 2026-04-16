const express = require("express");
const router = express.Router();


const cartController = require("./cart.controller");
const { auth, optionalAuth } = require("../../middlewares/auth");


/* create guest session */
router.post("/guest-session", cartController.createGuestSession);
router.post("/",optionalAuth, cartController.addToCart);

router.get("/",optionalAuth, cartController.getCart);

router.put("/", optionalAuth, cartController.updateCartQty);

router.delete("/:productId", optionalAuth, cartController.removeFromCart);

router.delete("/", optionalAuth, cartController.clearCart);
/* merge after login */
router.post("/merge", auth, cartController.mergeGuestCart);

module.exports = router;