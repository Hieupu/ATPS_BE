const express = require("express");
const router = express.Router();
const { verifyToken, authorizeFeature } = require("../middlewares/middware");
const courseController = require("../controllers/adminCourseController");
const publicCourseController = require("../controllers/courseController");

// =====================================================
// PUBLIC APIs - MUST come first
// =====================================================

// Specific public routes - MUST come before dynamic routes
router.get("/", publicCourseController.getAllCourses);
router.get("/search", publicCourseController.searchCourses);
router.get("/popular", publicCourseController.getPopularCourses);
router.get("/admin/all", publicCourseController.getAllCoursesAdmin);
router.get(
  "/learner-id/:accountId",
  publicCourseController.getLearnerIdByAccount
);
router.get(
  "/my-courses/enrolled",
  verifyToken,
  publicCourseController.getMyCourses
);
router.post("/enroll", verifyToken, publicCourseController.enrollInCourse);

// Specific routes with /classes prefix - MUST come before /:id routes
router.get("/classes/popular", publicCourseController.getPopularClasses);
router.get(
  "/classes/:classId/enrollment-status",
  verifyToken,
  publicCourseController.checkEnrollmentStatus
);

// Public dynamic routes with /:id - MUST come before admin routes
router.get(
  "/:id/my-classes",
  verifyToken,
  publicCourseController.getMyClassesInCourse
);
router.get(
  "/:id/assignments",
  verifyToken,
  publicCourseController.getCourseAssignments
);
router.get("/:id/classes", publicCourseController.getClassesByCourse);
router.get("/:id/curriculum", publicCourseController.getCourseCurriculum);
router.get("/:id", publicCourseController.getCourseById);

// =====================================================
// ADMIN APIs - MUST come after public routes
// =====================================================

// Admin specific routes
router.get(
  "/admin",
  verifyToken,
  authorizeFeature("admin"),
  courseController.getAllCourses
);

router.post(
  "/",
  verifyToken,
  authorizeFeature("admin"),
  courseController.createCourse
);

router.get(
  "/admin/:courseId",
  verifyToken,
  authorizeFeature("admin"),
  courseController.getCourseById
);

router.get(
  "/available",
  verifyToken,
  authorizeFeature("admin"),
  courseController.getAllCourses
);

// Status APIs
router.get(
  "/status/:status",
  verifyToken,
  authorizeFeature("admin"),
  courseController.getCoursesByStatus
);

// Admin dynamic routes with /:courseId or /:id - MUST be last
router.put(
  "/:courseId",
  verifyToken,
  authorizeFeature("admin"),
  courseController.updateCourse
);

router.delete(
  "/:courseId",
  verifyToken,
  authorizeFeature("admin"),
  courseController.deleteCourse
);

router.get(
  "/:courseId/enrollments",
  verifyToken,
  authorizeFeature("admin"),
  courseController.getCourseEnrollments
);

router.get(
  "/:courseId/classes",
  verifyToken,
  authorizeFeature("admin"),
  courseController.getCourseClasses
);

router.get(
  "/:id/check-in-use",
  verifyToken,
  authorizeFeature("admin"),
  courseController.checkCourseInUse
);

router.put(
  "/:id/status",
  verifyToken,
  authorizeFeature("admin"),
  courseController.updateCourseStatus
);

router.post(
  "/:id/approve",
  verifyToken,
  authorizeFeature("admin"),
  courseController.approveCourse
);

module.exports = router;
