const express = require("express");
const {
  // Exam CRUD
  createExam,
  updateExam,
  getExams,
  getExamDetail,
  deleteExam,
  archiveExam,
  unarchiveExam,
  getArchivedExams,

  // Exam Instances
  createExamInstance,
  updateExamInstance,
  deleteExamInstance,
  getExamInstances,
  getAvailableClasses,
  getAvailableUnits,
  checkAndUpdateInstanceStatus,

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

  // Section-Question Management
  addQuestionsToSection,
  removeQuestionFromSection,
  updateQuestionOrder,

  // Grading
  getExamResults,
  getLearnerSubmission,
  autoGradeExam,
  manualGradeExam,

  importQuestionsExcelController
} = require("../controllers/instructorExamController");
const { verifyToken } = require("../middlewares/middware");

const multer = require("multer");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage()
});

router.use(verifyToken);

// ==================== EXAM ROUTES ====================
router.get("/exams", getExams);
router.post("/exams", createExam);
router.get("/exams/archived", getArchivedExams);
router.get("/exams/:examId", getExamDetail);
router.put("/exams/:examId", updateExam);
router.delete("/exams/:examId", deleteExam);
router.post("/exams/:examId/archive", archiveExam);
router.post("/exams/:examId/unarchive", unarchiveExam);

// ==================== EXAM INSTANCE ROUTES ====================
router.get("/exams/:examId/instances", getExamInstances);
router.post("/exams/:examId/instances", createExamInstance);
router.put("/exams/:examId/instances/:instanceId", updateExamInstance);
router.delete("/exams/:examId/instances/:instanceId", deleteExamInstance);
router.get("/available-classes", getAvailableClasses);
router.get("/available-units", getAvailableUnits);
router.post("/instances/check-status", checkAndUpdateInstanceStatus);

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

// ==================== GRADING ROUTES ====================
router.get("/instances/:instanceId/results", getExamResults);
router.get("/exams/:examId/learners/:learnerId/submission", getLearnerSubmission);
router.post("/exams/:examId/learners/:learnerId/auto-grade", autoGradeExam);
router.post("/exams/:examId/learners/:learnerId/manual-grade", manualGradeExam);


router.post(
  "/exams/:examId/sections/:sectionId/questions/import",
  upload.single("file"),
  importQuestionsExcelController
);

module.exports = router;