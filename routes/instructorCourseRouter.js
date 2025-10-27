const express = require("express");
const {
  createCourse,
  addUnit,
  createSession,
  addLesson,
  addMaterial,
  submitCourse,
  approveCourse,
  publishCourse,
  addTimeslot,
  getCourseDetail,
  updateCourse,
  deleteCourse,
  updateUnit,
  deleteUnit,
  updateSession,
  deleteSession,
  updateLesson,
  deleteLesson,
  updateMaterial,
  deleteMaterial,
  updateTimeslot,
  deleteTimeslot,
  listInstructorCourses,
} = require("../controllers/instructorCourseController");
const { verifyToken, authorizeRole } = require("../middlewares/middware");

const router = express.Router();

/* ============================
    COURSE instructor
  ============================ */
router.get(
  "/",
  verifyToken,
  authorizeRole("instructor"),
  listInstructorCourses
);

router.post("/", verifyToken, authorizeRole("instructor"), createCourse);

router.get(
  "/:courseId/detail",
  verifyToken,
  authorizeRole("instructor", "admin"),
  getCourseDetail
);

router.put(
  "/:courseId",
  verifyToken,
  authorizeRole("instructor"),
  updateCourse
);

router.delete(
  "/:courseId",
  verifyToken,
  authorizeRole("instructor", "admin"),
  deleteCourse
);

router.put(
  "/:courseId/submit",
  verifyToken,
  authorizeRole("instructor"),
  submitCourse
);

router.put(
  "/:courseId/approve",
  verifyToken,
  authorizeRole("admin"),
  approveCourse
);

router.put(
  "/:courseId/publish",
  verifyToken,
  authorizeRole("admin"),
  publishCourse
);

/* ============================
    UNIT MANAGEMENT
  ============================ */
router.post(
  "/:courseId/units",
  verifyToken,
  authorizeRole("instructor"),
  addUnit
);

router.put(
  "/:courseId/units/:unitId",
  verifyToken,
  authorizeRole("instructor"),
  updateUnit
);

router.delete(
  "/:courseId/units/:unitId",
  verifyToken,
  authorizeRole("instructor"),
  deleteUnit
);

/* ============================
    SESSION MANAGEMENT
  ============================ */
router.post(
  "/:courseId/sessions",
  verifyToken,
  authorizeRole("instructor"),
  createSession
);

router.put(
  "/:courseId/sessions/:sessionId",
  verifyToken,
  authorizeRole("instructor"),
  updateSession
);

router.delete(
  "/:courseId/sessions/:sessionId",
  verifyToken,
  authorizeRole("instructor"),
  deleteSession
);

/* ============================
    LESSION MANAGEMENT
  ============================ */
router.post(
  "/:courseId/units/:unitId/lessons",
  verifyToken,
  authorizeRole("instructor"),
  addLesson
);
router.put(
  "/:courseId/units/:unitId/lessons/:lessonId",
  verifyToken,
  authorizeRole("instructor"),
  updateLesson
);
router.delete(
  "/:courseId/units/:unitId/lessons/:lessonId",
  verifyToken,
  authorizeRole("instructor"),
  deleteLesson
);

/* ============================
    MATERIAL MANAGEMENT
  ============================ */
router.post(
  "/:courseId/materials",
  verifyToken,
  authorizeRole("instructor"),
  addMaterial
);

router.put(
  "/:courseId/materials/:materialId",
  verifyToken,
  authorizeRole("instructor"),
  updateMaterial
);

router.delete(
  "/:courseId/materials/:materialId",
  verifyToken,
  authorizeRole("instructor"),
  deleteMaterial
);

/* ============================
    TIMESLOT MANAGEMENT
  ============================ */
router.post(
  "/courses/:courseId/sessions/:sessionId/timeslots",
  verifyToken,
  authorizeRole("instructor", "admin"),
  addTimeslot
);

router.put(
  "/courses/:courseId/sessions/:sessionId/timeslots/:timeslotId",
  verifyToken,
  authorizeRole("instructor", "admin"),
  updateTimeslot
);

router.delete(
  "/courses/:courseId/sessions/:sessionId/timeslots/:timeslotId",
  verifyToken,
  authorizeRole("instructor", "admin"),
  deleteTimeslot
);

module.exports = router;
