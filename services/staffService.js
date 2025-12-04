const staffRepository = require("../repositories/staffRepository");

class StaffService {
  async getAllStaff(options = {}) {
    try {
      return await staffRepository.findAll(options);
    } catch (error) {
      throw error;
    }
  }

  async getStaffById(staffId) {
    try {
      const staff = await staffRepository.findById(staffId);
      if (!staff) {
        throw new Error("Staff not found");
      }
      return staff;
    } catch (error) {
      throw error;
    }
  }

  async createStaff(data) {
    try {
      if (!data.AccID) {
        throw new Error("AccID is required");
      }
      if (!data.FullName) {
        throw new Error("FullName is required");
      }

      const staff = await staffRepository.create(data);
      return staff;
    } catch (error) {
      throw error;
    }
  }

  async updateStaff(staffId, data) {
    try {
      const updated = await staffRepository.update(staffId, data);
      if (!updated) {
        throw new Error("Staff not found");
      }
      return updated;
    } catch (error) {
      throw error;
    }
  }

  async deleteStaff(staffId) {
    try {
      const deleted = await staffRepository.delete(staffId);
      if (!deleted) {
        throw new Error("Staff not found");
      }
      return deleted;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new StaffService();

