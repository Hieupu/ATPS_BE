const express = require("express");
const router = express.Router();
const TimeslotController = require("../controllers/timeslotController");

/**
 * TimeslotRouter - Routes cho Timeslot management
 * Luồng: Frontend → TimeslotRouter → TimeslotController → TimeslotService → TimeslotModel → Database
 */

// Admin APIs - Timeslot Management
router.post("/", TimeslotController.createTimeslot);
router.get("/", TimeslotController.getAllTimeslots);
router.get("/:timeslotId", TimeslotController.getTimeslotById);
router.put("/:timeslotId", TimeslotController.updateTimeslot);
router.delete("/:timeslotId", TimeslotController.deleteTimeslot);

// Class-specific Timeslots
router.get("/class/:classId", TimeslotController.getClassTimeslots);

// Course-specific Timeslots (Legacy)
router.get("/course/:courseId", TimeslotController.getCourseTimeslots);

// Learner Schedule
router.get("/learner/schedule", TimeslotController.getLearnerSchedule);

module.exports = router;



