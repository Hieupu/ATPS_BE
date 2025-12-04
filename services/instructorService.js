const instructorRepository = require("../repositories/instructorRepository");

class InstructorService {
  async createInstructor(data) {
    try {
      // Validate required fields
      if (!data.AccID || !data.FullName) {
        throw new Error("AccID and FullName are required");
      }

      // Create instructor
      const newInstructor = await instructorRepository.create(data);
      return newInstructor;
    } catch (error) {
      throw error;
    }
  }

  async getAllInstructors() {
    try {
      const instructors = await instructorRepository.findAll();
      return instructors;
    } catch (error) {
      throw error;
    }
  }

  async getInstructorById(id) {
    try {
      const instructor = await instructorRepository.findById(id);
      if (!instructor) {
        throw new Error("Instructor not found");
      }
      return instructor;
    } catch (error) {
      throw error;
    }
  }

  async getInstructorByAccountId(accountId) {
    try {
      const instructor = await instructorRepository.findByAccountId(accountId);
      if (!instructor) {
        throw new Error("Instructor not found");
      }
      return instructor;
    } catch (error) {
      throw error;
    }
  }

  async updateInstructor(id, data) {
    try {
      // Check if instructor exists
      const existingInstructor = await instructorRepository.findById(id);
      if (!existingInstructor) {
        throw new Error("Instructor not found");
      }

      // Update instructor
      const updatedInstructor = await instructorRepository.update(id, data);
      return updatedInstructor;
    } catch (error) {
      throw error;
    }
  }

  async deleteInstructor(id) {
    try {
      // Check if instructor exists
      const existingInstructor = await instructorRepository.findById(id);
      if (!existingInstructor) {
        throw new Error("Instructor not found");
      }

      // Delete instructor
      const deleted = await instructorRepository.delete(id);
      return deleted;
    } catch (error) {
      throw error;
    }
  }

  async getInstructorsByMajor(major) {
    try {
      const instructors = await instructorRepository.findByMajor(major);
      return instructors;
    } catch (error) {
      throw error;
    }
  }

  async getInstructorWithCourses(instructorId) {
    try {
      const instructor = await instructorRepository.findByIdWithCourses(instructorId);
      if (!instructor) {
        throw new Error("Instructor not found");
      }
      return instructor;
    } catch (error) {
      throw error;
    }
  }

  async getInstructorSchedule(instructorId, startDate = null, endDate = null) {
    try {
      // Check if instructor exists
      const existingInstructor = await instructorRepository.findById(instructorId);
      if (!existingInstructor) {
        throw new Error("Instructor not found");
      }

      // Lấy Type và truyền vào getSchedule
      const instructorType = existingInstructor.Type || 'parttime';
      const schedule = await instructorRepository.getSchedule(
        instructorId,
        startDate,
        endDate,
        instructorType
      );

      // Trả về schedule kèm Type để frontend biết
      return {
        schedule,
        instructorType,
        instructor: {
          id: existingInstructor.InstructorID,
          name: existingInstructor.FullName,
          type: instructorType,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async getInstructorStatistics(instructorId) {
    try {
      // Check if instructor exists
      const existingInstructor = await instructorRepository.findById(instructorId);
      if (!existingInstructor) {
        throw new Error("Instructor not found");
      }

      const statistics = await instructorRepository.getStatistics(instructorId);
      return statistics;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new InstructorService();
