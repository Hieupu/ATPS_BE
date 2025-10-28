const express = require("express");
const {
  createCourse,
  listInstructorCourses,
  updateCourse,
  deleteCourse,
  submitCourse,
  approveCourse,
  publishCourse,
  getCourseDetail,
  addUnit,
  updateUnit,
  deleteUnit,
  addLesson,
  updateLesson,
  deleteLesson,
  addMaterial,
  updateMaterial,
  deleteMaterial,
} = require("../controllers/instructorCourseController");
const { verifyToken, authorizeRole } = require("../middlewares/middware");

const router = express.Router();
// COURSE
router.get(
  "/courses",
  verifyToken,
  authorizeRole("instructor"),
  listInstructorCourses
);
router.post("/courses", verifyToken, authorizeRole("instructor"), createCourse);
router.put(
  "/courses/:courseId",
  verifyToken,
  authorizeRole("instructor"),
  updateCourse
);
router.delete(
  "/courses/:courseId",
  verifyToken,
  authorizeRole("instructor"),
  deleteCourse
);
router.post(
  "/courses/:courseId/submit",
  verifyToken,
  authorizeRole("instructor"),
  submitCourse
);
router.post(
  "/courses/:courseId/approve",
  verifyToken,
  authorizeRole("admin"),
  approveCourse
);
router.post(
  "/courses/:courseId/publish",
  verifyToken,
  authorizeRole("admin"),
  publishCourse
);
router.get(
  "/courses/:courseId",
  verifyToken,
  authorizeRole("instructor", "admin"),
  getCourseDetail
);

// UNIT
router.post(
  "/courses/:courseId/units",
  verifyToken,
  authorizeRole("instructor"),
  addUnit
);
router.put(
  "/units/:unitId",
  verifyToken,
  authorizeRole("instructor"),
  updateUnit
);
router.delete(
  "/units/:unitId",
  verifyToken,
  authorizeRole("instructor"),
  deleteUnit
);

// LESSON (không còn sessionId)
router.post(
  "/units/:unitId/lessons",
  verifyToken,
  authorizeRole("instructor"),
  addLesson
);
router.put(
  "/units/:unitId/lessons/:lessonId",
  verifyToken,
  authorizeRole("instructor"),
  updateLesson
);
router.delete(
  "/units/:unitId/lessons/:lessonId",
  verifyToken,
  authorizeRole("instructor"),
  deleteLesson
);

// MATERIAL
router.post(
  "/courses/:courseId/materials",
  verifyToken,
  authorizeRole("instructor"),
  addMaterial
);
router.put(
  "/materials/:materialId",
  verifyToken,
  authorizeRole("instructor"),
  updateMaterial
);
router.delete(
  "/materials/:materialId",
  verifyToken,
  authorizeRole("instructor"),
  deleteMaterial
);

module.exports = router;
