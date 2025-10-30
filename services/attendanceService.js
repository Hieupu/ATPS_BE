const attendanceRepository = require("../repositories/attendanceRepository");

class AttendanceService {
  async getLearnerAttendance(learnerId) {
    try {
      const attendance = await attendanceRepository.getLearnerAttendance(
        learnerId
      );

      // Format dữ liệu
      const formattedAttendance = attendance.map((record) => ({
        ...record,
        formattedDate: record.SessionDate
          ? new Date(record.SessionDate).toLocaleDateString("vi-VN")
          : null,
        timeRange: `${record.StartTime} - ${record.EndTime}`,
        statusBadge: this.getStatusBadge(record.Status),
        statusColor: this.getStatusColor(record.Status),
      }));

      return formattedAttendance;
    } catch (error) {
      console.error("Error in getLearnerAttendance service:", error);
      throw error;
    }
  }

  async getAttendanceStats(learnerId, sessionId = null) {
    try {
      const stats = await attendanceRepository.getAttendanceStats(
        learnerId,
        sessionId
      );

      // Format stats
      return {
        totalSessions: stats.TotalSessions || 0,
        presentCount: stats.PresentCount || 0,
        absentCount: stats.AbsentCount || 0,
        lateCount: stats.LateCount || 0,
        attendanceRate: stats.AttendanceRate || 0,
        grade: this.calculateAttendanceGrade(stats.AttendanceRate),
      };
    } catch (error) {
      console.error("Error in getAttendanceStats service:", error);
      throw error;
    }
  }

  async updateAttendance(attendanceId, status) {
    try {
      if (!["Present", "Absent", "Late", "Excused"].includes(status)) {
        throw new Error("Status không hợp lệ");
      }

      return await attendanceRepository.updateAttendance(attendanceId, status);
    } catch (error) {
      console.error("Error in updateAttendance service:", error);
      throw error;
    }
  }

  getStatusBadge(status) {
    const badges = {
      Present: "Có mặt",
      Absent: "Vắng mặt",
      Late: "Muộn",
      Excused: "Có phép",
    };
    return badges[status] || status;
  }

  getStatusColor(status) {
    const colors = {
      Present: "success",
      Absent: "error",
      Late: "warning",
      Excused: "info",
    };
    return colors[status] || "default";
  }

  calculateAttendanceGrade(rate) {
    if (rate >= 95) return "Xuất sắc";
    if (rate >= 85) return "Tốt";
    if (rate >= 75) return "Khá";
    if (rate >= 65) return "Trung bình";
    return "Cần cải thiện";
  }
}

module.exports = new AttendanceService();
