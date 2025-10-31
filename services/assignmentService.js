// services/assignmentService.js
const assignmentRepository = require("../repositories/assignmentRepository");

class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const ALLOWED_TYPES = ["assignment", "homework"];
const ALLOWED_STATUSES = ["active", "inactive", "deleted"];

function assertValidDateStr(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) throw new ServiceError("Hạn nộp không hợp lệ (yyyy-mm-dd)", 400);
}

const createAssignmentService = async (instructorAccId, data) => {
  const { title, description, deadline, type, unitId, status } = data;
  if (!title?.trim()) throw new ServiceError("Tiêu đề là bắt buộc");
  if (!description?.trim()) throw new ServiceError("Mô tả là bắt buộc");
  if (!deadline) throw new ServiceError("Hạn nộp là bắt buộc");
  assertValidDateStr(deadline);
  if (!ALLOWED_TYPES.includes(type)) throw new ServiceError("Loại bài tập không hợp lệ");
  if (!unitId) throw new ServiceError("UnitID là bắt buộc");

  const canAccess = await assignmentRepository.canInstructorAccessUnit(instructorAccId, unitId);
  if (!canAccess) throw new ServiceError("Bạn không có quyền với Unit này", 403);

  return assignmentRepository.createAssignment({
    title: title.trim(),
    description: description.trim(),
    deadline,
    type,
    unitId: Number(unitId),
    status: ALLOWED_STATUSES.includes(status) ? status : "active",
  });
};

const getAssignmentsService = async (instructorAccId) =>
  assignmentRepository.getAssignmentsByInstructor(instructorAccId);

const updateAssignmentService = async (instructorAccId, assignmentId, payload) => {
  const canAccess = await assignmentRepository.canInstructorAccessAssignment(instructorAccId, assignmentId);
  if (!canAccess) throw new ServiceError("Không có quyền cập nhật bài tập này", 403);

  const updated = await assignmentRepository.updateAssignment(assignmentId, payload);
  if (!updated) throw new ServiceError("Không tìm thấy bài tập", 404);
  return updated;
};

// 🔹 PATCH /assignments/:id/status
const updateAssignmentStatusService = async (instructorAccId, assignmentId, status) => {
  if (!ALLOWED_STATUSES.includes(status)) throw new ServiceError("Trạng thái không hợp lệ", 400);

  const canAccess = await assignmentRepository.canInstructorAccessAssignment(instructorAccId, assignmentId);
  if (!canAccess) throw new ServiceError("Không có quyền cập nhật trạng thái bài tập này", 403);

  const updated = await assignmentRepository.updateAssignment(assignmentId, { status });
  if (!updated) throw new ServiceError("Không tìm thấy bài tập", 404);

  return updated;
};

module.exports = {
  createAssignmentService,
  getAssignmentsService,
  updateAssignmentService,
  updateAssignmentStatusService,
};
