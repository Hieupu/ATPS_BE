const express = require("express");
const router = express.Router();
const { verifyToken, authorizeFeature } = require("../middlewares/auth");
const sessiontimeslotController = require("../controllers/sessiontimeslotController");

// Admin APIs
router.post(
  "/",
  // verifyToken,
  // authorizeFeature("admin"),
  sessiontimeslotController.createSessionTimeslot
);
router.get(
  "/",
  // verifyToken,
  // authorizeFeature("admin"),
  sessiontimeslotController.getAllSessionTimeslots
);
router.get(
  "/:id",
  // verifyToken,
  // authorizeFeature("admin"),
  sessiontimeslotController.getSessionTimeslotById
);
router.get(
  "/session/:sessionId",
  // verifyToken,
  // authorizeFeature("admin"),
  sessiontimeslotController.getSessionTimeslotsBySession
);
router.get(
  "/timeslot/:timeslotId",
  // verifyToken,
  // authorizeFeature("admin"),
  sessiontimeslotController.getSessionTimeslotsByTimeslot
);
router.put(
  "/:id",
  // verifyToken,
  // authorizeFeature("admin"),
  sessiontimeslotController.updateSessionTimeslot
);
router.delete(
  "/:id",
  // verifyToken,
  // authorizeFeature("admin"),
  sessiontimeslotController.deleteSessionTimeslot
);
router.get(
  "/admin/check/:id",
  // verifyToken,
  // authorizeFeature("admin"),
  sessiontimeslotController.checkSessionTimeslotExists
);
router.get(
  "/admin/statistics",
  // verifyToken,
  // authorizeFeature("admin"),
  sessiontimeslotController.getSessionTimeslotStatistics
);

// Instructor APIs
router.get(
  "/instructor",
  verifyToken,
  authorizeFeature("instructor"),
  sessiontimeslotController.getAllSessionTimeslots
);
router.get(
  "/instructor/:id",
  verifyToken,
  authorizeFeature("instructor"),
  sessiontimeslotController.getSessionTimeslotById
);
router.get(
  "/instructor/session/:sessionId",
  verifyToken,
  authorizeFeature("instructor"),
  sessiontimeslotController.getSessionTimeslotsBySession
);
router.get(
  "/instructor/timeslot/:timeslotId",
  verifyToken,
  authorizeFeature("instructor"),
  sessiontimeslotController.getSessionTimeslotsByTimeslot
);
router.get(
  "/instructor/statistics",
  verifyToken,
  authorizeFeature("instructor"),
  sessiontimeslotController.getSessionTimeslotStatistics
);

// Learner APIs
router.get(
  "/learner",
  verifyToken,
  authorizeFeature("learner"),
  sessiontimeslotController.getAllSessionTimeslots
);
router.get(
  "/learner/:id",
  verifyToken,
  authorizeFeature("learner"),
  sessiontimeslotController.getSessionTimeslotById
);
router.get(
  "/learner/session/:sessionId",
  verifyToken,
  authorizeFeature("learner"),
  sessiontimeslotController.getSessionTimeslotsBySession
);

module.exports = router;
