const assignmentRepository = require("../repositories/assignmentRepository");

class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const ALLOWED_TYPES = ["assignment", "homework"];
const ALLOWED_STATUSES = ["draft", "active", "inactive", "deleted"];

function assertValidDateStr(dateStr) {
  if (!dateStr) return;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) throw new ServiceError("Hạn nộp không hợp lệ (yyyy-mm-dd)", 400);
}

// Lấy InstructorID từ AccID
const getInstructorIdByAccId = async (accId) => {
  const db = await require("../config/db")();
  const [rows] = await db.query("SELECT InstructorID FROM instructor WHERE AccID = ?", [accId]);
  if (!rows.length) throw new ServiceError("Không tìm thấy InstructorID cho tài khoản này", 404);
  return rows[0].InstructorID;
};

// Tạo assignment
const createAssignmentService = async (instructorAccId, data) => {
  const { title, description, deadline, type, status, fileURL, unitId, unitTitle } = data;

  if (!title?.trim()) throw new ServiceError("Tiêu đề là bắt buộc");
  if (!description?.trim()) throw new ServiceError("Mô tả là bắt buộc");
  assertValidDateStr(deadline);
  if (type && !ALLOWED_TYPES.includes(type)) throw new ServiceError("Loại bài tập không hợp lệ");
  let resolvedUnitId = null;

  if (Object.prototype.hasOwnProperty.call(data, "unitId")) {
    if (unitId != null) {
      const ok = await assignmentRepository.canInstructorAccessUnit(instructorAccId, unitId);
      if (!ok) throw new ServiceError("Không tìm thấy Unit hoặc bạn không có quyền", 403);
      resolvedUnitId = unitId;
    } else {
      resolvedUnitId = null; 
    }
  } else if (unitTitle) {
    const id = await assignmentRepository.findUnitIdByTitleForInstructor(instructorAccId, unitTitle);
    if (!id) throw new ServiceError("Không tìm thấy Unit hoặc bạn không có quyền", 403);
    resolvedUnitId = id;
  }

  const instructorId = await getInstructorIdByAccId(instructorAccId);

  const assignment = await assignmentRepository.createAssignment({
    instructorId,
    title,
    description,
    deadline,
    type: type || "assignment",
    unitId: resolvedUnitId, 
    status: ALLOWED_STATUSES.includes(status)
      ? status
      : resolvedUnitId ? "active" : "draft",
    fileURL,
  });

  return assignment;
};

// Lấy danh sách
const getAssignmentsService = async (instructorAccId) =>
  assignmentRepository.getAssignmentsByInstructor(instructorAccId);

// Xem chi tiết
const getAssignmentDetailService = async (instructorAccId, assignmentId) => {
  const canAccess = await assignmentRepository.canInstructorAccessAssignment(instructorAccId, assignmentId);
  if (!canAccess) throw new ServiceError("Bạn không có quyền truy cập bài tập này", 403);
  const detail = await assignmentRepository.getAssignmentById(assignmentId);
  if (!detail) throw new ServiceError("Không tìm thấy bài tập", 404);
  return detail;
};

// Cập nhật assignment
const updateAssignmentService = async (instructorAccId, assignmentId, payload) => {
  const canAccess = await assignmentRepository.canInstructorAccessAssignment(instructorAccId, assignmentId);
  if (!canAccess) throw new ServiceError("Không có quyền cập nhật bài tập này", 403);

  if (payload.type && !ALLOWED_TYPES.includes(payload.type)) {
    throw new ServiceError("Loại bài tập không hợp lệ");
  }
  assertValidDateStr(payload.deadline);
  if (payload.status && !ALLOWED_STATUSES.includes(payload.status)) {
    throw new ServiceError("Trạng thái không hợp lệ");
  }

  let resolvedUnitId = undefined; 
  if (Object.prototype.hasOwnProperty.call(payload, "unitId")) {
    if (payload.unitId == null) {
      resolvedUnitId = null;
    } else {
      const ok = await assignmentRepository.canInstructorAccessUnit(instructorAccId, payload.unitId);
      if (!ok) throw new ServiceError("Không tìm thấy Unit hoặc bạn không có quyền", 403);
      resolvedUnitId = payload.unitId;
    }
  } else if (Object.prototype.hasOwnProperty.call(payload, "unitTitle")) {
    if (payload.unitTitle) {
      const id = await assignmentRepository.findUnitIdByTitleForInstructor(instructorAccId, payload.unitTitle);
      if (!id) throw new ServiceError("Không tìm thấy Unit hoặc bạn không có quyền", 403);
      resolvedUnitId = id;
    } else {
      resolvedUnitId = null;
    }
  }

  const updates = {
    Title: payload.title,
    Description: payload.description,
    Deadline: payload.deadline || null,
    Type: payload.type,
    FileURL: payload.fileURL,
    Status: payload.status,
    UnitID: resolvedUnitId,
  };

  return assignmentRepository.updateAssignment(assignmentId, updates);
};

// Xóa mềm
const deleteAssignmentService = async (instructorAccId, assignmentId) => {
  const canAccess = await assignmentRepository.canInstructorAccessAssignment(instructorAccId, assignmentId);
  if (!canAccess) throw new ServiceError("Bạn không có quyền xóa bài tập này", 403);
  return assignmentRepository.softDeleteAssignment(assignmentId);
};
const getUnitsService = async (instructorAccId) => {
  return assignmentRepository.getUnitsByInstructor(instructorAccId);
};
// Units lọc theo course
const getUnitsByCourseService = async (instructorAccId, courseId) => {
  if (!courseId) return assignmentRepository.getUnitsByInstructor(instructorAccId);
  return assignmentRepository.getUnitsByInstructorAndCourse(instructorAccId, courseId);
};

// Courses của instructor
const getCoursesService = async (instructorAccId) => {
  return assignmentRepository.getCoursesByInstructor(instructorAccId);
};
module.exports = {
  createAssignmentService,
  getAssignmentsService,
  getAssignmentDetailService,
  updateAssignmentService,
  deleteAssignmentService,
  getUnitsService,
  getUnitsByCourseService,
  getCoursesService,
};
