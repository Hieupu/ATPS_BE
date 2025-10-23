const SessionTimeslot = require("../models/sessiontimeslot");

const sessiontimeslotController = {
  // Tạo sessiontimeslot
  createSessionTimeslot: async (req, res) => {
    try {
      const sessionTimeslotData = req.body;

      // Validation
      if (!sessionTimeslotData.SessionID || !sessionTimeslotData.TimeslotID) {
        return res.status(400).json({
          success: false,
          message: "SessionID và TimeslotID là bắt buộc",
        });
      }

      const newSessionTimeslot = await SessionTimeslot.create(
        sessionTimeslotData
      );

      res.status(201).json({
        success: true,
        message: "Tạo sessiontimeslot thành công",
        data: newSessionTimeslot,
      });
    } catch (error) {
      console.error("Error creating sessiontimeslot:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo sessiontimeslot",
        error: error.message,
      });
    }
  },

  // Lấy tất cả sessiontimeslots
  getAllSessionTimeslots: async (req, res) => {
    try {
      const sessionTimeslots = await SessionTimeslot.findAll();

      res.status(200).json({
        success: true,
        message: "Lấy danh sách sessiontimeslots thành công",
        data: sessionTimeslots,
      });
    } catch (error) {
      console.error("Error getting sessiontimeslots:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách sessiontimeslots",
        error: error.message,
      });
    }
  },

  // Lấy sessiontimeslot theo ID
  getSessionTimeslotById: async (req, res) => {
    try {
      const sessionTimeslotId = req.params.id;
      const sessionTimeslot = await SessionTimeslot.findById(sessionTimeslotId);

      if (!sessionTimeslot) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sessiontimeslot",
        });
      }

      res.status(200).json({
        success: true,
        message: "Lấy thông tin sessiontimeslot thành công",
        data: sessionTimeslot,
      });
    } catch (error) {
      console.error("Error getting sessiontimeslot:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin sessiontimeslot",
        error: error.message,
      });
    }
  },

  // Lấy sessiontimeslots theo session
  getSessionTimeslotsBySession: async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const sessionTimeslots = await SessionTimeslot.findBySessionId(sessionId);

      res.status(200).json({
        success: true,
        message: "Lấy sessiontimeslots theo session thành công",
        data: sessionTimeslots,
      });
    } catch (error) {
      console.error("Error getting sessiontimeslots by session:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy sessiontimeslots theo session",
        error: error.message,
      });
    }
  },

  // Lấy sessiontimeslots theo timeslot
  getSessionTimeslotsByTimeslot: async (req, res) => {
    try {
      const timeslotId = req.params.timeslotId;
      const sessionTimeslots = await SessionTimeslot.findByTimeslotId(
        timeslotId
      );

      res.status(200).json({
        success: true,
        message: "Lấy sessiontimeslots theo timeslot thành công",
        data: sessionTimeslots,
      });
    } catch (error) {
      console.error("Error getting sessiontimeslots by timeslot:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy sessiontimeslots theo timeslot",
        error: error.message,
      });
    }
  },

  // Cập nhật sessiontimeslot
  updateSessionTimeslot: async (req, res) => {
    try {
      const sessionTimeslotId = req.params.id;
      const updateData = req.body;

      const updatedSessionTimeslot = await SessionTimeslot.update(
        sessionTimeslotId,
        updateData
      );

      if (!updatedSessionTimeslot) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sessiontimeslot",
        });
      }

      res.status(200).json({
        success: true,
        message: "Cập nhật sessiontimeslot thành công",
        data: updatedSessionTimeslot,
      });
    } catch (error) {
      console.error("Error updating sessiontimeslot:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật sessiontimeslot",
        error: error.message,
      });
    }
  },

  // Xóa sessiontimeslot
  deleteSessionTimeslot: async (req, res) => {
    try {
      const sessionTimeslotId = req.params.id;

      const deleted = await SessionTimeslot.delete(sessionTimeslotId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sessiontimeslot",
        });
      }

      res.status(200).json({
        success: true,
        message: "Xóa sessiontimeslot thành công",
      });
    } catch (error) {
      console.error("Error deleting sessiontimeslot:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa sessiontimeslot",
        error: error.message,
      });
    }
  },

  // Kiểm tra sessiontimeslot có tồn tại không
  checkSessionTimeslotExists: async (req, res) => {
    try {
      const sessionTimeslotId = req.params.id;
      const exists = await SessionTimeslot.exists(sessionTimeslotId);

      res.status(200).json({
        success: true,
        message: "Kiểm tra sessiontimeslot thành công",
        data: { exists },
      });
    } catch (error) {
      console.error("Error checking sessiontimeslot exists:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi kiểm tra sessiontimeslot",
        error: error.message,
      });
    }
  },

  // Lấy thống kê sessiontimeslot
  getSessionTimeslotStatistics: async (req, res) => {
    try {
      const { sessionId, timeslotId } = req.query;

      let statistics;
      if (sessionId) {
        statistics = await SessionTimeslot.getStatisticsBySession(sessionId);
      } else if (timeslotId) {
        statistics = await SessionTimeslot.getStatisticsByTimeslot(timeslotId);
      } else {
        statistics = await SessionTimeslot.getOverallStatistics();
      }

      res.status(200).json({
        success: true,
        message: "Lấy thống kê sessiontimeslot thành công",
        data: statistics,
      });
    } catch (error) {
      console.error("Error getting sessiontimeslot statistics:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê sessiontimeslot",
        error: error.message,
      });
    }
  },
};

module.exports = sessiontimeslotController;
