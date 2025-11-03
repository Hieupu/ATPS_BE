const {
  createAssignmentService,
  getAssignmentsService,
  getAssignmentDetailService,
  updateAssignmentService,
  deleteAssignmentService,
  getUnitsService,
  getUnitsByCourseService,
  getCoursesService,
} = require("../services/assignmentService");
const cloudinary = require("../config/cloudinary");

const createAssignment = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const assignment = await createAssignmentService(instructorAccId, req.body);
    res.status(201).json({ message: "Tạo bài tập thành công", assignment });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Lỗi hệ thống" });
  }
};

const getAssignments = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const assignments = await getAssignmentsService(instructorAccId);
    res.json({ assignments });
  } catch {
    res.status(500).json({ message: "Lỗi khi lấy danh sách bài tập" });
  }
};

const getAssignmentDetail = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const assignmentId = Number(req.params.id);
    const detail = await getAssignmentDetailService(instructorAccId, assignmentId);
    res.json(detail);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Lỗi hệ thống" });
  }
};

const updateAssignment = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const assignmentId = Number(req.params.id);
    const result = await updateAssignmentService(instructorAccId, assignmentId, req.body);
    res.json({ message: "Cập nhật thành công", assignment: result });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Lỗi hệ thống" });
  }
};

const deleteAssignment = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const assignmentId = Number(req.params.id);
    const result = await deleteAssignmentService(instructorAccId, assignmentId);
    res.json({ message: "Đã xóa bài tập (soft delete)", assignment: result });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Lỗi hệ thống" });
  }
};

const getUnits = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { courseId } = req.query;
    const units = courseId
      ? await getUnitsByCourseService(instructorAccId, Number(courseId))
      : await getUnitsService(instructorAccId);
    res.status(200).json({ units });
  } catch (err) {
    res.status(500).json({ message: "Không thể lấy danh sách Unit", error: err.message });
  }
};

const getCourses = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const courses = await getCoursesService(instructorAccId);
    res.status(200).json({ courses });
  } catch (err) {
    res.status(500).json({ message: "Không thể lấy danh sách Course", error: err.message });
  }
};
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Không có file nào được tải lên" });
    }
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "assignments", 
        resource_type: "auto", 
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({
            message: "Upload thất bại",
            error: error.message
          });
        }

        // Trả về secure URL từ Cloudinary
        return res.status(200).json({
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          size: result.bytes
        });
      }
    );
    const { Readable } = require("stream");
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);

  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({
      message: "Upload thất bại",
      error: err.message
    });
  }
};

module.exports = {
  createAssignment,
  getAssignments,
  getAssignmentDetail,
  updateAssignment,
  deleteAssignment,
  getUnits,
  getCourses,
  uploadFile,
};