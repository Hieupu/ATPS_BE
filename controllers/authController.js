const { Account, initializeDB } = require("../models/account");

const register = async (req, res) => {
  try {
    const { username, email, phone, password, status } = req.body;
    if (!username || !email || !phone || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const accountData = { username, email, phone, password, status };
    const newAccount = await Account.create(accountData);
    res
      .status(201)
      .json({ message: "Account created successfully", account: newAccount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAccounts = async (req, res) => {
  try {
    const connection = await initializeDB();
    const [rows] = await connection.query("SELECT * FROM atps.account");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, getAccounts };
