// controllers/userProfileController.js
const {
  getUserProfileById,
  updateUserProfileById,
  updateProfilePicture,
  updatePassword
} = require("../models/userProfile");
const connectDB = require("../config/db");

// Lấy thông tin profile theo ID và role
const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.query; // 'learner', 'instructor', 'parent'
    
    const profile = await getUserProfileById(id, role);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    
    res.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Cập nhật thông tin profile
const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, fullName, dateOfBirth, job, address, major, cv } = req.body;

    const updated = await updateUserProfileById(id, role, {
      fullName,
      dateOfBirth,
      job,
      address,
      major,
      cv
    });
    
    if (!updated) return res.status(404).json({ message: "Profile not found" });
    
    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    const { id } = req.params;
    const { profilePicture } = req.body;

    const updated = await updateProfilePicture(id, profilePicture);
    if (!updated) return res.status(404).json({ message: "User not found" });
    
    res.json({ message: "Profile picture updated successfully" });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Đổi mật khẩu
const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Kiểm tra mật khẩu hiện tại
    const db = await connectDB();
    const [users] = await db.query("SELECT Password FROM account WHERE AccID = ?", [id]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];
    
    // Trong thực tế, cần hash password để so sánh
    if (user.Password !== currentPassword) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Cập nhật mật khẩu mới
    const updated = await updatePassword(id, newPassword);
    if (!updated) return res.status(400).json({ message: "Failed to update password" });
    
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
  changePassword
};