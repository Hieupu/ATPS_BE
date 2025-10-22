const express = require("express");
const {
  getAllCourses,
  getCourseById,
  enrollInCourse,
  getPopularCourses,
  getAllCoursesAdmin
} = require("../controllers/courseController");
const { verifyToken } = require("../middlewares/middware");

const router = express.Router();

router.get("/", getAllCourses);
router.get("/popular", getPopularCourses);
router.get("/:id", getCourseById);
router.post("/enroll", verifyToken, enrollInCourse);
router.get("/admin/all", getAllCoursesAdmin); // Admin route to see all courses

module.exports = router;