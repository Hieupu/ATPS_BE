const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { findAccountByEmail } = require("../models/account");
require("dotenv").config();

const loginService = async (email, password, provider) => {
  const user = await findAccountByEmail(email);
  if (!user) {
    throw new Error("User not found");
  }

  if (provider === "local") {
    if (!password) {
      throw new Error("Password is required for local login");
    }

    if (!user.password) {
      throw new Error("This account cannot login locally");
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new Error("Invalid credentials");
    }
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return { token, user };
};

module.exports = {
  loginService,
};
