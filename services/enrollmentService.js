const enrollmentRepository = require("../repositories/enrollmentRepository");
const learnerRepository = require("../repositories/learnerRepository");
const courseRepository = require("../repositories/courseRepository");

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
}

module.exports = new EnrollmentService();
