const enrollmentRepository = require("../repositories/enrollmentRepository");
const learnerRepository = require("../repositories/learnerRepository");
const courseRepository = require("../repositories/courseRepository");

class EnrollmentService {
  async createEnrollment(data) {
    try {
      // Validate required fields
      if (!data.LearnerID || !data.CourseID) {
        throw new Error("LearnerID and CourseID are required");
      }

      // Check if learner exists
      const learner = await learnerRepository.findById(data.LearnerID);
      if (!learner) {
        throw new Error("Learner not found");
      }

      // Check if course exists
      const course = await courseRepository.findById(data.CourseID);
      if (!course) {
        throw new Error("Course not found");
      }

      // Check if enrollment already exists
      const existingEnrollment =
        await enrollmentRepository.checkEnrollmentExists(
          data.LearnerID,
          data.CourseID
        );
      if (existingEnrollment) {
        throw new Error("Enrollment already exists");
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
        throw new Error("Enrollment not found");
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
        throw new Error("Enrollment not found");
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
        throw new Error("Enrollment not found");
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
