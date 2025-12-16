const express = require("express");
const router = express.Router();
const { verifyToken, authorizeFeature } = require("../middlewares/middware");
const certificateController = require("../controllers/certificateController");

// Admin routes - get all certificates (with optional filters)
router.get(
  "/",
  verifyToken,
  authorizeFeature("admin"),
  certificateController.getAllCertificates
);

// Get certificate by ID
router.get(
  "/:id",
  verifyToken,
  authorizeFeature("admin"),
  certificateController.getCertificateById
);

// Update certificate status (APPROVED, REJECTED)
router.put(
  "/:id/status",
  verifyToken,
  authorizeFeature("admin"),
  certificateController.updateCertificateStatus
);

// Get certificates by instructor ID
router.get(
  "/instructor/:instructorId",
  verifyToken,
  authorizeFeature("admin"),
  certificateController.getCertificatesByInstructorId
);

module.exports = router;

