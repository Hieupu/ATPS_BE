const express = require("express");
const router = express.Router();
const promotionController = require("../controllers/promotionController");
const { verifyToken, authorizeFeature } = require("../middlewares/auth");

// Tất cả routes đều yêu cầu authentication và authorization (admin)
// Trừ route validate/:code là public
router.use(async (req, res, next) => {
  // Bỏ qua auth cho route validate (public)
  if (req.path.startsWith("/validate/")) {
    return next();
  }
  // Áp dụng auth cho các route khác
  await verifyToken(req, res, () => {
    authorizeFeature("admin")(req, res, next);
  });
});

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
