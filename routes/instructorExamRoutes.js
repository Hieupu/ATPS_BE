const express = require("express");
const {
  createExam,
  updateExam,
  getExams,
  getExamDetail,
  deleteExam,
  // Section Management 
  createExamSection,
  updateExamSection,
  deleteExamSection,
  getSections,
  // Question Bank
  createQuestion,
  getQuestions,
  getQuestionDetail,
  updateQuestion,
  deleteQuestion,
  // Section-Question Management 
  addQuestionsToSection,
  removeQuestionFromSection,
  // Grading
  getExamResults,
  getLearnerSubmission,
  autoGradeExam,
  manualGradeExam
} = require("../controllers/instructorExamController");
const { verifyToken } = require("../middlewares/middware");

const router = express.Router();
router.use(verifyToken);

// ==================== EXAM ROUTES ====================
router.get("/exams", getExams);
router.post("/exams", createExam);
router.get("/exams/:examId", getExamDetail);
router.put("/exams/:examId", updateExam);
router.delete("/exams/:examId", deleteExam);

// ==================== SECTION MANAGEMENT ROUTES ====================
router.get("/exams/:examId/sections", getSections);
router.post("/exams/:examId/sections", createExamSection);
router.put("/exams/:examId/sections/:sectionId", updateExamSection);
router.delete("/exams/:examId/sections/:sectionId", deleteExamSection);

// ==================== QUESTION BANK ROUTES ====================
router.get("/questions", getQuestions);
router.post("/questions", createQuestion);
router.get("/questions/:questionId", getQuestionDetail);
router.put("/questions/:questionId", updateQuestion);
router.delete("/questions/:questionId", deleteQuestion);

// ==================== SECTION-QUESTION MANAGEMENT ====================
router.post("/exams/:examId/sections/:sectionId/questions", addQuestionsToSection);
router.delete("/exams/:examId/sections/:sectionId/questions/:questionId", removeQuestionFromSection);

// ==================== GRADING ROUTES ====================
router.get("/exams/:examId/classes/:classId/results", getExamResults);
router.get("/exams/:examId/learners/:learnerId/submission", getLearnerSubmission);
router.post("/exams/:examId/learners/:learnerId/auto-grade", autoGradeExam);
router.post("/exams/:examId/learners/:learnerId/manual-grade", manualGradeExam);

module.exports = router;