const express = require("express");
const router = express.Router();
const { verifyToken, authorizeFeature } = require("../middlewares/auth");
const learnerController = require("../controllers/learnerController");

// Admin APIs
router.get(
  "/",
  // verifyToken,
  // authorizeFeature("admin"),
  learnerController.getAllLearners
);
router.post(
  "/",
  verifyToken,
  authorizeFeature("admin"),
  learnerController.createLearner
);
router.get(
  "/:id",
  // verifyToken,
  // authorizeFeature("admin"),
  learnerController.getLearnerById
);
router.put(
  "/:id",
  verifyToken,
  authorizeFeature("admin"),
  learnerController.updateLearner
);
router.delete(
  "/:id",
  verifyToken,
  authorizeFeature("admin"),
  learnerController.deleteLearner
);
router.get(
  "/:id/classes",
  verifyToken,
  authorizeFeature("admin"),
  learnerController.getLearnerWithClasses
);
router.get(
  "/:id/schedule",
  verifyToken,
  authorizeFeature("admin"),
  learnerController.getLearnerSchedule
);
router.get(
  "/:id/statistics",
  verifyToken,
  authorizeFeature("admin"),
  learnerController.getLearnerStatistics
);
router.get(
  "/:id/attendance",
  verifyToken,
  authorizeFeature("admin"),
  learnerController.getLearnerAttendance
);

// Learner APIs
router.get(
  "/learner/:id",
  verifyToken,
  authorizeFeature("learner"),
  learnerController.getLearnerById
);
router.put(
  "/learner/:id",
  verifyToken,
  authorizeFeature("learner"),
  learnerController.updateLearner
);
router.get(
  "/learner/:id/classes",
  verifyToken,
  authorizeFeature("learner"),
  learnerController.getLearnerWithClasses
);
router.get(
  "/learner/:id/schedule",
  verifyToken,
  authorizeFeature("learner"),
  learnerController.getLearnerSchedule
);
router.get(
  "/learner/:id/statistics",
  verifyToken,
  authorizeFeature("learner"),
  learnerController.getLearnerStatistics
);
router.get(
  "/learner/:id/attendance",
  verifyToken,
  authorizeFeature("learner"),
  learnerController.getLearnerAttendance
);

// Common APIs
router.get("/public", learnerController.getAllLearners);
router.get("/public/:id", learnerController.getLearnerById);

module.exports = router;
