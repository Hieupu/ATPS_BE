const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { verifyToken, authorizeFeature } = require("../middlewares/middware");
router.use(verifyToken);
router.use(authorizeFeature("admin"));


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

