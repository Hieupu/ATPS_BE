const express = require("express");
const {
  createExam,
  updateExam,
  getExams,
  getExamDetail,
  deleteExam,
  archiveExam,
  unarchiveExam,
  getArchivedExams,
  createFullExamController,

  createExamInstance,
  updateExamInstance,
  deleteExamInstance,
  getExamInstances,
  getClassesByCourse,
  getUnitByCourse,
  checkAndUpdateInstanceStatus,
  getInstructorCourses,

  createExamSection,
  updateExamSection,
  deleteExamSection,
  getSections,
  getSectionDetail,

  createQuestion,
  getQuestions,
  getQuestionDetail,
  updateQuestion,
  deleteQuestion,

  addQuestionsToSection,
  removeQuestionFromSection,
  updateQuestionOrder,

  getExamResults,
  getLearnerSubmission,
  autoGradeExam,
  manualGradeExam,

  importQuestionsExcelController,
  openExamInstanceNow,
  closeExamInstanceNow,
} = require("../controllers/instructorExamController");
const { verifyToken } = require("../middlewares/middware");

const multer = require("multer");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage()
});

router.use(verifyToken);

router.get("/exams", getExams);
router.post("/exams", createExam);
router.post("/exams/full", createFullExamController);
router.get("/exams/archived", getArchivedExams);
router.get("/exams/:examId", getExamDetail);
router.put("/exams/:examId", updateExam);
router.delete("/exams/:examId", deleteExam);
router.post("/exams/:examId/archive", archiveExam);
router.post("/exams/:examId/unarchive", unarchiveExam);

router.get("/exams/:examId/instances", getExamInstances);
router.post("/exams/:examId/instances", createExamInstance);
router.put("/exams/:examId/instances/:instanceId", updateExamInstance);
router.delete("/exams/:examId/instances/:instanceId", deleteExamInstance);
router.get("/course/:courseId/classes", getClassesByCourse);
router.get("/course/:courseId/units", getUnitByCourse);
router.post("/instances/check-status", checkAndUpdateInstanceStatus);
router.get("/courses", getInstructorCourses);

router.get("/exams/:examId/sections", getSections);
router.post("/exams/:examId/sections", createExamSection);
router.get("/exams/:examId/sections/:sectionId", getSectionDetail);
router.put("/exams/:examId/sections/:sectionId", updateExamSection);
router.delete("/exams/:examId/sections/:sectionId", deleteExamSection);

router.get("/questions", getQuestions);
router.post("/questions", createQuestion);
router.get("/questions/:questionId", getQuestionDetail);
router.put("/questions/:questionId", updateQuestion);
router.delete("/questions/:questionId", deleteQuestion);

router.post("/exams/:examId/sections/:sectionId/questions", addQuestionsToSection);
router.delete("/exams/:examId/sections/:sectionId/questions/:questionId", removeQuestionFromSection);
router.put("/exams/:examId/sections/:sectionId/questions/:questionId/order", updateQuestionOrder);

router.get("/instances/:instanceId/results", getExamResults);
router.get("/exams/:examId/learners/:learnerId/submission", getLearnerSubmission);
router.post("/exams/:examId/learners/:learnerId/auto-grade", autoGradeExam);
router.post("/exams/:examId/learners/:learnerId/manual-grade", manualGradeExam);


router.post(
  "/exams/:examId/sections/:sectionId/questions/import",
  upload.single("file"),
  importQuestionsExcelController
);

router.post("/exams/:examId/instances/:instanceId/open-now", openExamInstanceNow);
router.post("/exams/:examId/instances/:instanceId/close-now", closeExamInstanceNow);

module.exports = router;