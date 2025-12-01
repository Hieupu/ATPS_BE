// controllers/learnerassignmentController.js
const learnerassignmentService = require('../services/learnerassignmentService');

const getAssignmentDetails = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const accountId = req.user.id;

    const assignment = await learnerassignmentService.getAssignmentDetails(assignmentId, accountId);
    
    res.json({
      success: true,
      assignment
    });
  } catch (error) {
    console.error("Get assignment details error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch assignment details"
    });
  }
};

const getAssignmentQuestions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const accountId = req.user.id;

    const questions = await learnerassignmentService.getAssignmentQuestions(assignmentId, accountId);
    
    res.json({
      success: true,
      questions
    });
  } catch (error) {
    console.error("Get assignment questions error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch assignment questions"
    });
  }
};


// controllers/learnerassignmentController.js
const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const accountId = req.user.id;
    
    console.log("Raw request body:", req.body); // DEBUG
    console.log("Raw request files:", req.files); // DEBUG
    
    // Xử lý multipart form data
    const submissionData = {
      answers: req.body.answers ? JSON.parse(req.body.answers) : {},
      content: req.body.content || '',
      durationSec: req.body.durationSec ? parseInt(req.body.durationSec) : null,
      audioFile: req.files?.audioFile ? req.files.audioFile[0] : null
    };

    console.log("Parsed submission data:", submissionData); // DEBUG

    const result = await learnerassignmentService.submitAssignment(assignmentId, accountId, submissionData);
    
    res.json({
      success: true,
      message: "Assignment submitted successfully",
      submission: result
    });
  } catch (error) {
    console.error("Submit assignment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to submit assignment"
    });
  }
};

const getSubmissionDetails = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const accountId = req.user.id;

    const submission = await learnerassignmentService.getSubmissionDetails(submissionId, accountId);
    
    res.json({
      success: true,
      submission
    });
  } catch (error) {
    console.error("Get submission details error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch submission details"
    });
  }
};

const getAssignmentResults = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const accountId = req.user.id;

    const results = await learnerassignmentService.getAssignmentResults(assignmentId, accountId);
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error("Get assignment results error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch assignment results"
    });
  }
};

module.exports = {
  getAssignmentDetails,
  getAssignmentQuestions,
  submitAssignment,
  getSubmissionDetails,
  getAssignmentResults
};