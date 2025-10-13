const express = require("express");
const router = express.Router();
const { register, getAccounts } = require("../controllers/authController");

router.get("/accounts", getAccounts);
router.post("/register", register);

module.exports = router;
