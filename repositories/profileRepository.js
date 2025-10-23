const pool = require("../config/db");

class ProfileRepository {
  async findAccountById(accountId) {
    const [rows] = await pool.query("SELECT * FROM account WHERE AccID = ?", [
      accountId,
    ]);
    if (!rows.length) return null;
    const u = rows[0];
    return {
      AccID: u.AccID,
      Username: u.Username,
      Email: u.Email,
      Phone: u.Phone,
      Password: u.Password,
      Status: u.Status,
      Provider: u.Provider || "local",
      Role: u.Role || "learner",
    };
  }

  async findInstructorByAccountId(accountId) {
    const [rows] = await pool.query(
      "SELECT * FROM instructor WHERE AccID = ?",
      [accountId]
    );
    if (!rows.length) return null;
    return rows[0];
  }

  async findLearnerByAccountId(accountId) {
    const [rows] = await pool.query("SELECT * FROM learner WHERE AccID = ?", [
      accountId,
    ]);
    if (!rows.length) return null;
    return rows[0];
  }

  async findParentByAccountId(accountId) {
    const [rows] = await pool.query("SELECT * FROM parent WHERE AccID = ?", [
      accountId,
    ]);
    if (!rows.length) return null;
    return rows[0];
  }

  async updateAccount(accountId, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    await pool.query(`UPDATE account SET ${setClause} WHERE AccID = ?`, [
      ...values,
      accountId,
    ]);
  }

  async updateInstructor(accountId, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    await pool.query(`UPDATE instructor SET ${setClause} WHERE AccID = ?`, [
      ...values,
      accountId,
    ]);
  }

  async updateLearner(accountId, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    await pool.query(`UPDATE learner SET ${setClause} WHERE AccID = ?`, [
      ...values,
      accountId,
    ]);
  }

  async updateParent(accountId, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    await pool.query(`UPDATE parent SET ${setClause} WHERE AccID = ?`, [
      ...values,
      accountId,
    ]);
  }

  async updatePassword(accountId, hashedPassword) {
    await pool.query("UPDATE account SET Password = ? WHERE AccID = ?", [
      hashedPassword,
      accountId,
    ]);
  }

  async updateInstructorAvatar(accountId, avatarUrl) {
    await pool.query(
      "UPDATE instructor SET ProfilePicture = ? WHERE AccID = ?",
      [avatarUrl, accountId]
    );
  }

  async updateLearnerAvatar(accountId, avatarUrl) {
    await pool.query("UPDATE learner SET ProfilePicture = ? WHERE AccID = ?", [
      avatarUrl,
      accountId,
    ]);
  }

  async updateParentAvatar(accountId, avatarUrl) {
    await pool.query("UPDATE parent SET ProfilePicture = ? WHERE AccID = ?", [
      avatarUrl,
      accountId,
    ]);
  }
}

module.exports = new ProfileRepository();
