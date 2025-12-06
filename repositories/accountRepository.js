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
      `INSERT INTO learner (AccID, FullName, DateOfBirth, ProfilePicture, Job, Address)
     SELECT AccID, Username, NULL, NULL, NULL, NULL
     FROM account
     WHERE AccID = ?`,
      [accId]
    );
  }

  async getFeaturesByAccountId(accountId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `
      SELECT f.Name
      FROM feature f
      JOIN accountfeature af ON f.FeatureID = af.FeatureID
      WHERE af.AccountID = ?  
      `,
      [accountId]
    );
    return rows.map((row) => row.Name);
  }
  // async findAccountByEmail(email) {
  //   if (!email) {
  //     return null;
  //   }

  //   const normalized = email.trim().toLowerCase();

  //   // Hỗ trợ login bằng cả Email hoặc Username (case-insensitive)
  //   const [rows] = await connectDB.query(
  //     "SELECT * FROM account WHERE LOWER(Email) = ? OR LOWER(Username) = ?",
  //     [normalized, normalized]
  //   );
  //   if (!rows.length) return null;
  //   const u = rows[0];
  //   return {
  //     AccID: u.AccID,
  //     Username: u.Username,
  //     Email: u.Email,
  //     Phone: u.Phone,
  //     Password: u.Password,
  //     Status: u.Status,
  //     Provider: u.Provider || "local",
  //   };
  // }

  async findAccountById(accountId) {
    const db = await connectDB();
    const [rows] = await db.query("SELECT * FROM account WHERE AccID = ?", [
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

  // Alias for findAccountById
  async findById(accountId) {
    return this.findAccountById(accountId);
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

  async createAccountWithRole({
    username,
    email,
    phone = "",
    password,
    status = "active",
    provider = "local",
    gender = "other",
  }) {
    const db = await connectDB();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername =
      username || normalizedEmail.split("@")[0] || "user";
    try {
      const [result] = await db.query(
        "INSERT INTO account (Username, Email, Phone, Password, Status, Provider, Gender) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          normalizedUsername,
          normalizedEmail,
          phone || "",
          password,
          status,
          provider,
          gender || "other",
        ]
      );
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
      WHERE af.AccountID = ?
      `,
      [accountId]
    );
    return rows.map((row) => row.Name);
  }

  async updateAccount(accountId, updateData) {
    // Whitelist các trường được phép update trong bảng account
    const allowedFields = [
      "Email",
      "Phone",
      "Status",
      "Password",
      // Username và Provider không được update qua đây
      // AccID là primary key, không thể update
    ];

    // Lọc chỉ các trường hợp lệ
    const filteredData = {};
    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    // Nếu không có trường nào hợp lệ, return
    if (Object.keys(filteredData).length === 0) {
      return;
    }

    const fields = Object.keys(filteredData);
    const values = Object.values(filteredData);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const db = await connectDB();
    const [result] = await db.query(
      `UPDATE account SET ${setClause} WHERE AccID = ?`,
      [...values, accountId]
    );

    return result;
  }

  async updatePassword(accountId, hashedPassword) {
    const db = await connectDB();
    await db.query("UPDATE account SET Password = ? WHERE AccID = ?", [
      hashedPassword,
      accountId,
    ]);
  }
}

module.exports = new AccountRepository();
