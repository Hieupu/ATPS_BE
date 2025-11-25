const passport = require("passport");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const { loginService, registerService } = require("../services/authService");
const accountRepository = require("../repositories/accountRepository");

const {
  sendVerificationEmail,
  generateVerificationCode,
} = require("../utils/nodemailer");
const jwt = require("jsonwebtoken");
const connectDB = require("../config/db");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const login = async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    const result = await loginService(email, password, "local", rememberMe);

    const { token, expiresIn, user } = result;
    const { id, email: userEmail, username, role } = user;

    res.json({
      message: "Đăng nhập thành công",
      token,
      expiresIn,
      user: {
        id,
        username,
        email: userEmail,
        role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Đã có lỗi xảy ra" });
    }
  }
};

const logout = async (req, res) => {
  res.json({ message: "Logout successful (client should remove token)" });
};

const register = async (req, res) => {
  try {
    const username = (req.body.username || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const phone = (req.body.phone || "").trim();
    const password = req.body.password || "";
    const { id } = await registerService({
      username,
      email,
      phone,
      password,
      provider: "local",
    });

    return res.status(201).json({
      message: "Account created successfully!",
      AccID: id,
    });
  } catch (error) {
    console.error("Register error:", error);

    if (
      error.code === "ER_DUP_ENTRY" ||
      /duplicate/i.test(error.message || "")
    ) {
      return res.status(400).json({ message: "Email has been registered!" });
    }

    const status = Number(error.status) || 500;
    const message =
      status === 500
        ? "System error, please try again later!"
        : error.message || "Bad request";
    return res.status(status).json({ message });
  }
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://atps-be.onrender.com/api/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const username = profile.displayName || `google_${profile.id}`;
        let user = await accountRepository.findAccountByEmail(email);

        if (user) {
          if (user.Provider === "google") {
            console.log("Google user already exists, logging in:", email);
            return done(null, user);
          } else {
            console.warn(
              `Email ${email} has been registered by ${user.Provider}`
            );
            return done(null, false, {
              errorMessage:
                "This account has been registered, please return to the login page!",
            });
          }
        } else {
          const randomPassword = crypto.randomBytes(6).toString("hex");
          const hashedPassword = await bcrypt.hash(randomPassword, 10);
          const id = await accountRepository.createAccount({
            username,
            email,
            phone: "",
            password: hashedPassword,
            provider: "google",
          });

          const newUser = await accountRepository.findAccountByEmail(email);
          console.log("Created new Google user:", {
            email,
            rawPassword: randomPassword,
          });

          return done(null, newUser);
        }
      } catch (error) {
        console.error("Google strategy error:", error);
        return done(error, null);
      }
    }
  )
);

const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

const googleAuthCallback = (req, res, next) => {
  passport.authenticate(
    "google",
    { session: false, failWithError: true },
    async (err, user, info) => {
      if (err) {
        console.error("Google auth error:", err);
        return res.redirect(buildOAuthErrorRedirect("google", err.message));
      }
      if (info && info.errorMessage) {
        return res.redirect(
          buildOAuthErrorRedirect("google", info.errorMessage)
        );
      }
      if (!user) {
        return res.redirect(
          buildOAuthErrorRedirect("google", "Authentication failed")
        );
      }

      try {
        // ✅ Sửa: Lấy cả token và user từ loginService
        const { token, user: userWithRole } = await loginService(
          user.Email,
          null,
          "google"
        );

        const safeUser = {
          AccID:
            userWithRole.AccID || userWithRole.id || userWithRole.AccountID,
          Username: userWithRole.Username,
          Email: userWithRole.Email,
          Provider: "google",
          role: userWithRole.role, // ✅ Thêm role vào response
        };

        console.log("Google login - User with role:", safeUser); // Debug

        return res.redirect(buildOAuthRedirect("google", token, safeUser));
      } catch (e) {
        console.error("Error in Google callback:", e);
        return res.redirect(buildOAuthErrorRedirect("google", e.message));
      }
    }
  )(req, res, next);
};

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: "https://atps-be.onrender.com/api/facebook/callback",
      profileFields: ["id", "displayName", "emails"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email =
          profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        const userEmail = email || `facebook_${profile.id}@placeholder.com`;
        const username = profile.displayName || `facebook_${profile.id}`;

        let user = await accountRepository.findAccountByEmail(userEmail);

        if (user) {
          if (user.Provider === "facebook") {
            console.log("Facebook user already exists, logging in:", userEmail);
            return done(null, user);
          } else {
            console.warn(
              `Email ${userEmail} has been registered by ${user.Provider}`
            );
            return done(null, false, {
              errorMessage:
                "This account has been registered, please return to the login page!",
            });
          }
        }

        const randomPassword = crypto.randomBytes(6).toString("hex");
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        const id = await accountRepository.createAccount({
          username,
          email: userEmail,
          phone: "",
          password: hashedPassword,
          provider: "facebook",
        });

        const newUser = await accountRepository.findAccountByEmail(userEmail);

        console.log("Created new Facebook user:", {
          email: userEmail,
          rawPassword: randomPassword,
        });

        if (!email) {
          console.warn(
            `Facebook user ${profile.id} has no email, using placeholder: ${userEmail}`
          );
        }

        return done(null, newUser);
      } catch (error) {
        console.error("Facebook strategy error:", error);
        return done(error, null);
      }
    }
  )
);

const facebookAuth = passport.authenticate("facebook", { scope: ["email"] });

const facebookAuthCallback = (req, res, next) => {
  passport.authenticate(
    "facebook",
    { session: false, failWithError: true },
    async (err, user, info) => {
      if (err) {
        console.error("Facebook auth error:", err);
        return res.redirect(buildOAuthErrorRedirect("facebook", err.message));
      }
      if (info && info.errorMessage) {
        return res.redirect(
          buildOAuthErrorRedirect("facebook", info.errorMessage)
        );
      }
      if (!user) {
        return res.redirect(
          buildOAuthErrorRedirect("facebook", "Authentication failed")
        );
      }

      try {
        // ✅ Sửa: Lấy cả token và user từ loginService
        const { token, user: userWithRole } = await loginService(
          user.Email,
          null,
          "facebook"
        );

        const safeUser = {
          Username: userWithRole.Username,
          Email: userWithRole.Email,
          Provider: "facebook",
          role: userWithRole.role, // ✅ Thêm role vào response
        };

        console.log("Facebook login - User with role:", safeUser); // Debug

        return res.redirect(buildOAuthRedirect("facebook", token, safeUser));
      } catch (e) {
        console.error("Error in Facebook callback:", e);
        return res.redirect(buildOAuthErrorRedirect("facebook", e.message));
      }
    }
  )(req, res, next);
};

const verificationCodes = new Map();
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Vui lòng nhập email!" });
    }

    const user = await accountRepository.findAccountByEmail(email);

    if (!user) {
      return res
        .status(404)
        .json({ message: "Email không tồn tại trong hệ thống!" });
    }

    const verificationCode = generateVerificationCode();

    verificationCodes.set(email, {
      code: verificationCode,
      expiresAt: Date.now() + 15 * 60 * 1000,
      userId: user.AccID,
    });
    setTimeout(() => verificationCodes.delete(email), 15 * 60 * 1000);
    sendVerificationEmail(email, verificationCode);

    res.json({
      message: "Mã xác thực đã được gửi đến email của bạn!",
      email: email,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Hệ thống lỗi, vui lòng thử lại sau!" });
  }
};

const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập email và mã xác thực!" });
    }

    const storedData = verificationCodes.get(email);

    if (!storedData) {
      return res
        .status(400)
        .json({ message: "Mã xác thực không tồn tại hoặc đã hết hạn!" });
    }

    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({ message: "Mã xác thực đã hết hạn!" });
    }

    if (storedData.code !== parseInt(code)) {
      return res.status(400).json({ message: "Mã xác thực không chính xác!" });
    }

    const resetToken = jwt.sign(
      { userId: storedData.userId, email: email },
      process.env.JWT_SECRET + "_reset",
      { expiresIn: "15m" }
    );

    verificationCodes.delete(email);

    res.json({
      message: "Xác thực thành công!",
      resetToken: resetToken,
    });
  } catch (error) {
    console.error("Verify code error:", error);
    res.status(500).json({ message: "Hệ thống lỗi, vui lòng thử lại sau!" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập token và mật khẩu mới!" });
    }

    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET + "_reset");

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: "Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ và số!",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const db = await connectDB();

    const [result] = await db.query(
      "UPDATE account SET Password = ? WHERE AccID = ?",
      [hashedPassword, decoded.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng!" });
    }

    res.json({
      message: "Đổi mật khẩu thành công! Vui lòng đăng nhập lại.",
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({
        message: "Token đã hết hạn! Vui lòng thực hiện lại quy trình.",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(400).json({ message: "Token không hợp lệ!" });
    }
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Hệ thống lỗi, vui lòng thử lại sau!" });
  }
};
const buildOAuthRedirect = (provider, token, userObj) => {
  const u = encodeURIComponent(
    Buffer.from(JSON.stringify(userObj || {}), "utf-8").toString("base64")
  );
  return `${FRONTEND_URL}/oauth/callback?provider=${provider}&token=${token}&u=${u}`;
};

const buildOAuthErrorRedirect = (provider, message) => {
  const msg = encodeURIComponent(message || "Authentication failed");
  return `${FRONTEND_URL}/oauth/callback?provider=${provider}&error=${msg}`;
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
  resetPassword,
};
