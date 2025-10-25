const bcrypt = require("bcryptjs");
const profileRepository = require("../repositories/profileRepository");
const cloudinary = require('../config/cloudinary');

class ProfileService {
  async getProfileByAccountId(accountId) {
    const account = await profileRepository.findAccountById(accountId);
    if (!account) throw new Error("Account not found");

    // Xác định role bằng cách kiểm tra accountId có trong bảng nào
    const role = await this.determineRole(accountId);
    
    let profileData = {
      account: {
        AccID: account.AccID,
        Username: account.Username,
        Email: account.Email,
        Phone: account.Phone,
        Role: role // Sử dụng role đã xác định
      }
    };

    // Get role-specific data
    if (role === 'instructor') {
      const instructor = await profileRepository.findInstructorByAccountId(accountId);
      profileData = { ...profileData, ...instructor };
    } else if (role === 'learner') {
      const learner = await profileRepository.findLearnerByAccountId(accountId);
      profileData = { ...profileData, ...learner };
    } else if (role === 'parent') {
      const parent = await profileRepository.findParentByAccountId(accountId);
      profileData = { ...profileData, ...parent };
    }

    return profileData;
  }

  async determineRole(accountId) {
    const instructor = await profileRepository.findInstructorByAccountId(accountId);
    if (instructor) return 'instructor';

    const learner = await profileRepository.findLearnerByAccountId(accountId);
    if (learner) return 'learner';

    const parent = await profileRepository.findParentByAccountId(accountId);
    if (parent) return 'parent';

    throw new Error("Role not found for this account");
  }

  async updateProfile(accountId, updateData) {
    const role = await this.determineRole(accountId);
    
    console.log(`Updating profile for account ${accountId} with role: ${role}`);
    
    const accountData = {};
    const profileData = {};

    if (updateData.Username !== undefined) accountData.Username = updateData.Username;
    if (updateData.Phone !== undefined) accountData.Phone = updateData.Phone;

    // Xử lý dữ liệu cho bảng profile theo role
    if (updateData.FullName !== undefined) profileData.FullName = updateData.FullName;
    if (updateData.DateOfBirth !== undefined) profileData.DateOfBirth = updateData.DateOfBirth;
    if (updateData.Job !== undefined) profileData.Job = updateData.Job;
    if (updateData.Address !== undefined) profileData.Address = updateData.Address;
    
    if (role === 'instructor' && updateData.Major !== undefined) {
      profileData.Major = updateData.Major;
    }

    if (updateData.FullName && !updateData.Username) {
      accountData.Username = this.generateUsername(updateData.FullName);
    }

    if (Object.keys(accountData).length > 0) {
      await profileRepository.updateAccount(accountId, accountData);
    }
    
    if (Object.keys(profileData).length > 0) {
      if (role === 'instructor') {
        await profileRepository.updateInstructor(accountId, profileData);
      } else if (role === 'learner') {
        await profileRepository.updateLearner(accountId, profileData);
      } else if (role === 'parent') {
        await profileRepository.updateParent(accountId, profileData);
      }
    }

    return this.getProfileByAccountId(accountId);
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
    
    if (account.Provider === 'local') {
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
      `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      {
        folder: 'avatars',
        transformation: [
          { width: 300, height: 300, crop: 'fill' },
          { quality: 'auto' },
          { format: 'webp' }
        ]
      }
    );

    const avatarUrl = result.secure_url;

    // Cập nhật avatar URL vào database
     const role = await this.determineRole(accountId);
    if (role === 'instructor') {
      await profileRepository.updateInstructorAvatar(accountId, avatarUrl);
    } else if (role === 'learner') {
      await profileRepository.updateLearnerAvatar(accountId, avatarUrl);
    } else if (role === 'parent') {
      await profileRepository.updateParentAvatar(accountId, avatarUrl);
    }

    return this.getProfileByAccountId(accountId);
  } catch (error) {
    throw new Error(`Upload avatar failed: ${error.message}`);
  }
}

  async deleteOldAvatar(avatarUrl) {
    try {
      if (avatarUrl && avatarUrl.includes('cloudinary')) {
        const publicId = avatarUrl.split('/').pop().split('.')[0];
        const fullPublicId = `avatars/${publicId}`;
        
        await cloudinary.uploader.destroy(fullPublicId);
      }
    } catch (error) {
      console.error('Error deleting old avatar:', error);
    }
  }
}

module.exports = new ProfileService();