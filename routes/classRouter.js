const express = require("express");
const router = express.Router();
const { verifyToken, authorizeFeature } = require("../middlewares/auth");
const classController = require("../controllers/classController");
const classScheduleController = require("../controllers/classScheduleController");

// Admin APIs
router.get(
  "/",
  // verifyToken,
  // authorizeFeature("admin"),
  classController.getClassesDetails
);

router.get(
  "/details",
  // verifyToken,
  // authorizeFeature("admin"),
  classController.getClassesDetails
);

router.post(
  "/",
  // verifyToken,
  // authorizeFeature("admin"),
  classController.createClass
);

// Common APIs for dropdowns (phải đặt trước /:classId)
router.get("/instructors", classController.getAllInstructors);
router.get("/courses", classController.getAllCourses);

// Tìm các ca rảnh của GV (phải đặt trước /instructor/:instructorId)
router.get(
  "/instructor/available-slots",
  // verifyToken,
  classScheduleController.findAvailableInstructorSlots
);

router.get(
  "/:classId",
  // verifyToken,
  // authorizeFeature("admin"),
  classController.getClassById
);

router.put(
  "/:classId",
  // verifyToken,
  // authorizeFeature("admin"),
  classController.updateClass
);

router.delete(
  "/:classId",
  // verifyToken,
  // authorizeFeature("admin"),
  classController.deleteClass
);

// Course-related APIs
router.get(
  "/course/:courseId",
  // verifyToken,
  // authorizeFeature("admin"),
  classController.getClassesByCourseId
);

// Instructor APIs
router.get(
  "/instructor/:instructorId",
  // verifyToken,
  // authorizeFeature("instructor"),
  classController.getClassesByInstructorId
);

// Learner APIs
router.get("/available", classController.getClassesDetails);

// Auto update APIs
router.post("/auto-update-status", classController.autoUpdateClassStatus);

// ClassService APIs theo API_TIME_MANAGEMENT_GUIDE.md
router.post("/:classId/sessions", classController.createClassSession);
router.get("/:classId/sessions", classController.getClassSessions);
router.put("/sessions/:sessionId", classController.updateClassSession);
router.delete("/sessions/:sessionId", classController.deleteClassSession);
router.get("/:classId/enrollments", classController.getClassEnrollments);

// =====================================================
// WORKFLOW 4 BƯỚC - CLASS MANAGEMENT ROUTES
// =====================================================

// Bước 1: Admin tạo lớp
router.post(
  "/",
  // verifyToken,
  // authorizeFeature("admin"),
  classController.createClass
);

// Bước 2: Gửi lớp cho giảng viên
router.post(
  "/:classId/send-to-instructor",
  // verifyToken,
  // authorizeFeature("admin"),
  classController.sendToInstructor
);

// Thêm route PUT /:classId/status cho submitForApproval (frontend compatibility)
router.put(
  "/:classId/status",
  // verifyToken,
  // authorizeFeature("admin"),
  classController.updateClassStatus
);

// Bước 3: Admin kiểm duyệt
router.post(
  "/:classId/review",
  // verifyToken,
  // authorizeFeature("admin"),
  classController.reviewClass
);

// Thêm route PUT /:classId/review cho frontend compatibility
router.put(
  "/:classId/review",
  // verifyToken,
  // authorizeFeature("admin"),
  classController.reviewClass
);

// Bước 4: Admin xuất bản
router.post(
  "/:classId/publish",
  // verifyToken,
  // authorizeFeature("admin"),
  classController.publishClass
);

// Thêm route PUT /:classId/publish cho frontend compatibility
router.put(
  "/:classId/publish",
  // verifyToken,
  // authorizeFeature("admin"),
  classController.publishClass
);

// Lấy danh sách lớp theo status
router.get(
  "/status/:status",
  // verifyToken,
  classController.getClassesByStatus
);

// =====================================================
// CLASS SCHEDULE MANAGEMENT ROUTES
// =====================================================

// Tạo lịch hàng loạt
router.post(
  "/:classId/schedule/bulk",
  // verifyToken,
  // authorizeFeature("admin"),
  classScheduleController.createBulkSchedule
);

// Đếm học viên
router.get(
  "/:classId/learners/count",
  // verifyToken,
  classScheduleController.countLearners
);

// Kiểm tra đầy lớp
router.get(
  "/:classId/full",
  // verifyToken,
  classScheduleController.checkFullClass
);

// Thêm buổi học bù
router.post(
  "/:classId/sessions/makeup",
  // verifyToken,
  // authorizeFeature("admin"),
  classScheduleController.addMakeupSession
);

// Tự động đóng đăng ký
router.post(
  "/:classId/enrollment/auto-close",
  // verifyToken,
  // authorizeFeature("admin"),
  classScheduleController.autoCloseEnrollment
);

// Tự động đóng lớp (chạy hàng đêm)
router.post(
  "/auto-close",
  // verifyToken,
  // authorizeFeature("admin"),
  classScheduleController.autoCloseClasses
);

// =====================================================
// CLASS CREATION WIZARD ROUTES
// =====================================================

// Tạo lớp với Wizard (3 lần kiểm tra)
router.post(
  "/wizard",
  // verifyToken,
  // authorizeFeature("admin"),
  classScheduleController.createClassWizard
);

// Dời buổi học đầu
router.post(
  "/:classId/delay-start",
  // verifyToken,
  // authorizeFeature("admin"),
  classScheduleController.delayClassStart
);

// Kiểm tra xung đột với học viên (Bước 2)
router.post(
  "/check-learner-conflicts",
  // verifyToken,
  // authorizeFeature("admin"),
  classScheduleController.checkLearnerConflicts
);

// =====================================================
// INSTRUCTOR LEAVE MANAGEMENT ROUTES
// =====================================================

// Thêm lịch nghỉ hàng loạt
router.post(
  "/instructor/leave/bulk",
  // verifyToken,
  // authorizeFeature("admin"),
  classScheduleController.addBulkInstructorLeave
);

// Kiểm tra cảnh báo xung đột tương lai
router.post(
  "/instructor/leave/check-conflicts",
  // verifyToken,
  // authorizeFeature("admin"),
  classScheduleController.checkFutureConflicts
);

// Xử lý lớp bị ảnh hưởng
router.post(
  "/:classId/handle-affected",
  // verifyToken,
  // authorizeFeature("admin"),
  classScheduleController.handleAffectedClass
);

module.exports = router;
