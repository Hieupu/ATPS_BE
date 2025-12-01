const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const connectDB = require("../config/db");
const accountRepository = require("../repositories/accountRepository");
const instructorRepository = require("../repositories/instructorRepository");
require("dotenv").config();

const courseRepository = require("../repositories/instructorCourseRepository");

const getInstructorId = async (accId) => {
  const instructorId = await courseRepository.findInstructorIdByAccountId(
    accId
  );

  if (!instructorId) {
    throw new Error("Instructor không tồn tại");
  }
  return instructorId;
};

class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// services/authService.js
const loginService = async (
  email,
  password,
  provider = "local",
  rememberMe = false
) => {
  const user = await accountRepository.findAccountByEmail(email);

  if (!user) {
    if (password) {
      await bcrypt.compare(
        password,
        "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
      );
    }
    throw new ServiceError("Email hoặc mật khẩu không chính xác", 401);
  }

  const userProvider = user.Provider.toLowerCase();
  const loginProvider = provider.toLowerCase();

  if (userProvider !== loginProvider) {
    if (userProvider === "local") {
      throw new ServiceError(
        "Tài khoản này yêu cầu đăng nhập bằng mật khẩu",
        401
      );
    } else {
      throw new ServiceError(
        `Tài khoản này chỉ có thể đăng nhập qua ${user.Provider}`,
        401
      );
    }
  }

  if (loginProvider === "local") {
    if (!password) {
      throw new ServiceError("Vui lòng nhập mật khẩu", 400);
    }

    if (!user.Password) {
      throw new ServiceError("Email hoặc mật khẩu không chính xác", 401);
    }

    const match = await bcrypt.compare(password, user.Password);
    if (!match) {
      throw new ServiceError("Email hoặc mật khẩu không chính xác", 401);
    }
  }

  const role = await determineUserRole(user.AccID);

  let profilePicture = null;

  if (role === "instructor") {
    const instructorId = await getInstructorId(user.AccID);

    const instructor = await instructorRepository.getInstructorById(
      instructorId
    );

    profilePicture = instructor?.ProfilePicture || null;
  }

  const expiresIn = rememberMe ? "30d" : "1h";
  const expiresInSeconds = rememberMe ? 30 * 24 * 60 * 60 : 3600;

  const token = jwt.sign(
    {
      id: user.AccID,
      email: user.Email,
      Username: user.Username,
      features: featureNames,
      role: role, // Đảm bảo role được thêm vào token
    },
    process.env.JWT_SECRET,
    { expiresIn }
  );

  return {
    token,
    expiresIn: expiresInSeconds,
    user: {
      id: user.AccID,
      email: user.Email,
      username: user.Username,
      role: role,
      ProfilePicture: profilePicture,
    },
  };
};

// Hàm xác định role
const determineUserRole = async (accountId) => {
  const db = await connectDB();

  // Kiểm tra instructor
  const [instructors] = await db.query(
    "SELECT InstructorID FROM instructor WHERE AccID = ?",
    [accountId]
  );
  if (instructors.length > 0) return "instructor";

  // Kiểm tra learner
  const [learners] = await db.query(
    "SELECT LearnerID FROM learner WHERE AccID = ?",
    [accountId]
  );
  if (learners.length > 0) return "learner";

  // Kiểm tra parent
  const [parents] = await db.query(
    "SELECT ParentID FROM parent WHERE AccID = ?",
    [accountId]
  );
  if (parents.length > 0) return "parent";

  return "unknown";
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
