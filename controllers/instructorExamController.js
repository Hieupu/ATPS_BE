const {
  createExamService,
  updateExamService,
  getExamsService,
  getExamDetailService,
  deleteExamService,
  archiveExamService,
  getArchivedExamsService,

  // Classes
  getClassesByCourseService,

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

  // Status Check
  checkAndUpdateExamStatusService,
  unarchiveExamService 
} = require("../services/instructorExamService");

// ==================== EXAM CONTROLLERS ====================

/**
 * Tạo exam mới
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
 * Cập nhật exam
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
 * Lấy danh sách exams
 */
const getExams = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const filters = {
      status: req.query.status,
      courseId: req.query.courseId
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
 * Lấy chi tiết exam (bao gồm cấu trúc phân cấp sections + questions)
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
 * Xóa exam
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
 * Lấy danh sách exam đã lưu trữ
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

// ==================== SECTION MANAGEMENT CONTROLLERS====================

/**
 * Tạo section cho exam (có thể là parent hoặc child section)
 * Body: { type, orderIndex, parentSectionId? }
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
 * Body: { type, orderIndex, parentSectionId? }
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
 * Xóa section (sẽ xóa cả child sections và questions)
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
 * Lấy danh sách sections của exam
 * Query: ?hierarchical=true (default) hoặc false
 */
const getSections = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { examId } = req.params;
    const hierarchical = req.query.hierarchical !== 'false'; // default true
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
 * Lấy chi tiết một section (bao gồm child sections và questions)
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
 * Lấy danh sách kết quả thi
 */
const getExamResults = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { examId, classId } = req.params;

    const data = await getExamResultsService(instructorAccId, examId, classId);

    res.status(200).json({
      success: true,
      ...data
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

// ==================== CLASSES CONTROLLER ====================

/**
 * Lấy danh sách lớp học theo khóa học
 */
const getClassesByCourse = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { courseId } = req.params;

    const classes = await getClassesByCourseService(instructorAccId, courseId);

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
 * Check and update exam status - Controller layer
 */
const checkAndUpdateExamStatus = async (req, res) => {
  try {
    const result = await checkAndUpdateExamStatusService();
    
    res.status(200).json(result);
    
  } catch (error) {
    console.error("❌ Controller: Check exam status error:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to check exam status"
    });
  }
};
/**
 * Khôi phục bài thi từ lưu trữ
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

module.exports = {
  // Exam CRUD
  createExam,
  updateExam,
  getExams,
  getExamDetail,
  deleteExam,
  archiveExam,
  getArchivedExams,

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

  // Classes
  getClassesByCourse,

  // Grading
  getExamResults,
  getLearnerSubmission,
  autoGradeExam,
  manualGradeExam,
  
  // Status Check
  checkAndUpdateExamStatus,
  unarchiveExam
};