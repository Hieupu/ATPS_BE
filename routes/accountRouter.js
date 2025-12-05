const express = require("express");
const router = express.Router();
const { verifyToken, authorizeFeature } = require("../middlewares/auth");
const accountController = require("../controllers/accountController");

// Admin APIs
router.get(
  "/:accId",
  verifyToken,
  authorizeFeature("admin"),
  accountController.getAccountById
);
router.put(
  "/:accId",
  verifyToken,
  authorizeFeature("admin"),
  accountController.updateAccount
);

module.exports = router;
