const courseService = require("../services/courseService");
const instructorService = require("../services/instructorService");
const learnerService = require("../services/learnerService");

const courseController = {
  // Tạo khóa học mới
  createCourse: async (req, res) => {
    try {
      const courseData = req.body;

      if (!courseData.Title || !courseData.Description) {
        return res.status(400).json({
          success: false,
          message: "Title và Description là bắt buộc",
        });
      }

      const newCourse = await courseService.createCourse(courseData);

      res.status(201).json({
        success: true,
        message: "Tạo khóa học thành công",
        data: newCourse,
      });
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo khóa học",
        error: error.message,
      });
    }
  },

  // Lấy tất cả khóa học
  getAllCourses: async (req, res) => {
    try {
      const courses = await courseService.getAllCourses();

      res.json({
        success: true,
        message: "Lấy danh sách khóa học thành công",
        data: courses,
      });
    } catch (error) {
      console.error("Error getting courses:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách khóa học",
        error: error.message,
      });
    }
  },

  // Lấy khóa học theo ID
  getCourseById: async (req, res) => {
    try {
      const courseId = req.params.id;

      if (!courseId) {
        return res.status(400).json({
          success: false,
          message: "Course ID là bắt buộc",
        });
      }

      const course = await courseService.getCourseById(courseId);

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy khóa học",
        });
      }

      res.json({
        success: true,
        message: "Lấy thông tin khóa học thành công",
        data: course,
      });
    } catch (error) {
      console.error("Error getting course:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin khóa học",
        error: error.message,
      });
    }
  },

  // Cập nhật khóa học
  updateCourse: async (req, res) => {
    try {
      const courseId = req.params.id;
      const updateData = req.body;

      const updatedCourse = await courseService.updateCourse(
        courseId,
        updateData
      );

      if (!updatedCourse) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy khóa học",
        });
      }

      res.json({
        success: true,
        message: "Cập nhật khóa học thành công",
        data: updatedCourse,
      });
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật khóa học",
        error: error.message,
      });
    }
  },

  // Xóa khóa học
  deleteCourse: async (req, res) => {
    try {
      const courseId = req.params.id;

      const deleted = await courseService.deleteCourse(courseId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy khóa học",
        });
      }

      res.json({
        success: true,
        message: "Xóa khóa học thành công",
      });
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa khóa học",
        error: error.message,
      });
    }
  },

  // Lấy khóa học theo trạng thái
  getCoursesByStatus: async (req, res) => {
    try {
      const { status } = req.query;
      const courses = await courseService.getCoursesByStatus(status);

      res.json({
        success: true,
        message: "Lấy danh sách khóa học theo trạng thái thành công",
        data: courses,
      });
    } catch (error) {
      console.error("Error getting courses by status:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách khóa học theo trạng thái",
        error: error.message,
      });
    }
  },

  // Lấy khóa học với số lượng đăng ký
  getCoursesWithEnrollmentCount: async (req, res) => {
    try {
      const courses = await courseService.getCoursesWithEnrollmentCount();

      res.json({
        success: true,
        message: "Lấy danh sách khóa học với số lượng đăng ký thành công",
        data: courses,
      });
    } catch (error) {
      console.error("Error getting courses with enrollment count:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách khóa học với số lượng đăng ký",
        error: error.message,
      });
    }
  },

  // Lấy danh sách đăng ký của khóa học
  getCourseEnrollments: async (req, res) => {
    try {
      const courseId = req.params.courseId;
      const enrollments = await courseService.getCourseEnrollments(courseId);

      res.json({
        success: true,
        message: "Lấy danh sách đăng ký khóa học thành công",
        data: enrollments,
      });
    } catch (error) {
      console.error("Error getting course enrollments:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách đăng ký khóa học",
        error: error.message,
      });
    }
  },

  // Lấy danh sách lớp học của khóa học
  getCourseClasses: async (req, res) => {
    try {
      const courseId = req.params.courseId;
      const classes = await courseService.getCourseClasses(courseId);

      res.json({
        success: true,
        message: "Lấy danh sách lớp học của khóa học thành công",
        data: classes,
      });
    } catch (error) {
      console.error("Error getting course classes:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách lớp học của khóa học",
        error: error.message,
      });
    }
  },
};

module.exports = courseController;
