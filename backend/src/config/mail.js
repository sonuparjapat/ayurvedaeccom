const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,

  auth: {
    user: 'apikey', // always "apikey"
    pass: process.env.SENDGRID_KEY,
  },
})

module.exports = transporter