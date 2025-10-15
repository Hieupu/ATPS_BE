const bcrypt = require("bcryptjs");
const { loginService } = require("../services/authService");
const { findAccountByEmail, createAccount } = require("../models/account");

const register = async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    const existing = await findAccountByEmail(email);
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = await createAccount(username, email, phone, hashedPassword);
    res
      .status(201)
      .json({ message: "Account created successfully", AccID: id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { token, user } = await loginService(email, password);

    const { Username, Email } = user;

    res.json({
      message: "Login successful",
      token,
      user: { Username, Email },
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

const logout = async (req, res) => {
  // Logout bằng cách client xóa token (vì JWT không lưu server)
  res.json({ message: "Logout successful (client should remove token)" });
};

module.exports = {
  register,
  login,
  logout,
};
