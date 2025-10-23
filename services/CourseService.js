const courseRepository = require("../repositories/courseRepository");
const enrollmentRepository = require("../repositories/enrollmentRepository");
const classRepository = require("../repositories/classRepository");

class CourseService {
  async createCourse(data) {
    try {
      // Validate required fields
      if (!data.Title || !data.Description) {
        throw new Error("Title and Description are required");
      }

      // Create course
      const newCourse = await courseRepository.create(data);
      return newCourse;
    } catch (error) {
      throw error;
    }
  }

  async getAllCourses() {
    try {
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
        throw new Error("Course not found");
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
        throw new Error("Course not found");
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
        throw new Error("Course not found");
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
}

module.exports = new CourseService();
