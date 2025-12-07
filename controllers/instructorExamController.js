const {
  // Exam CRUD
  createExamService,
  updateExamService,
  getExamsService,
  getExamDetailService,
  deleteExamService,
  archiveExamService,
  unarchiveExamService,
  getArchivedExamsService,

  // Exam Instances
  createExamInstanceService,
  updateExamInstanceService,
  deleteExamInstanceService,
  getExamInstancesService,
  getAvailableClassesService,
  getAvailableUnitsService,
  checkAndUpdateInstanceStatusService,

  // Section Management
  createExamSectionService,
  updateExamSectionService,
  deleteExamSectionService,
  getSectionsService,
  getSectionDetailService,

  // Question Bank
  createQuestionService,
  getQuestionsService,
  getQuestionDetailService,
  updateQuestionService,
  deleteQuestionService,

  // Section-Question Management
  addQuestionsToSectionService,
  removeQuestionFromSectionService,
  updateQuestionOrderService,

  // Grading
  getExamResultsService,
  getLearnerSubmissionService,
  autoGradeExamService,
  manualGradeExamService,

  importQuestionsFromExcel,

} = require("../services/instructorExamService");

// ==================== EXAM CONTROLLERS ====================

/**
 * Tạo exam mới (template)
 * POST /api/instructor/exams
 */
const createExam = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const examData = req.body;

    const result = await createExamService(instructorAccId, examData);

    res.status(201).json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(err.status || 400).json({
      success: false,
      message: err.message || "Lỗi khi tạo bài thi"
    });
  }
};

/**
 * Cập nhật exam template
 * PUT /api/instructor/exams/:examId
 */
const updateExam = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { examId } = req.params;
    const examData = req.body;

    const result = await updateExamService(instructorAccId, examId, examData);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(err.status || 400).json({
      success: false,
      message: err.message || "Lỗi khi cập nhật bài thi"
    });
  }
};

/**
 * Lấy danh sách exams của instructor
 * GET /api/instructor/exams?status=Draft&type=Exam
 */
const getExams = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const filters = {
      status: req.query.status,
      type: req.query.type
    };

    const exams = await getExamsService(instructorAccId, filters);

    res.status(200).json({
      success: true,
      data: exams,
      total: exams.length
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Lỗi khi lấy danh sách bài thi"
    });
  }
};

/**
 * Lấy chi tiết exam với cấu trúc phân cấp
 * GET /api/instructor/exams/:examId
 */
const getExamDetail = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { examId } = req.params;

    const exam = await getExamDetailService(instructorAccId, examId);

    res.status(200).json({
      success: true,
      data: exam
    });
  } catch (err) {
    res.status(err.status || 404).json({
      success: false,
      message: err.message || "Lỗi khi lấy chi tiết bài thi"
    });
  }
};

/**
 * Xóa exam (chuyển sang Archived)
 * DELETE /api/instructor/exams/:examId
 */
const deleteExam = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { examId } = req.params;

    const result = await deleteExamService(instructorAccId, examId);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(err.status || 400).json({
      success: false,
      message: err.message || "Lỗi khi xóa bài thi"
    });
  }
};

/**
 * Lưu trữ exam
 * POST /api/instructor/exams/:examId/archive
 */
const archiveExam = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { examId } = req.params;

    const result = await archiveExamService(instructorAccId, examId);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(err.status || 400).json({
      success: false,
      message: err.message || "Lỗi khi lưu trữ bài thi"
    });
  }
};

/**
 * Khôi phục exam từ lưu trữ
 * POST /api/instructor/exams/:examId/unarchive
 */
const unarchiveExam = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { examId } = req.params;

    const result = await unarchiveExamService(instructorAccId, examId);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(err.status || 400).json({
      success: false,
      message: err.message || "Lỗi khi khôi phục bài thi"
    });
  }
};

/**
 * Lấy danh sách exam đã lưu trữ
 * GET /api/instructor/exams/archived
 */
const getArchivedExams = async (req, res) => {
  try {
    const instructorAccId = req.user.id;

    const exams = await getArchivedExamsService(instructorAccId);

    res.status(200).json({
      success: true,
      data: exams,
      total: exams.length
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Lỗi khi lấy danh sách bài thi đã lưu trữ"
    });
  }
};

// ==================== EXAM INSTANCE CONTROLLERS ====================

/**
 * Tạo exam instance (phiên thi cụ thể)
 * POST /api/instructor/exams/:examId/instances
 */
const createExamInstance = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { examId } = req.params;
    const instanceData = req.body;

    const result = await createExamInstanceService(instructorAccId, examId, instanceData);

    res.status(201).json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(err.status || 400).json({
      success: false,
      message: err.message || "Lỗi khi tạo phiên thi"
    });
  }
};

/**
 * Cập nhật exam instance
 * PUT /api/instructor/exams/:examId/instances/:instanceId
 */
const updateExamInstance = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { examId, instanceId } = req.params;
    const instanceData = req.body;

    const result = await updateExamInstanceService(instructorAccId, examId, instanceId, instanceData);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(err.status || 400).json({
      success: false,
      message: err.message || "Lỗi khi cập nhật phiên thi"
    });
  }
};

/**
 * Xóa exam instance
 * DELETE /api/instructor/exams/:examId/instances/:instanceId
 */
const deleteExamInstance = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { examId, instanceId } = req.params;

    const result = await deleteExamInstanceService(instructorAccId, examId, instanceId);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(err.status || 400).json({
      success: false,
      message: err.message || "Lỗi khi xóa phiên thi"
    });
  }
};

/**
 * Lấy danh sách instances của exam
 * GET /api/instructor/exams/:examId/instances
 */
const getExamInstances = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { examId } = req.params;

    const instances = await getExamInstancesService(instructorAccId, examId);

    res.status(200).json({
      success: true,
      data: instances,
      total: instances.length
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Lỗi khi lấy danh sách phiên thi"
    });
  }
};

/**
 * Lấy danh sách classes có thể gán
 * GET /api/instructor/available-classes
 */
const getAvailableClasses = async (req, res) => {
  try {
    const instructorAccId = req.user.id;

    const classes = await getAvailableClassesService(instructorAccId);

    res.status(200).json({
      success: true,
      data: classes,
      total: classes.length
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Lỗi khi lấy danh sách lớp học"
    });
  }
};

/**
 * Lấy danh sách units có thể gán
 * GET /api/instructor/available-units
 */
const getAvailableUnits = async (req, res) => {
  try {
    const instructorAccId = req.user.id;

    const units = await getAvailableUnitsService(instructorAccId);

    res.status(200).json({
      success: true,
      data: units,
      total: units.length
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Lỗi khi lấy danh sách units"
    });
  }
};

/**
 * Auto update exam instance status (Scheduled -> Open -> Closed)
 * POST /api/instructor/instances/check-status
 */
const checkAndUpdateInstanceStatus = async (req, res) => {
  try {
    const result = await checkAndUpdateInstanceStatusService();

    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Controller: Check instance status error:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to check instance status"
    });
  }
};

// ==================== SECTION MANAGEMENT CONTROLLERS ====================

/**
 * Tạo section mới
 * POST /api/instructor/exams/:examId/sections
 */
const createExamSection = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { examId } = req.params;
    const sectionData = req.body;

    const result = await createExamSectionService(instructorAccId, examId, sectionData);

    res.status(201).json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(err.status || 400).json({
      success: false,
      message: err.message || "Lỗi khi tạo section"
    });
  }
};

/**
 * Cập nhật section
 * PUT /api/instructor/exams/:examId/sections/:sectionId
 */
const updateExamSection = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { examId, sectionId } = req.params;
    const sectionData = req.body;

    const result = await updateExamSectionService(instructorAccId, examId, sectionId, sectionData);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(err.status || 400).json({
      success: false,
      message: err.message || "Lỗi khi cập nhật section"
    });
  }
};

/**
 * Xóa section
 * DELETE /api/instructor/exams/:examId/sections/:sectionId
 */
const deleteExamSection = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { examId, sectionId } = req.params;

    const result = await deleteExamSectionService(instructorAccId, examId, sectionId);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(err.status || 400).json({
      success: false,
      message: err.message || "Lỗi khi xóa section"
    });
  }
};

/**
 * Lấy danh sách sections
 * GET /api/instructor/exams/:examId/sections?hierarchical=true
 */
const getSections = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { examId } = req.params;
    const hierarchical = req.query.hierarchical !== 'false';

    const sections = await getSectionsService(instructorAccId, examId, hierarchical);

    res.status(200).json({
      success: true,
      data: sections,
      hierarchical: hierarchical
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Lỗi khi lấy danh sách sections"
    });
  }
};

/**
 * Lấy chi tiết section
 * GET /api/instructor/exams/:examId/sections/:sectionId
 */
const getSectionDetail = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { examId, sectionId } = req.params;

    const section = await getSectionDetailService(instructorAccId, examId, sectionId);

    res.status(200).json({
      success: true,
      data: section
    });
  } catch (err) {
    res.status(err.status || 404).json({
      success: false,
      message: err.message || "Lỗi khi lấy chi tiết section"
    });
  }
};

// ==================== QUESTION BANK CONTROLLERS ====================

/**
 * Tạo câu hỏi mới
 * POST /api/instructor/questions
 */
const createQuestion = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const questionData = req.body;

    const result = await createQuestionService(instructorAccId, questionData);

    res.status(201).json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(err.status || 400).json({
      success: false,
      message: err.message || "Lỗi khi tạo câu hỏi"
    });
  }
};

/**
 * Lấy danh sách câu hỏi
 * GET /api/instructor/questions?topic=Grammar&level=Easy&type=multiple_choice
 */
const getQuestions = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const filters = {
      topic: req.query.topic,
      level: req.query.level,
      type: req.query.type
    };

    const questions = await getQuestionsService(instructorAccId, filters);

    res.status(200).json({
      success: true,
      data: questions,
      total: questions.length
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Lỗi khi lấy danh sách câu hỏi"
    });
  }
};

/**
 * Lấy chi tiết câu hỏi
 * GET /api/instructor/questions/:questionId
 */
const getQuestionDetail = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { questionId } = req.params;

    const question = await getQuestionDetailService(instructorAccId, questionId);

    res.status(200).json({
      success: true,
      data: question
    });
  } catch (err) {
    res.status(err.status || 404).json({
      success: false,
      message: err.message || "Lỗi khi lấy chi tiết câu hỏi"
    });
  }
};

/**
 * Cập nhật câu hỏi
 * PUT /api/instructor/questions/:questionId
 */
const updateQuestion = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { questionId } = req.params;
    const questionData = req.body;

    const result = await updateQuestionService(instructorAccId, questionId, questionData);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(err.status || 400).json({
      success: false,
      message: err.message || "Lỗi khi cập nhật câu hỏi"
    });
  }
};

/**
 * Xóa câu hỏi
 * DELETE /api/instructor/questions/:questionId
 */
const deleteQuestion = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { questionId } = req.params;

    const result = await deleteQuestionService(instructorAccId, questionId);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(err.status || 400).json({
      success: false,
      message: err.message || "Lỗi khi xóa câu hỏi"
    });
  }
};

// ==================== SECTION-QUESTION MANAGEMENT ====================

/**
 * Thêm câu hỏi vào section
 * POST /api/instructor/exams/:examId/sections/:sectionId/questions
 * Body: { questionIds: [1, 2, 3] }
 */
const addQuestionsToSection = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { examId, sectionId } = req.params;
    const { questionIds } = req.body;

    const result = await addQuestionsToSectionService(instructorAccId, examId, sectionId, questionIds);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(err.status || 400).json({
      success: false,
      message: err.message || "Lỗi khi thêm câu hỏi vào section"
    });
  }
};

/**
 * Xóa câu hỏi khỏi section
 * DELETE /api/instructor/exams/:examId/sections/:sectionId/questions/:questionId
 */
const removeQuestionFromSection = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { examId, sectionId, questionId } = req.params;

    const result = await removeQuestionFromSectionService(instructorAccId, examId, sectionId, questionId);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(err.status || 400).json({
      success: false,
      message: err.message || "Lỗi khi xóa câu hỏi khỏi section"
    });
  }
};

/**
 * Cập nhật thứ tự câu hỏi trong section
 * PUT /api/instructor/exams/:examId/sections/:sectionId/questions/:questionId/order
 * Body: { orderIndex: 5 }
 */
const updateQuestionOrder = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { examId, sectionId, questionId } = req.params;
    const { orderIndex } = req.body;

    const result = await updateQuestionOrderService(
      instructorAccId,
      examId,
      sectionId,
      questionId,
      orderIndex
    );

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(err.status || 400).json({
      success: false,
      message: err.message || "Lỗi khi cập nhật thứ tự câu hỏi"
    });
  }
};

// ==================== GRADING CONTROLLERS ====================

/**
 * Lấy danh sách kết quả thi theo instance
 * GET /api/instructor/instances/:instanceId/results
 */
const getExamResults = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { instanceId } = req.params;

    const results = await getExamResultsService(instructorAccId, instanceId);

    res.status(200).json({
      success: true,
      data: results,
      total: results.length
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Lỗi khi lấy kết quả thi"
    });
  }
};

/**
 * Lấy bài thi của learner để chấm
 * GET /api/instructor/exams/:examId/learners/:learnerId/submission
 */
const getLearnerSubmission = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { examId, learnerId } = req.params;

    const submission = await getLearnerSubmissionService(instructorAccId, examId, learnerId);

    res.status(200).json({
      success: true,
      data: submission
    });
  } catch (err) {
    res.status(err.status || 404).json({
      success: false,
      message: err.message || "Lỗi khi lấy bài làm của học viên"
    });
  }
};

/**
 * Chấm bài tự động
 * POST /api/instructor/exams/:examId/learners/:learnerId/auto-grade
 */
const autoGradeExam = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { examId, learnerId } = req.params;

    const result = await autoGradeExamService(instructorAccId, examId, learnerId);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(err.status || 400).json({
      success: false,
      message: err.message || "Lỗi khi chấm bài tự động"
    });
  }
};

/**
 * Chấm bài thủ công
 * POST /api/instructor/exams/:examId/learners/:learnerId/manual-grade
 * Body: { score, feedback }
 */
const manualGradeExam = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { examId, learnerId } = req.params;
    const { score, feedback } = req.body;

    const result = await manualGradeExamService(instructorAccId, examId, learnerId, score, feedback);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(err.status || 400).json({
      success: false,
      message: err.message || "Lỗi khi chấm bài"
    });
  }
};
const importQuestionsExcelController = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { examId, sectionId } = req.params;
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng upload file Excel",
      });
    }
    const result = await importQuestionsFromExcel(
      instructorAccId,
      examId,
      sectionId,
      req.file.buffer
    );

    return res.status(200).json({
      success: true,
      message: "Import câu hỏi thành công",
      ...result,
    });

  } catch (error) {
    console.error("Import Excel Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi import Excel",
    });
  }
};



const createQuestionAndAssignToSection = async (req, res) => {
  try {
    const instructorAccId = req.user.accountId;
    const { sectionId } = req.params;
    const questionData = req.body;
    const { questionId } = await instructorExamService.createQuestionService(
      instructorAccId,
      questionData
    );
    await instructorExamRepository.addQuestionToSection(sectionId, questionId, 0);

    return res.json({
      success: true,
      message: "Tạo câu hỏi & gán vào section thành công",
      questionId,
      sectionId
    });

  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};


// ==================== EXPORTS ====================

module.exports = {
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

  importQuestionsExcelController,
  createQuestionAndAssignToSection
};