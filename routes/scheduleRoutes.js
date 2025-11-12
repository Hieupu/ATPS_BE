const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController");
const { verifyToken } = require("../middlewares/middware");

// Get learner's schedule
router.get("/learner/:learnerId", scheduleController.getLearnerSchedule);

// Get instructor's schedule
router.get(
  "/instructor/:instructorId",
  scheduleController.getInstructorSchedule
);

// Get session details
router.get("/session/:sessionId", scheduleController.getSessionDetails);

// Create new session
router.post("/", scheduleController.createSession);

// Get available slots for instructor
router.get(
  "/instructor/:instructorId/available-slots",
  scheduleController.getAvailableInstructorSlots
);

// Get instructor weekly schedule
router.get(
  "/instructor/:instructorId/weekly-schedule",
  scheduleController.getInstructorWeeklySchedule
);

// Get classes by instructor
router.get(
  "/instructor/:instructorId/classes",
  scheduleController.getClassesByInstructor
);

// Get class schedule
router.get("/class/:classId/schedule", scheduleController.getClassSchedule);

// Create 1-1 booking (requires auth)
router.post("/booking", verifyToken, scheduleController.createOneOnOneBooking);

// booking-requests route removed

// Learner: Get my enrollment requests (pending)
router.get(
  "/my-enrollment-requests",
  verifyToken,
  scheduleController.getMyEnrollmentRequests
);

// Get sessions of an enrollment (for viewing details)
router.get(
  "/enrollment/:enrollmentId/sessions",
  verifyToken,
  scheduleController.getEnrollmentSessions
);

// Instructor actions: confirm, cancel, or reschedule
router.put(
  "/session/:sessionId/action",
  verifyToken,
  scheduleController.handleSessionAction
);

// Learner response to reschedule request: accept or reject
router.put(
  "/session/:sessionId/reschedule-response",
  verifyToken,
  scheduleController.handleRescheduleResponse
);

// Get pending reschedule requests for learner (uses accountId from token)
router.get(
  "/pending-reschedule",
  verifyToken,
  scheduleController.getPendingRescheduleRequestsByAccount
);

// Learner: cancel my enrollment request if still pending
router.put(
  "/enrollment/:enrollmentId/cancel",
  verifyToken,
  scheduleController.cancelMyEnrollment
);

module.exports = router;
