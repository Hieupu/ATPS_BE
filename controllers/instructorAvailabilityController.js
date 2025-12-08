const instructorAvailabilityService = require("../services/instructorAvailabilityService");

class InstructorAvailabilityController {
  /**
   * GET /api/instructors/:id/availability
   * Lấy lịch bận để dạy của giảng viên
   */
  async getAvailability(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "startDate và endDate là bắt buộc",
        });
      }

      const instructorId = parseInt(id, 10);
      if (isNaN(instructorId)) {
        return res.status(400).json({
          success: false,
          message: "InstructorID không hợp lệ",
        });
      }

      const result = await instructorAvailabilityService.getAvailability(
        instructorId,
        startDate,
        endDate
      );

      res.json({
        success: true,
        message: "Lấy lịch bận để dạy thành công",
        data: result,
      });
    } catch (error) {
      console.error("Error getting availability:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Lỗi khi lấy lịch bận để dạy",
      });
    }
  }

  /**
   * POST /api/instructors/:id/availability
   * Lưu lịch bận để dạy của giảng viên
   */
  async saveAvailability(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate, slots, instructorType } = req.body;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "startDate và endDate là bắt buộc",
        });
      }

      if (!Array.isArray(slots)) {
        return res.status(400).json({
          success: false,
          message: "slots phải là một mảng",
        });
      }

      const instructorId = parseInt(id, 10);
      if (isNaN(instructorId)) {
        return res.status(400).json({
          success: false,
          message: "InstructorID không hợp lệ",
        });
      }

      const result = await instructorAvailabilityService.saveAvailability(
        instructorId,
        startDate,
        endDate,
        slots,
        instructorType
      );

      res.json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      console.error("Error saving availability:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Lỗi khi lưu lịch bận để dạy",
      });
    }
  }
}

module.exports = new InstructorAvailabilityController();

