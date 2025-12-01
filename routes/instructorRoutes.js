const express = require("express");
const router = express.Router();
const instructorController = require("../controllers/instructorController");

// Public endpoints for instructors list and detail
router.get("/featured", instructorController.getFeaturedInstructors);
router.get("/", instructorController.getAllInstructors);
router.get("/account/:accountId", instructorController.getInstructorIdByAccountId);
router.get("/:id", instructorController.getInstructorById);

module.exports = router;
