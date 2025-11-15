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
  listUnitsByCourse,
  listLessonsByUnit,
  listMaterialsByCourse,
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
const uploadFile = require("../middlewares/uploadFile");

const router = express.Router();
// COURSE
router.get(
  "/courses",
  verifyToken,
  authorizeRole("instructor"),
  listInstructorCourses
);
router.post(
  "/courses",
  verifyToken,
  authorizeRole("instructor"),
  uploadFile,
  createCourse
);
router.put(
  "/courses/:courseId",
  verifyToken,
  authorizeRole("instructor"),
  uploadFile,
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
router.get(
  "/courses/:courseId/units",
  verifyToken,
  authorizeRole("instructor", "admin"),
  listUnitsByCourse
);
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

// LESSON
router.get(
  "/units/:unitId/lessons",
  verifyToken,
  authorizeRole("instructor", "admin"),
  listLessonsByUnit
);
router.post(
  "/units/:unitId/lessons",
  verifyToken,
  authorizeRole("instructor"),
  uploadFile,
  addLesson
);
router.put(
  "/units/:unitId/lessons/:lessonId",
  verifyToken,
  authorizeRole("instructor"),
  uploadFile,
  updateLesson
);
router.delete(
  "/units/:unitId/lessons/:lessonId",
  verifyToken,
  authorizeRole("instructor"),
  deleteLesson
);

// MATERIAL
router.get(
  "/courses/:courseId/materials",
  verifyToken,
  authorizeRole("instructor", "admin"),
  listMaterialsByCourse
);
router.post(
  "/courses/:courseId/materials",
  verifyToken,
  authorizeRole("instructor"),
  uploadFile,
  addMaterial
);
router.put(
  "/materials/:materialId",
  verifyToken,
  authorizeRole("instructor"),
  uploadFile,
  updateMaterial
);
router.delete(
  "/materials/:materialId",
  verifyToken,
  authorizeRole("instructor"),
  deleteMaterial
);

module.exports = router;
