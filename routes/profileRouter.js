const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth");
const profileController = require("../controllers/profileController");

router.get("/", verifyToken, profileController.getProfile);
router.put("/", verifyToken, profileController.updateProfile);
router.put("/password", verifyToken, profileController.changePassword);
router.put("/avatar", verifyToken, profileController.updateAvatar);

module.exports = router;
