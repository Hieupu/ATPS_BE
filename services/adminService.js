const adminRepository = require("../repositories/adminRepository");

class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

class AdminService {
  async getAllAdmins(options = {}) {
    try {
      return await adminRepository.findAll(options);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      if (error.code === "PERMISSION_DENIED") {
        throw new ServiceError("Lỗi khi lấy danh sách admin", 403);
      }
      throw new ServiceError(
        "Lỗi khi lấy danh sách admin",
        error?.status || 500
      );
    }
  }

  async getAdminById(adminId) {
    try {
      const admin = await adminRepository.findById(adminId);
      if (!admin) {
        throw new ServiceError("Admin không tồn tại", 404);
      }
      return admin;
    } catch (error) {
      if (error.code === "PERMISSION_DENIED") {
        throw new ServiceError("Lỗi khi lấy danh sách admin", 403);
      }
      throw new ServiceError(
        error?.message || "Lỗi khi lấy thông tin admin",
        error?.status || 500
      );
    }
  }

  async createAdmin(data) {
    try {
      const accIdNum =
        typeof data.AccID === "string" ? parseInt(data.AccID, 10) : data.AccID;
      if (!accIdNum || !Number.isInteger(accIdNum)) {
        throw new ServiceError("AccID phải là số nguyên dương", 400);
      }

      const trimmedName = (data.FullName || "").trim();
      if (!trimmedName) {
        throw new ServiceError("Thiếu FullName", 400);
      }
      if (trimmedName.length > 255) {
        throw new ServiceError("FullName tối đa 255 ký tự", 400);
      }

      const admin = await adminRepository.create({
        ...data,
        AccID: accIdNum,
        FullName: trimmedName,
      });
      return admin;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      if (error.code === "PERMISSION_DENIED") {
        throw new ServiceError("Lỗi khi tạo admin", 403);
      }
      throw new ServiceError("Lỗi khi tạo admin", error?.status || 500);
    }
  }

  async updateAdmin(adminId, data) {
    try {
      const adminIdNum =
        typeof adminId === "string" ? parseInt(adminId, 10) : adminId;
      if (!adminIdNum || !Number.isInteger(adminIdNum) || adminIdNum < 1) {
        throw new ServiceError("AdminID phải là số nguyên dương", 400);
      }

      const updatePayload = { ...data };
      if ("FullName" in data) {
        const trimmedName = (data.FullName || "").trim();
        if (!trimmedName) {
          throw new ServiceError("FullName không được để trống", 400);
        }
        if (trimmedName.length > 255) {
          throw new ServiceError("FullName tối đa 255 ký tự", 400);
        }
        updatePayload.FullName = trimmedName;
      }

      if (Object.keys(updatePayload).length === 0) {
        throw new ServiceError("Không có dữ liệu để cập nhật", 400);
      }

      const updated = await adminRepository.update(adminIdNum, updatePayload);
      if (!updated) {
        throw new ServiceError("Admin không tồn tại", 404);
      }
      return updated;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      if (error.code === "PERMISSION_DENIED") {
        throw new ServiceError("Lỗi khi cập nhật admin", 403);
      }
      throw new ServiceError("Lỗi khi cập nhật admin", error?.status || 500);
    }
  }
}

module.exports = new AdminService();
