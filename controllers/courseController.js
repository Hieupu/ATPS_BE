const courseService = require("../services/courseService");
const instructorService = require("../services/instructorService");
const learnerService = require("../services/learnerService");
const logService = require("../services/logService");

const courseController = {
  // Tạo khóa học mới
  createCourse: async (req, res) => {
    try {
      const courseData = req.body;
      const adminAccID = req.user ? req.user.AccID : null;

      if (!courseData.Title || !courseData.Description) {
        return res.status(400).json({
          success: false,
          message: "Title và Description là bắt buộc",
        });
      }

      const newCourse = await courseService.createCourse(courseData);

      // Ghi log CREATE_COURSE
      if (adminAccID && newCourse?.CourseID) {
        await logService.logAction({
          action: "CREATE_COURSE",
          accId: adminAccID,
          detail: `CourseID: ${newCourse.CourseID}, Title: ${newCourse.Title}`,
        });
      }

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
      const adminAccID = req.user ? req.user.AccID : null;

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

      // Ghi log UPDATE_COURSE
      if (adminAccID && updatedCourse?.CourseID) {
        await logService.logAction({
          action: "UPDATE_COURSE",
          accId: adminAccID,
          detail: `CourseID: ${updatedCourse.CourseID}, Title: ${updatedCourse.Title}`,
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
      const adminAccID = req.user ? req.user.AccID : null;

      // Lấy thông tin khóa học trước khi xóa để log
      let course = null;
      if (adminAccID) {
        course = await courseService.getCourseById(courseId);
      }

      const deleted = await courseService.deleteCourse(courseId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy khóa học",
        });
      }

      // Ghi log DELETE_COURSE
      if (adminAccID && course) {
        await logService.logAction({
          action: "DELETE_COURSE",
          accId: adminAccID,
          detail: `CourseID: ${course.CourseID}, Title: ${course.Title}`,
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

  // Admin duyệt khóa học
  approveCourse: async (req, res) => {
    try {
      const courseId = req.params.id;
      const { action } = req.body; // 'APPROVE' hoặc 'REJECT'
      const adminAccID = req.user ? req.user.AccID : null;

      if (!action || !["APPROVE", "REJECT"].includes(action)) {
        return res.status(400).json({
          success: false,
          message: "Action phải là 'APPROVE' hoặc 'REJECT'",
        });
      }

      const course = await courseService.getCourseById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy khóa học",
        });
      }

      // Chỉ cho phép duyệt các khóa học đang ở trạng thái IN_REVIEW hoặc DRAFT
      if (course.Status !== "IN_REVIEW" && course.Status !== "DRAFT") {
        return res.status(400).json({
          success: false,
          message: "Chỉ có thể duyệt khóa học ở trạng thái IN_REVIEW hoặc DRAFT",
        });
      }

      const newStatus = action === "APPROVE" ? "APPROVED" : "DRAFT";
      const updatedCourse = await courseService.updateCourse(courseId, {
        Status: newStatus,
      });

      // Ghi log APPROVE_COURSE / REJECT_COURSE
      if (adminAccID && updatedCourse?.CourseID) {
        await logService.logAction({
          action: action === "APPROVE" ? "APPROVE_COURSE" : "REJECT_COURSE",
          accId: adminAccID,
          detail: `CourseID: ${updatedCourse.CourseID}, Title: ${updatedCourse.Title}`,
        });
      }

      res.json({
        success: true,
        message:
          action === "APPROVE"
            ? "Duyệt khóa học thành công"
            : "Từ chối khóa học thành công",
        data: updatedCourse,
      });
    } catch (error) {
      console.error("Error approving course:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi duyệt khóa học",
        error: error.message,
      });
    }
  },
};

module.exports = courseController;
