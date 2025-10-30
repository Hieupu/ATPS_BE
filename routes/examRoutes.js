const express = require("express");
const { verifyToken } = require("../middlewares/middware");
const examController = require("../controllers/examController");

const router = express.Router();

router.get("/course/:courseId", verifyToken, examController.listByCourse);
router.get("/:examId/questions", verifyToken, examController.getQuestions);
router.post("/:examId/submit", verifyToken, examController.submit);

module.exports = router;
