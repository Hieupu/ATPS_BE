const logRepository = require("../repositories/logRepository");

class LogService {
  // Ghi log đơn giản
  async logAction({ action, accId, detail }) {
    if (!action || !accId) {
      throw new Error("action và accId là bắt buộc");
    }

    return await logRepository.create({
      Action: action,
      AccID: accId,
      Detail: detail || "",
    });
  }

  // Lấy log gần đây (cho dashboard)
  async getRecentLogs(limit = 50) {
    return await logRepository.findAll(limit);
  }

  // Lấy log theo action (nếu cần mở rộng)
  async getLogsByAction(action, limit = 50) {
    return await logRepository.findByAction(action, limit);
  }
}

module.exports = new LogService();



