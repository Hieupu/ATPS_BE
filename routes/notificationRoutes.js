const express = require("express");
const { verifyToken } = require("../middlewares/middware");
const notificationController = require("../controllers/notificationController");

const router = express.Router();

// Authenticated notification routes
router.get("/", verifyToken, notificationController.list);
router.post("/", verifyToken, notificationController.create);
router.post("/mark-all", verifyToken, notificationController.markAllAsRead);
router.post("/:id/mark", verifyToken, notificationController.markAsRead);

module.exports = router;
