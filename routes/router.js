const express = require("express");
const { register, login, logout } = require("../controllers/authController");
const { verifyToken } = require("../middlewares/middware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", verifyToken, logout);

module.exports = router;
