const profileService = require("../services/profileService");

const getProfile = async (req, res) => {
  try {
    const { id } = req.user;
    const profile = await profileService.getProfileByAccountId(id);
    res.json(profile);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    console.log("Update", req);
    const { id } = req.user;
    const updateData = req.body;
    
    const updatedProfile = await profileService.updateProfile(id, updateData);
    res.json({ message: "Profile updated successfully", profile: updatedProfile });
  } catch (error) {
    console.error("Update profile error:", error);
    
    if (error.message.includes("not found") || error.message.includes("invalid")) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

const changePassword = async (req, res) => {
  try {
    const { id } = req.user;
    const { currentPassword, newPassword } = req.body;
    await profileService.changePassword(id, currentPassword, newPassword);
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(400).json({ message: error.message });
  }
};

const updateAvatar = async (req, res) => {
  try {
    const { id } = req.user;
    
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const updatedProfile = await profileService.uploadAvatar(req.file, id);
    
    res.json({ 
      message: "Avatar updated successfully", 
      profile: updatedProfile 
    });
  } catch (error) {
    console.error("Update avatar error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  updateAvatar,
};