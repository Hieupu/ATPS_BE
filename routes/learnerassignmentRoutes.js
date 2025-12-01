// routes/learnerassignmentRoutes.js
const express = require('express');
const router = express.Router();
const learnerassignmentController = require('../controllers/learnerassignmentController');
const { verifyToken } = require("../middlewares/middware");
const upload = require('../middlewares/uploadMiddleware');
// Lấy assignment details với questions
router.get('/:assignmentId', verifyToken, learnerassignmentController.getAssignmentDetails);

// Lấy questions của assignment
router.get('/:assignmentId/questions', verifyToken, learnerassignmentController.getAssignmentQuestions);

// Submit assignment
router.post('/:assignmentId/submit', 
  verifyToken, 
  upload.fields([{ name: 'audioFile', maxCount: 1 }]),
  learnerassignmentController.submitAssignment
);

// Lấy submission details
router.get('/submissions/:submissionId', verifyToken, learnerassignmentController.getSubmissionDetails);

// Lấy assignment results (sau khi nộp)
router.get('/:assignmentId/results', verifyToken, learnerassignmentController.getAssignmentResults);

module.exports = router;