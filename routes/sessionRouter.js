const express = require("express");
const router = express.Router();
const { verifyToken, authorizeFeature } = require("../middlewares/auth");
const sessionController = require("../controllers/sessionController");

// Admin APIs
router.get(
  "/",
  // verifyToken,
  // authorizeFeature("admin"),
  sessionController.getAllSessions
);

router.post(
  "/",
  // verifyToken,
  // authorizeFeature("admin"),
  sessionController.createSession
);

router.get(
  "/:sessionId",
  // verifyToken,
  // authorizeFeature("admin"),
  sessionController.getSessionById
);

router.put(
  "/:sessionId",
  // verifyToken,
  // authorizeFeature("admin"),
  sessionController.updateSession
);

router.delete(
  "/:sessionId",
  // verifyToken,
  // authorizeFeature("admin"),
  sessionController.deleteSession
);

// Class-related APIs
router.get(
  "/class/:classId",
  // verifyToken,
  // authorizeFeature("admin"),
  sessionController.getSessionsByClassId
);

// Instructor APIs
router.get(
  "/instructor/:instructorId",
  // verifyToken,
  // authorizeFeature("instructor"),
  sessionController.getSessionsByInstructorId
);

// Public APIs
router.get("/available", sessionController.getAllSessions);

module.exports = router;
