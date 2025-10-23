const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const accountRepository = require("../repositories/accountRepository");
require("dotenv").config();

class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const loginService = async (email, password, provider = "local") => {
  console.log("Login attempt for email:", email);

  const user = await accountRepository.findAccountByEmail(email);
  console.log("User found:", user);
  if (!user) {
    throw new ServiceError("User not found", 401);
  }

  if (user.Provider !== "local") {
    if (provider !== user.Provider) {
      throw new ServiceError(
        `This account can only login via ${user.Provider}`,
        401
      );
    }
  } else {
    if (!password) {
      throw new ServiceError("Password is required for local login", 400);
    }
    const match = await bcrypt.compare(password, user.Password);
    if (!match) throw new ServiceError("Invalid credentials", 401);
  }

  const featureNames = await accountRepository.getFeaturesByAccountId(
    user.AccID
  );

  const token = jwt.sign(
    {
      id: user.AccID,
      email: user.Email,
      username: user.Username,
      features: featureNames,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return { token, user };
};

const registerService = async ({
  username,
  email,
  phone,
  password,
  provider = "local",
}) => {
  if (!username || !email || !password) {
    throw new ServiceError(
      "Please enter complete information: username, email, password!",
      400
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ServiceError("Invalid email!", 400);
  }

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;
  if (!passwordRegex.test(password)) {
    throw new ServiceError(
      "Password must be at least 6 characters, including letters and numbers!",
      400
    );
  }

  if (phone && !/^\d{9,11}$/.test(phone)) {
    throw new ServiceError("Invalid phone number (9–11 digits only)!", 400);
  }

  const existing = await accountRepository.findAccountByEmail(email);
  if (existing) {
    throw new ServiceError("Email has been registered!", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const id = await accountRepository.createAccount({
    username,
    email: email.trim().toLowerCase(),
    phone: phone || "",
    password: hashedPassword,
    provider,
  });

  return { id };
};

module.exports = {
  loginService,
  registerService,
};
