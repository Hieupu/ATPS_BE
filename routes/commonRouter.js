const express = require("express");
const router = express.Router();
const classController = require("../controllers/classController");

// Common APIs cho dropdowns và shared data
router.get("/courses", classController.getAllCourses);
router.get("/courses/instructors", classController.getAllInstructors);

module.exports = router;
