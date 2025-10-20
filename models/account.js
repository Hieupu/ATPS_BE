const connectDB = require("../config/db");

const getFeaturesByAccountId = async (accountId) => {
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
};

const findAccountByEmail = async (email) => {
  const db = await connectDB();
  const [rows] = await db.query("SELECT * FROM account WHERE Email = ?", [
    email,
  ]);
  return rows[0];
};

const createAccount = async (username, email, phone, password) => {
  const db = await connectDB();
  const [result] = await db.query(
    "INSERT INTO account (Username, Email, Phone, Password, Status) VALUES (?, ?, ?, ?, ?)",
    [username, email, phone, password, "active"]
  );
  return result.insertId;
};

module.exports = {
  findAccountByEmail,
  createAccount,
  getFeaturesByAccountId,
};
