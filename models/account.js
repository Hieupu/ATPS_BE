const connectDB = require("../config/db");

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
};
