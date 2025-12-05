const express = require("express");
const router = express.Router();
const emailTemplateController = require("../controllers/emailTemplateController");
const { verifyToken, authorizeFeature } = require("../middlewares/auth");

// Lấy danh sách templates
router.get(
  "/",
  verifyToken,
  authorizeFeature("admin"),
  emailTemplateController.getAllTemplates
);

// Lấy template theo ID
router.get(
  "/:id",
  verifyToken,
  authorizeFeature("admin"),
  emailTemplateController.getTemplateById
);

// Tạo template mới
router.post(
  "/",
  verifyToken,
  authorizeFeature("admin"),
  emailTemplateController.createTemplate
);

// Cập nhật template
router.put(
  "/:id",
  verifyToken,
  authorizeFeature("admin"),
  emailTemplateController.updateTemplate
);

// Xóa template
router.delete(
  "/:id",
  verifyToken,
  authorizeFeature("admin"),
  emailTemplateController.deleteTemplate
);

// Preview template
router.post(
  "/:id/preview",
  verifyToken,
  authorizeFeature("admin"),
  emailTemplateController.previewTemplate
);

// Test gửi email
router.post(
  "/:id/test",
  verifyToken,
  authorizeFeature("admin"),
  emailTemplateController.testSendEmail
);

// Gửi email sử dụng template code
router.post(
  "/send",
  verifyToken,
  authorizeFeature("admin"),
  emailTemplateController.sendEmailWithTemplate
);

module.exports = router;

