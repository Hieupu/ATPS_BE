const express = require("express");
const router = express.Router();
const { verifyToken, authorizeFeature } = require("../middlewares/middware");
const sessionController = require("../controllers/sessionController");
const classScheduleController = require("../controllers/classScheduleController");
const {
  validateSession,
  validateSessionUpdate,
  validateBulkSessions,
} = require("../utils/validators");

// Admin APIs
router.get(
  "/",
  verifyToken,
  authorizeFeature("admin"),
  sessionController.getAllSessions
);

router.post(
  "/",
  verifyToken,
  authorizeFeature("admin"),
  validateSession,
  sessionController.createSession
);

// Date range APIs - Phải đặt TRƯỚC /:sessionId để không bị match nhầm
router.get(
  "/date-range",
  verifyToken,
  authorizeFeature("admin"),
  sessionController.getSessionsByDateRange
);

// Bulk create API - Phải đặt TRƯỚC /:sessionId
router.post(
  "/bulk",
  verifyToken,
  authorizeFeature("admin"),
  validateBulkSessions,
  sessionController.createBulkSessions
);

// Class-related APIs
router.get(
  "/class/:classId",
  verifyToken,
  authorizeFeature("admin"),
  sessionController.getSessionsByClassId
);

// Instructor APIs
router.get(
  "/instructor/:instructorId",
  verifyToken,
  authorizeFeature(["instructor", "admin"]),
  sessionController.getSessionsByInstructorId
);

// Timeslot-related APIs
router.get(
  "/timeslot/:timeslotId",
  verifyToken,
  authorizeFeature("admin"),
  sessionController.getSessionsByTimeslotId
);

// Dynamic routes - Phải đặt SAU các routes cụ thể
router.get(
  "/:sessionId",
  verifyToken,
  authorizeFeature("admin"),
  sessionController.getSessionById
);

router.put(
  "/:sessionId",
  verifyToken,
  authorizeFeature("admin"),
  validateSessionUpdate,
  sessionController.updateSession
);

router.delete(
  "/:sessionId",
  verifyToken,
  authorizeFeature("admin"),
  sessionController.deleteSession
);

// Public APIs
router.get("/available", sessionController.getAllSessions);

// =====================================================
// BƯỚC 2: GIẢNG VIÊN CHUẨN BỊ NỘI DUNG
// =====================================================
// Route POST / đã được định nghĩa ở trên (dòng 19-25)
// Không cần duplicate route

// Thêm tài liệu vào session
router.post(
  "/:sessionId/materials",
  verifyToken,
  authorizeFeature("instructor"),
  sessionController.addMaterialToSession
);

// Thêm bài học vào session
router.post(
  "/:sessionId/lessons",
  verifyToken,
  authorizeFeature("instructor"),
  sessionController.addLessonToSession
);

// Giảng viên submit để chờ duyệt
router.put(
  "/:classId/submit-approval",
  verifyToken,
  authorizeFeature("instructor"),
  sessionController.submitForApproval
);

// =====================================================
// SESSION SCHEDULE MANAGEMENT ROUTES
// =====================================================

// Dời lịch (Reschedule)
router.put(
  "/:sessionId/reschedule",
  verifyToken,
  authorizeFeature("admin"),
  classScheduleController.rescheduleSession
);

// Hủy buổi học
router.delete(
  "/:sessionId/cancel",
  verifyToken,
  authorizeFeature("admin"),
  classScheduleController.cancelSession
);

module.exports = router;
