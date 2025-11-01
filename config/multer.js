const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

function createUploader(allowedMimes, maxSizeMB = 5) {
  const fileFilter = (req, file, cb) => {
    if (allowedMimes.some((type) => file.mimetype.startsWith(type))) {
      cb(null, true);
    } else {
      cb(new Error("Loại file không được phép!"), false);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
  });
}

module.exports = { createUploader };
