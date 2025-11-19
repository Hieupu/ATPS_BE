const instructorClassRepository = require("../repositories/instructorClassRepository");
const instructorClassRosterRepository = require("../repositories/instructorClassRosterRepository");

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

  const roster = await instructorClassRosterRepository.listByClassId(classId);

  return {
    ...classObj,
    StudentCount: roster.length,
  };
};

//3. Lấy danh sách học viên (roster) của 1 lớp cho instructor
const getInstructorClassRosterService = async (classId, instructorId) => {
  const classObj = await instructorClassRepository.findById(classId);

  if (!classObj) {
    throw new ServiceError("Class không tồn tại", 404);
  }

  if (classObj.InstructorID !== instructorId) {
    throw new ServiceError("Bạn không có quyền truy cập lớp này", 403);
  }

  const roster = await instructorClassRosterRepository.listByClassId(classId);

  return {
    Class: classObj,
    Students: roster,
  };
};

module.exports = {
  listInstructorClassesService,
  getInstructorClassDetailService,
  getInstructorClassRosterService,
};
