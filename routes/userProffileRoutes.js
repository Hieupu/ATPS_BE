
const express = require("express");
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
  changePassword
} = require("../controllers/userProfileController");

router.get("/:id", getUserProfile);           // GET /api/user-profile/:id
router.put("/:id", updateUserProfile);        // PUT /api/user-profile/:id
router.post("/:id/upload", uploadProfilePicture); // POST /api/user-profile/:id/upload
router.post("/:id/change-password", changePassword); // POST /api/user-profile/:id/change-password

module.exports = router;