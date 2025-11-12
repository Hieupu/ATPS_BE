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
router.get("/:id/my-classes", verifyToken, getMyClassesInCourse);
router.get("/:id/assignments", verifyToken, getCourseAssignments);

// Dynamic routes - must be last
router.get("/:id/classes", getClassesByCourse); // More specific first
router.get("/:id/curriculum", getCourseCurriculum);
router.get("/:id", getCourseById);

module.exports = router;
