const staffRepository = require("../repositories/staffRepository");

class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

class StaffService {
  async getAllStaff(options = {}) {
    try {
      return await staffRepository.findAll(options);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      if (error.code === "PERMISSION_DENIED") {
        throw new ServiceError("Lỗi khi lấy danh sách nhân viên", 403);
      }
      throw new ServiceError(
        "Lỗi khi lấy danh sách nhân viên",
        error?.status || 500
      );
    }
  }

  async getStaffById(staffId) {
    try {
      const staff = await staffRepository.findById(staffId);
      if (!staff) {
        throw new ServiceError("Nhân viên không tồn tại", 404);
      }
      return staff;
    } catch (error) {
      throw error;
    }
  }

  async createStaff(data) {
    try {
      if (!data.AccID) {
        throw new ServiceError("Thiếu AccID", 400);
      }
      if (!data.FullName || data.FullName.trim() === "") {
        throw new ServiceError("Thiếu FullName", 400);
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
        throw new ServiceError("Nhân viên không tồn tại", 404);
      }
      return updated;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      if (error.code === "PERMISSION_DENIED") {
        throw new ServiceError("Lỗi khi cập nhật nhân viên", 403);
      }
      throw new ServiceError(
        "Lỗi khi cập nhật nhân viên",
        error?.status || 500
      );
    }
  }
}

module.exports = new StaffService();
