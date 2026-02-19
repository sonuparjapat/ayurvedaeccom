const express = require("express");
const router = express.Router();

const controller = require("./product.controller");
const {auth} = require("../../middlewares/auth");



// Public
router.get("/public", controller.getAllPublic)
router.get("/public/:id",controller.getsingleproduct)
router.get("/categories", controller.getCategories)

/* =================wishlist ROUTES ================= */

router.post("/wishlist", auth, controller.toggleWishlist);

router.get("/", auth, controller.getWishlist);

router.delete("/:productId", auth, controller.removeWishlist);

router.post('/review',auth,controller.addReview)

router.post('/cart',auth,controller.addToCart)

router.get('/cart',auth,controller.getCart)

module.exports = router;