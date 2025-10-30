const express = require("express");
const router = express.Router();
const progressController = require("../controllers/progressController");

// Get learner's progress (all courses or specific course)
router.get("/learner/:learnerId", progressController.getLearnerProgress);

// Get unit progress for specific course
router.get(
  "/learner/:learnerId/course/:courseId",
  progressController.getUnitProgress
);

module.exports = router;
