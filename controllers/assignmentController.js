const {
  createAssignmentService,
  getAssignmentsService,
  updateAssignmentService,
  updateAssignmentStatusService,
} = require("../services/assignmentService");

const createAssignment = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const assignmentData = req.body;
    const assignment = await createAssignmentService(instructorAccId, assignmentData);
    res.status(201).json({ message: "Tạo bài tập thành công", assignment });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Lỗi hệ thống" });
  }
};

const getAssignments = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const assignments = await getAssignmentsService(instructorAccId);
    res.json({ assignments });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách bài tập" });
  }
};

const updateAssignment = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const assignmentId = Number(req.params.id);
    const payload = req.body;
    const assignment = await updateAssignmentService(instructorAccId, assignmentId, payload);
    res.json({ message: "Cập nhật bài tập thành công", assignment });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Lỗi hệ thống" });
  }
};

const updateAssignmentStatus = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const assignmentId = Number(req.params.id);
    const { status } = req.body;
    const assignment = await updateAssignmentStatusService(instructorAccId, assignmentId, status);
    res.json({ message: "Cập nhật trạng thái bài tập thành công", assignment });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Lỗi hệ thống" });
  }
};

module.exports = {
  createAssignment,
  getAssignments,
  updateAssignment,
  updateAssignmentStatus,
};
