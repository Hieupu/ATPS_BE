const attendanceRepository = require("../repositories/attendanceRepository");

class AttendanceService {
  async getLearnerAttendance(learnerId) {
    try {
      const attendance = await attendanceRepository.getLearnerAttendance(learnerId);
      
      console.log(`Total attendance records found: ${attendance.length}`);
      console.log('Unique classes:', [...new Set(attendance.map(a => a.ClassName))]);

      const formattedAttendance = attendance.map((record) => ({
        AttendanceID: record.AttendanceID,
        Status: record.Status,
        StatusText: this.getStatusText(record.Status),
        Date: record.Date,
        SessionDate: record.SessionDate,
        SessionID: record.SessionID,
        SessionTitle: record.SessionTitle,
        SessionDescription: record.SessionDescription,
        Time: `${this.formatTime(record.StartTime)} - ${this.formatTime(record.EndTime)}`,
        StartTime: record.StartTime,
        EndTime: record.EndTime,
        DayOfWeek: record.DayOfWeek,
        InstructorID: record.InstructorID,
        InstructorName: record.InstructorName,
        InstructorAvatar: record.InstructorAvatar,
        CourseID: record.CourseID,
        CourseTitle: record.CourseTitle,
        CourseImage: record.CourseImage,
        ClassID: record.ClassID,
        ClassName: record.ClassName,
        ZoomID: record.ZoomID,
        Zoompass: record.Zoompass,
        TotalPresent: record.TotalPresent,
        TotalLearners: record.TotalLearners,
        AttendancePercentage: record.TotalLearners > 0 
          ? Math.round((record.TotalPresent / record.TotalLearners) * 100) 
          : 0,
      }));

      return formattedAttendance;
    } catch (error) {
      console.error("Error in getLearnerAttendance service:", error);
      throw error;
    }
  }

  async getAttendanceStats(learnerId, sessionId = null) {
    try {
      const stats = await attendanceRepository.getAttendanceStats(learnerId, sessionId);

      return {
        totalSessions: stats.TotalSessions || 0,
        totalPresent: stats.PresentCount || 0,
        totalAbsent: stats.AbsentCount || 0,
        totalLate: stats.LateCount || 0,
        attendanceRate: stats.AttendanceRate || 0,
        grade: this.calculateAttendanceGrade(stats.AttendanceRate || 0),
        status: this.getAttendanceStatus(stats.AttendanceRate || 0),
      };
    } catch (error) {
      console.error("Error in getAttendanceStats service:", error);
      throw error;
    }
  }

  async getAttendanceByClass(learnerId) {
    try {
      const classList = await attendanceRepository.getAttendanceByClass(learnerId);

      return classList.map(cls => ({
        ...cls,
        grade: this.calculateAttendanceGrade(cls.AttendanceRate || 0),
        status: this.getAttendanceStatus(cls.AttendanceRate || 0),
      }));
    } catch (error) {
      console.error("Error in getAttendanceByClass service:", error);
      throw error;
    }
  }

  async getAttendanceCalendar(learnerId, month, year) {
    try {
      const calendar = await attendanceRepository.getAttendanceCalendar(learnerId, month, year);

      return calendar.map(item => ({
        ...item,
        StatusText: this.getStatusText(item.Status),
        Time: `${this.formatTime(item.StartTime)} - ${this.formatTime(item.EndTime)}`,
      }));
    } catch (error) {
      console.error("Error in getAttendanceCalendar service:", error);
      throw error;
    }
  }

  getStatusText(status) {
    const statusMap = {
      'Present': 'Có mặt',
      'Absent': 'Vắng mặt',
      'Late': 'Đi muộn',
    };
    return statusMap[status] || status;
  }

  getStatusBadge(status) {
    const badgeMap = {
      'Present': 'success',
      'Absent': 'error',
      'Late': 'warning',
    };
    return badgeMap[status] || 'default';
  }

  getStatusColor(status) {
    const colorMap = {
      'Present': '#4caf50',
      'Absent': '#f44336',
      'Late': '#ff9800',
    };
    return colorMap[status] || '#9e9e9e';
  }

  calculateAttendanceGrade(rate) {
    if (rate >= 90) return 'A';
    if (rate >= 80) return 'B';
    if (rate >= 70) return 'C';
    if (rate >= 60) return 'D';
    return 'F';
  }

  getAttendanceStatus(rate) {
    if (rate >= 80) return 'Tốt';
    if (rate >= 60) return 'Khá';
    if (rate >= 40) return 'Trung bình';
    return 'Cần cải thiện';
  }

  formatTime(time) {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
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
