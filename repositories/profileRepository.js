const connectDB = require("../config/db");

class ProfileRepository {
  async findAccountById(accountId) {
    const db = await connectDB();
    const [rows] = await db.query("SELECT * FROM account WHERE AccID = ?", [accountId]);
    return rows[0] || null;
  }

  async findInstructorByAccountId(accountId) {
    const db = await connectDB();
    const [rows] = await db.query("SELECT * FROM instructor WHERE AccID = ?", [accountId]);
    return rows[0] ? { ...rows[0], Role: 'instructor' } : null;
  }

  async findLearnerByAccountId(accountId) {
    const db = await connectDB();
    const [rows] = await db.query("SELECT * FROM learner WHERE AccID = ?", [accountId]);
    return rows[0] ? { ...rows[0], Role: 'learner' } : null;
  }

  async findParentByAccountId(accountId) {
    const db = await connectDB();
    const [rows] = await db.query("SELECT * FROM parent WHERE AccID = ?", [accountId]);
    return rows[0] ? { ...rows[0], Role: 'parent' } : null;
  }

async updateAccount(accountId, data) {
  const db = await connectDB();
  
  // Only update fields that are provided and not null/undefined
  const updateFields = [];
  const updateValues = [];
  
  if (data.Username !== undefined && data.Username !== null) {
    updateFields.push("Username = ?");
    updateValues.push(data.Username);
  }
  
  if (data.Phone !== undefined && data.Phone !== null) {
    updateFields.push("Phone = ?");
    updateValues.push(data.Phone);
  }
  
  if (updateFields.length === 0) {
    return; // No fields to update
  }
  
  updateValues.push(accountId);
  
  await db.query(
    `UPDATE account SET ${updateFields.join(", ")} WHERE AccID = ?`,
    updateValues
  );
}
  async updateInstructor(accountId, data) {
    const db = await connectDB();
    await db.query(
      `UPDATE instructor SET FullName = ?, DateOfBirth = ?, Job = ?, Address = ?, Major = ? 
       WHERE AccID = ?`,
      [data.FullName, data.DateOfBirth, data.Job, data.Address, data.Major, accountId]
    );
  }

  async updateLearner(accountId, data) {
    const db = await connectDB();
    await db.query(
      `UPDATE learner SET FullName = ?, DateOfBirth = ?, Job = ?, Address = ? 
       WHERE AccID = ?`,
      [data.FullName, data.DateOfBirth, data.Job, data.Address, accountId]
    );
  }

  async updateParent(accountId, data) {
    const db = await connectDB();
    await db.query(
      `UPDATE parent SET FullName = ?, DateOfBirth = ?, Job = ?, Address = ? 
       WHERE AccID = ?`,
      [data.FullName, data.DateOfBirth, data.Job, data.Address, accountId]
    );
  }

  async updatePassword(accountId, hashedPassword) {
    const db = await connectDB();
    await db.query("UPDATE account SET Password = ? WHERE AccID = ?", [hashedPassword, accountId]);
  }

  async updateInstructorAvatar(accountId, avatarUrl) {
    const db = await connectDB();
    await db.query("UPDATE instructor SET ProfilePicture = ? WHERE AccID = ?", [avatarUrl, accountId]);
  }

  async updateLearnerAvatar(accountId, avatarUrl) {
    const db = await connectDB();
    await db.query("UPDATE learner SET ProfilePicture = ? WHERE AccID = ?", [avatarUrl, accountId]);
  }

  async updateParentAvatar(accountId, avatarUrl) {
    const db = await connectDB();
    await db.query("UPDATE parent SET ProfilePicture = ? WHERE AccID = ?", [avatarUrl, accountId]);
  }
}

module.exports = new ProfileRepository();