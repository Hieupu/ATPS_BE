const {
  listInstructorClassesService,
  getInstructorClassDetailService,
  getInstructorClassRosterService,
} = require("../services/instructorClassService");

// GET /instructor/classes
const listInstructorClasses = async (req, res) => {
  try {
    const instructorId = Number(req.user.id);
    const result = await listInstructorClassesService(instructorId);
    res.status(200).json(result);
  } catch (error) {
    console.error("listInstructorClasses error:", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Lỗi khi lấy danh sách lớp" });
  }
};

// GET /instructor/classes/:classId
const getInstructorClassDetail = async (req, res) => {
  try {
    const instructorId = Number(req.user.id);
    const classId = Number(req.params.classId);

    const result = await getInstructorClassDetailService(classId, instructorId);
    res.status(200).json(result);
  } catch (error) {
    console.error("getInstructorClassDetail error:", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Lỗi khi lấy chi tiết lớp" });
  }
};

// GET /instructor/classes/:classId/students
const getInstructorClassRoster = async (req, res) => {
  try {
    const instructorId = Number(req.user.id);
    const classId = Number(req.params.classId);

    const result = await getInstructorClassRosterService(classId, instructorId);
    res.status(200).json(result);
  } catch (error) {
    console.error("getInstructorClassRoster error:", error);
    res.status(error.status || 500).json({
      message: error.message || "Lỗi khi lấy danh sách học viên của lớp",
    });
  }
};

module.exports = {
  listInstructorClasses,
  getInstructorClassDetail,
  getInstructorClassRoster,
};
