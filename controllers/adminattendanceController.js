const Attendance = require("../models/attendance");
const SessionTimeslot = require("../models/sessiontimeslot");
const connectDB = require("../config/db");
const attendanceService = require("../services/attendanceService");

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
        message: "Tạo điểm danh thành công",
        data: newAttendance,
      });
    } catch (error) {
      console.error("Error creating attendance:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo điểm danh",
        error: error.message,
      });
    }
  },

  // Lấy danh sách điểm danh theo sessiontimeslot
  getAttendanceBySessionTimeslot: async (req, res) => {
    try {
      const { sessiontimeslotId } = req.params;

      const attendanceList = await Attendance.findBySessionTimeslotId(
        sessiontimeslotId
      );

      res.status(200).json({
        success: true,
        message: "Lấy danh sách điểm danh thành công",
        data: attendanceList,
      });
    } catch (error) {
      console.error("Error getting attendance:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách điểm danh",
        error: error.message,
      });
    }
  },

  // Lấy điểm danh của học viên
  getAttendanceByLearner: async (req, res) => {
    try {
      const { learnerId } = req.params;

      const attendanceList = await Attendance.findByLearnerId(learnerId);

      res.status(200).json({
        success: true,
        message: "Lấy điểm danh của học viên thành công",
        data: attendanceList,
      });
    } catch (error) {
      console.error("Error getting learner attendance:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy điểm danh của học viên",
        error: error.message,
      });
    }
  },

  // Lấy điểm danh theo giảng viên (admin xem tất cả phiên do GV dạy)
  getAttendanceByInstructor: async (req, res) => {
    try {
      const { instructorId } = req.params;

      if (!instructorId) {
        return res.status(400).json({
          success: false,
          message: "InstructorID là bắt buộc",
        });
      }

      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT 
          a.AttendanceID,
          a.Status,
          a.Date,
          a.LearnerID,
          a.SessionID,
          s.Title AS SessionTitle,
          s.Date AS SessionDate,
          c.ClassID,
          c.Name AS ClassName,
          l.FullName AS LearnerName
        FROM attendance a
        INNER JOIN session s ON a.SessionID = s.SessionID
        INNER JOIN class c ON s.ClassID = c.ClassID
        INNER JOIN learner l ON a.LearnerID = l.LearnerID
        WHERE c.InstructorID = ?
        ORDER BY a.Date DESC, a.AttendanceID DESC`,
        [instructorId]
      );

      const summary = rows.reduce(
        (acc, cur) => {
          const status = (cur.Status || "").toLowerCase();
          if (status === "present" || status === "attended") acc.present += 1;
          else if (status === "absent") acc.absent += 1;
          else acc.other += 1;
          return acc;
        },
        { present: 0, absent: 0, other: 0 }
      );

      return res.status(200).json({
        success: true,
        message: "Lấy điểm danh theo giảng viên thành công",
        data: rows,
        summary,
      });
    } catch (error) {
      console.error("Error getting instructor attendance:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi lấy điểm danh theo giảng viên",
        error: error.message,
      });
    }
  },

  // Cập nhật trạng thái điểm danh
  updateAttendance: async (req, res) => {
    try {
      const { attendanceId } = req.params;
      const { Status } = req.body;

      if (!Status) {
        return res.status(400).json({
          success: false,
          message: "Status là bắt buộc",
        });
      }

      const updatedAttendance = await Attendance.update(attendanceId, {
        Status,
      });

      if (!updatedAttendance) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy điểm danh",
        });
      }

      res.status(200).json({
        success: true,
        message: "Cập nhật điểm danh thành công",
        data: updatedAttendance,
      });
    } catch (error) {
      console.error("Error updating attendance:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật điểm danh",
        error: error.message,
      });
    }
  },

  // Xóa điểm danh
  deleteAttendance: async (req, res) => {
    try {
      const { attendanceId } = req.params;

      const deleted = await Attendance.delete(attendanceId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy điểm danh",
        });
      }

      res.status(200).json({
        success: true,
        message: "Xóa điểm danh thành công",
      });
    } catch (error) {
      console.error("Error deleting attendance:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa điểm danh",
        error: error.message,
      });
    }
  },

  // Lấy thống kê điểm danh
  getAttendanceStatistics: async (req, res) => {
    try {
      const { classId, learnerId } = req.query;

      let statistics;
      if (classId) {
        statistics = await Attendance.getStatisticsByClass(classId);
      } else if (learnerId) {
        statistics = await Attendance.getStatisticsByLearner(learnerId);
      } else {
        return res.status(400).json({
          success: false,
          message: "ClassID hoặc LearnerID là bắt buộc",
        });
      }

      res.status(200).json({
        success: true,
        message: "Lấy thống kê điểm danh thành công",
        data: statistics,
      });
    } catch (error) {
      console.error("Error getting attendance statistics:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê điểm danh",
        error: error.message,
      });
    }
  },

  // Điểm danh hàng loạt
  bulkCreateAttendance: async (req, res) => {
    try {
      const { sessiontimeslotId, attendanceList } = req.body;

      if (
        !sessiontimeslotId ||
        !attendanceList ||
        !Array.isArray(attendanceList)
      ) {
        return res.status(400).json({
          success: false,
          message: "SessionTimeslotID và danh sách điểm danh là bắt buộc",
        });
      }

      const results = [];
      for (const attendanceData of attendanceList) {
        try {
          const newAttendance = await Attendance.create({
            LearnerID: attendanceData.LearnerID,
            sessiontimeslotID: sessiontimeslotId,
            Status: attendanceData.Status || "Present",
            Date: attendanceData.Date || new Date().toISOString().split("T")[0],
          });
          results.push({ success: true, data: newAttendance });
        } catch (error) {
          results.push({
            success: false,
            error: error.message,
            learnerId: attendanceData.LearnerID,
          });
        }
      }

      res.status(201).json({
        success: true,
        message: "Tạo điểm danh hàng loạt thành công",
        data: results,
      });
    } catch (error) {
      console.error("Error creating bulk attendance:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo điểm danh hàng loạt",
        error: error.message,
      });
    }
  },

  // Lấy điểm danh theo giảng viên (cho admin)
  getAttendanceByInstructor: async (req, res) => {
    try {
      const { instructorId } = req.params;

      if (!instructorId) {
        return res.status(400).json({
          success: false,
          message: "InstructorID là bắt buộc",
        });
      }

      const result = await attendanceService.getAttendanceByInstructor(
        instructorId
      );

      res.status(200).json({
        success: true,
        message: "Lấy điểm danh theo giảng viên thành công",
        data: result.data,
        summary: result.summary,
      });
    } catch (error) {
      console.error("Error getting attendance by instructor:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy điểm danh theo giảng viên",
        error: error.message,
      });
    }
  },
};

module.exports = attendanceController;
