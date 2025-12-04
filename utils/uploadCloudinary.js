const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

function uploadToCloudinary(buffer, folder = "lessons") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (result) resolve(result.secure_url);
        else reject(new Error("Lỗi upload Cloudinary: " + error.message));
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

module.exports = uploadToCloudinary;