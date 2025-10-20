// models/userProfile.js
const connectDB = require("../config/db");

// Lấy thông tin profile theo role
const getUserProfileById = async (id, role) => {
  const db = await connectDB();
  
  let query = "";
  switch (role) {
    case "learner":
      query = "SELECT * FROM learner WHERE AccID = ?";
      break;
    case "instructor":
      query = "SELECT * FROM instructor WHERE AccID = ?";
      break;
    case "parent":
      query = "SELECT * FROM parent WHERE AccID = ?";
      break;
    default:
      return null;
  }
  
  const [rows] = await db.query(query, [id]);
  return rows[0];
};

// Cập nhật thông tin profile theo role
const updateUserProfileById = async (id, role, profileData) => {
  const db = await connectDB();
  
  let query = "";
  let params = [];
  
  switch (role) {
    case "learner":
      query = `
        UPDATE learner 
        SET FullName = ?, DateOfBirth = ?, Job = ?, Address = ? 
        WHERE AccID = ?
      `;
      params = [
        profileData.fullName,
        profileData.dateOfBirth,
        profileData.job,
        profileData.address,
        id
      ];
      break;
      
    case "instructor":
      query = `
        UPDATE instructor 
        SET FullName = ?, DateOfBirth = ?, Job = ?, Address = ?, Major = ?, CV = ? 
        WHERE AccID = ?
      `;
      params = [
        profileData.fullName,
        profileData.dateOfBirth,
        profileData.job,
        profileData.address,
        profileData.major,
        profileData.cv,
        id
      ];
      break;
      
    case "parent":
      query = `
        UPDATE parent 
        SET FullName = ?, DateOfBirth = ?, Job = ?, Address = ? 
        WHERE AccID = ?
      `;
      params = [
        profileData.fullName,
        profileData.dateOfBirth,
        profileData.job,
        profileData.address,
        id
      ];
      break;
      
    default:
      return false;
  }
  
  const [result] = await db.query(query, params);
  return result.affectedRows > 0;
};

// Cập nhật profile picture
const updateProfilePicture = async (id, profilePicture) => {
  const db = await connectDB();
  
  // Cần xác định bảng dựa trên role, nhưng tạm thời thử tất cả các bảng
  const tables = ["learner", "instructor", "parent"];
  
  for (let table of tables) {
    const [result] = await db.query(
      `UPDATE ${table} SET ProfilePicture = ? WHERE AccID = ?`,
      [profilePicture, id]
    );
    if (result.affectedRows > 0) {
      return true;
    }
  }
  
  return false;
};

// Cập nhật mật khẩu
const updatePassword = async (id, newPassword) => {
  const db = await connectDB();
  
  // Trong thực tế, cần hash password trước khi lưu
  const [result] = await db.query(
    "UPDATE account SET Password = ? WHERE AccID = ?",
    [newPassword, id]
  );
  
  return result.affectedRows > 0;
};

module.exports = {
  getUserProfileById,
  updateUserProfileById,
  updateProfilePicture,
  updatePassword
};