const {
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const { s3 } = require("../config/aws");

const path = require("path");


// ==========================
// Upload Image to S3
// ==========================
exports.uploadImageToAWS = async (file, folder = "products") => {

  try {

    if (!file || !file.buffer) {
      throw new Error("File buffer missing");
    }

    const ext = path.extname(file.originalname);

    const safeFolder = folder || "products";

    const fileName =
      `${safeFolder}/` +
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      ext;

    const command = new PutObjectCommand({

      Bucket: process.env.AWS_BUCKET_NAME,

      Key: fileName,

      Body: file.buffer,

      ContentType: file.mimetype,

    });

    await s3.send(command);

    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

  } catch (err) {

    console.error("AWS Upload Error:", err);
    throw err;

  }
};


// ==========================
// Delete from S3
// ==========================
exports.deleteFromAWS = async (url) => {

  try {

    if (!url) return;

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