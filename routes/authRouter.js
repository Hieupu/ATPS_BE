const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/logout", authController.logout);
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-reset-code", authController.verifyResetCode);
router.post("/reset-password", authController.resetPassword);
router.get("/google", authController.googleAuth);
router.get("/google/callback", authController.googleAuthCallback);
router.get("/facebook", authController.facebookAuth);
router.get("/facebook/callback", authController.facebookAuthCallback);

module.exports = router;
