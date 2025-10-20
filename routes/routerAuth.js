const express = require("express");
const passport = require("passport");
const {
    register,
    login,
    logout,
    googleAuth,
    googleAuthCallback,
    facebookAuth,
    facebookAuthCallback,
     forgotPassword,
    verifyResetCode,
    resetPassword
} = require("../controllers/authController");
const { verifyToken } = require("../middlewares/middware");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);
router.get("/google", googleAuth);
router.get("/google/callback",  googleAuthCallback);
router.get("/facebook", facebookAuth);
router.get("/facebook/callback", facebookAuthCallback);
module.exports = router;
