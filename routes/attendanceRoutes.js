const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");

// Get learner's attendance
// Get learner's attendance
router.get("/learner/:learnerId", attendanceController.getLearnerAttendance);

// Get attendance stats
router.get("/learner/:learnerId/stats", attendanceController.getAttendanceStats);

// Get attendance by class
router.get("/learner/:learnerId/by-class", attendanceController.getAttendanceByClass);

// Get attendance calendar
router.get("/learner/:learnerId/calendar", attendanceController.getAttendanceCalendar);

module.exports = router;
