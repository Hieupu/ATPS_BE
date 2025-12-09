const express = require("express");
const router = express.Router();
const { verifyToken, authorizeFeature } = require("../middlewares/middware");
const timeslotController = require("../controllers/timeslotController");

// Admin APIs
router.get(
  "/",
  verifyToken,
  authorizeFeature("admin"),
  timeslotController.getAllTimeslots
);

router.post(
  "/",
  verifyToken,
  authorizeFeature("admin"),
  timeslotController.createTimeslot
);

// ✅ Distinct time ranges API - Phải đặt TRƯỚC route /:timeslotId để tránh bị match nhầm
router.get(
  "/distinct-time-ranges",
  verifyToken,
  timeslotController.getDistinctTimeRanges
);

router.get(
  "/:timeslotId",
  verifyToken,
  authorizeFeature("admin"),
  timeslotController.getTimeslotById
);

router.put(
  "/:timeslotId",
  verifyToken,
  authorizeFeature("admin"),
  timeslotController.updateTimeslot
);

router.delete(
  "/:timeslotId",
  verifyToken,
  authorizeFeature("admin"),
  timeslotController.deleteTimeslot
);

// Date range APIs
router.get(
  "/date-range",
  verifyToken,
  authorizeFeature("admin"),
  timeslotController.getTimeslotsByDateRange
);

// Location APIs
router.get(
  "/location",
  verifyToken,
  authorizeFeature("admin"),
  timeslotController.getTimeslotsByLocation
);

// Statistics APIs
router.get(
  "/admin/statistics/total",
  verifyToken,
  authorizeFeature("admin"),
  timeslotController.getTotalTimeslots
);

// Class-specific Timeslots
router.get("/class/:classId", timeslotController.getClassTimeslots);

// Course-specific Timeslots (Legacy)
router.get("/course/:courseId", timeslotController.getCourseTimeslots);

// Learner Schedule
router.get("/learner/schedule", timeslotController.getLearnerSchedule);

// Session Time Range APIs
router.get(
  "/class/:classId/session-range",
  timeslotController.getClassSessionTimeRange
);
router.get(
  "/course/:courseId/session-range",
  timeslotController.getCourseSessionTimeRange
);
router.get("/session-range", timeslotController.getTimeslotsWithSessionRange);
router.get("/statistics", timeslotController.getSessionStatistics);

// Class List APIs
router.get(
  "/classes/with-time-info",
  timeslotController.getClassesWithTimeInfo
);
router.get("/classes/time-stats", timeslotController.getClassListWithTimeStats);
router.get(
  "/class/:classId/existing-timeslots",
  timeslotController.getExistingTimeslotsForClass
);
router.get(
  "/existing-timeslots/all",
  timeslotController.getAllExistingTimeslotsWithClassInfo
);

// Enrollment APIs
router.get(
  "/class/:classId/enrolled-learners",
  timeslotController.getEnrolledLearners
);
router.get(
  "/enrolled-learners/all",
  timeslotController.getAllEnrolledLearnersWithClassInfo
);
router.get(
  "/classes/enrollment-stats",
  timeslotController.getClassEnrollmentStats
);

// Frontend-specific APIs
router.get(
  "/class/:classId/sessions",
  timeslotController.getClassSessionsForFrontend
);

// Public APIs
router.get("/available", timeslotController.getAllTimeslots);

module.exports = router;
