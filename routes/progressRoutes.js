const express = require("express");
const router = express.Router();
const progressController = require("../controllers/progressController");

// Get learner's overall progress (all courses or specific course)
router.get("/learner/:learnerId", progressController.getLearnerProgress);

// Get detailed progress for a specific course (by units)
router.get("/learner/:learnerId/course/:courseId", progressController.getCourseDetailProgress);

// Get overall statistics for a learner
router.get("/learner/:learnerId/statistics", progressController.getOverallStatistics);

module.exports = router;