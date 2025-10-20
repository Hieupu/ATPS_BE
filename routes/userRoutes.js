const express = require("express");
const router = express.Router();
const {
  getUsers,
  getUser,
  updateUserInfo,
  deleteUserById,
} = require("../controllers/userController");

const { getUserRole } = require("../models/user");

// Các route chính cho user
router.get("/", getUsers);            // GET /api/users
router.get("/:id", getUser);          // GET /api/users/:id
router.put("/:id", updateUserInfo);   // PUT /api/users/:id
router.delete("/:id", deleteUserById);// DELETE /api/users/:id

router.get('/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const role = await getUserRole(id);
    res.json({ role });
  } catch (error) {
    console.error("Error getting user role:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
