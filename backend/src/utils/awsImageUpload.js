const {
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const { s3 } = require("../config/aws");

const path = require("path");


// ==========================
// Upload Image to S3
// ==========================
exports.uploadImageToAWS = async (file) => {

  try {

    if (!file || !file.buffer) {
      throw new Error("File buffer missing. Check Multer config.");
    }

    const ext = path.extname(file.originalname);

    const fileName =
      "products/" +
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      ext;

    // ⭐ THIS IS WHERE YOUR CODE GOES
    const command = new PutObjectCommand({

      Bucket: process.env.AWS_BUCKET_NAME,

      Key: fileName,

      Body: file.buffer,       // IMPORTANT

      ContentType: file.mimetype,

    });

    await s3.send(command);

    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

  } catch (err) {

    console.error("AWS Image Upload Error:", err);

    throw err;
  }
};


// ==========================
// Delete from S3
// ==========================
exports.deleteFromAWS = async (url) => {

  try {

    const key = url.split(".com/")[1];

    const command = new DeleteObjectCommand({

      Bucket: process.env.AWS_BUCKET_NAME,

      Key: key,

    });

    await s3.send(command);

  } catch (err) {

    console.log("AWS Delete Error:", err);
  }
};