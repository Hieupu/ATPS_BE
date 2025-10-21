const Attendance = require("../models/attendance");
const SessionTimeslot = require("../models/sessiontimeslot");

const attendanceController = {
  // Tạo attendance mới
  createAttendance: async (req, res) => {
    try {
      const attendanceData = {
        LearnerID: req.body.LearnerID,
        sessiontimeslotID: req.body.sessiontimeslotID,
        Status: req.body.Status || "Present",
        Date: req.body.Date || new Date().toISOString().split("T")[0],
      };

      // Validation
      if (!attendanceData.LearnerID || !attendanceData.sessiontimeslotID) {
        return res.status(400).json({
          success: false,
          message: "LearnerID và sessiontimeslotID là bắt buộc",
        });
      }

      // Kiểm tra SessionTimeslot có tồn tại không
      const sessionTimeslotExists = await SessionTimeslot.exists(
        attendanceData.sessiontimeslotID
      );
      if (!sessionTimeslotExists) {
        return res.status(400).json({
          success: false,
          message: "Không tìm thấy SessionTimeslot",
        });
      }

      const newAttendance = await Attendance.create(attendanceData);

      res.status(201).json({
        success: true,
        message: "Tạo attendance thành công",
        data: newAttendance,
      });
    } catch (error) {
      console.error("Error creating attendance:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo attendance",
        error: error.message,
      });
    }
  },

  // Lấy attendance theo ID
  getAttendanceById: async (req, res) => {
    try {
      const { attendanceId } = req.params;

      const attendance = await Attendance.findById(attendanceId);

      if (!attendance) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy attendance",
        });
      }

      res.status(200).json({
        success: true,
        message: "Lấy attendance thành công",
        data: attendance,
      });
    } catch (error) {
      console.error("Error getting attendance:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy attendance",
        error: error.message,
      });
    }
  },

  // Lấy attendance theo LearnerID
  getAttendanceByLearner: async (req, res) => {
    try {
      const { learnerId } = req.params;

      const attendances = await Attendance.findByLearnerId(learnerId);

      res.status(200).json({
        success: true,
        message: "Lấy danh sách attendance thành công",
        data: attendances,
      });
    } catch (error) {
      console.error("Error getting learner attendance:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách attendance",
        error: error.message,
      });
    }
  },

  // Lấy attendance theo SessionTimeslotID
  getAttendanceBySessionTimeslot: async (req, res) => {
    try {
      const { sessionTimeslotId } = req.params;

      const attendances = await Attendance.findBySessionTimeslotId(
        sessionTimeslotId
      );

      res.status(200).json({
        success: true,
        message: "Lấy danh sách attendance thành công",
        data: attendances,
      });
    } catch (error) {
      console.error("Error getting session timeslot attendance:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách attendance",
        error: error.message,
      });
    }
  },

  // Lấy attendance theo ClassID
  getAttendanceByClass: async (req, res) => {
    try {
      const { classId } = req.params;

      const attendances = await Attendance.findByClassId(classId);

      res.status(200).json({
        success: true,
        message: "Lấy danh sách attendance thành công",
        data: attendances,
      });
    } catch (error) {
      console.error("Error getting class attendance:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách attendance",
        error: error.message,
      });
    }
  },

  // Cập nhật attendance
  updateAttendance: async (req, res) => {
    try {
      const { attendanceId } = req.params;
      const { Status } = req.body;

      // Kiểm tra attendance có tồn tại không
      const exists = await Attendance.exists(attendanceId);
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy attendance",
        });
      }

      const updatedAttendance = await Attendance.update(attendanceId, {
        Status,
      });

      res.status(200).json({
        success: true,
        message: "Cập nhật attendance thành công",
        data: updatedAttendance,
      });
    } catch (error) {
      console.error("Error updating attendance:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật attendance",
        error: error.message,
      });
    }
  },

  // Xóa attendance
  deleteAttendance: async (req, res) => {
    try {
      const { attendanceId } = req.params;

      const deleted = await Attendance.delete(attendanceId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy attendance",
        });
      }

      res.status(200).json({
        success: true,
        message: "Xóa attendance thành công",
      });
    } catch (error) {
      console.error("Error deleting attendance:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa attendance",
        error: error.message,
      });
    }
  },

  // Lấy thống kê attendance theo ClassID
  getAttendanceStats: async (req, res) => {
    try {
      const { classId } = req.params;

      const stats = await Attendance.getAttendanceStats(classId);

      res.status(200).json({
        success: true,
        message: "Lấy thống kê attendance thành công",
        data: stats,
      });
    } catch (error) {
      console.error("Error getting attendance stats:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê attendance",
        error: error.message,
      });
    }
  },
};

module.exports = attendanceController;
