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

  const sessions = await instructorClassRosterRepository.getSessions(
    classId,
    instructorId
  );

  const totalStudents =
    await instructorClassRosterRepository.getTotalEnrolledStudents(classId);

  const enrichedSessions = await Promise.all(
    sessions.map(async (session) => {
      const attendedCount =
        await instructorClassRosterRepository.getAttendedCount(
          session.sessionId
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

  const sessions = await instructorClassRosterRepository.getSessions(
    classId,
    instructorId
  );
  const sessionExists = sessions.some(
    (s) => s.sessionId === parseInt(sessionId)
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

// Lấy thời khóa biểu của instructor (tất cả các lớp)
const getInstructorScheduleService = async (instructorId) => {
  const sessions =
    await instructorClassRosterRepository.getSessionsByInstructor(instructorId);

  if (!sessions || sessions.length === 0) {
    return {
      Sessions: [],
      message: "Không có buổi học nào",
    };
  }

  const classIds = [...new Set(sessions.map((s) => s.classId))];

  const classStudentCounts = await Promise.all(
    classIds.map(async (classId) => {
      const count =
        await instructorClassRosterRepository.getTotalEnrolledStudents(classId);
      return { classId, count };
    })
  );

  const studentCountMap = Object.fromEntries(
    classStudentCounts.map((item) => [item.classId, item.count])
  );

  const enrichedSessions = await Promise.all(
    sessions.map(async (session) => {
      const totalStudents = studentCountMap[session.classId] || 0;
      const attendedCount =
        await instructorClassRosterRepository.getAttendedCount(
          session.sessionId
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

// 8. Lấy danh sách lịch rảnh của giảng viên
const getInstructorAvailabilityService = async (
  instructorId,
  startDate,
  endDate
) => {
  if (!startDate || !endDate) {
    throw new ServiceError(
      "Vui lòng cung cấp ngày bắt đầu và ngày kết thúc",
      400
    );
  }

  // Sử dụng Promise.all để chạy song song 2 câu lệnh (Tối ưu tốc độ)
  const [availabilityData, occupiedData] = await Promise.all([
    // 1. Lấy những slot đã tick "Rảnh" (Màu xanh)
    instructorClassRosterRepository.getInstructorAvailability(
      instructorId,
      startDate,
      endDate
    ),

    instructorClassRosterRepository.getInstructorOccupiedSlots(
      instructorId,
      startDate,
      endDate
    ),
  ]);

  return {
    availability: availabilityData,
    occupied: occupiedData,
  };
};

// 9. Cập nhật lịch rảnh (Save Availability)
const saveInstructorAvailabilityService = async (
  instructorId,
  startDate,
  endDate,
  slots
) => {
  if (!startDate || !endDate) {
    throw new ServiceError(
      "Vui lòng cung cấp ngày bắt đầu và ngày kết thúc",
      400
    );
  }

  if (!Array.isArray(slots)) {
    throw new ServiceError(
      "Dữ liệu lịch đăng ký (slots) phải là một danh sách",
      400
    );
  }

  const today = new Date().toISOString().split("T")[0];
  if (startDate < today) {
    throw new ServiceError(
      "Không thể cập nhật lịch cho ngày trong quá khứ",
      400
    );
  }

  await instructorClassRosterRepository.saveInstructorAvailability(
    instructorId,
    startDate,
    endDate,
    slots
  );

  return {
    success: true,
    message: "Cập nhật lịch rảnh thành công",
  };
};

// 10. Đăng ký lịch rảnh (Chế độ bổ sung - Có check trùng)
const addInstructorAvailabilityService = async (instructorId, slots) => {
  if (!instructorId) {
    throw new ServiceError("Thiếu thông tin giảng viên", 400);
  }

  if (!Array.isArray(slots) || slots.length === 0) {
    throw new ServiceError("Danh sách lịch đăng ký không được để trống", 400);
  }

  const today = new Date().toISOString().split("T")[0];
  const hasPastDate = slots.some((slot) => slot.date < today);

  if (hasPastDate) {
    throw new ServiceError(
      "Không thể đăng ký lịch cho ngày trong quá khứ",
      400
    );
  }

  const dates = slots.map((s) => s.date).sort();
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  const existingSlots =
    await instructorClassRosterRepository.getInstructorAvailability(
      instructorId,
      startDate,
      endDate
    );

  const existingSet = new Set(
    existingSlots.map((item) => `${item.date}_${item.timeslotId}`)
  );

  const slotsToInsert = slots.filter((slot) => {
    const key = `${slot.date}_${slot.timeslotId}`;
    return !existingSet.has(key);
  });

  if (slotsToInsert.length > 0) {
    await instructorClassRosterRepository.addInstructorAvailability(
      instructorId,
      slotsToInsert
    );
  }

  const skippedCount = slots.length - slotsToInsert.length;

  return {
    success: true,
    message: `Đã đăng ký thêm ${slotsToInsert.length} buổi. (Bỏ qua ${skippedCount} buổi đã tồn tại)`,
    inserted: slotsToInsert.length,
    skipped: skippedCount,
  };
};

const requestSessionChangeService = async (instructorId, payload) => {
  const { sessionId, newDate, newTimeslotId, reason } = payload;

  if (!sessionId || !newDate || !newTimeslotId || !reason) {
    throw new ServiceError(
      "Vui lòng nhập đầy đủ thông tin: Ngày mới, Ca học và Lý do.",
      400
    );
  }

  const today = new Date().toISOString().split("T")[0];
  if (newDate < today) {
    throw new ServiceError("Không thể đổi lịch sang ngày trong quá khứ.", 400);
  }

  const session = await instructorClassRosterRepository.getSessionById(
    sessionId
  );

  if (!session) {
    throw new ServiceError("Buổi học không tồn tại.", 404);
  }

  if (session.InstructorID !== instructorId) {
    throw new ServiceError("Bạn không có quyền thay đổi buổi học này.", 403);
  }

  const requestId = await instructorClassRosterRepository.createChangeRequest(
    sessionId,
    instructorId,
    newDate,
    newTimeslotId,
    reason
  );

  return {
    success: true,
    message: "Gửi yêu cầu đổi lịch thành công.",
    requestId: requestId,
  };
};

//admin duyệt
// 1. Service: Duyệt yêu cầu đổi lịch
const approveRequestService = async (adminId, requestId) => {
  // Validate đầu vào
  if (!requestId) {
    throw new ServiceError("Thiếu thông tin Request ID.", 400);
  }

  // Gọi Repository thực hiện Transaction
  // Hàm approveChangeRequest này là hàm bạn vừa thêm ở bước trước trong Repo
  await instructorClassRosterRepository.approveChangeRequest(
    requestId,
    adminId
  );

  return {
    success: true,
    message:
      "Đã duyệt yêu cầu đổi lịch thành công. Hệ thống đã cập nhật lịch học và thông báo cho giảng viên.",
  };
};

// 2. Service: Từ chối yêu cầu đổi lịch
const rejectRequestService = async (adminId, payload) => {
  const { requestId, reason } = payload;

  // Validate đầu vào
  if (!requestId) {
    throw new ServiceError("Thiếu thông tin Request ID.", 400);
  }

  // Gọi Repository
  await instructorClassRosterRepository.rejectChangeRequest(
    requestId,
    adminId,
    reason
  );

  return {
    success: true,
    message: "Đã từ chối yêu cầu đổi lịch.",
  };
};

module.exports = {
  listInstructorClassesService,
  getInstructorClassDetailService,
  getInstructorClassRosterService,
  getInstructorClassScheduleService,
  getAttendanceSheetService,
  saveAttendanceService,
  getInstructorScheduleService,
  getInstructorAvailabilityService,
  saveInstructorAvailabilityService,
  addInstructorAvailabilityService,
  requestSessionChangeService,
  approveRequestService,
  rejectRequestService,
};
