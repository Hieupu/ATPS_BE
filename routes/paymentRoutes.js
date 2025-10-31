const express = require("express");
const router = express.Router();
const {
  createPaymentLink,
  updatePaymentStatus,
} = require("../controllers/paymentController");
const { verifyToken } = require("../middlewares/middware");

// POST /api/payment/create
router.post("/create", verifyToken, createPaymentLink);

// POST /api/payment/update-status
router.post("/update-status", verifyToken, updatePaymentStatus);

module.exports = router;
