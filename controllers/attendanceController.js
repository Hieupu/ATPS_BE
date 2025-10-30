const attendanceService = require("../services/attendanceService");

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
      return res.json({ attendance });
    } catch (error) {
      console.error("Error in getLearnerAttendance:", error);
      return res.status(500).json({ message: "Server error" });
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
      return res.json({ stats });
    } catch (error) {
      console.error("Error in getAttendanceStats:", error);
      return res.status(500).json({ message: "Server error" });
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
}

module.exports = new AttendanceController();
