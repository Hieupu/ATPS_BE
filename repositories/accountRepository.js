const connectDB = require("../config/db");
const Account = require("../models/account");

class AccountRepository {
  async findAccountByEmail(email) {
    const db = await connectDB();
    const normalizedEmail = email.trim().toLowerCase();
    const [rows] = await db.query("SELECT * FROM account WHERE Email = ?", [
      normalizedEmail,
    ]);
    if (!rows.length) return null;
    return new Account(rows[0]);
  }

  async createAccount({
    username,
    email,
    phone,
    password,
    provider = "local",
  }) {
    const db = await connectDB();
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const [result] = await db.query(
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
    const db = await connectDB();
    await db.query(
      "INSERT INTO learner (AccID, FullName, DateOfBirth, ProfilePicture, Job, Address) VALUES (?, ?, ?, ?, ?, ?)",
      [accId, null, null, null, null, null]
    );
  }

  async getFeaturesByAccountId(accountId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `
      SELECT f.Name
      FROM atps.feature f
      JOIN atps.accountfeature af ON f.FeatureID = af.FeatureID
      WHERE af.AccountID = ?  -- SỬA Ở ĐÂY: AccID → AccountID
      `,
      [accountId]
    );
    return rows.map((row) => row.Name);
  }
}

module.exports = new AccountRepository();
