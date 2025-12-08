// controllers/learnerExamController.js
const {
  getAvailableExamsService,
  getExamToDoService,
  saveExamAnswersService,
  submitExamService,
  getExamResultService,
  getHistoryService,
  retryExamService
} = require("../services/learnerExamService");

/**
 * GET /api/exams/instances
 * Lấy danh sách phiên thi đang mở cho learner
 */
const getAvailableExams = async (req, res) => {
  try {
    const learnerAccId = req.user.id;
    const data = await getAvailableExamsService(learnerAccId);

    return res.status(200).json({
      success: true,
      data,
      total: data.length
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Lỗi khi lấy danh sách phiên thi"
    });
  }
};

/**
 * GET /api/exams/instances/:instanceId
 * Lấy đề thi (section + question) để làm
 */
const getExamToDo = async (req, res) => {
  try {
    const learnerAccId = req.user.id;
    const { instanceId } = req.params;

    const data = await getExamToDoService(learnerAccId, instanceId);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    return res.status(err.status || 400).json({
      success: false,
      message: err.message || "Lỗi khi lấy đề thi"
    });
  }
};

/**
 * POST /api/exams/instances/:instanceId/answers
 * Body: { answers: [{ examQuestionId, answer }, ...] }
 * Lưu đáp án (auto-save)
 */
const saveExamAnswers = async (req, res) => {
  try {
    const learnerAccId = req.user.id;
    const { instanceId } = req.params;
    const { answers } = req.body;

    const result = await saveExamAnswersService(
      learnerAccId,
      instanceId,
      answers || []
    );

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    return res.status(err.status || 400).json({
      success: false,
      message: err.message || "Lỗi khi lưu đáp án"
    });
  }
};

/**
 * POST /api/exams/instances/:instanceId/submit
 * Body optional: { answers: [...] } – nếu FE gửi kèm để nộp lần cuối
 */
const submitExam = async (req, res) => {
  try {
    const learnerAccId = req.user.id;
    const { instanceId } = req.params;
    const { answers } = req.body || {};

    const result = await submitExamService(
      learnerAccId,
      instanceId,
      answers || []
    );

    return res.status(200).json({
      success: true,
      message: "Nộp bài và chấm điểm thành công",
      ...result
    });
  } catch (err) {
    return res.status(err.status || 400).json({
      success: false,
      message: err.message || "Lỗi khi nộp bài"
    });
  }
};

/**
 * GET /api/exams/instances/:instanceId/result
 * Xem kết quả một bài thi cụ thể
 */
const getExamResult = async (req, res) => {
  try {
    const learnerAccId = req.user.id;
    const { instanceId } = req.params;

    const data = await getExamResultService(learnerAccId, instanceId);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    return res.status(err.status || 400).json({
      success: false,
      message: err.message || "Lỗi khi lấy kết quả thi"
    });
  }
};

/**
 * GET /api/exams/results/history
 * Lịch sử kết quả các bài thi của learner
 */
const getExamHistory = async (req, res) => {
  try {
    const learnerAccId = req.user.id;
    const data = await getHistoryService(learnerAccId);

    return res.status(200).json({
      success: true,
      data,
      total: data.length
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Lỗi khi lấy lịch sử bài thi"
    });
  }
};
const retryExam = async (req, res) => {
  try {
    const learnerAccId = req.user.id;
    const { instanceId } = req.params;

    const data = await retryExamService(learnerAccId, instanceId);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    return res.status(err.status || 400).json({
      success: false,
      message: err.message || "Lỗi khi làm lại bài"
    });
  }
};

module.exports = {
  getAvailableExams,
  getExamToDo,
  saveExamAnswers,
  submitExam,
  getExamResult,
  getExamHistory,
  retryExam
};
