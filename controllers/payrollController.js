const payrollService = require("../services/payrollService");

const getInstructorPayroll = async (req, res) => {
  try {
    const { startDate, endDate, instructorId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "StartDate và EndDate là bắt buộc",
      });
    }

    const payrollData = await payrollService.getInstructorPayroll(
      startDate,
      endDate,
      instructorId || null
    );

    res.status(200).json({
      success: true,
      data: payrollData,
    });
  } catch (error) {
    console.error("Error in getInstructorPayroll controller:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi lấy dữ liệu báo cáo lương",
    });
  }
};

const getAllInstructors = async (req, res) => {
  try {
    const instructors = await payrollService.getAllInstructors();
    res.status(200).json({
      success: true,
      data: instructors,
    });
  } catch (error) {
    console.error("Error in getAllInstructors controller:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi lấy danh sách giảng viên",
    });
  }
};

module.exports = {
  getInstructorPayroll,
  getAllInstructors,
};
