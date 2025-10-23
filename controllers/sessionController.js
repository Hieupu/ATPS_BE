const sessionService = require("../services/sessionService");
const classService = require("../services/classService");
const instructorService = require("../services/instructorService");

const sessionController = {
  // Tạo session mới
  createSession: async (req, res) => {
    try {
      const sessionData = req.body;

      if (
        !sessionData.Title ||
        !sessionData.InstructorID ||
        !sessionData.ClassID
      ) {
        return res.status(400).json({
          success: false,
          message: "Title, InstructorID, và ClassID là bắt buộc",
        });
      }

      const newSession = await sessionService.createSession(sessionData);

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

  // Lấy tất cả sessions
  getAllSessions: async (req, res) => {
    try {
      const sessions = await sessionService.getAllSessions();

      res.json({
        success: true,
        message: "Lấy danh sách sessions thành công",
        data: sessions,
      });
    } catch (error) {
      console.error("Error getting sessions:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách sessions",
        error: error.message,
      });
    }
  },

  // Lấy session theo ID
  getSessionById: async (req, res) => {
    try {
      const sessionId = req.params.id;
      const session = await sessionService.getSessionById(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy session",
        });
      }

      res.json({
        success: true,
        message: "Lấy thông tin session thành công",
        data: session,
      });
    } catch (error) {
      console.error("Error getting session:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin session",
        error: error.message,
      });
    }
  },

  // Lấy sessions theo class
  getSessionsByClassId: async (req, res) => {
    try {
      const classId = req.params.classId;
      const sessions = await sessionService.getSessionsByClassId(classId);

      res.json({
        success: true,
        message: "Lấy danh sách sessions theo class thành công",
        data: sessions,
      });
    } catch (error) {
      console.error("Error getting sessions by class:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách sessions theo class",
        error: error.message,
      });
    }
  },

  // Lấy sessions theo instructor
  getSessionsByInstructorId: async (req, res) => {
    try {
      const instructorId = req.params.instructorId;
      const sessions = await sessionService.getSessionsByInstructorId(
        instructorId
      );

      res.json({
        success: true,
        message: "Lấy danh sách sessions theo instructor thành công",
        data: sessions,
      });
    } catch (error) {
      console.error("Error getting sessions by instructor:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách sessions theo instructor",
        error: error.message,
      });
    }
  },

  // Cập nhật session
  updateSession: async (req, res) => {
    try {
      const sessionId = req.params.id;
      const updateData = req.body;

      const updatedSession = await sessionService.updateSession(
        sessionId,
        updateData
      );

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
      const sessionId = req.params.id;

      const deleted = await sessionService.deleteSession(sessionId);

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
};

module.exports = sessionController;
