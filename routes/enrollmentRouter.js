const express = require("express");
const router = express.Router();
const { verifyToken, authorizeFeature } = require("../middlewares/auth");
const enrollmentController = require("../controllers/enrollmentController");

// Admin APIs
router.post(
  "/admin/enroll",
  verifyToken,
  authorizeFeature("admin"),
  enrollmentController.enrollClass
);
router.delete(
  "/admin/:enrollmentId",
  verifyToken,
  authorizeFeature("admin"),
  enrollmentController.cancelEnrollment
);
router.get(
  "/admin/class/:classId",
  verifyToken,
  authorizeFeature("admin"),
  enrollmentController.getClassEnrollments
);
router.get(
  "/admin/learner/:learnerId",
  verifyToken,
  authorizeFeature("admin"),
  enrollmentController.getLearnerEnrollments
);
router.put(
  "/admin/:enrollmentId/status",
  verifyToken,
  authorizeFeature("admin"),
  enrollmentController.updateEnrollmentStatus
);
router.get(
  "/admin/statistics",
  verifyToken,
  authorizeFeature("admin"),
  enrollmentController.getEnrollmentStatistics
);

// Instructor APIs
router.get(
  "/instructor/class/:classId",
  verifyToken,
  authorizeFeature("instructor"),
  enrollmentController.getClassEnrollments
);
router.get(
  "/instructor/statistics",
  verifyToken,
  authorizeFeature("instructor"),
  enrollmentController.getEnrollmentStatistics
);

// Learner APIs
router.post(
  "/:classId/enroll",
  verifyToken,
  authorizeFeature("learner"),
  enrollmentController.selfEnroll
);
router.delete(
  "/:classId/cancel",
  verifyToken,
  authorizeFeature("learner"),
  enrollmentController.selfCancelEnrollment
);
router.get(
  "/learner/:learnerId",
  verifyToken,
  authorizeFeature("learner"),
  enrollmentController.getLearnerEnrollments
);

module.exports = router;
