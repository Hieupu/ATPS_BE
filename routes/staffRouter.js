const express = require("express");
const router = express.Router();
const { verifyToken, authorizeFeature } = require("../middlewares/middware");
const staffController = require("../controllers/staffController");

// Tạm thời bỏ middleware auth để test
router.get("/", staffController.getAllStaff);
router.post("/", staffController.createStaff);
router.get("/:id", staffController.getStaffById);
router.put("/:id", staffController.updateStaff);
router.delete("/:id", staffController.deleteStaff);

module.exports = router;

