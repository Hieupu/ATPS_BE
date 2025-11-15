const express = require("express");
const router = express.Router();
const {
  createPaymentLink,
  updatePaymentStatus,
  checkPromotionCode,
  getPaymentLinkByOrderCode,
} = require("../controllers/paymentController");
const { verifyToken } = require("../middlewares/middware");

// POST /api/payment/create
router.post("/create", verifyToken, createPaymentLink);

// POST /api/payment/update-status
router.post("/update-status", verifyToken, updatePaymentStatus);

// POST /api/payment/check-promo
router.post("/check-promo", verifyToken, checkPromotionCode);

// GET /api/payment/get-link/:orderCode
router.get("/get-link/:orderCode", verifyToken, getPaymentLinkByOrderCode);

module.exports = router;
