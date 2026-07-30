

const express = require("express");
const router = express.Router();
const mailer = require("../../config/mail")
const categoryCtrl = require("./routedapis.controler");
const upload = require("../../config/multer");

router.get('/categories', categoryCtrl.getCategories)
router.get('/categories/tree', categoryCtrl.getCategoryTree)
router.get('/categories/slug/:slug', categoryCtrl.getCategoryBySlug)
router.get('/brands', categoryCtrl.getPublicBrands)
router.get('/brands/:slug', categoryCtrl.getPublicBrandBySlug)
router.get('/categories/:id', categoryCtrl.getCategoryById)

router.post('/categories',upload.single('image'), categoryCtrl.createCategory)

router.put('/categories/:id',upload.single('image'), categoryCtrl.updateCategory)
router.get("/test-mail",
 async(req,res)=>{
  try{
console.log(
 process.env.BREVO_API_KEY,"HIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII"
);
   await mailer
   .sendTransacEmail({
    sender:{
     email:
      process.env
      .MAIL_FROM,
     name:
      process.env
      .APP_NAME
    },

    to:[
     {
      email:
      "sgate.sonu@gmail.com"
     }
    ],

    subject:
     "Brevo Test",

    htmlContent:
     "<h1>Working</h1>"
   });

   res.json({
    success:true
   });

  }catch(err){
   console.log(err);
   res.status(500)
   .json(err);
  }
});
router.delete('/categories/:id', categoryCtrl.deleteCategory)
module.exports=router
