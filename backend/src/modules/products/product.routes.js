const express = require("express");
const router = express.Router();

const controller = require("./product.controller");
const {auth} = require("../../middlewares/auth");



// Public
router.get("/public", controller.getAllPublic)

router.get("/categories", controller.getCategories)
router.post('/wishlist',auth, controller.toggleWishlist)

router.post('/review',auth,controller.addReview)

router.post('/cart',auth,controller.addToCart)

router.get('/cart',auth,controller.getCart)

module.exports = router;