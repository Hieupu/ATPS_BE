const express = require("express");
const router = express.Router();
const {
  createPaymentLink,
  updatePaymentStatus,
  checkPromotionCode,
  getPaymentLinkByOrderCode,
  requestRefund,
  getPaymentHistory,
  getAdminPaymentHistory,
  cancelRefundRequest
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

router.get("/learner/:learnerId",verifyToken, getPaymentHistory);
router.get("/admin/history", verifyToken, getAdminPaymentHistory);

// Request refund
router.post("/refunds/request", verifyToken, requestRefund);

router.put("/refund/:refundId/cancel", verifyToken , cancelRefundRequest);

module.exports = router;
