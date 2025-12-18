const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const newsController = require("../controllers/newsController");
const {
  verifyToken,
  authorizeFeature,
  authorizeRole,
} = require("../middlewares/middware");
router.use(verifyToken);

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

// Upload image cho tin tức (admin + staff)
router.post(
  "/upload",
  authorizeRole("admin", "staff"),
  upload.single("image"),
  newsController.uploadImage
);

router.post("/", authorizeRole("admin", "staff"), newsController.createNews);

router.get("/", authorizeRole("admin", "staff"), newsController.getAllNews);

router.get(
  "/status",
  authorizeRole("admin", "staff"),
  newsController.getNewsByStatus
);

// Lấy tin tức theo ID (admin + staff)
router.get("/:id", authorizeRole("admin", "staff"), newsController.getNewsById);

// Cập nhật tin tức (admin + staff)
router.put("/:id", authorizeRole("admin", "staff"), newsController.updateNews);

router.delete("/:id", authorizeFeature("staff"), newsController.deleteNews);

// Duyệt tin tức (chỉ admin)
router.post(
  "/:id/approve",
  authorizeFeature("admin"),
  newsController.approveNews
);

// Từ chối tin tức (chỉ admin)
router.post(
  "/:id/reject",
  authorizeFeature("admin"),
  newsController.rejectNews
);

module.exports = router;
