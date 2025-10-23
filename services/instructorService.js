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
}

module.exports = new InstructorService();
