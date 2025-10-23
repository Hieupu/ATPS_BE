const pool = require("../config/db");

class AccountRepository {
  async findAccountByEmail(email) {
    const normalizedEmail = email.trim().toLowerCase();
    const [rows] = await pool.query("SELECT * FROM account WHERE Email = ?", [
      normalizedEmail,
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
    };
  }

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

  async createAccount({
    username,
    email,
    phone,
    password,
    provider = "local",
  }) {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const [result] = await pool.query(
        "INSERT INTO account (Username, Email, Phone, Password, Status, Provider) VALUES (?, ?, ?, ?, ?, ?)",
        [username, normalizedEmail, phone || "", password, "active", provider]
      );
      await this.createLearner(result.insertId, username);
      return result.insertId;
    } catch (e) {
      if (e.code === "ER_DUP_ENTRY") {
        const err = new Error("Email has been registered!");
        err.status = 400;
        throw err;
      }
      throw e;
    }
  }

  async createLearner(accId) {
    await pool.query(
      "INSERT INTO learner (AccID, FullName, DateOfBirth, ProfilePicture, Job, Address) VALUES (?, ?, ?, ?, ?, ?)",
      [accId, null, null, null, null, null]
    );
  }

  async getFeaturesByAccountId(accountId) {
    const [rows] = await pool.query(
      `
      SELECT f.Name
      FROM atps.feature f
      JOIN atps.accountfeature af ON f.FeatureID = af.FeatureID
      WHERE af.AccountID = ?
      `,
      [accountId]
    );
    return rows.map((row) => row.Name);
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

  async updatePassword(accountId, hashedPassword) {
    await pool.query("UPDATE account SET Password = ? WHERE AccID = ?", [
      hashedPassword,
      accountId,
    ]);
  }
}

module.exports = new AccountRepository();
