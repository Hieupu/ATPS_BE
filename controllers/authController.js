const passport = require("passport");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const { loginService } = require("../services/authService");
const { findAccountByEmail, createAccount } = require("../models/account");
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";


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
    console.error("Login error:", error);
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
        message:
          "Please enter complete information: username, email, password!",
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
            console.warn(
              `Email ${email} has been registered by ${user.provider}`
            );
            return done(null, false, {
              errorMessage:
                "This account has been registered, please return to the login page!",
            });
          }
        } else {
          const randomPassword = crypto.randomBytes(6).toString("hex");
          const hashedPassword = await bcrypt.hash(randomPassword, 10);
          const id = await createAccount(
            username,
            email,
            null,
            hashedPassword,
            "google"
          );
          user = { id, username, email, provider: "google" };
          console.log("Created new Google user:", {
            email,
            rawPassword: randomPassword,
          });
          return done(null, user);
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
        return res.redirect(buildOAuthErrorRedirect("google", info.errorMessage));
      }
      if (!user) {
        return res.redirect(buildOAuthErrorRedirect("google", "Authentication failed"));
      }

      try {
        const { token } = await loginService(user.email, null, "google");
        const safeUser = {
          Username: user.username || user.Username,
          Email: user.email || user.Email,
          Provider: "google",
        };
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
      callbackURL: "http://localhost:9999/api/facebook/callback",
      profileFields: ["id", "displayName", "emails"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email =
          profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        const userEmail = email || `facebook_${profile.id}@placeholder.com`;
        const username = profile.displayName || `facebook_${profile.id}`;

        let user = await findAccountByEmail(userEmail);

        if (user) {
          if (user.provider === "facebook") {
            console.log("Facebook user already exists, logging in:", userEmail);
            return done(null, user);
          } else {
            console.warn(
              `Email ${userEmail} has been registered by ${user.provider}`
            );
            return done(null, false, {
              errorMessage:
                "This account has been registered, please return to the login page!",
            });
          }
        }

        const randomPassword = crypto.randomBytes(6).toString("hex");
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        const id = await createAccount(
          username,
          userEmail,
          null,
          hashedPassword,
          "facebook",
          profile.id
        );

        user = { id, username, email: userEmail, provider: "facebook" };
        console.log("Created new Facebook user:", {
          email: userEmail,
          rawPassword: randomPassword,
        });

        if (!email) {
          console.warn(
            `Facebook user ${profile.id} has no email, using placeholder: ${userEmail}`
          );
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
  passport.authenticate(
    "facebook",
    { session: false, failWithError: true },
    async (err, user, info) => {
      if (err) {
        console.error("Facebook auth error:", err);
        return res.redirect(buildOAuthErrorRedirect("facebook", err.message));
      }
      if (info && info.errorMessage) {
        return res.redirect(buildOAuthErrorRedirect("facebook", info.errorMessage));
      }
      if (!user) {
        return res.redirect(buildOAuthErrorRedirect("facebook", "Authentication failed"));
      }

      try {
        const { token } = await loginService(user.email, null, "facebook");
        const safeUser = {
          Username: user.username || user.Username,
          Email: user.email || user.Email,
          Provider: "facebook",
        };
        return res.redirect(buildOAuthRedirect("facebook", token, safeUser));
      } catch (e) {
        console.error("Error in Facebook callback:", e);
        return res.redirect(buildOAuthErrorRedirect("facebook", e.message));
      }
    }
  )(req, res, next);
};

const buildOAuthRedirect = (provider, token, userObj) => {
  const u = encodeURIComponent(btoa(JSON.stringify(userObj || {})));
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
};
