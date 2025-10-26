const express = require("express");
const {
  createCourse,
  addUnit,
  createSession,
  addLession,
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
  updateLession,
  deleteLession,
  updateMaterial,
  deleteMaterial,
  updateTimeslot,
  deleteTimeslot,
} = require("../controllers/instructorCourseController");
const { verifyToken, authorizeRole } = require("../middlewares/middware");

const router = express.Router();
/* ============================
   COURSE
============================ */
router.post("/", verifyToken, authorizeRole("instructor"), createCourse);
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
router.get(
  "/:courseId/detail",
  verifyToken,
  authorizeRole("instructor", "admin"),
  getCourseDetail
);

/* ============================
   UNIT
============================ */
router.post(
  "/:courseId/units",
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

/* ============================
   SESSION
============================ */
router.post(
  "/sessions",
  verifyToken,
  authorizeRole("instructor"),
  createSession
);
router.put(
  "/sessions/:sessionId",
  verifyToken,
  authorizeRole("instructor"),
  updateSession
);
router.delete(
  "/sessions/:sessionId",
  verifyToken,
  authorizeRole("instructor"),
  deleteSession
);

/* ============================
   LESSION
============================ */
router.post(
  "/units/:unitId/sessions/:sessionId/lessions",
  verifyToken,
  authorizeRole("instructor"),
  addLession
);
router.put(
  "/lessions/:lessionId",
  verifyToken,
  authorizeRole("instructor"),
  updateLession
);
router.delete(
  "/lessions/:lessionId",
  verifyToken,
  authorizeRole("instructor"),
  deleteLession
);

/* ============================
   MATERIAL
============================ */
router.post(
  "/:courseId/materials",
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

/* ============================
   TIMESLOT
============================ */
router.post(
  "/:courseId/sessions/:sessionId/timeslots",
  verifyToken,
  authorizeRole("instructor", "admin"),
  addTimeslot
);
router.put(
  "/timeslots/:timeslotId",
  verifyToken,
  authorizeRole("instructor", "admin"),
  updateTimeslot
);
router.delete(
  "/timeslots/:timeslotId",
  verifyToken,
  authorizeRole("instructor", "admin"),
  deleteTimeslot
);

module.exports = router;
