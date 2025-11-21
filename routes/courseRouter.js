const express = require("express");
const router = express.Router();
const { verifyToken, authorizeFeature } = require("../middlewares/auth");
const courseController = require("../controllers/courseController");

// Admin APIs
router.get(
  "/admin",
  // verifyToken,
  // authorizeFeature("admin"),
  courseController.getAllCourses
);

router.post(
  "/",
  // verifyToken,
  // authorizeFeature("admin"),
  courseController.createCourse
);

router.get(
  "/admin/:courseId",
  // verifyToken,
  // authorizeFeature("admin"),
  courseController.getCourseById
);

router.put(
  "/:courseId",
  // verifyToken,
  // authorizeFeature("admin"),
  courseController.updateCourse
);

router.delete(
  "/:courseId",
  // verifyToken,
  // authorizeFeature("admin"),
  courseController.deleteCourse
);

// Status APIs
router.get(
  "/status/:status",
  // verifyToken,
  // authorizeFeature("admin"),
  courseController.getCoursesByStatus
);

// Enrollment APIs
router.get(
  "/:courseId/enrollments",
  // verifyToken,
  // authorizeFeature("admin"),
  courseController.getCourseEnrollments
);

// Class APIs
router.get(
  "/:courseId/classes",
  // verifyToken,
  // authorizeFeature("admin"),
  courseController.getCourseClasses
);

// Admin approve/reject course
router.post(
  "/:id/approve",
  // verifyToken,
  // authorizeFeature("admin"),
  courseController.approveCourse
);

// Public APIs
router.get("/available", courseController.getAllCourses);

router.get("/:courseId", courseController.getCourseById);

module.exports = router;
