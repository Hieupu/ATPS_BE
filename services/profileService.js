const bcrypt = require("bcryptjs");
const profileRepository = require("../repositories/profileRepository");
const cloudinary = require("../config/cloudinary");

class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

class ProfileService {
  async getProfileByAccountId(accountId) {
    const account = await profileRepository.findAccountById(accountId);
    if (!account) throw new ServiceError("Account not found", 404);

    const role = await this.determineRole(accountId);

    let profileData = {
      account: {
        AccID: account.AccID,
        Username: account.Username,
        Email: account.Email,
        Phone: account.Phone,
        Gender: account.Gender,
        Role: role, // Sử dụng role đã xác định
      },
    };

    // Get role-specific data
    if (role === "instructor") {
      const instructor = await profileRepository.findInstructorByAccountId(
        accountId
      );
      profileData = { ...profileData, ...instructor };
    } else if (role === "learner") {
      const learner = await profileRepository.findLearnerByAccountId(accountId);
      profileData = { ...profileData, ...learner };
    } else if (role === "admin") {
      const admin = await profileRepository.findAdminByAccountId(accountId);
      profileData = { ...profileData, ...admin };
    } else if (role === "staff") {
      const staff = await profileRepository.findStaffByAccountId(accountId);
      profileData = { ...profileData, ...staff };
    }


    return profileData;
  }

  async determineRole(accountId) {
    const instructor = await profileRepository.findInstructorByAccountId(
      accountId
    );
    if (instructor) return "instructor";
    const learner = await profileRepository.findLearnerByAccountId(accountId);
    if (learner) return "learner";
    const staff = await profileRepository.findStaffByAccountId(accountId);
    if (staff) return "staff";
    const admin = await profileRepository.findAdminByAccountId(accountId);
    if (admin) return "admin";
    const parent = await profileRepository.findParentByAccountId(accountId);
    if (parent) return "parent";

    throw new ServiceError("Role not found for this account", 404);
  }

  async updateProfile(accountId, updateData) {
    const role = await this.determineRole(accountId);

    console.log(`Updating profile for account ${accountId} with role: ${role}`);

    const accountData = {};
    const profileData = {};

    if (updateData.Username !== undefined)
      accountData.Username = updateData.Username;
    if (updateData.Phone !== undefined) accountData.Phone = updateData.Phone;
    if (updateData.Gender !== undefined) accountData.Gender = updateData.Gender;

    // Xử lý dữ liệu cho bảng profile theo role
    if (updateData.FullName !== undefined)
      profileData.FullName = updateData.FullName;
    if (updateData.DateOfBirth !== undefined) {
      profileData.DateOfBirth = this.formatDateForMySQL(updateData.DateOfBirth);
    }
    if (updateData.Job !== undefined) profileData.Job = updateData.Job;
    if (updateData.Address !== undefined)
      profileData.Address = updateData.Address;

    if (role === "instructor" && updateData.Major !== undefined) {
      profileData.Major = updateData.Major;
    }

    if (updateData.FullName && !updateData.Username) {
      accountData.Username = this.generateUsername(updateData.FullName);
    }

    if (Object.keys(accountData).length > 0) {
      await profileRepository.updateAccount(accountId, accountData);
    }

    if (Object.keys(profileData).length > 0) {
      if (role === "instructor") {
        await profileRepository.updateInstructor(accountId, profileData);
      } else if (role === "learner") {
        await profileRepository.updateLearner(accountId, profileData);
      } else if (role === "staff") {
        await profileRepository.updateStaff(accountId, profileData);
      }
    }

    return this.getProfileByAccountId(accountId);
  }

  formatDateForMySQL(dateString) {
    if (!dateString) return null;

    try {
      // Nếu là ISO string (có chứa 'T'), lấy phần date
      if (dateString.includes("T")) {
        return dateString.split("T")[0];
      }

      // Nếu đã là YYYY-MM-DD thì giữ nguyên
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }

      // Chuyển đổi từ các định dạng khác
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn("Invalid date format:", dateString);
        return null;
      }

      return date.toISOString().split("T")[0];
    } catch (error) {
      console.error("Error formatting date:", error);
      return null;
    }
  }

  generateUsername(fullName) {
    if (!fullName) return null;

    return fullName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 20);
  }

  async changePassword(accountId, currentPassword, newPassword) {
    const account = await profileRepository.findAccountById(accountId);

    if (account.Provider === "local") {
      const match = await bcrypt.compare(currentPassword, account.Password);
      if (!match) throw new Error("Current password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await profileRepository.updatePassword(accountId, hashedPassword);
  }

  async uploadAvatar(file, accountId) {
    try {
      // Upload ảnh lên Cloudinary - SỬA LẠI PHẦN NÀY
      const result = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
        {
          folder: "avatars",
          transformation: [
            { width: 300, height: 300, crop: "fill" },
            { quality: "auto" },
            { format: "webp" },
          ],
        }
      );

      const avatarUrl = result.secure_url;

      // Cập nhật avatar URL vào database
      const role = await this.determineRole(accountId);
      if (role === "instructor") {
        await profileRepository.updateInstructorAvatar(accountId, avatarUrl);
      } else if (role === "learner") {
        await profileRepository.updateLearnerAvatar(accountId, avatarUrl);
      } else if (role === "parent") {
        await profileRepository.updateParentAvatar(accountId, avatarUrl);
      }

      return this.getProfileByAccountId(accountId);
    } catch (error) {
      throw new Error(`Upload avatar failed: ${error.message}`);
    }
  }

  async deleteOldAvatar(avatarUrl) {
    try {
      if (avatarUrl && avatarUrl.includes("cloudinary")) {
        const publicId = avatarUrl.split("/").pop().split(".")[0];
        const fullPublicId = `avatars/${publicId}`;

        await cloudinary.uploader.destroy(fullPublicId);
      }
    } catch (error) {
      console.error("Error deleting old avatar:", error);
    }
  }
}

module.exports = new ProfileService();
