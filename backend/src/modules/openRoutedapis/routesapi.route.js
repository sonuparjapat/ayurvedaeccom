

const express = require("express");
const router = express.Router();

const categoryCtrl = require("./routedapis.controler");
const upload = require("../../config/multer");

router.get('/categories', categoryCtrl.getCategories)
router.get('/categories/:id', categoryCtrl.getCategoryById)

router.post('/categories',upload.single('image'), categoryCtrl.createCategory)

router.put('/categories/:id',upload.single('image'), categoryCtrl.updateCategory)

router.delete('/categories/:id', categoryCtrl.deleteCategory)
module.exports=router
