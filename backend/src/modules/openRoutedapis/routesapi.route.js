

const express = require("express");
const router = express.Router();

const categoryCtrl = require("./routedapis.controler");

router.get('/categories', categoryCtrl.getCategories)
router.get('/categories/:id', categoryCtrl.getCategoryById)

router.post('/categories', categoryCtrl.createCategory)

router.put('/categories/:id', categoryCtrl.updateCategory)

router.delete('/categories/:id', categoryCtrl.deleteCategory)
module.exports=router
