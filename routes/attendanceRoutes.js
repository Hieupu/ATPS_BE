const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");

// Get learner's attendance
router.get("/learner/:learnerId", attendanceController.getLearnerAttendance);

// Get attendance stats
router.get(
  "/learner/:learnerId/stats",
  attendanceController.getAttendanceStats
);

// Update attendance status
router.patch("/:attendanceId", attendanceController.updateAttendance);

module.exports = router;
