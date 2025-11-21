const express = require("express");
const router = express.Router();
const { verifyToken, authorizeFeature } = require("../middlewares/auth");
const accountController = require("../controllers/accountController");

// Admin APIs - Tạm thời tắt authentication để test
router.get(
  "/:accId",
  // verifyToken,
  // authorizeFeature("admin"),
  accountController.getAccountById
);
router.put(
  "/:accId",
  // verifyToken,
  // authorizeFeature("admin"),
  accountController.updateAccount
);

module.exports = router;

