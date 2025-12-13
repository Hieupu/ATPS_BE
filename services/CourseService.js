const courseRepository = require("../repositories/courseRepository");
const enrollmentRepository = require("../repositories/enrollmentRepository");
const classRepository = require("../repositories/classRepository");

class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

class CourseService {
  async createCourse(data) {
    try {
      // Validate required fields
      if (!data.Title || !data.Description) {
        throw new ServiceError("Thiếu Title hoặc Description", 400);
      }

      // Create course
      const newCourse = await courseRepository.create(data);
      return newCourse;
    } catch (error) {
      throw error;
    }
  }

  async getAllCourses(options = {}) {
    try {
      const { status, isAdmin } = options;

      // Nếu là admin, chỉ lấy IN_REVIEW, APPROVED, PUBLISHED
      if (isAdmin) {
        const allCourses = await courseRepository.findAll();
        const allowedStatuses = ["IN_REVIEW", "APPROVED", "PUBLISHED"];
        const filtered = allCourses.filter((c) =>
          allowedStatuses.includes(c.Status?.toUpperCase())
        );
        return filtered;
      }

      // Nếu có filter status cụ thể
      if (status) {
        if (Array.isArray(status)) {
          const allCourses = await courseRepository.findAll();
          return allCourses.filter((c) =>
            status.includes(c.Status?.toUpperCase())
          );
        } else {
          return await courseRepository.findByStatus(status);
        }
      }

      const courses = await courseRepository.findAll();
      return courses;
    } catch (error) {
      throw error;
    }
  }

  async getCourseById(id) {
    try {
      const course = await courseRepository.findById(id);
      if (!course) {
        throw new ServiceError("Khóa học không tồn tại", 404);
      }
      return course;
    } catch (error) {
      throw error;
    }
  }

  async updateCourse(id, data) {
    try {
      // Check if course exists
      const existingCourse = await courseRepository.findById(id);
      if (!existingCourse) {
        throw new ServiceError("Khóa học không tồn tại", 404);
      }

      // Update course
      const updatedCourse = await courseRepository.update(id, data);
      return updatedCourse;
    } catch (error) {
      throw error;
    }
  }

  async deleteCourse(id) {
    try {
      // Check if course exists
      const existingCourse = await courseRepository.findById(id);
      if (!existingCourse) {
        throw new ServiceError("Khóa học không tồn tại", 404);
      }

      // Delete course
      const deleted = await courseRepository.delete(id);
      return deleted;
    } catch (error) {
      throw error;
    }
  }

  async getCoursesByStatus(status) {
    try {
      const courses = await courseRepository.findByStatus(status);
      return courses;
    } catch (error) {
      throw error;
    }
  }

  async getCoursesWithEnrollmentCount() {
    try {
      const courses = await courseRepository.getCoursesWithEnrollmentCount();
      return courses;
    } catch (error) {
      throw error;
    }
  }

  async getCourseEnrollments(courseId) {
    try {
      const enrollments = await enrollmentRepository.findByCourseId(courseId);
      return enrollments;
    } catch (error) {
      throw error;
    }
  }

  async getCourseClasses(courseId) {
    try {
      const classes = await classRepository.findByCourseId(courseId);
      return classes;
    } catch (error) {
      throw error;
    }
  }

  // Kiểm tra course có đang được sử dụng bởi lớp học nào không
  async checkCourseInUse(courseId) {
    try {
      const classes = await classRepository.findByCourseId(courseId);

      // Lọc các lớp có status != CLOSE, CANCEL, CANCELLED
      const activeClasses = classes.filter((c) => {
        const status = (c.Status || "").toUpperCase();
        return (
          status !== "CLOSE" && status !== "CANCEL" && status !== "CANCELLED"
        );
      });

      return {
        inUse: activeClasses.length > 0,
        classes: activeClasses,
        totalClasses: classes.length,
      };
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật trạng thái course với validation
  async updateCourseStatus(courseId, newStatus, action = null) {
    try {
      const course = await courseRepository.findById(courseId);
      if (!course) {
        throw new ServiceError("Khóa học không tồn tại", 404);
      }

      const currentStatus = (course.Status || "").toUpperCase();
      const targetStatus = (newStatus || "").toUpperCase();

      // Validation transitions
      const validTransitions = {
        IN_REVIEW: ["DRAFT", "APPROVED"], // reject → DRAFT, approve → APPROVED
        APPROVED: ["DRAFT", "PUBLISHED"],
        PUBLISHED: ["APPROVED"],
      };

      if (!validTransitions[currentStatus]?.includes(targetStatus)) {
        throw new ServiceError(
          `Không thể chuyển từ ${currentStatus} sang ${targetStatus}. ` +
            `Chuyển đổi hợp lệ: ${
              validTransitions[currentStatus]?.join(", ") || "không có"
            }`,
          400
        );
      }

      // Nếu chuyển từ PUBLISHED, kiểm tra lớp học đang sử dụng
      if (currentStatus === "PUBLISHED" && targetStatus !== "PUBLISHED") {
        const checkResult = await this.checkCourseInUse(courseId);
        if (checkResult.inUse) {
          const classNames = checkResult.classes
            .map((c) => c.Name || `ClassID: ${c.ClassID}`)
            .join(", ");
          throw new ServiceError(
            `Không thể chuyển trạng thái. Khóa học đang được sử dụng bởi ${checkResult.classes.length} lớp học: ${classNames}`,
            409
          );
        }
      }

      // Update status
      await courseRepository.update(courseId, { Status: targetStatus });
      const updatedCourse = await courseRepository.findById(courseId);

      return updatedCourse;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new CourseService();
