const learnerRepository = require("../repositories/learnerRepository");
const enrollmentRepository = require("../repositories/enrollmentRepository");

class LearnerService {
  async createLearner(data) {
    try {
      // Validate required fields
      if (!data.AccID) {
        throw new Error("AccID is required");
      }

      // Create learner
      const newLearner = await learnerRepository.create(data);
      return newLearner;
    } catch (error) {
      throw error;
    }
  }

  async getAllLearners() {
    try {
      const learners = await learnerRepository.findAll();
      return learners;
    } catch (error) {
      throw error;
    }
  }

  async getLearnerById(id) {
    try {
      const learner = await learnerRepository.findById(id);
      if (!learner) {
        throw new Error("Learner not found");
      }
      return learner;
    } catch (error) {
      throw error;
    }
  }

  async getLearnerByAccountId(accountId) {
    try {
      const learner = await learnerRepository.findByAccountId(accountId);
      if (!learner) {
        throw new Error("Learner not found");
      }
      return learner;
    } catch (error) {
      throw error;
    }
  }

  async updateLearner(id, data) {
    try {
      // Check if learner exists
      const existingLearner = await learnerRepository.findById(id);
      if (!existingLearner) {
        throw new Error("Learner not found");
      }

      // Update learner
      const updatedLearner = await learnerRepository.update(id, data);
      return updatedLearner;
    } catch (error) {
      throw error;
    }
  }

  async deleteLearner(id) {
    try {
      // Check if learner exists
      const existingLearner = await learnerRepository.findById(id);
      if (!existingLearner) {
        throw new Error("Learner not found");
      }

      // Delete learner
      const deleted = await learnerRepository.delete(id);
      return deleted;
    } catch (error) {
      throw error;
    }
  }

  async getLearnersWithEnrollmentCount() {
    try {
      const learners = await learnerRepository.getLearnersWithEnrollmentCount();
      return learners;
    } catch (error) {
      throw error;
    }
  }

  async getLearnerEnrollments(learnerId) {
    try {
      const enrollments = await enrollmentRepository.findByLearnerId(learnerId);
      return enrollments;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new LearnerService();
