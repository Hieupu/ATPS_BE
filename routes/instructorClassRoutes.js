const express = require("express");
const {
  listInstructorClasses,
  getInstructorClassDetail,
  getInstructorClassRoster,
  getInstructorClassSchedule,
  getAttendanceSheet,
  saveAttendance,
  getInstructorSchedule,
  getInstructorAvailability,
  saveInstructorAvailability,
} = require("../controllers/instructorClassController");

const { verifyToken, authorizeRole } = require("../middlewares/middware");

const router = express.Router();
// 1. Danh sách lớp của instructor
router.get(
  "/classes",
  verifyToken,
  authorizeRole("instructor"),
  listInstructorClasses
);

// 2. Chi tiết 1 lớp (header + StudentCount)
router.get(
  "/classes/:classId",
  verifyToken,
  authorizeRole("instructor"),
  getInstructorClassDetail
);

// 3. Tab Danh sách học viên
router.get(
  "/classes/:classId/students",
  verifyToken,
  authorizeRole("instructor"),
  getInstructorClassRoster
);

// 4. Lịch các buổi học (thời khóa biểu + vào Zoom)
router.get(
  "/classes/:classId/schedule",
  verifyToken,
  authorizeRole("instructor"),
  getInstructorClassSchedule
);

// 5. Mở form điểm danh buổi học
router.get(
  "/classes/:classId/sessions/:sessionId/attendance",
  verifyToken,
  authorizeRole("instructor"),
  getAttendanceSheet
);

// 6. Lưu điểm danh buổi học
router.post(
  "/classes/:classId/sessions/:sessionId/attendance",
  verifyToken,
  authorizeRole("instructor"),
  saveAttendance
);

router.get(
  "/schedule",
  verifyToken,
  authorizeRole("instructor"),
  getInstructorSchedule
);

// 8. Lấy danh sách lịch rảnh đã đăng ký
router.get(
  "/availability",
  verifyToken,
  authorizeRole("instructor"),
  getInstructorAvailability
);

// 9. Đăng ký/Cập nhật lịch rảnh
router.post(
  "/availability",
  verifyToken,
  authorizeRole("instructor"),
  saveInstructorAvailability
);

module.exports = router;
