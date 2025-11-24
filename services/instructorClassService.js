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
  const classObj = await instructorClassRepository.findById(classId);

  if (!classObj) {
    throw new ServiceError("Class không tồn tại", 404);
  }

  if (classObj.InstructorID !== instructorId) {
    throw new ServiceError("Bạn không có quyền truy cập lớp này", 403);
  }

  const students = await instructorClassRosterRepository.getStudents(classId);
  return {
    ...classObj,
    StudentCount: students.length,
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
    Class: classObj,
    Students: students,
  };
};

// 4. Lấy lịch các buổi học (dùng cho thời khóa biểu T2-CN và vào Zoom)
const getInstructorClassScheduleService = async (classId, instructorId) => {
  const classObj = await instructorClassRepository.findById(classId);

  if (!classObj) {
    throw new ServiceError("Lớp học không tồn tại", 404);
  }

  if (classObj.InstructorID !== instructorId) {
    throw new ServiceError("Bạn không có quyền truy cập lớp này", 403);
  }

  const sessions = await instructorClassRosterRepository.getSessions(classId);

  return {
    Class: classObj,
    Sessions: sessions, // mảng Session object
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
