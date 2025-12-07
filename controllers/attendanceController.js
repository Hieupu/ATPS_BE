const attendanceService = require("../services/attendanceService");
const connectDB = require("../config/db");
const crypto = require("crypto");

class AttendanceController {
  async getLearnerAttendance(req, res) {
    try {
      const { learnerId } = req.params;

      if (!learnerId) {
        return res.status(400).json({ message: "Learner ID is required" });
      }

      const attendance = await attendanceService.getLearnerAttendance(
        learnerId
      );
      return res.json({
        success: true,
        attendance,
      });
    } catch (error) {
      console.error("Error in getLearnerAttendance:", error);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }

  async getAttendanceStats(req, res) {
    try {
      const { learnerId } = req.params;
      const { sessionId } = req.query;

      if (!learnerId) {
        return res.status(400).json({ message: "Learner ID is required" });
      }

      const stats = await attendanceService.getAttendanceStats(
        learnerId,
        sessionId
      );
      return res.json({
        success: true,
        ...stats,
      });
    } catch (error) {
      console.error("Error in getAttendanceStats:", error);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }

  async getAttendanceByClass(req, res) {
    try {
      const { learnerId } = req.params;

      if (!learnerId) {
        return res.status(400).json({ message: "Learner ID is required" });
      }

      const classList = await attendanceService.getAttendanceByClass(learnerId);
      return res.json({
        success: true,
        classes: classList,
      });
    } catch (error) {
      console.error("Error in getAttendanceByClass:", error);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }

  async getAttendanceCalendar(req, res) {
    try {
      const { learnerId } = req.params;
      const { month, year } = req.query;

      if (!learnerId) {
        return res.status(400).json({ message: "Learner ID is required" });
      }

      const currentMonth = month || new Date().getMonth() + 1;
      const currentYear = year || new Date().getFullYear();

      const calendar = await attendanceService.getAttendanceCalendar(
        learnerId,
        currentMonth,
        currentYear
      );

      return res.json({
        success: true,
        calendar,
        month: currentMonth,
        year: currentYear,
      });
    } catch (error) {
      console.error("Error in getAttendanceCalendar:", error);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }

  async updateAttendance(req, res) {
    try {
      const { attendanceId } = req.params;
      const { Status } = req.body;

      if (!Status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const updated = await attendanceService.updateAttendance(
        attendanceId,
        Status
      );

      if (!updated) {
        return res.status(404).json({ message: "Attendance not found" });
      }

      return res.json({ message: "Attendance updated successfully" });
    } catch (error) {
      console.error("Error in updateAttendance:", error);
      return res.status(500).json({ message: error.message || "Server error" });
    }
  }

  async recordAttendance(req, res) {
    try {
      const { learnerId, sessionId, status = "present" } = req.body;
      const db = await connectDB();

      if (!learnerId || !sessionId) {
        return res
          .status(400)
          .json({ message: "LearnerID and SessionID are required" });
      }

      // Check if attendance already exists
      const [existing] = await db.query(
        "SELECT * FROM attendance WHERE LearnerID = ? AND SessionID = ?",
        [learnerId, sessionId]
      );

      if (existing.length > 0) {
        return res.json({
          message: "Attendance already recorded",
          attendance: existing[0],
        });
      }

      // Insert new attendance
      const [result] = await db.query(
        `INSERT INTO attendance (LearnerID, SessionID, Status, Date) 
         VALUES (?, ?, ?, CURDATE())`,
        [learnerId, sessionId, status]
      );

      res.json({
        message: "Attendance recorded successfully",
        attendanceId: result.insertId,
      });
    } catch (error) {
      console.error("Attendance recording error:", error);
      res.status(500).json({ message: "Failed to record attendance" });
    }
  }

  async getAttendanceBySession(req, res) {
    try {
      const { sessionId } = req.params;
      const db = await connectDB();

      const [attendance] = await db.query(
        `SELECT a.*, l.FullName as LearnerName 
         FROM attendance a 
         INNER JOIN learner l ON a.LearnerID = l.LearnerID 
         WHERE a.SessionID = ?`,
        [sessionId]
      );

      res.json({ attendance });
    } catch (error) {
      console.error("Get attendance error:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  }
}

module.exports = new AttendanceController();
