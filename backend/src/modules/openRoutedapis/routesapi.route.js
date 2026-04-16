

const express = require("express");
const router = express.Router();
const mailer = require("../../config/mail")
const categoryCtrl = require("./routedapis.controler");
const upload = require("../../config/multer");

router.get('/categories', categoryCtrl.getCategories)
router.get('/categories/:id', categoryCtrl.getCategoryById)

router.post('/categories',upload.single('image'), categoryCtrl.createCategory)

router.put('/categories/:id',upload.single('image'), categoryCtrl.updateCategory)
router.get("/test-mail", async (req,res)=>{
  try{
    console.log(`${process.env.APP_NAME} <${process.env.MAIL_FROM}>`)
    await mailer.emails.send({
      from: `${process.env.APP_NAME} <${process.env.MAIL_FROM}>`,
      to: "sgate.sonu@gmail.com"||"sonuparjapat.connect@gmail.com",
      subject: "Test Email",
      html: "<h1>Resend working</h1>"
    });

    res.json({success:true});
  }catch(err){
    console.log(err);
    res.status(500).json(err);
  }
});
router.delete('/categories/:id', categoryCtrl.deleteCategory)
module.exports=router
