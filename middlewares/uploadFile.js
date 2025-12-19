const { createUploader } = require("../config/multer");

const allowedMimes = [
  "image/",
  "video/",
  "audio/",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const uploader = createUploader(allowedMimes, 20);

// chấp nhận các tên field khác nhau
module.exports = (req, res, next) => {
  const handler = uploader.fields([
    { name: "file", maxCount: 1 },
    { name: "image", maxCount: 1 },
    { name: "document", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 }, // nếu bạn có gửi kèm
  ]);

  handler(req, res, (err) => {
    if (err) return next(err);
    // chuẩn hóa về req.file cho service hiện tại
    req.file =
      (req.files?.file && req.files.file[0]) ||
      (req.files?.image && req.files.image[0]) ||
      (req.files?.document && req.files.document[0]) ||
      (req.files?.thumbnail && req.files.thumbnail[0]) ||
      undefined;
    next();
  });
};
