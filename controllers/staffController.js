const bcrypt = require("bcryptjs");
const staffService = require("../services/staffService");
const accountService = require("../services/accountService");
const accountRepository = require("../repositories/accountRepository");

const staffController = {
  getAllStaff: async (req, res) => {
    try {
      const { page, limit, search } = req.query;
      const staff = await staffService.getAllStaff({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
        search: search || "",
      });

      res.json({
        success: true,
        message: "Lấy danh sách nhân viên thành công",
        data: staff,
      });
    } catch (error) {
      console.error("Error getting staff:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách nhân viên",
        error: error.message,
      });
    }
  },

  getStaffById: async (req, res) => {
    try {
      const { id } = req.params;
      const staff = await staffService.getStaffById(id);

      res.json({
        success: true,
        message: "Lấy thông tin nhân viên thành công",
        data: staff,
      });
    } catch (error) {
      console.error("Error getting staff:", error);
      const status = error.message === "Staff not found" ? 404 : 500;
      res.status(status).json({
        success: false,
        message:
          status === 404 ? "Không tìm thấy nhân viên" : "Lỗi khi lấy thông tin nhân viên",
        error: error.message,
      });
    }
  },

  createStaff: async (req, res) => {
    try {
      const {
        AccID,
        FullName,
        DateOfBirth,
        ProfilePicture,
        Address,
        Email,
        Phone,
        Password,
        Status = "active",
        Username,
        Gender = "other",
      } = req.body;

      if (!FullName) {
        return res.status(400).json({
          success: false,
          message: "FullName là bắt buộc",
        });
      }

      let accountId = AccID;

      if (!accountId) {
        if (!Email || !Password) {
          return res.status(400).json({
            success: false,
            message: "Thiếu thông tin Email hoặc Password để tạo tài khoản",
          });
        }

        const existingAccount = await accountRepository.findAccountByEmail(
          Email.trim().toLowerCase()
        );
        if (existingAccount) {
          return res.status(400).json({
            success: false,
            message: "Email đã tồn tại",
          });
        }

        const hashedPassword = await bcrypt.hash(Password, 10);
        accountId = await accountRepository.createAccountWithRole({
          username: Username || FullName?.trim().replace(/\s+/g, "").toLowerCase(),
          email: Email,
          phone: Phone || "",
          password: hashedPassword,
          status: Status || "active",
          provider: "local",
          gender: Gender || "other",
        });
      }

      const newStaff = await staffService.createStaff({
        AccID: accountId,
        FullName,
        DateOfBirth,
        ProfilePicture,
        Address,
      });

      let accountInfo = null;
      try {
        accountInfo = await accountService.getAccountById(accountId);
      } catch (error) {
        // ignore
      }

      res.status(201).json({
        success: true,
        message: "Tạo nhân viên thành công",
        data: {
          ...newStaff,
          Email: accountInfo?.Email || Email,
          Phone: accountInfo?.Phone || Phone,
          Status: accountInfo?.Status || Status,
        },
      });
    } catch (error) {
      console.error("Error creating staff:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo nhân viên",
        error: error.message,
      });
    }
  },

  updateStaff: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedStaff = await staffService.updateStaff(id, updateData);

      res.json({
        success: true,
        message: "Cập nhật nhân viên thành công",
        data: updatedStaff,
      });
    } catch (error) {
      console.error("Error updating staff:", error);
      const status = error.message === "Staff not found" ? 404 : 500;
      res.status(status).json({
        success: false,
        message:
          status === 404 ? "Không tìm thấy nhân viên" : "Lỗi khi cập nhật nhân viên",
        error: error.message,
      });
    }
  },

  deleteStaff: async (req, res) => {
    try {
      const { id } = req.params;
      await staffService.deleteStaff(id);

      res.json({
        success: true,
        message: "Xóa nhân viên thành công",
      });
    } catch (error) {
      console.error("Error deleting staff:", error);
      const status = error.message === "Staff not found" ? 404 : 500;
      res.status(status).json({
        success: false,
        message:
          status === 404 ? "Không tìm thấy nhân viên" : "Lỗi khi xóa nhân viên",
        error: error.message,
      });
    }
  },
};

module.exports = staffController;

