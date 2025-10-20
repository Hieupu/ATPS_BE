const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  findAccountByEmail,
  getFeaturesByAccountId,
} = require("../models/account");
require("dotenv").config();

const loginService = async (email, password) => {
  const user = await findAccountByEmail(email);
  if (!user) {
    throw new Error("User not found");
  }

  if (!user.Password)
    throw new Error("This account can only login via Google/Facebook");

  const match = await bcrypt.compare(password, user.Password);
  if (!match) throw new Error("Invalid credentials");

  const featureNames = await getFeaturesByAccountId(user.AccID);

  const token = jwt.sign(
    {
      id: user.id,
      email: user.Email,
      username: user.Username,
      features: featureNames,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return { token, user };
};

module.exports = {
  loginService,
};
