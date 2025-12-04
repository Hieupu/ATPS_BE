const accountRepository = require("../repositories/accountRepository");
const bcrypt = require("bcryptjs");

class AccountService {
  async getAccountById(accountId) {
    try {
      const account = await accountRepository.findById(accountId);
      if (!account) {
        throw new Error("Account not found");
      }
      // Không trả về password
      const { Password, ...accountWithoutPassword } = account;
      return accountWithoutPassword;
    } catch (error) {
      throw error;
    }
  }

  async updateAccount(accountId, updateData) {
    try {
      // Kiểm tra account có tồn tại không
      const existingAccount = await accountRepository.findById(accountId);
      if (!existingAccount) {
        throw new Error("Account not found");
      }

      // Chuẩn bị dữ liệu update
      const updateFields = {};

      // Xử lý Email
      if (updateData.Email !== undefined) {
        const normalizedEmail = updateData.Email.trim().toLowerCase();
        
        // Kiểm tra email trùng với account khác
        const existingEmailAccount = await accountRepository.findAccountByEmail(normalizedEmail);
        if (existingEmailAccount && existingEmailAccount.AccID !== accountId) {
          throw new Error("Email đã tồn tại");
        }
        
        updateFields.Email = normalizedEmail;
      }

      // Xử lý Phone
      if (updateData.Phone !== undefined) {
        updateFields.Phone = updateData.Phone || "";
      }

      // Xử lý Status
      if (updateData.Status !== undefined) {
        const normalizedStatus = updateData.Status.toLowerCase();
        // DB chỉ chấp nhận: active, inactive, banned
        const validStatuses = ["active", "inactive", "banned"];
        if (!validStatuses.includes(normalizedStatus)) {
          throw new Error(
            `Status phải là một trong: ${validStatuses.join(", ")}`
          );
        }
        updateFields.Status = normalizedStatus;
      }

      // Xử lý Password
      if (updateData.Password !== undefined) {
        // Validate password
        if (updateData.Password.length < 6) {
          throw new Error("Mật khẩu phải có ít nhất 6 ký tự");
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(updateData.Password, 10);
        updateFields.Password = hashedPassword;
      }

      // Nếu không có trường nào để update
      if (Object.keys(updateFields).length === 0) {
        return await this.getAccountById(accountId);
      }

      // Lưu status cũ để gửi email thông báo
      const oldStatus = existingAccount.Status;

      // Update account
      await accountRepository.updateAccount(accountId, updateFields);

      // Gửi email thông báo nếu status thay đổi (không block nếu lỗi)
      if (updateFields.Status && updateFields.Status !== oldStatus) {
        try {
          const { notifyAccountStatusChange } = require("../utils/emailNotificationHelper");
          await notifyAccountStatusChange(accountId, oldStatus, updateFields.Status);
        } catch (emailError) {
          console.error("[updateAccount] Error sending email notification:", emailError);
        }
      }

      // Trả về account đã được update (không có password)
      return await this.getAccountById(accountId);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AccountService();

