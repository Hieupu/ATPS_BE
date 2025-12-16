const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/middware");
const {
  getAvailableExams,
  getExamToDo,
  saveExamAnswers,
  submitExam,
  getExamResult,
  getExamHistory,
  retryExam,
  reviewExam  
} = require("../controllers/learnerExamController");

router.use(verifyToken);

router.get("/instances", getAvailableExams);
router.get("/instances/:instanceId", getExamToDo);
router.post("/instances/:instanceId/answers", saveExamAnswers);
router.post("/instances/:instanceId/submit", submitExam);
router.get("/instances/:instanceId/result", getExamResult);
router.get("/instances/:instanceId/review", reviewExam);
router.get("/results/history", getExamHistory);
router.post("/instances/:instanceId/retry", retryExam);

module.exports = router;