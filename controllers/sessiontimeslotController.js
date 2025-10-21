const SessionTimeslot = require("../models/sessiontimeslot");
const Session = require("../models/session");
const Timeslot = require("../models/timeslot");

const sessionTimeslotController = {
  // Tạo sessiontimeslot mới
  createSessionTimeslot: async (req, res) => {
    try {
      const sessionTimeslotData = {
        SessionID: req.body.SessionID,
        TimeslotID: req.body.TimeslotID,
      };

      // Validation
      if (!sessionTimeslotData.SessionID || !sessionTimeslotData.TimeslotID) {
        return res.status(400).json({
          success: false,
          message: "SessionID và TimeslotID là bắt buộc",
        });
      }

      // Kiểm tra session có tồn tại không
      const sessionExists = await Session.exists(sessionTimeslotData.SessionID);
      if (!sessionExists) {
        return res.status(400).json({
          success: false,
          message: "Không tìm thấy session",
        });
      }

      // Kiểm tra timeslot có tồn tại không
      const timeslotExists = await Timeslot.exists(
        sessionTimeslotData.TimeslotID
      );
      if (!timeslotExists) {
        return res.status(400).json({
          success: false,
          message: "Không tìm thấy timeslot",
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

  // Gán timeslot cho session (Admin API)
  assignTimeslotToSession: async (req, res) => {
    try {
      
      const { sessionId } = req.params;
      const { TimeslotID } = req.body;

      // Validation
      if (!TimeslotID) {
        return res.status(400).json({
          success: false,
          message: "TimeslotID là bắt buộc",
        });
      }

      // Kiểm tra session có tồn tại không
      const sessionExists = await Session.exists(sessionId);
      if (!sessionExists) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy session",
        });
      }

      // Kiểm tra timeslot có tồn tại không
      const timeslotExists = await Timeslot.exists(TimeslotID);
      if (!timeslotExists) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy timeslot",
        });
      }

      // Kiểm tra timeslot đã được gán chưa
      const existingAssignment = await SessionTimeslot.findBySessionAndTimeslot(
        sessionId,
        TimeslotID
      );
      if (existingAssignment) {
        return res.status(409).json({
          success: false,
          message: "Timeslot đã được gán cho session này",
        });
      }

      const sessionTimeslotData = {
        SessionID: sessionId,
        TimeslotID: TimeslotID,
      };

    
      const newSessionTimeslot = await SessionTimeslot.create(
        sessionTimeslotData
      );

      res.status(201).json({
        success: true,
        message: "Gán timeslot cho session thành công",
        data: newSessionTimeslot,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi gán timeslot cho session",
        error: error.message,
      });
    }
  },

  // Lấy timeslots của session (Admin API)
  getSessionTimeslots: async (req, res) => {
    try {
      const { sessionId } = req.params;

      const timeslots = await SessionTimeslot.findBySessionId(sessionId);

      res.json({
        success: true,
        message: "Lấy timeslots của session thành công",
        data: timeslots,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy timeslots của session",
        error: error.message,
      });
    }
  },

  // Lấy sessiontimeslot theo ID
  getSessionTimeslotById: async (req, res) => {
    try {
      const { sessionTimeslotId } = req.params;

      const sessionTimeslot = await SessionTimeslot.findById(sessionTimeslotId);

      if (!sessionTimeslot) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sessiontimeslot",
        });
      }

      res.status(200).json({
        success: true,
        message: "Lấy sessiontimeslot thành công",
        data: sessionTimeslot,
      });
    } catch (error) {
      console.error("Error getting sessiontimeslot:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy sessiontimeslot",
        error: error.message,
      });
    }
  },

  // Lấy sessiontimeslots theo ClassID
  getSessionTimeslotsByClassId: async (req, res) => {
    try {
      const { classId } = req.params;

      const sessionTimeslots = await SessionTimeslot.findByClassId(classId);

      res.status(200).json({
        success: true,
        message: "Lấy danh sách sessiontimeslots thành công",
        data: sessionTimeslots,
      });
    } catch (error) {
      console.error("Error getting sessiontimeslots by class:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách sessiontimeslots",
        error: error.message,
      });
    }
  },

  // Lấy sessiontimeslots theo SessionID
  getSessionTimeslotsBySessionId: async (req, res) => {
    try {
      const { sessionId } = req.params;

      const sessionTimeslots = await SessionTimeslot.findBySessionId(sessionId);

      res.status(200).json({
        success: true,
        message: "Lấy danh sách sessiontimeslots thành công",
        data: sessionTimeslots,
      });
    } catch (error) {
      console.error("Error getting sessiontimeslots by session:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách sessiontimeslots",
        error: error.message,
      });
    }
  },

  // Lấy lịch học của học viên
  getLearnerSchedule: async (req, res) => {
    try {
      const { learnerId } = req.query;

      if (!learnerId) {
        return res.status(400).json({
          success: false,
          message: "LearnerID là bắt buộc",
        });
      }

      const schedule = await SessionTimeslot.getLearnerSchedule(learnerId);

      res.status(200).json({
        success: true,
        message: "Lấy lịch học thành công",
        data: schedule,
      });
    } catch (error) {
      console.error("Error getting learner schedule:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy lịch học",
        error: error.message,
      });
    }
  },

  // Cập nhật sessiontimeslot
  updateSessionTimeslot: async (req, res) => {
    try {
      const { sessionTimeslotId } = req.params;
      const sessionTimeslotData = req.body;

      // Kiểm tra sessiontimeslot có tồn tại không
      const exists = await SessionTimeslot.exists(sessionTimeslotId);
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sessiontimeslot",
        });
      }

      const updatedSessionTimeslot = await SessionTimeslot.update(
        sessionTimeslotId,
        sessionTimeslotData
      );

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
      const { sessionTimeslotId } = req.params;

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
};

module.exports = sessionTimeslotController;
