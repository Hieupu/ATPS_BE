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
  retryExam
} = require("../controllers/learnerExamController");


router.use(verifyToken);

// 1. Danh sách các phiên thi đang mở cho learner
router.get("/instances", getAvailableExams);

// 2. Lấy đề thi để làm
router.get("/instances/:instanceId", getExamToDo);

// 3. Lưu đáp án (auto-save)
router.post("/instances/:instanceId/answers", saveExamAnswers);

// 4. Nộp bài + auto chấm điểm
router.post("/instances/:instanceId/submit", submitExam);

// 5. Xem kết quả 1 bài thi
router.get("/instances/:instanceId/result", getExamResult);

// 6. Lịch sử kết quả các bài thi của learner
router.get("/results/history", getExamHistory);

// 7. Làm lại bài thi
router.post("/instances/:instanceId/retry", retryExam);

module.exports = router;
