const express = require("express");
const router = express.Router();


const cartController = require("./cart.controller");
const { auth } = require("../../middlewares/auth");


router.post("/cart", auth, cartController.addToCart);

router.get("/", auth, cartController.getCart);

router.put("/", auth, cartController.updateCartQty);

router.delete("/:productId", auth, cartController.removeFromCart);

router.delete("/", auth, cartController.clearCart);


module.exports = router;