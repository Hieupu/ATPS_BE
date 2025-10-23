const express = require("express");
const router = express.Router();
const { verifyToken, authorizeFeature } = require("../middlewares/auth");
const instructorController = require("../controllers/instructorController");

// Admin APIs
router.get(
  "/",
  verifyToken,
  authorizeFeature("admin"),
  instructorController.getAllInstructors
);
router.post(
  "/",
  verifyToken,
  authorizeFeature("admin"),
  instructorController.createInstructor
);
router.get(
  "/:id",
  verifyToken,
  authorizeFeature("admin"),
  instructorController.getInstructorById
);
router.put(
  "/:id",
  verifyToken,
  authorizeFeature("admin"),
  instructorController.updateInstructor
);
router.delete(
  "/:id",
  verifyToken,
  authorizeFeature("admin"),
  instructorController.deleteInstructor
);
router.get(
  "/:id/courses",
  verifyToken,
  authorizeFeature("admin"),
  instructorController.getInstructorWithCourses
);
router.get(
  "/:id/schedule",
  verifyToken,
  authorizeFeature("admin"),
  instructorController.getInstructorSchedule
);
router.get(
  "/:id/statistics",
  verifyToken,
  authorizeFeature("admin"),
  instructorController.getInstructorStatistics
);

// Instructor APIs
router.get(
  "/instructor/:id",
  verifyToken,
  authorizeFeature("instructor"),
  instructorController.getInstructorById
);
router.get(
  "/instructor/:id/courses",
  verifyToken,
  authorizeFeature("instructor"),
  instructorController.getInstructorWithCourses
);
router.get(
  "/instructor/:id/schedule",
  verifyToken,
  authorizeFeature("instructor"),
  instructorController.getInstructorSchedule
);
router.get(
  "/instructor/:id/statistics",
  verifyToken,
  authorizeFeature("instructor"),
  instructorController.getInstructorStatistics
);
router.put(
  "/instructor/:id",
  verifyToken,
  authorizeFeature("instructor"),
  instructorController.updateInstructor
);

// Common APIs
router.get("/public", instructorController.getAllInstructors);
router.get("/public/:id", instructorController.getInstructorById);

module.exports = router;
