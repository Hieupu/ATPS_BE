const emailLogRepository = require("../repositories/emailLogRepository");

class ServiceError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
    this.name = "ServiceError";
  }
}

// Lấy danh sách email logs với filter và pagination
const getAllEmailLogs = async (filters = {}) => {
  try {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    const queryFilters = {
      ...filters,
      limit,
      offset,
    };

    const logs = await emailLogRepository.findAll(queryFilters);
    const total = await emailLogRepository.count(filters);
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  } catch (error) {
    console.error("Error in getAllEmailLogs:", error);
    throw new ServiceError(
      error.message || "Lỗi khi lấy danh sách email log",
      error.status || 500
    );
  }
};

// Lấy email log theo ID
const getEmailLogById = async (emailLogId) => {
  try {
    const log = await emailLogRepository.findById(emailLogId);
    if (!log) {
      throw new ServiceError("Không tìm thấy email log", 404);
    }

    return {
      success: true,
      data: log,
    };
  } catch (error) {
    console.error("Error in getEmailLogById:", error);
    throw new ServiceError(
      error.message || "Lỗi khi lấy email log",
      error.status || 500
    );
  }
};

// Tạo email log mới
const createEmailLog = async (logData) => {
  try {
    const log = await emailLogRepository.create(logData);
    return {
      success: true,
      data: log,
    };
  } catch (error) {
    console.error("Error in createEmailLog:", error);
    throw new ServiceError(
      error.message || "Lỗi khi tạo email log",
      error.status || 500
    );
  }
};

// Cập nhật trạng thái email log
const updateEmailLogStatus = async (
  emailLogId,
  status,
  errorMessage = null
) => {
  try {
    const sentAt = status === "SENT" ? new Date() : null;
    const log = await emailLogRepository.updateStatus(
      emailLogId,
      status,
      errorMessage,
      sentAt
    );
    return {
      success: true,
      data: log,
    };
  } catch (error) {
    console.error("Error in updateEmailLogStatus:", error);
    throw new ServiceError(
      error.message || "Lỗi khi cập nhật trạng thái email log",
      error.status || 500
    );
  }
};

module.exports = {
  getAllEmailLogs,
  getEmailLogById,
  createEmailLog,
  updateEmailLogStatus,
};
