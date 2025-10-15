const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { findAccountByEmail } = require("../models/account");
require("dotenv").config();

const loginService = async (email, password) => {
  const user = await findAccountByEmail(email);
  if (!user) {
    throw new Error("Email not found");
  }

  const isMatch = await bcrypt.compare(password, user.Password);
  if (!isMatch) {
    throw new Error("Incorrect password");
  }

  const token = jwt.sign(
    { AccID: user.AccID, Email: user.Email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );

  return { token, user };
};

module.exports = {
  loginService,
};
