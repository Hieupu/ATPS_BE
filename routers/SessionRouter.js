const express = require("express");
const router = express.Router();
const SessionController = require("../controllers/sessionController");

/**
 * SessionRouter - Routes cho Session management
 * Luồng: Frontend → SessionRouter → SessionController → SessionService → SessionModel → Database
 */

// Admin APIs - Session Management
router.get("/", SessionController.getAllSessions);
router.get("/:sessionId", SessionController.getSessionById);
router.post("/", SessionController.createSession);
router.put("/:sessionId", SessionController.updateSession);
router.delete("/:sessionId", SessionController.deleteSession);

// Admin APIs - Session with Timeslots Management
router.put(
  "/:sessionId/with-timeslots",
  SessionController.updateSessionWithTimeslots
);
router.delete(
  "/:sessionId/with-timeslots",
  SessionController.deleteSessionWithTimeslots
);

module.exports = router;
