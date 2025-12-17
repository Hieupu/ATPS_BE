const {
  getFullDashboardDataService,
} = require("../services/instructorDashboardService");

const getInstructorDashboardController = async (req, res) => {
  try {
    const { instructorId } = req.params;

    if (!instructorId) {
      return res.status(400).json({
        success: false,
        message: "Yêu cầu phải có Instructor ID",
      });
    }

    const dashboardData = await getFullDashboardDataService(instructorId);

    return res.status(200).json({
      success: true,
      message: "Lấy dữ liệu Dashboard thành công",
      data: dashboardData,
    });
  } catch (error) {
    console.error("Error in getInstructorDashboardController:", error);

    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Lỗi hệ thống (Internal Server Error)",
    });
  }
};

module.exports = {
  getInstructorDashboardController,
};
