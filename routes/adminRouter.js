const express = require("express");
const router = express.Router();
const { verifyToken, authorizeFeature } = require("../middlewares/middware");
const adminController = require("../controllers/adminController");

router.get(
  "/",
  verifyToken,
  authorizeFeature("admin"),
  adminController.getAllAdmins
);
router.post(
  "/",
  verifyToken,
  authorizeFeature("admin"),
  adminController.createAdmin
);
router.get(
  "/:id",
  verifyToken,
  authorizeFeature("admin"),
  adminController.getAdminById
);
router.put(
  "/:id",
  verifyToken,
  authorizeFeature("admin"),
  adminController.updateAdmin
);


module.exports = router;
