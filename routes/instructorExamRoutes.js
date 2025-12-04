const express = require("express");
const {
  // Exam Management
  createExam,
  updateExam,
  getExams,
  getExamDetail,
  deleteExam,
  getArchivedExams,
  archiveExam,
  
  // Section Management 
  createExamSection,
  updateExamSection,
  deleteExamSection,
  getSections,
  getSectionDetail,
  
  // Question Bank
  createQuestion,
  getQuestions,
  getQuestionDetail,
  updateQuestion,
  deleteQuestion,
  
  // Classes
  getClassesByCourse,
  
  // Section-Question Management
  addQuestionsToSection,
  removeQuestionFromSection,
  updateQuestionOrder,
  
  // Grading
  getExamResults,
  getLearnerSubmission,
  autoGradeExam,
  manualGradeExam,

  // Status Check
  checkAndUpdateExamStatus,
  unarchiveExam
} = require("../controllers/instructorExamController");
const { verifyToken } = require("../middlewares/middware");

const router = express.Router();
router.use(verifyToken);

// ==================== EXAM ROUTES ====================
router.get("/exams", getExams);
router.post("/exams", createExam);
router.get("/exams/archived", getArchivedExams);
router.get("/exams/:examId", getExamDetail);
router.put("/exams/:examId", updateExam);
router.delete("/exams/:examId", deleteExam);
router.post("/exams/:examId/archive", archiveExam);

// ==================== SECTION MANAGEMENT ROUTES ====================
router.get("/exams/:examId/sections", getSections);
router.post("/exams/:examId/sections", createExamSection);
router.get("/exams/:examId/sections/:sectionId", getSectionDetail);
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
router.put("/exams/:examId/sections/:sectionId/questions/:questionId/order", updateQuestionOrder);

// ==================== CLASSES ROUTES ====================
router.get("/courses/:courseId/classes", getClassesByCourse);

// ==================== GRADING ROUTES ====================
router.get("/exams/:examId/classes/:classId/results", getExamResults);
router.get("/exams/:examId/learners/:learnerId/submission", getLearnerSubmission);
router.post("/exams/:examId/learners/:learnerId/auto-grade", autoGradeExam);
router.post("/exams/:examId/learners/:learnerId/manual-grade", manualGradeExam);
router.post("/exams/check-status", checkAndUpdateExamStatus);
router.post("/exams/:examId/unarchive", unarchiveExam);


module.exports = router;