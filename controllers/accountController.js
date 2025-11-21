const accountService = require("../services/accountService");

const accountController = {
  // Lấy thông tin account theo ID
  getAccountById: async (req, res) => {
    try {
      // Hỗ trợ cả accId và accid (từ URL parameter)
      const accId = req.params.accId || req.params.accid;
      
      if (!accId) {
        return res.status(400).json({
          success: false,
          message: "AccID là bắt buộc",
          error: "AccID is required",
        });
      }

      const account = await accountService.getAccountById(accId);

      res.status(200).json({
        success: true,
        message: "Lấy thông tin tài khoản thành công",
        data: account,
      });
    } catch (error) {
      console.error("Error getting account:", error);
      if (error.message === "Account not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tài khoản",
          error: error.message,
        });
      }
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin tài khoản",
        error: error.message,
      });
    }
  },

  // Cập nhật thông tin account
  updateAccount: async (req, res) => {
    try {
      // Hỗ trợ cả accId và accid (case-insensitive)
      const accId = req.params.accId || req.params.accid;
      const updateData = req.body;

      console.log("Update account request - accId:", accId, "data:", updateData);

      if (!accId) {
        return res.status(400).json({
          success: false,
          message: "AccID là bắt buộc",
          error: "AccID is required",
        });
      }

      const updatedAccount = await accountService.updateAccount(accId, updateData);

      res.status(200).json({
        success: true,
        message: "Cập nhật tài khoản thành công",
        data: updatedAccount,
      });
    } catch (error) {
      console.error("Error updating account:", error);
      if (error.message === "Account not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tài khoản",
          error: error.message,
        });
      }
      if (error.message === "Email đã tồn tại") {
        return res.status(400).json({
          success: false,
          message: "Email đã tồn tại",
          error: error.message,
        });
      }
      if (error.message.includes("Status phải là") || error.message.includes("Mật khẩu phải")) {
        return res.status(400).json({
          success: false,
          message: error.message,
          error: error.message,
        });
      }
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật tài khoản",
        error: error.message,
      });
    }
  },
};

module.exports = accountController;

