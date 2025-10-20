const connectDB = require("../config/db");


const getUserById = async (id) => {
  const db = await connectDB();
  const [rows] = await db.query("SELECT AccID, Username, Email, Phone, Status FROM account WHERE AccID = ?", [id]);
  return rows[0];
};


const getUserProfile = async (id) => {
  const db = await connectDB();
  
  const role = await getUserRole(id);
  
  let profileQuery = "";
  switch (role) {
    case "learner":
      profileQuery = "SELECT * FROM learner WHERE AccID = ?";
      break;
    case "instructor":
      profileQuery = "SELECT * FROM instructor WHERE AccID = ?";
      break;
    case "parent":
      profileQuery = "SELECT * FROM parent WHERE AccID = ?";
      break;
    default:
      return null;
  }
  
  const [profileRows] = await db.query(profileQuery, [id]);
  const profile = profileRows[0];
  
  if (profile) {
    profile.Role = role;
  }
  
  return profile;
};

const updateUserProfile = async (id, profileData) => {
  const db = await connectDB();
  
  const role = await getUserRole(id);
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



const updateProfilePicture = async (id, profilePicture) => {
  const db = await connectDB();
  
  const role = await getUserRole(id);
  const [result] = await db.query(
    `UPDATE ${role} SET ProfilePicture = ? WHERE AccID = ?`,
    [profilePicture, id]
  );
  
  return result.affectedRows > 0;
};


const updatePassword = async (id, newPassword) => {
  const db = await connectDB();
  const [result] = await db.query(
    "UPDATE account SET Password = ? WHERE AccID = ?",
    [newPassword, id]
  );
  return result.affectedRows > 0;
};


const getUserRole = async (id) => {
  const db = await connectDB();
  
  const [learnerRows] = await db.query("SELECT * FROM learner WHERE AccID = ?", [id]);
  if (learnerRows.length > 0) return 'learner';
  
  const [instructorRows] = await db.query("SELECT * FROM instructor WHERE AccID = ?", [id]);
  if (instructorRows.length > 0) return 'instructor';
  
  const [parentRows] = await db.query("SELECT * FROM parent WHERE AccID = ?", [id]);
  if (parentRows.length > 0) return 'parent';
  
  return 'user';
};

module.exports = {
  getUserById,
  getUserProfile,
  updateUserProfile,
  updateProfilePicture,
  updatePassword,
  getUserRole
};