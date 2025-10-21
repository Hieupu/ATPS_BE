const express = require("express");
const router = express.Router();
const ClassController = require("../controllers/classController");

/**
 * ClassRouter - Routes cho Class management
 * Luồng: Frontend → ClassRouter → ClassController → ClassService → ClassModel → Database
 */

// Admin APIs - Class Management
router.post("/", ClassController.createClass);
router.get("/details", ClassController.getClassesDetails);
router.get("/:classId", ClassController.getClassById);
router.put("/:classId", ClassController.updateClass);
router.delete("/:classId", ClassController.deleteClass);

// Admin APIs - Class Statistics
router.get("/:classId/statistics", ClassController.getClassStatistics);

// Admin APIs - Auto Update Status
router.post("/auto-update-status", ClassController.autoUpdateClassStatus);

// Admin APIs - Session Management
router.get("/:classId/sessions", ClassController.getClassSessions);
router.post("/:classId/sessions", ClassController.createClassSession);

// Admin APIs - Enrollment Management
router.post("/:classId/enroll", ClassController.enrollLearnerInClass);
router.delete(
  "/:classId/unenroll/:learnerId",
  ClassController.unenrollLearnerFromClass
);

// Instructor APIs - Class Management
router.get("/:classId/schedule", ClassController.getClassSchedule);

// Learner APIs - Class Management
router.get("/available", ClassController.getAvailableClasses);
router.post("/:classId/join", ClassController.joinClass);
router.delete("/:classId/leave", ClassController.leaveClass);
router.get("/:classId/content", ClassController.getClassContent);

module.exports = router;
