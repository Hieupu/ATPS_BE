const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const newsController = require("../controllers/newsController");
const { verifyToken, authorizeFeature } = require("../middlewares/middware");
router.use(verifyToken);
router.use(authorizeFeature("admin"));

const uploadDir = path.join(__dirname, "..", "public", "assets", "news");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "");
    const uniqueName = `${baseName || "news"}_${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Chỉ cho phép upload file ảnh"));
    }
    cb(null, true);
  },
});

// Upload image cho tin tức
router.post(
  "/upload",
  upload.single("image"),
  newsController.uploadImage
);

// Tạo tin tức mới
router.post("/", newsController.createNews);

// Lấy tất cả tin tức
router.get("/", newsController.getAllNews);

// Lấy tin tức theo trạng thái
router.get("/status", newsController.getNewsByStatus);

// Lấy tin tức theo ID
router.get("/:id", newsController.getNewsById);

// Cập nhật tin tức
router.put("/:id", newsController.updateNews);

// Xóa tin tức
router.delete("/:id", newsController.deleteNews);

// Duyệt tin tức
router.post("/:id/approve", newsController.approveNews);

// Từ chối tin tức
router.post("/:id/reject", newsController.rejectNews);

module.exports = router;


