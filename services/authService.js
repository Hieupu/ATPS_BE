const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const accountRepository = require("../repositories/accountRepository");
require("dotenv").config();

const loginService = async (email, password, provider = "local") => {
  const user = await accountRepository.findAccountByEmail(email);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.Provider !== "local") {
    if (provider !== user.Provider) {
      throw new Error(`This account can only login via ${user.Provider}`);
    }
  } else {
    if (!password) {
      throw new Error("Password is required for local login");
    }
    const match = await bcrypt.compare(password, user.Password);
    if (!match) throw new Error("Invalid credentials");
  }

  const featureNames = await accountRepository.getFeaturesByAccountId(
    user.AccountID
  );

  const token = jwt.sign(
    {
      id: user.AccountID,
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
