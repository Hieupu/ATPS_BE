const express = require("express");
const {
  getAllCourses,
  searchCourses,
  getCourseById,
  enrollInCourse,
  getPopularCourses,
  getAllCoursesAdmin,
  getMyCourses,
  getLearnerIdByAccount,
  getClassesByCourse,
  getCourseCurriculum,
  getMyClassesInCourse,
  getCourseAssignments,
  getPopularClasses,
  checkEnrollmentStatus,
  getScheduleClasses
} = require("../controllers/courseController");
const { verifyToken } = require("../middlewares/middware");

const router = express.Router();

// Specific routes must come before dynamic routes like /:id
router.get("/", getAllCourses);
router.get("/search", searchCourses);
router.get("/popular", getPopularCourses);
router.get("/admin/all", getAllCoursesAdmin);
router.get("/learner-id/:accountId", getLearnerIdByAccount);
router.get("/my-courses/enrolled", verifyToken, getMyCourses);
router.post("/enroll", verifyToken, enrollInCourse);

// Specific routes with /classes prefix - MUST come before /:id routes
router.get("/classes/popular", getPopularClasses);
router.get(
  "/classes/:classId/enrollment-status",
  verifyToken,
  checkEnrollmentStatus
);

// Dynamic routes with /:id - MUST be last
router.get("/:id/my-classes", verifyToken, getMyClassesInCourse);
router.get("/:id/assignments", verifyToken, getCourseAssignments);
router.get("/:id/classes", getClassesByCourse);
router.get("/:id/curriculum", getCourseCurriculum);
router.get("/:id", getCourseById);
router.get('/classes/:classId/enrollment-status', verifyToken, checkEnrollmentStatus);
router.get("/schedule/all-classes", getScheduleClasses);

module.exports = router;
