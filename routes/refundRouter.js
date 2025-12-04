const express = require("express");
const router = express.Router();
const refundController = require("../controllers/refundController");
// const { authenticate, authorize } = require("../middleware/auth"); // Uncomment khi có auth middleware

// Tất cả routes đều yêu cầu authentication và authorization (admin)
// router.use(authenticate);
// router.use(authorize(["admin"]));

// Tạo yêu cầu hoàn tiền
router.post("/", refundController.createRefund);

// Lấy tất cả yêu cầu hoàn tiền
router.get("/", refundController.getAllRefunds);

// Lấy yêu cầu hoàn tiền theo trạng thái
router.get("/status", refundController.getRefundsByStatus);

// Lấy yêu cầu hoàn tiền theo ID
router.get("/:id", refundController.getRefundById);

// Cập nhật yêu cầu hoàn tiền
router.put("/:id", refundController.updateRefund);

// Xóa yêu cầu hoàn tiền
router.delete("/:id", refundController.deleteRefund);

// Duyệt yêu cầu hoàn tiền
router.post("/:id/approve", refundController.approveRefund);

// Từ chối yêu cầu hoàn tiền
router.post("/:id/reject", refundController.rejectRefund);

// Hoàn tiền (approved -> completed)
router.post("/:id/complete", refundController.completeRefund);

module.exports = router;
