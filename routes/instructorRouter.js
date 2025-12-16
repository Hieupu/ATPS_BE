const express = require("express");
const router = express.Router();
const multer = require("multer");
const { verifyToken, authorizeFeature } = require("../middlewares/middware");
const instructorController = require("../controllers/admininstructorController");
const publicInstructorController = require("../controllers/instructorController");

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

// =====================================================
// ADMIN APIs - MUST come BEFORE public routes to avoid conflicts
// =====================================================

// Admin-specific endpoint for getting all instructors
// Format: { success: true, data: [...] }
router.get(
  "/admin/all",
  verifyToken,
  authorizeFeature("admin"),
  instructorController.getAllInstructorsAdmin
);

// =====================================================
// PUBLIC APIs - MUST come after admin routes
// =====================================================

// Public specific routes - MUST come before dynamic routes
router.get("/featured", publicInstructorController.getFeaturedInstructors);
// Explicit public aliases must stay above the catch-all "/:id"
router.get("/public", publicInstructorController.getAllInstructors);
router.get("/public/:id", publicInstructorController.getInstructorById);
router.get("/", publicInstructorController.getAllInstructors);
router.get("/:id", publicInstructorController.getInstructorById);

// =====================================================
// ADMIN APIs - MUST come after public routes
// =====================================================

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

// Admin CRUD routes
router.post(
  "/",
  verifyToken,
  authorizeFeature("admin"),
  instructorController.createInstructor
);

router.put(
  "/:id",
  verifyToken,
  authorizeFeature("admin"),
  instructorController.updateInstructor
);

router.delete(
  "/:id",
  verifyToken,
  authorizeFeature("admin"),
  instructorController.deleteInstructor
);

router.get(
  "/:id/courses",
  verifyToken,
  authorizeFeature("admin"),
  instructorController.getInstructorWithCourses
);

router.get(
  "/:id/schedule",
  verifyToken,
  authorizeFeature("admin"),
  instructorController.getInstructorSchedule
);

router.get(
  "/:id/statistics",
  verifyToken,
  authorizeFeature("admin"),
  instructorController.getInstructorStatistics
);

// Check timeslot availability
router.post(
  "/check-timeslot-availability",
  verifyToken,
  authorizeFeature("admin"),
  instructorController.checkTimeslotAvailability
);

// Admin API for getting instructor by ID (có Status và Gender)
router.get(
  "/admin/:id",
  verifyToken,
  authorizeFeature("admin"),
  instructorController.getInstructorByIdAdmin
);

// Instructor APIs
router.get(
  "/instructor/:id",
  verifyToken,
  authorizeFeature("instructor"),
  instructorController.getInstructorById
);

router.get(
  "/instructor/:id/courses",
  verifyToken,
  authorizeFeature("instructor"),
  instructorController.getInstructorWithCourses
);

router.get(
  "/instructor/:id/schedule",
  verifyToken,
  authorizeFeature("instructor"),
  instructorController.getInstructorSchedule
);

router.get(
  "/instructor/:id/statistics",
  verifyToken,
  authorizeFeature("instructor"),
  instructorController.getInstructorStatistics
);

// Common APIs - Public endpoints (không cần authentication)
// (đặt ở trên để tránh bị shadow bởi "/:id")
// Moved lên trên cùng public section

// Availability APIs - Lịch bận để dạy
const instructorAvailabilityController = require("../controllers/instructorAvailabilityController");
router.get(
  "/:id/availability",
  verifyToken,
  authorizeFeature("instructor"),
  instructorAvailabilityController.getAvailability
);

router.post(
  "/:id/availability",
  verifyToken,
  authorizeFeature("instructor"),
  instructorAvailabilityController.saveAvailability
);

module.exports = router;
