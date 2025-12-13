const bcrypt = require("bcryptjs");
const adminService = require("../services/adminService");
const accountService = require("../services/accountService");
const accountRepository = require("../repositories/accountRepository");
const {
  validateEmailFormat,
  validatePassword,
  validatePhoneFormat,
  validateFullName,
  checkEmailExists,
} = require("../utils/validators");

const adminController = {
  getAllAdmins: async (req, res) => {
    try {
      const { page, limit, search } = req.query;
      const admins = await adminService.getAllAdmins({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
        search: search || "",
      });

      res.json({
        success: true,
        message: "Lấy danh sách admin thành công",
        data: admins,
      });
    } catch (error) {
      console.error("Error getting admins:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách admin",
        error: error.message,
      });
    }
  },

  getAdminById: async (req, res) => {
    try {
      const { id } = req.params;
      const admin = await adminService.getAdminById(id);

      res.json({
        success: true,
        message: "Lấy thông tin admin thành công",
        data: admin,
      });
    } catch (error) {
      console.error("Error getting admin:", error);
      const status = error.message === "Admin not found" ? 404 : 500;
      res.status(status).json({
        success: false,
        message:
          status === 404
            ? "Không tìm thấy admin"
            : "Lỗi khi lấy thông tin admin",
        error: error.message,
      });
    }
  },

  createAdmin: async (req, res) => {
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

      // Validate FullName using utils
      const fullNameValidation = validateFullName(FullName);
      if (!fullNameValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: fullNameValidation.error,
        });
      }

      let accountId = AccID;

      if (!accountId) {
        // Validate Email using utils
        const emailValidation = validateEmailFormat(Email);
        if (!emailValidation.isValid) {
          return res.status(400).json({
            success: false,
            message: emailValidation.error,
          });
        }

        // Validate Password using utils
        const passwordValidation = validatePassword(Password, true);
        if (!passwordValidation.isValid) {
          return res.status(400).json({
            success: false,
            message: passwordValidation.error,
          });
        }

        // Validate Phone format using utils (if provided)
        let phoneValidation = { cleanedPhone: null };
        if (Phone && Phone.trim()) {
          phoneValidation = validatePhoneFormat(Phone, false);
          if (!phoneValidation.isValid) {
            return res.status(400).json({
              success: false,
              message: phoneValidation.error,
            });
          }
        }

        // Check duplicate email using utils
        const emailCheck = await checkEmailExists(
          accountRepository.findAccountByEmail.bind(accountRepository),
          Email
        );
        if (emailCheck.exists) {
          return res.status(400).json({
            success: false,
            message: emailCheck.error,
          });
        }

        const hashedPassword = await bcrypt.hash(Password, 10);
        accountId = await accountRepository.createAccountWithRole({
          username:
            Username ||
            fullNameValidation.trimmedName.replace(/\s+/g, "").toLowerCase(),
          email: emailValidation.normalizedEmail,
          phone: phoneValidation.cleanedPhone || "",
          password: hashedPassword,
          status: Status || "active",
          provider: "local",
          gender: Gender || "other",
        });
      }

      const newAdmin = await adminService.createAdmin({
        AccID: accountId,
        FullName: fullNameValidation.trimmedName,
        DateOfBirth: DateOfBirth || null,
        ProfilePicture: ProfilePicture || null,
        Address: Address || null,
      });

      let accountInfo = null;
      try {
        accountInfo = await accountService.getAccountById(accountId);
      } catch (error) {
        // ignore
      }

      res.status(201).json({
        success: true,
        message: "Tạo admin thành công",
        data: {
          ...newAdmin,
          Email: accountInfo?.Email || Email,
          Phone: accountInfo?.Phone || Phone,
          Status: accountInfo?.Status || Status,
          Gender: accountInfo?.Gender || Gender,
        },
      });
    } catch (error) {
      console.error("Error creating admin:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo admin",
        error: error.message,
      });
    }
  },

  updateAdmin: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedAdmin = await adminService.updateAdmin(id, updateData);

      res.json({
        success: true,
        message: "Cập nhật admin thành công",
        data: updatedAdmin,
      });
    } catch (error) {
      console.error("Error updating admin:", error);
      const status = error.message === "Admin not found" ? 404 : 500;
      res.status(status).json({
        success: false,
        message:
          status === 404 ? "Không tìm thấy admin" : "Lỗi khi cập nhật admin",
        error: error.message,
      });
    }
  },
};

module.exports = adminController;
