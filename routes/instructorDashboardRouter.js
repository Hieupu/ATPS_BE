const express = require("express");
const {
  getInstructorDashboardController,
} = require("../controllers/instructorDashboardController");
const { verifyToken, authorizeRole } = require("../middlewares/middware");

const router = express.Router();

router.get(
  "/:instructorId/dashboard",
  verifyToken,
  authorizeRole("instructor"),
  getInstructorDashboardController
);
module.exports = router;
