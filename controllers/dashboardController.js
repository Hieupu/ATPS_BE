const dashboardService = require("../services/dashboardService");

const dashboardController = {
  // Lấy thống kê tổng quan
  getDashboardStats: async (req, res) => {
    try {
      const { year } = req.query;
      const stats = await dashboardService.getDashboardStats(year);

      res.json({
        success: true,
        message: "Lấy thống kê dashboard thành công",
        data: stats,
      });
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê dashboard",
        error: error.message,
      });
    }
  },

  // Lấy hoạt động gần đây
  getRecentActivities: async (req, res) => {
    try {
      const { limit = 10 } = req.query;

      // Debug: Log giá trị từ frontend
      console.log("[DEBUG] getRecentActivities - Raw query params:", {
        limit: limit,
        limitType: typeof limit,
        limitValue: limit,
        allQuery: req.query,
      });

      // Đảm bảo limit là số nguyên hợp lệ
      const validLimit = parseInt(limit, 10) || 10;

      // Debug: Log giá trị sau khi parse
      console.log("[DEBUG] getRecentActivities - After parse:", {
        validLimit: validLimit,
        validLimitType: typeof validLimit,
        isNaN: isNaN(validLimit),
        isInteger: Number.isInteger(validLimit),
      });

      const activities = await dashboardService.getRecentActivities(validLimit);

      res.json({
        success: true,
        message: "Lấy hoạt động gần đây thành công",
        data: activities,
      });
    } catch (error) {
      console.error("Error getting recent activities:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy hoạt động gần đây",
        error: error.message,
      });
    }
  },

  // Lấy thống kê theo khoảng thời gian
  getStatsByDateRange: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "startDate và endDate là bắt buộc",
        });
      }

      const stats = await dashboardService.getStatsByDateRange(
        startDate,
        endDate
      );

      res.json({
        success: true,
        message: "Lấy thống kê theo khoảng thời gian thành công",
        data: stats,
      });
    } catch (error) {
      console.error("Error getting stats by date range:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê theo khoảng thời gian",
        error: error.message,
      });
    }
  },
};

module.exports = dashboardController;
