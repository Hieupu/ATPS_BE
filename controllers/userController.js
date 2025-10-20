const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../models/user");
const connectDB = require("../config/db");

// Lấy danh sách tất cả người dùng
const getUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Lấy 1 user theo ID
const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Cập nhật user
const updateUserInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, phone, status } = req.body;

    const updated = await updateUser(id, username, phone, status);
    if (!updated) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Xoá user
const deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteUser(id);
    if (!deleted) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getUsers,
  getUser,
  updateUserInfo,
  deleteUserById,
};
