const connectDB = require("../config/db");
const Account = require("../models/account");

class AccountRepository {
  async findAccountByEmail(email) {
    const db = await connectDB();
    const [rows] = await db.query("SELECT * FROM account WHERE Email = ?", [
      email,
    ]);

    return rows.length ? new Account(rows[0]) : null;
  }

  async createAccount({
    username,
    email,
    phone,
    password,
    provider = "local",
  }) {
    const db = await connectDB();
    const [result] = await db.query(
      "INSERT INTO account (Username, Email, Phone, Password, Status, Provider) VALUES (?, ?, ?, ?, ?, ?)",
      [username, email, phone, password, "active", provider]
    );
    return result.insertId;
  }

  async getFeaturesByAccountId(accountId) {
    const db = await connectDB();
    const [rows] = await db.query(
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
}

module.exports = new AccountRepository();
