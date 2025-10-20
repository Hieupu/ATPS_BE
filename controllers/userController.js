const {
  getAllUsers,
  getUserById,
  getUserProfile,
  updateUserProfile,
  updateUser,
  updateProfilePicture,
  updatePassword,
  deleteUser,
} = require("../models/user");
const connectDB = require("../config/db");


// Trong controllers/userController.js - function getProfile
const getProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('User making request:', req.user);
    console.log('Requested profile ID:', id);
    
    // Kiểm tra quyền truy cập: user chỉ có thể xem profile của chính mình
    if (req.user.id !== parseInt(id) && !req.user.features?.includes('admin')) {
      console.log('Access denied: user', req.user.id, 'trying to access profile', id);
      return res.status(403).json({ message: "Access denied" });
    }
    
    const profile = await getUserProfile(id);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    
    res.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, dateOfBirth, job, address, major, cv } = req.body;

    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updated = await updateUserProfile(id, {
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


const uploadProfilePicture = async (req, res) => {
  try {
    const { id } = req.params;
    const { profilePicture } = req.body;

    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updated = await updateProfilePicture(id, profilePicture);
    if (!updated) return res.status(404).json({ message: "User not found" });
    
    res.json({ message: "Profile picture updated successfully" });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const db = await connectDB();
    const [users] = await db.query("SELECT Password FROM account WHERE AccID = ?", [id]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];
    
    if (user.Password !== currentPassword) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const updated = await updatePassword(id, newPassword);
    if (!updated) return res.status(400).json({ message: "Failed to update password" });
    
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// Lấy role của user
const getUserRoleController = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await getUserRole(id);
    res.json({ role });
  } catch (error) {
    console.error("Error getting user role:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  changePassword,
  getUserRole: getUserRoleController
};