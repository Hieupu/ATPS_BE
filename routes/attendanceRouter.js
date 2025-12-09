const express = require("express");
const router = express.Router();
const { verifyToken, authorizeFeature } = require("../middlewares/middware");
const attendanceController = require("../controllers/adminattendanceController");

// Admin APIs
router.post(
  "/",
  verifyToken,
  authorizeFeature("admin"),
  attendanceController.createAttendance
);
router.get(
  "/sessiontimeslot/:sessiontimeslotId",
  verifyToken,
  authorizeFeature("admin"),
  attendanceController.getAttendanceBySessionTimeslot
);
router.get(
  "/learner/:learnerId",
  verifyToken,
  authorizeFeature("admin"),
  attendanceController.getAttendanceByLearner
);
router.put(
  "/:attendanceId",
  verifyToken,
  authorizeFeature("admin"),
  attendanceController.updateAttendance
);
router.delete(
  "/:attendanceId",
  verifyToken,
  authorizeFeature("admin"),
  attendanceController.deleteAttendance
);
router.get(
  "/statistics",
  verifyToken,
  authorizeFeature("admin"),
  attendanceController.getAttendanceStatistics
);
router.post(
  "/bulk",
  verifyToken,
  authorizeFeature("admin"),
  attendanceController.bulkCreateAttendance
);

// Instructor APIs
router.get(
  "/instructor/statistics",
  verifyToken,
  authorizeFeature("instructor"),
  attendanceController.getAttendanceStatistics
);
router.post(
  "/instructor/bulk",
  verifyToken,
  authorizeFeature("instructor"),
  attendanceController.bulkCreateAttendance
);

// Learner APIs
router.get(
  "/learner/:learnerId/own",
  verifyToken,
  authorizeFeature("learner"),
  attendanceController.getAttendanceByLearner
);

module.exports = router;
