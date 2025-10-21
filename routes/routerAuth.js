const express = require("express");
const passport = require("passport");
const {
  register,
  login,
  googleLogin,
  logout,
  googleAuth,
  googleAuthCallback,
  facebookAuth,
  facebookAuthCallback,
  getAllAccountsController,
     forgotPassword,
    verifyResetCode,
    resetPassword
} = require("../controllers/authController");
const { verifyToken, authorizeFeature } = require("../middlewares/middware");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);
router.get("/google", googleAuth);
router.get("/google/callback", googleAuthCallback);
router.get("/facebook", facebookAuth);
router.get("/facebook/callback", facebookAuthCallback);

//phân quyền mẫu (Manager Admin là Name trong bảng Features)
// router.get(
//   "/admin",
//   verifyToken,
//   authorizeFeature("Manager Admin"),
//   getAllAccountsController
// );

module.exports = router;
