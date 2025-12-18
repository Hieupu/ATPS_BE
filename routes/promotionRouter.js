const express = require("express");
const router = express.Router();
const promotionController = require("../controllers/promotionController");
const {
  verifyToken,
  authorizeFeature,
  authorizeRole,
} = require("../middlewares/middware");

// Kiểm tra promotion có hợp lệ không (public endpoint - không cần auth)
router.get("/validate/:code", promotionController.validatePromotion);

// Các route còn lại yêu cầu auth (admin hoặc staff)
router.use(verifyToken);
router.use(authorizeRole("admin", "staff"));

// Tạo promotion mới
router.post("/", promotionController.createPromotion);

// Lấy tất cả promotions
router.get("/", promotionController.getAllPromotions);

// Lấy promotions theo trạng thái
router.get("/status", promotionController.getPromotionsByStatus);

// Kiểm tra promotion có hợp lệ không (public endpoint - không cần auth)
router.get("/validate/:code", promotionController.validatePromotion);

// Lấy promotion theo Code
router.get("/code/:code", promotionController.getPromotionByCode);

// Lấy promotion theo ID
router.get("/:id", promotionController.getPromotionById);

// Cập nhật promotion
router.put("/:id", promotionController.updatePromotion);

// Xóa promotion
router.delete("/:id", promotionController.deletePromotion);

// Kích hoạt promotion
router.post("/:id/activate", promotionController.activatePromotion);

// Vô hiệu hóa promotion
router.post("/:id/deactivate", promotionController.deactivatePromotion);

module.exports = router;
