const bcrypt = require("bcryptjs");
const profileRepository = require("../repositories/profileRepository");

class ProfileService {
  async getProfileByAccountId(accountId) {
    const account = await profileRepository.findAccountById(accountId);
    if (!account) throw new Error("Account not found");

    let profileData = {
      account: {
        AccID: account.AccID,
        Username: account.Username,
        Email: account.Email,
        Phone: account.Phone,
        Role: account.Role,
      },
    };

    // Get role-specific data
    if (account.Role === "instructor") {
      const instructor = await profileRepository.findInstructorByAccountId(
        accountId
      );
      profileData = { ...profileData, ...instructor };
    } else if (account.Role === "learner") {
      const learner = await profileRepository.findLearnerByAccountId(accountId);
      profileData = { ...profileData, ...learner };
    } else if (account.Role === "parent") {
      const parent = await profileRepository.findParentByAccountId(accountId);
      profileData = { ...profileData, ...parent };
    }

    return profileData;
  }

  async updateProfile(accountId, updateData) {
    const { role, ...data } = updateData;

    // Auto-generate username from FullName if not provided
    const username = data.Username || this.generateUsername(data.FullName);

    // Update account table
    await profileRepository.updateAccount(accountId, {
      Username: username,
      Phone: data.Phone,
    });

    // Update role-specific table
    if (role === "instructor") {
      await profileRepository.updateInstructor(accountId, {
        FullName: data.FullName,
        DateOfBirth: data.DateOfBirth,
        Job: data.Job,
        Address: data.Address,
        Major: data.Major,
      });
    } else if (role === "learner") {
      await profileRepository.updateLearner(accountId, {
        FullName: data.FullName,
        DateOfBirth: data.DateOfBirth,
        Job: data.Job,
        Address: data.Address,
      });
    } else if (role === "parent") {
      await profileRepository.updateParent(accountId, {
        FullName: data.FullName,
        DateOfBirth: data.DateOfBirth,
        Job: data.Job,
        Address: data.Address,
      });
    }

    return this.getProfileByAccountId(accountId);
  }

  // Helper method to generate username from FullName
  generateUsername(fullName) {
    if (!fullName) return "user" + Date.now();

    // Convert to lowercase and remove accents
    const username = fullName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .replace(/\s+/g, "");

    return username || "user" + Date.now();
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

  async updateAvatar(accountId, avatarUrl) {
    const account = await profileRepository.findAccountById(accountId);
    const { Role } = account;

    if (Role === "instructor") {
      await profileRepository.updateInstructorAvatar(accountId, avatarUrl);
    } else if (Role === "learner") {
      await profileRepository.updateLearnerAvatar(accountId, avatarUrl);
    } else if (Role === "parent") {
      await profileRepository.updateParentAvatar(accountId, avatarUrl);
    }

    return this.getProfileByAccountId(accountId);
  }
}

module.exports = new ProfileService();
