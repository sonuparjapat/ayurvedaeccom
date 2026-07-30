

const express = require("express");
const router = express.Router();
const categoryCtrl = require("./routedapis.controler");
const upload = require("../../config/multer");
const { admin } = require("../../middlewares/admin");

// Public read-only routes
router.get('/categories', categoryCtrl.getCategories)
router.get('/categories/tree', categoryCtrl.getCategoryTree)
router.get('/categories/slug/:slug', categoryCtrl.getCategoryBySlug)
router.get('/brands', categoryCtrl.getPublicBrands)
router.get('/brands/:slug', categoryCtrl.getPublicBrandBySlug)
router.get('/categories/:id', categoryCtrl.getCategoryById)

// Admin-only mutation routes
router.post('/categories', admin, upload.single('image'), categoryCtrl.createCategory)
router.put('/categories/:id', admin, upload.single('image'), categoryCtrl.updateCategory)
router.delete('/categories/:id', admin, categoryCtrl.deleteCategory)

module.exports = router
