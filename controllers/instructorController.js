const Instructor = require("../models/instructor");

const instructorController = {
  // Lấy tất cả giảng viên
  getAllInstructors: async (req, res) => {
    try {
      const instructors = await Instructor.findAll();

      res.status(200).json({
        success: true,
        message: "Lấy danh sách giảng viên thành công",
        data: instructors,
      });
    } catch (error) {
      console.error("Error getting instructors:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách giảng viên",
        error: error.message,
      });
    }
  },

  // Lấy một giảng viên theo ID
  getInstructorById: async (req, res) => {
    try {
      const instructorId = req.params.id;
      const instructor = await Instructor.findById(instructorId);

      if (!instructor) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giảng viên",
        });
      }

      // Lấy các khóa học mà giảng viên đang dạy
      const courses = await Instructor.getCourses(instructorId);
      instructor.courses = courses;

      res.status(200).json({
        success: true,
        message: "Lấy thông tin giảng viên thành công",
        data: instructor,
      });
    } catch (error) {
      console.error("Error getting instructor:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin giảng viên",
        error: error.message,
      });
    }
  },

  // Lấy các khóa học của giảng viên
  getInstructorCourses: async (req, res) => {
    try {
      const instructorId = req.params.id;

      // Kiểm tra giảng viên có tồn tại không
      const exists = await Instructor.exists(instructorId);
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giảng viên",
        });
      }

      const courses = await Instructor.getCourses(instructorId);

      res.status(200).json({
        success: true,
        message: "Lấy danh sách khóa học thành công",
        data: courses,
      });
    } catch (error) {
      console.error("Error getting instructor courses:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách khóa học",
        error: error.message,
      });
    }
  },
};

module.exports = instructorController;
