const attendanceRepository = require("../repositories/attendanceRepository");
const profileRepository = require("../repositories/profileRepository");

class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

class AttendanceService {
  async getLearnerAttendance(learnerId) {
    try {
      const attendance = await attendanceRepository.getLearnerAttendance(
        learnerId
      );

      console.log(`Total attendance records found: ${attendance.length}`);
      console.log("Unique classes:", [
        ...new Set(attendance.map((a) => a.ClassName)),
      ]);

      const formattedAttendance = attendance.map((record) => ({
        AttendanceID: record.AttendanceID,
        Status: record.Status,
        StatusText: this.getStatusText(record.Status),
        Date: record.Date,
        SessionDate: record.SessionDate,
        SessionID: record.SessionID,
        SessionTitle: record.SessionTitle,
        SessionDescription: record.SessionDescription,
        Time: `${this.formatTime(record.StartTime)} - ${this.formatTime(
          record.EndTime
        )}`,
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
        AttendancePercentage:
          record.TotalLearners > 0
            ? Math.round((record.TotalPresent / record.TotalLearners) * 100)
            : 0,
      }));

      return formattedAttendance;
    } catch (error) {
      console.error("Error in getLearnerAttendance service:", error);
      throw error;
    }
  }

  async getAttendanceStats(learnerId) {
    try {
      const stats = await attendanceRepository.getAttendanceStats(learnerId);

      return {
        totalSessions: stats.TotalSessions || 0,
        totalPresent: stats.PresentCount || 0,
        totalAbsent: stats.AbsentCount || 0,
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
      const classList = await attendanceRepository.getAttendanceByClass(
        learnerId
      );

      return classList.map((cls) => ({
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
      const calendar = await attendanceRepository.getAttendanceCalendar(
        learnerId,
        month,
        year
      );

      return calendar.map((item) => ({
        ...item,
        StatusText: this.getStatusText(item.Status),
        Time: `${this.formatTime(item.StartTime)} - ${this.formatTime(
          item.EndTime
        )}`,
      }));
    } catch (error) {
      console.error("Error in getAttendanceCalendar service:", error);
      throw error;
    }
  }

  getStatusText(status) {
    const statusMap = {
      Present: "Có mặt",
      Absent: "Vắng mặt",
      Late: "Đi muộn",
    };
    return statusMap[status] || status;
  }

  getStatusBadge(status) {
    const badgeMap = {
      Present: "success",
      Absent: "error",
      Late: "warning",
    };
    return badgeMap[status] || "default";
  }

  getStatusColor(status) {
    const colorMap = {
      Present: "#4caf50",
      Absent: "#f44336",
      Late: "#ff9800",
    };
    return colorMap[status] || "#9e9e9e";
  }

  calculateAttendanceGrade(rate) {
    if (rate >= 90) return "A";
    if (rate >= 80) return "B";
    if (rate >= 70) return "C";
    if (rate >= 60) return "D";
    return "F";
  }

  getAttendanceStatus(rate) {
    if (rate >= 80) return "Tốt";
    if (rate >= 60) return "Khá";
    if (rate >= 40) return "Trung bình";
    return "Cần cải thiện";
  }

  formatTime(time) {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    return `${hours}:${minutes}`;
  }

  async updateAttendance(attendanceId, status) {
    try {
      if (!["Present", "Absent", "Late", "Excused"].includes(status)) {
        throw new ServiceError("Status không hợp lệ", 400);
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

  async attendanceLogic(
    accId,
    startTime,
    endTime,
    date,
    sessionId,
    timestamp,
    type
  ) {
    try {
      const learner = await profileRepository.findLearnerByAccountId(accId);
      if (!learner) {
        console.log("Learner not found:", accId);
        return { error: "Learner not found" };
      }

      const sessionStart = new Date(`${date}T${startTime}`);
      const sessionEnd = new Date(`${date}T${endTime}`);
      const actionTime = new Date(timestamp);

      const THIRTY_MIN = 30 * 60 * 1000;
      const sessionDurationMs = sessionEnd - sessionStart;
      const eightyPercentMs = sessionDurationMs * 0.8;

      let finalStatus = "ABSENT";
      let finalNote = "";

      if (type === "join") {
        if (actionTime - sessionStart <= THIRTY_MIN) {
          finalStatus = "PRESENT";
          finalNote = "Tham gia đúng giờ (auto attendance)";
        } else {
          finalStatus = "ABSENT";
          finalNote = "Đi muộn hơn 30 phút";
        }

        await attendanceRepository.recordAttendance(
          learner.LearnerID,
          sessionId,
          finalStatus,
          finalNote
        );

        return {
          learnerId: learner.LearnerID,
          sessionId,
          status: finalStatus,
          note: finalNote,
        };
      } else if (type === "leave") {
        const attendedMs = actionTime - sessionStart;

        if (attendedMs >= eightyPercentMs) {
          finalStatus = "PRESENT";
          finalNote = "Tham gia đầy đủ buổi học";
        } else {
          finalStatus = "ABSENT";
          finalNote = `Rời phòng quá sớm ${actionTime}`;
        }

        await attendanceRepository.recordAttendance(
          learner.LearnerID,
          sessionId,
          finalStatus,
          finalNote
        );

        return {
          learnerId: learner.LearnerID,
          sessionId,
          status: finalStatus,
          note: finalNote,
        };
      } else {
        finalStatus = "ABSENT";
        finalNote = "Không tham gia buổi học";

        await attendanceRepository.recordAttendance(
          learner.LearnerID,
          sessionId,
          finalStatus,
          finalNote
        );
      }
    } catch (error) {
      console.error("attendanceLogic error:", error);
      return { error: error.message };
    }
  }

  async getAttendanceByInstructor(instructorId) {
    try {
      if (!instructorId) {
        throw new ServiceError("Thiếu InstructorID", 400);
      }

      const attendanceList =
        await attendanceRepository.getAttendanceByInstructor(instructorId);

      // Tính tổng hợp thống kê
      const summary = {
        total: attendanceList.length,
        present: attendanceList.filter(
          (a) => a.Status === "Present" || a.Status === "PRESENT"
        ).length,
        absent: attendanceList.filter(
          (a) => a.Status === "Absent" || a.Status === "ABSENT"
        ).length,
        late: attendanceList.filter(
          (a) => a.Status === "Late" || a.Status === "LATE"
        ).length,
        other: attendanceList.filter(
          (a) =>
            ![
              "Present",
              "PRESENT",
              "Absent",
              "ABSENT",
              "Late",
              "LATE",
            ].includes(a.Status)
        ).length,
      };

      // Format dữ liệu
      const formattedAttendance = attendanceList.map((record) => ({
        AttendanceID: record.AttendanceID,
        Status: record.Status,
        StatusText: this.getStatusText(record.Status),
        AttendanceDate: record.AttendanceDate,
        Note: record.note || "",
        Learner: {
          LearnerID: record.LearnerID,
          FullName: record.LearnerName,
          ProfilePicture: record.LearnerAvatar,
        },
        Session: {
          SessionID: record.SessionID,
          Title: record.SessionTitle,
          Description: record.SessionDescription,
          Date: record.SessionDate,
          StartTime: record.StartTime,
          EndTime: record.EndTime,
          DayOfWeek: record.DayOfWeek,
          Time:
            record.StartTime && record.EndTime
              ? `${this.formatTime(record.StartTime)} - ${this.formatTime(
                  record.EndTime
                )}`
              : "",
        },
        Class: {
          ClassID: record.ClassID,
          Name: record.ClassName,
        },
        Course: {
          CourseID: record.CourseID,
          Title: record.CourseTitle,
        },
        Instructor: {
          InstructorID: record.InstructorID,
          FullName: record.InstructorName,
        },
      }));

      return {
        data: formattedAttendance,
        summary,
      };
    } catch (error) {
      console.error("Error in getAttendanceByInstructor service:", error);
      throw error;
    }
  }
}

module.exports = new AttendanceService();
