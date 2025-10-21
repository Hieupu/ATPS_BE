const CourseModel = require("../models/course");
const CourseRequest = require("../requests/CourseRequest");

/**
 * CourseService - Business logic layer cho Course management
 */
class CourseService {
  // Tạo khóa học mới
  static async createCourse(data) {
    try {
      console.log("📚 CourseService.createCourse - Input data:", data);

      // Tạo CourseRequest object và validate
      const courseRequest = new CourseRequest(data);
      const validation = courseRequest.validateForCreate();

      if (!validation.isValid) {
        return {
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        };
      }

      // Chuyển đổi thành database object
      const courseData = courseRequest.toDatabaseObject();
      console.log(
        "📚 CourseService.createCourse - Database object:",
        courseData
      );

      // Gọi model để tạo course
      const newCourse = await CourseModel.create(courseData);
      console.log("✅ CourseService.createCourse - Result:", newCourse);

      return {
        success: true,
        message: "Tạo khóa học thành công",
        data: newCourse,
      };
    } catch (error) {
      console.error("❌ CourseService.createCourse - Error:", error);
      return {
        success: false,
        message: "Lỗi khi tạo khóa học",
        error: error.message,
      };
    }
  }

  // Lấy danh sách khóa học
  static async getAllCourses(options = {}) {
    try {
      console.log("📚 CourseService.getAllCourses - Options:", options);

      const result = await CourseModel.findAll(options);
      console.log("✅ CourseService.getAllCourses - Result:", result);

      return {
        success: true,
        message: "Lấy danh sách khóa học thành công",
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("❌ CourseService.getAllCourses - Error:", error);
      return {
        success: false,
        message: "Lỗi khi lấy danh sách khóa học",
        error: error.message,
      };
    }
  }

  // Lấy khóa học của instructor
  static async getInstructorCourses(instructorId, options = {}) {
    try {
      console.log(
        "📚 CourseService.getInstructorCourses - InstructorID:",
        instructorId,
        "Options:",
        options
      );

      const result = await CourseModel.findAll({
        ...options,
        instructorId: instructorId,
      });
      console.log("✅ CourseService.getInstructorCourses - Result:", result);

      return {
        success: true,
        message: "Lấy danh sách khóa học của instructor thành công",
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("❌ CourseService.getInstructorCourses - Error:", error);
      return {
        success: false,
        message: "Lỗi khi lấy danh sách khóa học của instructor",
        error: error.message,
      };
    }
  }

  // Lấy chi tiết khóa học
  static async getCourseById(courseId) {
    try {
      console.log("📚 CourseService.getCourseById - CourseID:", courseId);

      const courseData = await CourseModel.findById(courseId);

      if (!courseData) {
        return {
          success: false,
          message: "Không tìm thấy khóa học",
          data: null,
        };
      }

      console.log("✅ CourseService.getCourseById - Result:", courseData);

      return {
        success: true,
        message: "Lấy chi tiết khóa học thành công",
        data: courseData,
      };
    } catch (error) {
      console.error("❌ CourseService.getCourseById - Error:", error);
      return {
        success: false,
        message: "Lỗi khi lấy chi tiết khóa học",
        error: error.message,
      };
    }
  }

  // Cập nhật khóa học
  static async updateCourse(courseId, data) {
    try {
      console.log(
        "📚 CourseService.updateCourse - CourseID:",
        courseId,
        "Data:",
        data
      );

      // Tạo CourseRequest object và validate
      const courseRequest = new CourseRequest(data);
      const validation = courseRequest.validateForUpdate();

      if (!validation.isValid) {
        return {
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        };
      }

      // Chuyển đổi thành database object
      const courseData = courseRequest.toDatabaseObject();
      console.log(
        "📚 CourseService.updateCourse - Database object:",
        courseData
      );

      // Gọi model để cập nhật course
      const updatedCourse = await CourseModel.update(courseId, courseData);

      if (!updatedCourse) {
        return {
          success: false,
          message: "Không tìm thấy khóa học để cập nhật",
          data: null,
        };
      }

      console.log("✅ CourseService.updateCourse - Result:", updatedCourse);

      return {
        success: true,
        message: "Cập nhật khóa học thành công",
        data: updatedCourse,
      };
    } catch (error) {
      console.error("❌ CourseService.updateCourse - Error:", error);
      return {
        success: false,
        message: "Lỗi khi cập nhật khóa học",
        error: error.message,
      };
    }
  }

  // Xóa khóa học
  static async deleteCourse(courseId) {
    try {
      console.log("📚 CourseService.deleteCourse - CourseID:", courseId);

      const deleted = await CourseModel.delete(courseId);

      if (!deleted) {
        return {
          success: false,
          message: "Không tìm thấy khóa học để xóa",
          data: null,
        };
      }

      console.log("✅ CourseService.deleteCourse - Result:", deleted);

      return {
        success: true,
        message: "Xóa khóa học thành công",
        data: { CourseID: courseId },
      };
    } catch (error) {
      console.error("❌ CourseService.deleteCourse - Error:", error);
      return {
        success: false,
        message: "Lỗi khi xóa khóa học",
        error: error.message,
      };
    }
  }

  // Gán khóa học cho lớp
  static async assignCourseToClass(classId, courseId) {
    try {
      console.log(
        "📚 CourseService.assignCourseToClass - ClassID:",
        classId,
        "CourseID:",
        courseId
      );

      // Kiểm tra course có tồn tại không
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return {
          success: false,
          message: "Không tìm thấy khóa học",
          data: null,
        };
      }

      // Cập nhật class với CourseID
      const ClassModel = require("../models/class");
      const updatedClass = await ClassModel.update(classId, {
        CourseID: courseId,
      });

      if (!updatedClass) {
        return {
          success: false,
          message: "Không tìm thấy lớp học",
          data: null,
        };
      }

      console.log("✅ CourseService.assignCourseToClass - Result:", {
        updatedClass,
        course,
      });

      return {
        success: true,
        message: "Gán khóa học cho lớp thành công",
        data: {
          ClassID: classId,
          ClassName: updatedClass.ClassName,
          CourseID: courseId,
          CourseTitle: course.Title,
        },
      };
    } catch (error) {
      console.error("❌ CourseService.assignCourseToClass - Error:", error);
      return {
        success: false,
        message: "Lỗi khi gán khóa học cho lớp",
        error: error.message,
      };
    }
  }
}

module.exports = CourseService;



