const express = require("express");
const {
  getAllEmailLogs,
  getEmailLogById,
} = require("../controllers/emailLogController");
const { verifyToken, authorizeFeature } = require("../middlewares/middware");

const router = express.Router();

// Lấy danh sách email logs (chỉ admin)
router.get("/", verifyToken, authorizeFeature("admin"), getAllEmailLogs);

// Lấy email log theo ID (chỉ admin)
router.get("/:id", verifyToken, authorizeFeature("admin"), getEmailLogById);

module.exports = router;
