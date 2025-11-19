const express = require("express");
const {
  listInstructorClasses,
  getInstructorClassDetail,
  getInstructorClassRoster,
} = require("../controllers/instructorClassController");

const { verifyToken, authorizeRole } = require("../middlewares/middware");

const router = express.Router();

router.get(
  "/classes",
  verifyToken,
  authorizeRole("instructor"),
  listInstructorClasses
);

router.get(
  "/classes/:classId",
  verifyToken,
  authorizeRole("instructor"),
  getInstructorClassDetail
);

router.get(
  "/classes/:classId/students",
  verifyToken,
  authorizeRole("instructor"),
  getInstructorClassRoster
);

module.exports = router;
