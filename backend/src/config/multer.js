const multer = require("multer");

// Store files in memory (RAM) for AWS upload
const storage = multer.memoryStorage();

const upload = multer({

  storage,

  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },

  fileFilter: (req, file, cb) => {

    // Allow only images
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/webp"
    ) {
      cb(null, true);

    } else {
      cb(new Error("Only JPG, PNG, WEBP allowed"), false);
    }
  },
});

module.exports = upload;