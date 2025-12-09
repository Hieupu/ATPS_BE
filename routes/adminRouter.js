const express = require("express");
const router = express.Router();
const { verifyToken, authorizeFeature } = require("../middlewares/middware");
const adminController = require("../controllers/adminController");

// Tạm thời bỏ middleware auth để test
router.get("/", adminController.getAllAdmins);
router.post("/", adminController.createAdmin);
router.get("/:id", adminController.getAdminById);
router.put("/:id", adminController.updateAdmin);
router.delete("/:id", adminController.deleteAdmin);

module.exports = router;

