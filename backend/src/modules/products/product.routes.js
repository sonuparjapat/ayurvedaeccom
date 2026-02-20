const express = require("express");
const router = express.Router();

const controller = require("./product.controller");
const {auth, optionalAuth} = require("../../middlewares/auth");
const upload = require("../../config/multer");



// Public
router.get("/public", controller.getAllPublic)
router.get("/public/:id",controller.getsingleproduct)
router.get("/categories", controller.getCategories)

/* =================wishlist ROUTES ================= */

router.post("/wishlist", auth, controller.toggleWishlist);

router.get("/", auth, controller.getWishlist);



router.post('/review',auth,controller.addReview)

router.post('/cart',auth,controller.addToCart)

router.get('/cart',auth,controller.getCart)


// Review routes
router.post(
  "/reviews/order/:orderId/product/:productId",
  auth,
  upload.array("images", 5),
  controller.addOrUpdateReview
);
router.get(
  "/reviews/product/:productId",
  optionalAuth,
  controller.getProductReviews
);
router.post(
  "/reviews/product",
  optionalAuth,
  controller.getProductReviews
);

router.delete(
  "/review/:id",
  auth,
  controller.deleteReview
);
router.delete("/:productId", auth, controller.removeWishlist);
module.exports = router;