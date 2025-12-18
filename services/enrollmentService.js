const enrollmentRepository = require("../repositories/enrollmentRepository");
const learnerRepository = require("../repositories/learnerRepository");
const courseRepository = require("../repositories/courseRepository");
const classRepository = require("../repositories/classRepository");
const notificationService = require("../services/notificationService");

class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

class EnrollmentService {
  async createEnrollment(data) {
    try {
      // Validate required fields
      if (!data.LearnerID || !data.CourseID) {
        throw new ServiceError("Thiếu LearnerID hoặc CourseID", 400);
      }

      // Check if learner exists
      const learner = await learnerRepository.findById(data.LearnerID);
      if (!learner) {
        throw new ServiceError("Học viên không tồn tại", 404);
      }

      // Check if course exists
      const course = await courseRepository.findById(data.CourseID);
      if (!course) {
        throw new ServiceError("Khóa học không tồn tại", 404);
      }

      // Check if enrollment already exists
      const existingEnrollment =
        await enrollmentRepository.checkEnrollmentExists(
          data.LearnerID,
          data.CourseID
        );
      if (existingEnrollment) {
        throw new ServiceError("Đăng ký đã tồn tại", 409);
      }

      // Create enrollment
      const newEnrollment = await enrollmentRepository.create(data);
      return newEnrollment;
    } catch (error) {
      throw error;
    }
  }

  async getAllEnrollments() {
    try {
      const enrollments = await enrollmentRepository.findAll();
      return enrollments;
    } catch (error) {
      throw error;
    }
  }

  async getEnrollmentById(id) {
    try {
      const enrollment = await enrollmentRepository.findById(id);
      if (!enrollment) {
        throw new ServiceError("Đăng ký không tồn tại", 404);
      }
      return enrollment;
    } catch (error) {
      throw error;
    }
  }

  async getEnrollmentsByLearnerId(learnerId) {
    try {
      const enrollments = await enrollmentRepository.findByLearnerId(learnerId);
      return enrollments;
    } catch (error) {
      throw error;
    }
  }

  async getEnrollmentsByCourseId(courseId) {
    try {
      const enrollments = await enrollmentRepository.findByCourseId(courseId);
      return enrollments;
    } catch (error) {
      throw error;
    }
  }

  async updateEnrollment(id, data) {
    try {
      // Check if enrollment exists
      const existingEnrollment = await enrollmentRepository.findById(id);
      if (!existingEnrollment) {
        throw new ServiceError("Đăng ký không tồn tại", 404);
      }

      // Update enrollment
      const updatedEnrollment = await enrollmentRepository.update(id, data);
      return updatedEnrollment;
    } catch (error) {
      throw error;
    }
  }

  async deleteEnrollment(id) {
    try {
      // Check if enrollment exists
      const existingEnrollment = await enrollmentRepository.findById(id);
      if (!existingEnrollment) {
        throw new ServiceError("Đăng ký không tồn tại", 404);
      }

      // Delete enrollment
      const deleted = await enrollmentRepository.delete(id);
      return deleted;
    } catch (error) {
      throw error;
    }
  }

  // Lấy enrollments của một class (theo API_TIME_MANAGEMENT_GUIDE.md)
  async getClassEnrollments(classId) {
    try {
      const enrollments = await enrollmentRepository.findByClassId(classId);
      return enrollments;
    } catch (error) {
      throw error;
    }
  }

  async findByLearnerAndClass(learnerId, classId) {
    try {
      const row = await enrollmentRepository.findOneByLearnerAndClass(
        learnerId,
        classId
      );
      return row || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Đổi lớp cho học viên (admin flow)
   * - Không xử lý thanh toán, chỉ đổi Enrollment.ClassID
   * - Tạo notification in-app cho học viên thông báo đổi lớp
   */
  async changeClassForLearner({ learnerId, fromClassId, toClassId }) {
    try {
      if (!learnerId || !fromClassId || !toClassId) {
        throw new ServiceError(
          "LearnerID, fromClassId và toClassId là bắt buộc",
          400
        );
      }

      if (String(fromClassId) === String(toClassId)) {
        throw new ServiceError(
          "Lớp mới phải khác lớp hiện tại khi đổi lớp cho học viên",
          400
        );
      }

      // Tìm enrollment hiện tại
      const currentEnrollment = await this.findByLearnerAndClass(
        learnerId,
        fromClassId
      );
      if (!currentEnrollment) {
        throw new ServiceError(
          "Không tìm thấy đăng ký của học viên cho lớp hiện tại",
          404
        );
      }

      // Kiểm tra lớp mới tồn tại
      const newClassData = await classRepository.findById(toClassId);
      if (!newClassData || newClassData.length === 0) {
        throw new ServiceError("Lớp mới không tồn tại", 404);
      }

      // Không cho đăng ký trùng
      const existsInTarget = await enrollmentRepository.checkEnrollmentExists(
        learnerId,
        toClassId
      );
      if (existsInTarget) {
        throw new ServiceError(
          "Học viên đã đăng ký lớp mục tiêu, không thể đổi lớp trùng",
          400
        );
      }

      // Lấy thông tin lớp cũ và lớp mới (tên + ID) để log / notification
      const oldClassData = await classRepository.findById(fromClassId);
      const oldClassCoreName =
        (Array.isArray(oldClassData) && oldClassData[0]?.Name) || "";
      const newClassCoreName =
        (Array.isArray(newClassData) && newClassData[0]?.Name) || "";

      const oldClassLabel = ` ${oldClassCoreName || "Lớp cũ"}`;
      const newClassLabel = `${newClassCoreName || "Lớp mới"}`;

      // Đổi ClassID của enrollment hiện tại sang lớp mới
      const updatedEnrollment = await enrollmentRepository.update(
        currentEnrollment.EnrollmentID,
        { ClassID: toClassId }
      );

      // Tạo notification cho học viên (không block nếu lỗi)
      try {
        await notificationService.createClassChangeNotification(
          currentEnrollment.EnrollmentID,
          oldClassLabel,
          newClassLabel
        );
      } catch (notifyError) {
        console.error(
          "[changeClassForLearner] Error creating class change notification:",
          notifyError
        );
      }

      return updatedEnrollment;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new EnrollmentService();
