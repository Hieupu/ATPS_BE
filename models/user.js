const connectDB = require("../config/db");

// Lấy tất cả user
const getAllUsers = async () => {
  const db = await connectDB();
  const [rows] = await db.query("SELECT AccID, Username, Email, Phone, Status FROM account");
  return rows;
};

// Lấy user theo ID
const getUserById = async (id) => {
  const db = await connectDB();
  const [rows] = await db.query("SELECT AccID, Username, Email, Phone, Status FROM account WHERE AccID = ?", [id]);
  return rows[0];
};

// Cập nhật thông tin user
const updateUser = async (id, username, phone, status) => {
  const db = await connectDB();
  const [result] = await db.query(
    "UPDATE account SET Username = ?, Phone = ?, Status = ? WHERE AccID = ?",
    [username, phone, status, id]
  );
  return result.affectedRows > 0;
};

// Xoá user
const deleteUser = async (id) => {
  const db = await connectDB();
  const [result] = await db.query("DELETE FROM account WHERE AccID = ?", [id]);
  return result.affectedRows > 0;
};

const getUserRole = async (id) => {
  const db = await connectDB();
  
  // Kiểm tra trong tất cả các bảng để xác định role chính xác
  const [learnerRows] = await db.query("SELECT * FROM learner WHERE AccID = ?", [id]);
  if (learnerRows.length > 0) return 'learner';
  
  const [instructorRows] = await db.query("SELECT * FROM instructor WHERE AccID = ?", [id]);
  if (instructorRows.length > 0) return 'instructor';
  
  const [parentRows] = await db.query("SELECT * FROM parent WHERE AccID = ?", [id]);
  if (parentRows.length > 0) return 'parent';
  
  return 'user';
};
module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
    getUserRole 
};
