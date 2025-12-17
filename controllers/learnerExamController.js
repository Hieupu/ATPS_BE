const {
  getAvailableExamsService,
  getExamToDoService,
  saveExamAnswersService,
  submitExamService,
  getExamResultService,
  getHistoryService,
  retryExamService,
  reviewExamService
} = require("../services/learnerExamService");


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

const submitExam = async (req, res) => {
  try {
    const learnerAccId = req.user.id;
    const { instanceId } = req.params;
    const { answers, durationSec, content, assets } = req.body || {};

    const metadata = {
      durationSec,
      content,
      assets
    };

    const result = await submitExamService(
      learnerAccId,
      instanceId,
      answers || [],
      metadata
    );

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        submissionId: result.submissionId,
        score: result.score,
        maxScore: result.maxScore,
        totalScore: result.totalScore,
        autoGradedCount: result.autoGradedCount,
        manualGradeCount: result.manualGradeCount,
        isLate: result.isLate,
        submissionStatus: result.submissionStatus,
        durationSec: result.durationSec
      }
    });
  } catch (err) {
    return res.status(err.status || 400).json({
      success: false,
      message: err.message || "Lỗi khi nộp bài"
    });
  }
};

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

const reviewExam = async (req, res) => {
  try {
    const learnerAccId = req.user.id;
    const { instanceId } = req.params;

    const data = await reviewExamService(learnerAccId, instanceId);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    return res.status(err.status || 400).json({
      success: false,
      message: err.message || "Lỗi khi lấy review bài thi"
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
  retryExam,
  reviewExam
};