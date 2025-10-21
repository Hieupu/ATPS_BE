const connectDB = require("../config/db");

class AccountRepository {
  async findAccountByEmail(email) {
    const db = await connectDB();
     const normalizedEmail = email.trim().toLowerCase();
    
    console.log("Searching for email:", normalizedEmail);
    const [rows] = await db.query("SELECT * FROM account WHERE Email = ?", [
      email,
    ]);

      console.log("Query results:", rows);

    if (!rows.length) return null;

    const userData = rows[0];
    return {
      AccID: userData.AccID,
      Username: userData.Username,
      Email: userData.Email,
      Phone: userData.Phone,
      Password: userData.Password,
      Status: userData.Status,
      Provider: userData.Provider || "local",
    };
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
      WHERE af.AccountID = ?  -- SỬA Ở ĐÂY: AccID → AccountID
      `,
      [accountId]
    );
    return rows.map((row) => row.Name);
  }
}

module.exports = new AccountRepository();