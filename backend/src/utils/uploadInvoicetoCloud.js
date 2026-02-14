const { cloudinary } = require("../config/cloudinary");

exports.uploadInvoiceToCloud = async (buffer, invoiceNo) => {

  return new Promise((resolve, reject) => {

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "invoices",
        public_id: invoiceNo,
        resource_type: "raw",          // Stable for binary
        format: "pdf",
        overwrite: true,
        type: "upload",
        use_filename: true,
        unique_filename: false
      },
      (error, result) => {

        if (error) {
          console.error("Cloudinary Upload Error:", error);
          return reject(error);
        }

        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });
};