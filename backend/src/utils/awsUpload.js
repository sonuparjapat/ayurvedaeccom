const {
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const { s3 } = require("../config/aws");


// ==========================
// Upload PDF
// ==========================
exports.uploadInvoiceToAWS = async (buffer, invoiceNo) => {

  try {

    const key = `invoices/${invoiceNo}.pdf`;

   const command = new PutObjectCommand({

  Bucket: process.env.AWS_BUCKET_NAME,

  Key: key,

  Body: buffer,

  ContentType: "application/pdf",

});

    await s3.send(command);

    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return url;

  } catch (err) {

    console.error("AWS Upload Error:", err);

    throw err;
  }
};


// ==========================
// Delete File
// ==========================
exports.deleteFromAWS = async (fileUrl) => {

  try {

    const key = fileUrl.split(".com/")[1];

    const command = new DeleteObjectCommand({

      Bucket: process.env.AWS_BUCKET_NAME,

      Key: key,

    });

    await s3.send(command);

  } catch (err) {

    console.log("AWS Delete Error:", err);
  }
};