const express = require("express");
const router = express.Router();
const multer = require("multer");
const { verifyToken, authorizeFeature } = require("../middlewares/auth");
const instructorController = require("../controllers/instructorController");

// Cấu hình multer để nhận file trong memory (không lưu local, upload trực tiếp lên Cloudinary)
// Multer cho ảnh (avatar)
const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Chỉ cho phép upload file ảnh"));
    }
    cb(null, true);
  },
});

// Multer cho file (CV - có thể là PDF, DOC, DOCX, etc.)
const uploadFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Chỉ cho phép upload file PDF, DOC, DOCX, hoặc ảnh (JPEG, PNG)"
        )
      );
    }
    cb(null, true);
  },
});

// Admin APIs - Tạm thời tắt authentication để test (giống như learnerRouter)
// Test route để kiểm tra router hoạt động
router.get("/test-upload", (req, res) => {
  res.json({ success: true, message: "Upload routes are working" });
});

// Upload ảnh đại diện cho giảng viên (lên Cloudinary) - PHẢI ĐẶT TRƯỚC route /:id
router.post(
  "/upload-avatar",
  (req, res, next) => {
    console.log("[instructorRouter] POST /upload-avatar middleware hit");
    next();
  },
  uploadImage.single("image"),
  (req, res, next) => {
    console.log("[instructorRouter] After multer, file:", !!req.file);
    next();
  },
  instructorController.uploadAvatar
);

// Upload CV cho giảng viên (lên Cloudinary) - PHẢI ĐẶT TRƯỚC route /:id
router.post(
  "/upload-cv",
  (req, res, next) => {
    console.log("[instructorRouter] POST /upload-cv middleware hit");
    next();
  },
  uploadFile.single("file"),
  (req, res, next) => {
    console.log("[instructorRouter] After multer, file:", !!req.file);
    next();
  },
  instructorController.uploadCV
);

router.get(
  "/",
  // verifyToken,
  // authorizeFeature("admin"),
  instructorController.getAllInstructors
);
router.post(
  "/",
  // verifyToken,
  // authorizeFeature("admin"),
  instructorController.createInstructor
);
router.get(
  "/:id",
  // verifyToken,
  // authorizeFeature("admin"),
  instructorController.getInstructorById
);
router.put(
  "/:id",
  // verifyToken,
  // authorizeFeature("admin"),
  instructorController.updateInstructor
);
router.delete(
  "/:id",
  // verifyToken,
  // authorizeFeature("admin"),
  instructorController.deleteInstructor
);
router.get(
  "/:id/courses",
  // verifyToken,
  // authorizeFeature("admin"),
  instructorController.getInstructorWithCourses
);
router.get(
  "/:id/schedule",
  // verifyToken,
  // authorizeFeature("admin"),
  instructorController.getInstructorSchedule
);
router.get(
  "/:id/statistics",
  // verifyToken,
  // authorizeFeature("admin"),
  instructorController.getInstructorStatistics
);

// Instructor APIs - Tạm thời tắt authentication để test
router.get(
  "/instructor/:id",
  // verifyToken,
  // authorizeFeature("instructor"),
  instructorController.getInstructorById
);
router.get(
  "/instructor/:id/courses",
  // verifyToken,
  // authorizeFeature("instructor"),
  instructorController.getInstructorWithCourses
);
router.get(
  "/instructor/:id/schedule",
  // verifyToken,
  // authorizeFeature("instructor"),
  instructorController.getInstructorSchedule
);
router.get(
  "/instructor/:id/statistics",
  // verifyToken,
  // authorizeFeature("instructor"),
  instructorController.getInstructorStatistics
);
router.put(
  "/instructor/:id",
  // verifyToken,
  // authorizeFeature("instructor"),
  instructorController.updateInstructor
);

// Common APIs - Public endpoints (không cần authentication)
router.get("/public", instructorController.getAllInstructors);
router.get("/public/:id", instructorController.getInstructorById);

// Availability APIs - Lịch bận để dạy
const instructorAvailabilityController = require("../controllers/instructorAvailabilityController");
router.get(
  "/:id/availability",
  // verifyToken,
  // authorizeFeature("instructor"),
  instructorAvailabilityController.getAvailability
);
router.post(
  "/:id/availability",
  // verifyToken,
  // authorizeFeature("instructor"),
  instructorAvailabilityController.saveAvailability
);

module.exports = router;
