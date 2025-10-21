const Session = require("../models/session");

const sessionController = {
  // Lấy tất cả sessions
  getAllSessions: async (req, res) => {
    try {
      const sessions = await Session.findAll();

      res.json({
        success: true,
        message: "Lấy danh sách sessions thành công",
        data: sessions,
      });
    } catch (error) {
      console.error("Error getting all sessions:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách sessions",
        error: error.message,
      });
    }
  },

  // Tạo session/lesson
  createSession: async (req, res) => {
    try {
      const sessionData = req.body;

      // Validation
      if (
        !sessionData.Title ||
        !sessionData.Description ||
        !sessionData.InstructorID ||
        !sessionData.ClassID
      ) {
        return res.status(400).json({
          success: false,
          message: "Title, Description, InstructorID và ClassID là bắt buộc",
        });
      }

      const newSession = await Session.create(sessionData);

      res.status(201).json({
        success: true,
        message: "Tạo session thành công",
        data: newSession,
      });
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo session",
        error: error.message,
      });
    }
  },

  // Lấy session của lớp học
  getClassSessions: async (req, res) => {
    try {
      const { classId } = req.params;

      const sessions = await Session.findByClassId(classId);

      res.json({
        success: true,
        message: "Lấy session lớp học thành công",
        data: sessions,
      });
    } catch (error) {
      console.error("Error getting class sessions:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy session lớp học",
        error: error.message,
      });
    }
  },

  // Lấy session theo InstructorID
  getInstructorSessions: async (req, res) => {
    try {
      const { instructorId } = req.params;

      const sessions = await Session.findByInstructorId(instructorId);

      res.json({
        success: true,
        message: "Lấy session giảng viên thành công",
        data: sessions,
      });
    } catch (error) {
      console.error("Error getting instructor sessions:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy session giảng viên",
        error: error.message,
      });
    }
  },

  // Lấy session theo ID
  getSessionById: async (req, res) => {
    try {
      const { sessionId } = req.params;

      const session = await Session.findById(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy session",
        });
      }

      res.json({
        success: true,
        message: "Lấy session thành công",
        data: session,
      });
    } catch (error) {
      console.error("Error getting session:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy session",
        error: error.message,
      });
    }
  },

  // Cập nhật session
  updateSession: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const sessionData = req.body;

      const updatedSession = await Session.update(sessionId, sessionData);

      if (!updatedSession) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy session",
        });
      }

      res.json({
        success: true,
        message: "Cập nhật session thành công",
        data: updatedSession,
      });
    } catch (error) {
      console.error("Error updating session:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật session",
        error: error.message,
      });
    }
  },

  // Xóa session
  deleteSession: async (req, res) => {
    try {
      const { sessionId } = req.params;

      const deleted = await Session.delete(sessionId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy session",
        });
      }

      res.json({
        success: true,
        message: "Xóa session thành công",
      });
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa session",
        error: error.message,
      });
    }
  },

  // Cập nhật session với timeslots
  updateSessionWithTimeslots: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { title, description, timeslots } = req.body;

      // Kiểm tra session có tồn tại không
      const existingSession = await Session.findById(sessionId);
      if (!existingSession) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy session",
        });
      }

      // Cập nhật thông tin session
      const sessionData = {
        Title: title,
        Description: description || "",
      };

      const updatedSession = await Session.update(sessionId, sessionData);

      // Nếu có timeslots, cập nhật timeslots
      if (timeslots && timeslots.length > 0) {
        // Xóa timeslots cũ
        const SessionTimeslot = require("../models/sessiontimeslot");
        await SessionTimeslot.deleteBySessionId(sessionId);

        // Tạo timeslots mới
        const Timeslot = require("../models/timeslot");
        for (let timeslotData of timeslots) {
          // Tạo timeslot mới
          const timeslot = await Timeslot.create({
            Date: timeslotData.date,
            StartTime: timeslotData.startTime,
            EndTime: timeslotData.endTime,
            Location: timeslotData.location || null,
          });

          // Gán timeslot cho session
          await SessionTimeslot.create({
            SessionID: sessionId,
            TimeslotID: timeslot.TimeslotID,
          });
        }
      }

      res.json({
        success: true,
        message: "Cập nhật session thành công",
        data: updatedSession,
      });
    } catch (error) {
      console.error("Error updating session with timeslots:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật session",
        error: error.message,
      });
    }
  },

  // Xóa session và tất cả timeslots liên quan
  deleteSessionWithTimeslots: async (req, res) => {
    try {
      const { sessionId } = req.params;

      // Kiểm tra session có tồn tại không
      const existingSession = await Session.findById(sessionId);
      if (!existingSession) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy session",
        });
      }

      // Xóa tất cả sessiontimeslots liên quan
      const SessionTimeslot = require("../models/sessiontimeslot");
      await SessionTimeslot.deleteBySessionId(sessionId);

      // Xóa session
      const deleted = await Session.delete(sessionId);

      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: "Không thể xóa session",
        });
      }

      res.json({
        success: true,
        message: "Xóa session và timeslots thành công",
      });
    } catch (error) {
      console.error("Error deleting session with timeslots:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa session",
        error: error.message,
      });
    }
  },
};

module.exports = sessionController;
