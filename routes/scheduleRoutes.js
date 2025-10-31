const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController");

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

// Get classes by instructor
router.get(
  "/instructor/:instructorId/classes",
  scheduleController.getClassesByInstructor
);

// Get class schedule
router.get("/class/:classId/schedule", scheduleController.getClassSchedule);

// Create 1-1 booking
router.post("/booking", scheduleController.createOneOnOneBooking);

module.exports = router;
