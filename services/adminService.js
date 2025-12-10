const adminRepository = require("../repositories/adminRepository");

class AdminService {
  async getAllAdmins(options = {}) {
    try {
      return await adminRepository.findAll(options);
    } catch (error) {
      throw error;
    }
  }

  async getAdminById(adminId) {
    try {
      const admin = await adminRepository.findById(adminId);
      if (!admin) {
        throw new Error("Admin not found");
      }
      return admin;
    } catch (error) {
      throw error;
    }
  }

  async createAdmin(data) {
    try {
      if (!data.AccID) {
        throw new Error("AccID is required");
      }
      if (!data.FullName) {
        throw new Error("FullName is required");
      }

      const admin = await adminRepository.create(data);
      return admin;
    } catch (error) {
      throw error;
    }
  }

  async updateAdmin(adminId, data) {
    try {
      const updated = await adminRepository.update(adminId, data);
      if (!updated) {
        throw new Error("Admin not found");
      }
      return updated;
    } catch (error) {
      throw error;
    }
  }

}

module.exports = new AdminService();

