const express = require("express");
const router = express.Router();
const upload = require("../middlewares/uploadMiddleware");
const { verifyToken } = require("../middlewares/middware");
const profileController = require("../controllers/profileController");

router.get("/", verifyToken, profileController.getProfile);
router.put("/", verifyToken, profileController.updateProfile);
router.put("/password", verifyToken, profileController.changePassword);
router.put("/avatar", 
  verifyToken, 
  upload.single('avatar'), 
  profileController.updateAvatar
);

module.exports = router;