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
    return rows[0] || null; // Trả về null nếu không tìm thấy
  }

  async findLearnerByAccountId(accountId) {
    const db = await connectDB();
    const [rows] = await db.query("SELECT * FROM learner WHERE AccID = ?", [accountId]);
    return rows[0] || null; // Trả về null nếu không tìm thấy
  }

  async findParentByAccountId(accountId) {
    const db = await connectDB();
    const [rows] = await db.query("SELECT * FROM parent WHERE AccID = ?", [accountId]);
    return rows[0] || null; // Trả về null nếu không tìm thấy
  }

  async updateAccount(accountId, data) {
    const db = await connectDB();
    
    const updateFields = [];
    const updateValues = [];
    
    if (data.Username !== undefined) {
      updateFields.push("Username = ?");
      updateValues.push(data.Username);
    }
    
    if (data.Phone !== undefined) {
      updateFields.push("Phone = ?");
      updateValues.push(data.Phone);
    }
    
    if (updateFields.length === 0) {
      return;
    }
    
    updateValues.push(accountId);
    
    const [result] = await db.query(
      `UPDATE account SET ${updateFields.join(", ")} WHERE AccID = ?`,
      updateValues
    );
    
    console.log(`Updated account: ${result.affectedRows} rows affected`);
    return result;
  }

  async updateInstructor(accountId, data) {
    const db = await connectDB();
    
    const updateFields = [];
    const updateValues = [];
    
    if (data.FullName !== undefined) {
      updateFields.push("FullName = ?");
      updateValues.push(data.FullName);
    }
    if (data.DateOfBirth !== undefined) {
      updateFields.push("DateOfBirth = ?");
      updateValues.push(data.DateOfBirth);
    }
    if (data.Job !== undefined) {
      updateFields.push("Job = ?");
      updateValues.push(data.Job);
    }
    if (data.Address !== undefined) {
      updateFields.push("Address = ?");
      updateValues.push(data.Address);
    }
    if (data.Major !== undefined) {
      updateFields.push("Major = ?");
      updateValues.push(data.Major);
    }
    
    if (updateFields.length === 0) {
      return;
    }
    
    updateValues.push(accountId);
    
    const [result] = await db.query(
      `UPDATE instructor SET ${updateFields.join(", ")} WHERE AccID = ?`,
      updateValues
    );
    
    console.log(`Updated instructor: ${result.affectedRows} rows affected`);
    return result;
  }

  async updateLearner(accountId, data) {
    const db = await connectDB();
    
    const updateFields = [];
    const updateValues = [];
    
    if (data.FullName !== undefined) {
      updateFields.push("FullName = ?");
      updateValues.push(data.FullName);
    }
    if (data.DateOfBirth !== undefined) {
      updateFields.push("DateOfBirth = ?");
      updateValues.push(data.DateOfBirth);
    }
    if (data.Job !== undefined) {
      updateFields.push("Job = ?");
      updateValues.push(data.Job);
    }
    if (data.Address !== undefined) {
      updateFields.push("Address = ?");
      updateValues.push(data.Address);
    }
    
    if (updateFields.length === 0) {
      return;
    }
    
    updateValues.push(accountId);
    
    const [result] = await db.query(
      `UPDATE learner SET ${updateFields.join(", ")} WHERE AccID = ?`,
      updateValues
    );
    
    console.log(`Updated learner: ${result.affectedRows} rows affected`);
    return result;
  }

  async updateParent(accountId, data) {
    const db = await connectDB();
    
    const updateFields = [];
    const updateValues = [];
    
    if (data.FullName !== undefined) {
      updateFields.push("FullName = ?");
      updateValues.push(data.FullName);
    }
    if (data.DateOfBirth !== undefined) {
      updateFields.push("DateOfBirth = ?");
      updateValues.push(data.DateOfBirth);
    }
    if (data.Job !== undefined) {
      updateFields.push("Job = ?");
      updateValues.push(data.Job);
    }
    if (data.Address !== undefined) {
      updateFields.push("Address = ?");
      updateValues.push(data.Address);
    }
    
    if (updateFields.length === 0) {
      return;
    }
    
    updateValues.push(accountId);
    
    const [result] = await db.query(
      `UPDATE parent SET ${updateFields.join(", ")} WHERE AccID = ?`,
      updateValues
    );
    
    console.log(`Updated parent: ${result.affectedRows} rows affected`);
    return result;
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