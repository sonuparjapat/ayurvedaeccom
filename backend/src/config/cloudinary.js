const cloudinary = require('cloudinary').v2

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
})

const deleteFromCloud = async (url) => {
  try {

    const parts = url.split('/')
    const fileName = parts[parts.length - 1]
    const publicId = fileName.split('.')[0]

    await cloudinary.uploader.destroy(
      `ayurveda-products/${publicId}`
    )

  } catch (err) {
    console.log('Cloudinary delete error:', err)
  }
}

module.exports = {
  cloudinary,
  deleteFromCloud,
}