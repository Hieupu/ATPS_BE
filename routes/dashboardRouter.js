const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
// const { authenticate, authorize } = require("../middleware/auth"); // Uncomment khi có auth middleware

// Tất cả routes đều yêu cầu authentication và authorization (admin)
// router.use(authenticate);
// router.use(authorize(["admin"]));

// Debug: Log khi router được load
console.log("Dashboard router loaded");

// Lấy thống kê tổng quan
router.get("/stats", (req, res, next) => {
  console.log("GET /api/dashboard/stats called");
  dashboardController.getDashboardStats(req, res, next);
});

// Lấy hoạt động gần đây
router.get("/activities", (req, res, next) => {
  console.log("GET /api/dashboard/activities called");
  dashboardController.getRecentActivities(req, res, next);
});

// Lấy thống kê theo khoảng thời gian
router.get("/stats/range", dashboardController.getStatsByDateRange);

module.exports = router;

