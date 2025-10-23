const express = require("express");
const router = express.Router();
const { verifyToken, authorizeFeature } = require("../middlewares/auth");
const classController = require("../controllers/classController");

// Admin APIs
router.get(
  "/details",
  // verifyToken,
  // authorizeFeature("admin"),
  classController.getClassesDetails
);

router.post(
  "/",
  // verifyToken,
  // authorizeFeature("admin"),
  classController.createClass
);

// Common APIs for dropdowns (phải đặt trước /:classId)
router.get("/instructors", classController.getAllInstructors);
router.get("/courses", classController.getAllCourses);

router.get(
  "/:classId",
  // verifyToken,
  // authorizeFeature("admin"),
  classController.getClassById
);

router.put(
  "/:classId",
  // verifyToken,
  // authorizeFeature("admin"),
  classController.updateClass
);

router.delete(
  "/:classId",
  // verifyToken,
  // authorizeFeature("admin"),
  classController.deleteClass
);

// Course-related APIs
router.get(
  "/course/:courseId",
  // verifyToken,
  // authorizeFeature("admin"),
  classController.getClassesByCourseId
);

// Instructor APIs
router.get(
  "/instructor/:instructorId",
  // verifyToken,
  // authorizeFeature("instructor"),
  classController.getClassesByInstructorId
);

// Learner APIs
router.get("/available", classController.getClassesDetails);

// Auto update APIs
router.post("/auto-update-status", classController.autoUpdateClassStatus);

// ClassService APIs theo API_TIME_MANAGEMENT_GUIDE.md
router.post("/:classId/sessions", classController.createClassSession);
router.get("/:classId/sessions", classController.getClassSessions);
router.put("/sessions/:sessionId", classController.updateClassSession);
router.delete("/sessions/:sessionId", classController.deleteClassSession);
router.get("/:classId/enrollments", classController.getClassEnrollments);

module.exports = router;
