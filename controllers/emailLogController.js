const emailLogService = require("../services/emailLogService");

// Lấy danh sách email logs
const getAllEmailLogs = async (req, res) => {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      templateId: req.query.templateId,
      templateCode: req.query.templateCode,
      recipientEmail: req.query.recipientEmail,
      recipientAccID: req.query.recipientAccID,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const result = await emailLogService.getAllEmailLogs(filters);
    res.status(200).json(result);
  } catch (error) {
    console.error("getAllEmailLogs error:", error);
    res.status(error.status || 500).json({
      message: error.message || "Lỗi khi lấy danh sách email log",
    });
  }
};

// Lấy email log theo ID
const getEmailLogById = async (req, res) => {
  try {
    const emailLogId = parseInt(req.params.id);
    const result = await emailLogService.getEmailLogById(emailLogId);
    res.status(200).json(result);
  } catch (error) {
    console.error("getEmailLogById error:", error);
    res.status(error.status || 500).json({
      message: error.message || "Lỗi khi lấy email log",
    });
  }
};

module.exports = {
  getAllEmailLogs,
  getEmailLogById,
};
