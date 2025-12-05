const express = require("express");
const {
  createAssignment,
  getAssignments,
  getAssignmentDetail,
  updateAssignment,
  deleteAssignment,
  getUnits,
  getCourses,
  uploadFile,
  getAllAssignmentsStats, 
  getAssignmentStats,
  getAssignmentQuestions,
  createAndAddQuestion,
  removeQuestion,
  importQuestionsFromExcel, 
} = require("../controllers/assignmentController");
const { verifyToken } = require("../middlewares/middware");
const multer = require("multer");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.use(verifyToken);

// CRUD
router.post("/assignments", createAssignment);
router.get("/assignments", getAssignments);
router.get("/assignments/:id", getAssignmentDetail);
router.put("/assignments/:id", updateAssignment);
router.delete("/assignments/:id", deleteAssignment);

// Dropdowns
router.get("/units", getUnits);
router.get("/courses", getCourses);

// Upload to Cloudinary
router.post("/uploads", upload.single("file"), uploadFile);

// Stats
router.get("/stats/all", getAllAssignmentsStats);
router.get("/assignments/:id/stats", getAssignmentStats);

// Questions
router.get("/assignments/:id/questions", getAssignmentQuestions);
router.post("/assignments/:id/questions", createAndAddQuestion);
router.delete("/assignments/:id/questions/:questionId", removeQuestion);

// Import questions từ Excel
router.post(
  "/assignments/:id/questions/import-excel",
  upload.single("file"),         
  importQuestionsFromExcel
);

module.exports = router;