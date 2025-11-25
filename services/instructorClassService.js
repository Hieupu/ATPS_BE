const instructorClassRepository = require("../repositories/instructorClassRepository");
const instructorClassRosterRepository = require("../repositories/instructorClassRosterRepository");
const instructorAttendanceRepository = require("../repositories/instructorAttendanceRepository");

class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

//1. Lấy danh sách lớp mà instructor đang dạy
const listInstructorClassesService = async (instructorId) => {
  const classes = await instructorClassRepository.listByInstructor(
    instructorId
  );

  return classes;
};

//2. Lấy chi tiết 1 lớp (kèm info course/instructor)
const getInstructorClassDetailService = async (classId, instructorId) => {
  const raw = await instructorClassRepository.findById(classId);

  if (!raw) {
    throw new ServiceError("Class không tồn tại", 404);
  }

  if (raw.InstructorID !== instructorId) {
    throw new ServiceError("Bạn không có quyền truy cập lớp này", 403);
  }

  const students = await instructorClassRosterRepository.getStudents(classId);

  const totalSessions = Number(raw.Numofsession) || 0;
  const completedSessions = Number(raw.completedSessions) || 0;
  const progress =
    totalSessions > 0
      ? Math.round((completedSessions / totalSessions) * 100)
      : 0;

  let nextSession = "Chưa xếp lịch";
  if (raw.NextSessionDate) {
    const date = new Date(raw.NextSessionDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    if (targetDate.getTime() === today.getTime()) {
      nextSession = "Hôm nay";
    } else if (targetDate.getTime() === tomorrow.getTime()) {
      nextSession = "Ngày mai";
    } else {
      nextSession = targetDate.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
  }

  return {
    classId: raw.ClassID,
    className: raw.Name,
    status: raw.Status,
    fee: Number(raw.Fee) || 0,
    zoomMeetingId: raw.ZoomID,
    zoomPassword: raw.Zoompass,

    course: {
      id: raw.CourseID,
      title: raw.CourseTitle || "Chưa có khóa học",
      image: raw.CourseImage || "/images/default-class.jpg",
      level: raw.CourseLevel || null,
    },

    instructor: {
      id: raw.InstructorID,
      fullName: raw.InstructorName || "Chưa có giảng viên",
      avatar: raw.ProfilePicture || null,
    },

    currentStudents: raw.currentStudents,
    maxStudents: raw.Maxstudent,
    remainingSlots: raw.Maxstudent - raw.currentStudents,

    students: students.map((s) => ({
      learnerId: s.LearnerID,
      fullName: s.FullName,
      avatar: s.ProfilePicture || null,
      email: s.Email,
      phone: s.Phone,
    })),

    dates: {
      openPlan: raw.OpendatePlan,
      openActual: raw.Opendate,
      endPlan: raw.EnddatePlan,
      endActual: raw.Enddate,
    },

    totalSessions,
    completedSessions,
    progress,

    scheduleSummary: raw.ScheduleSummary || "Chưa có lịch cố định",
    hasSessionToday: !!raw.HasSessionToday,
    nextSession,
  };
};

// 3. Lấy danh sách học viên của lớp (tab "Danh sách học viên")
const getInstructorClassRosterService = async (classId, instructorId) => {
  const classObj = await instructorClassRepository.findById(classId);

  if (!classObj) {
    throw new ServiceError("Lớp học không tồn tại", 404);
  }

  if (classObj.InstructorID !== instructorId) {
    throw new ServiceError("Bạn không có quyền truy cập lớp này", 403);
  }

  const students = await instructorClassRosterRepository.getStudents(classId);

  return {
    Students: students,
  };
};

// 4. Lấy lịch các buổi học
const getInstructorClassScheduleService = async (classId, instructorId) => {
  const classObj = await instructorClassRepository.findById(classId);
  if (!classObj) throw new ServiceError("Lớp học không tồn tại", 404);
  if (classObj.InstructorID !== instructorId) {
    throw new ServiceError("Bạn không có quyền truy cập lớp này", 403);
  }

  const sessions = await instructorClassRosterRepository.getSessions(classId);

  const totalStudents =
    await instructorClassRosterRepository.getTotalEnrolledStudents(classId);

  const enrichedSessions = await Promise.all(
    sessions.map(async (session) => {
      const attendedCount =
        await instructorClassRosterRepository.getAttendedCount(
          session.SessionID
        );
      const isFullyMarked =
        totalStudents > 0 && attendedCount === totalStudents;

      return {
        ...session,
        attendedCount,
        totalStudents,
        isFullyMarked,
      };
    })
  );

  return {
    Sessions: enrichedSessions,
  };
};

// 5. Lấy danh sách điểm danh cho 1 buổi cụ thể (mở form điểm danh)
const getAttendanceSheetService = async (sessionId, classId, instructorId) => {
  const classObj = await instructorClassRepository.findById(classId);

  if (!classObj) {
    throw new ServiceError("Lớp học không tồn tại", 404);
  }

  if (classObj.InstructorID !== instructorId) {
    throw new ServiceError("Bạn không có quyền truy cập lớp này", 403);
  }

  const records = await instructorAttendanceRepository.getAttendanceSheet(
    sessionId,
    classId
  );

  return {
    SessionID: sessionId,
    ClassID: classId,
    AttendanceRecords: records,
  };
};

// 6. Lưu điểm danh buổi học
const saveAttendanceService = async (
  sessionId,
  classId,
  instructorId,
  attendanceData
) => {
  const classObj = await instructorClassRepository.findById(classId);
  if (!classObj) throw new ServiceError("Lớp học không tồn tại", 404);
  if (classObj.InstructorID !== instructorId)
    throw new ServiceError("Bạn không có quyền điểm danh lớp này", 403);

  const sessions = await instructorClassRosterRepository.getSessions(classId);
  const sessionExists = sessions.some(
    (s) => s.SessionID === parseInt(sessionId)
  );
  if (!sessionExists)
    throw new ServiceError("Buổi học không thuộc lớp này", 400);

  const students = await instructorClassRosterRepository.getStudents(classId);
  const validLearnerIds = students.map((s) => s.LearnerID);
  const invalidIds = attendanceData
    .filter((r) => !validLearnerIds.includes(r.LearnerID))
    .map((r) => r.LearnerID);

  if (invalidIds.length > 0)
    throw new ServiceError(
      `Học viên không thuộc lớp: ${invalidIds.join(", ")}`,
      400
    );

  await instructorAttendanceRepository.saveAttendance(
    sessionId,
    attendanceData
  );

  return { success: true, message: "Điểm danh đã được lưu thành công" };
};

module.exports = {
  listInstructorClassesService,
  getInstructorClassDetailService,
  getInstructorClassRosterService,
  getInstructorClassScheduleService,
  getAttendanceSheetService,
  saveAttendanceService,
};
