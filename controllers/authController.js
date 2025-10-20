const bcrypt = require("bcryptjs");
const passport = require("passport");
const crypto = require("crypto");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const { loginService } = require("../services/authService");
const { findAccountByEmail, createAccount } = require("../models/account");
const { sendVerificationEmail, generateVerificationCode } = require("../utils/nodemailer");
const jwt = require("jsonwebtoken");
const connectDB = require("../config/db");




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
  res.json({ message: "Logout successful (client should remove token)" });
};


const register = async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Please enter complete information: username, email, password!",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email!" });
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters, including letters and numbers!",
      });
    }

    if (phone && !/^\d{9,11}$/.test(phone)) {
      return res.status(400).json({
        message: "Invalid phone number (9–11 digits only)!",
      });
    }

    const existing = await findAccountByEmail(email);
    if (existing) {
      return res.status(400).json({ message: "Email has been registered!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = await createAccount(username, email, phone, hashedPassword);

    res.status(201).json({
      message: "Account created successfully!",
      AccID: id,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "System error, please try again later!" });
  }
};


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:9999/api/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const username = profile.displayName || `google_${profile.id}`;
        let user = await findAccountByEmail(email);

        if (user) {
          if (user.provider === "google") {
            console.log("Google user already exists, logging in:", email);
            return done(null, user);
          } else {
            console.warn(`Email ${email} has been registered by ${user.provider}`);
            return done(null, false, {
              errorMessage: "This account has been registered, please return to the login page!",
            });
          }
        } else {
          const randomPassword = crypto.randomBytes(6).toString("hex");
          const hashedPassword = await bcrypt.hash(randomPassword, 10);
          const id = await createAccount(username, email, null, hashedPassword, "google");
          user = { id, username, email, provider: "google" };
          console.log("Created new Google user:", { email, rawPassword: randomPassword });
          return done(null, user);
        }
      } catch (error) {
        console.error("Google strategy error:", error);
        return done(error, null);
      }
    }
  )
);

const googleAuth = passport.authenticate("google", { scope: ["profile", "email"] });

const googleAuthCallback = (req, res, next) => {
  passport.authenticate("google", { session: false, failWithError: true }, async (err, user, info) => {
    if (err) {
      console.error("Google auth error:", err);
      return res.status(400).json({ message: err.message });
    }
    if (info && info.errorMessage) {
      return res.status(400).json({ message: info.errorMessage });
    }
    if (!user) {
      return res.status(400).json({ message: "Authentication failed" });
    }
    req.user = user;
    try {
      const { token } = await loginService(user.email, null, user.provider);
      res.json({ message: "Google authentication successful", token, user });
    } catch (error) {
      console.error("Error in Google callback:", error);
      res.status(500).json({ message: error.message });
    }
  })(req, res, next);
};



passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: "http://localhost:9999/api/facebook/callback",
      profileFields: ["id", "displayName", "emails"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        const userEmail = email || `facebook_${profile.id}@placeholder.com`;
        const username = profile.displayName || `facebook_${profile.id}`;

        let user = await findAccountByEmail(userEmail);

        if (user) {
          if (user.provider === "facebook") {
            console.log("Facebook user already exists, logging in:", userEmail);
            return done(null, user);
          } else {
            console.warn(`Email ${userEmail} has been registered by ${user.provider}`);
            return done(null, false, {
              errorMessage: "This account has been registered, please return to the login page!",
            });
          }
        }

        const randomPassword = crypto.randomBytes(6).toString("hex");
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        const id = await createAccount(username, userEmail, null, hashedPassword, "facebook", profile.id);

        user = { id, username, email: userEmail, provider: "facebook" };
        console.log("Created new Facebook user:", { email: userEmail, rawPassword: randomPassword });

        if (!email) {
          console.warn(`Facebook user ${profile.id} has no email, using placeholder: ${userEmail}`);
        }

        return done(null, user);
      } catch (error) {
        console.error("Facebook strategy error:", error);
        return done(error, null);
      }
    }
  )
);


const facebookAuth = passport.authenticate("facebook", { scope: ["email"] });

const facebookAuthCallback = (req, res, next) => {
  passport.authenticate("facebook", { session: false, failWithError: true }, async (err, user, info) => {
    if (err) {
      console.error("Facebook auth error:", err);
      return res.status(400).json({ message: err.message });
    }
    if (info && info.errorMessage) {
      return res.status(400).json({ message: info.errorMessage });
    }
    if (!user) {
      return res.status(400).json({ message: "Authentication failed" });
    }
    req.user = user;
    try {
      const { token } = await loginService(user.email, null, user.provider);
      res.json({ message: "Facebook authentication successful", token, user });
    } catch (error) {
      console.error("Error in Facebook callback:", error);
      res.status(500).json({ message: error.message });
    }
  })(req, res, next);
};

// Lưu trữ tạm thời mã xác thực (trong production nên dùng Redis)
const verificationCodes = new Map();
// Gửi mã xác thực cho quên mật khẩu
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Vui lòng nhập email!" });
    }

    // Kiểm tra email có tồn tại không
    const user = await findAccountByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "Email không tồn tại trong hệ thống!" });
    }

    // Tạo mã xác thực
    const verificationCode = generateVerificationCode();
    
    // Lưu mã xác thực (hết hạn sau 15 phút)
    verificationCodes.set(email, {
      code: verificationCode,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 phút
      userId: user.AccID
    });

    // Gửi email
    sendVerificationEmail(email, verificationCode);

    res.json({
      message: "Mã xác thực đã được gửi đến email của bạn!",
      email: email
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Hệ thống lỗi, vui lòng thử lại sau!" });
  }
};

// Xác thực mã code
const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Vui lòng nhập email và mã xác thực!" });
    }

    const storedData = verificationCodes.get(email);
    
    if (!storedData) {
      return res.status(400).json({ message: "Mã xác thực không tồn tại hoặc đã hết hạn!" });
    }

    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({ message: "Mã xác thực đã hết hạn!" });
    }

    if (storedData.code !== parseInt(code)) {
      return res.status(400).json({ message: "Mã xác thực không chính xác!" });
    }

    // Mã hợp lệ, trả về token để reset password
    const resetToken = jwt.sign(
      { userId: storedData.userId, email: email }, 
      process.env.JWT_SECRET + "_reset", 
      { expiresIn: '15m' }
    );

    // Xóa mã xác thực sau khi xác nhận thành công
    verificationCodes.delete(email);

    res.json({
      message: "Xác thực thành công!",
      resetToken: resetToken
    });
  } catch (error) {
    console.error("Verify code error:", error);
    res.status(500).json({ message: "Hệ thống lỗi, vui lòng thử lại sau!" });
  }
};

// Đổi mật khẩu
const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: "Vui lòng nhập token và mật khẩu mới!" });
    }

    // Xác thực token
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET + "_reset");
    
    // Kiểm tra mật khẩu mới
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: "Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ và số!",
      });
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu trong database
    const db = await connectDB();
    await db.query(
      "UPDATE account SET Password = ? WHERE AccID = ?",
      [hashedPassword, decoded.userId]
    );

    res.json({
      message: "Đổi mật khẩu thành công! Vui lòng đăng nhập lại."
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: "Token đã hết hạn! Vui lòng thực hiện lại quy trình." });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: "Token không hợp lệ!" });
    }
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Hệ thống lỗi, vui lòng thử lại sau!" });
  }
};


module.exports = {
  login,
  logout,
  register,
  googleAuth,
  googleAuthCallback,
  facebookAuth,
  facebookAuthCallback,
   forgotPassword,
  verifyResetCode,
  resetPassword
};