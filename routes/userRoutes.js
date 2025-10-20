const express = require("express");
const router = express.Router();
const {
  getUsers,
  getUser,
  getProfile,
  updateProfile,
  uploadProfilePicture,
  changePassword,
  updateUserInfo,
  deleteUserById,
  getUserRole,
} = require("../controllers/userController");
const { verifyToken } = require("../middlewares/middware");

router.get('/:id/role', getUserRole);

router.use(verifyToken);

router.get("/profile/:id", getProfile);           // GET /api/users/profile/:id
router.put("/profile/:id", updateProfile);        // PUT /api/users/profile/:id
router.post("/profile/:id/upload", uploadProfilePicture); // POST /api/users/profile/:id/upload
router.post("/profile/:id/change-password", changePassword); // POST /api/users/profile/:id/change-password


module.exports = router;