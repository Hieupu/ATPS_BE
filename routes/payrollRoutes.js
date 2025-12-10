const express = require("express");
const router = express.Router();
const { verifyToken, authorizeFeature } = require("../middlewares/middware");
const payrollController = require("../controllers/payrollController");

router.get(
  "/instructors",
  verifyToken,
  authorizeFeature("admin"),
  payrollController.getInstructorPayroll
);

router.get(
  "/instructors/list",
  verifyToken,
  authorizeFeature("admin"),
  payrollController.getAllInstructors
);

module.exports = router;
