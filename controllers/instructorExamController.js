const {
  createExamService,
  updateExamService,
  getExamsService,
  getExamDetailService,
  deleteExamService,
  
  // Section Management Services (MỚI)
  createExamSectionService,
  updateExamSectionService,
  deleteExamSectionService,
  getSectionsService,
  
  // Question Bank
  createQuestionService,
  getQuestionsService,
  getQuestionDetailService,
  updateQuestionService,
  deleteQuestionService,
  
  // Section-Question Management (CẬP NHẬT)
  addQuestionsToSectionService,
  removeQuestionFromSectionService,
  
  // Grading
  getExamResultsService,
  getLearnerSubmissionService,
  autoGradeExamService,
  manualGradeExamService
} = require("../services/instructorExamService");

// ==================== EXAM CONTROLLERS ====================

//Tạo exam mới (HỖ TRỢ SECTIONS)
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

//Cập nhật exam (CẬP NHẬT: hỗ trợ random settings)
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

//Lấy danh sách exams
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

//Lấy chi tiết exam (CẬP NHẬT: bao gồm sections + questions)
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

//Xóa exam
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

// ==================== SECTION MANAGEMENT CONTROLLERS (MỚI) ====================

//Tạo section cho exam
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
      message: err.message || "Lỗi khi tạo phần thi"
    });
  }
};

//Cập nhật section
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
      message: err.message || "Lỗi khi cập nhật phần thi"
    });
  }
};

//Xóa section
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
      message: err.message || "Lỗi khi xóa phần thi"
    });
  }
};

//Lấy danh sách sections của exam
const getSections = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { examId } = req.params;
    
    const sections = await getSectionsService(instructorAccId, examId);
    
    res.status(200).json({
      success: true,
      data: sections,
      total: sections.length
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Lỗi khi lấy danh sách phần thi"
    });
  }
};

// ==================== QUESTION BANK CONTROLLERS ====================

//Tạo câu hỏi mới
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

//Lấy danh sách câu hỏi
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

//Lấy chi tiết câu hỏi
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

//Cập nhật câu hỏi
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

//Xóa câu hỏi
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

// ==================== SECTION-QUESTION MANAGEMENT (CẬP NHẬT) ====================

//Thêm câu hỏi vào section (THAY ĐỔI: từ exam sang section)
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
      message: err.message || "Lỗi khi thêm câu hỏi vào phần thi"
    });
  }
};

//Xóa câu hỏi khỏi section (THAY ĐỔI: từ exam sang section)
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
      message: err.message || "Lỗi khi xóa câu hỏi khỏi phần thi"
    });
  }
};

// ==================== GRADING CONTROLLERS ====================

//Lấy danh sách kết quả thi
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

//Lấy bài thi của learner để chấm
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

//Chấm bài tự động
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

//Chấm bài thủ công
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

module.exports = {
  // Exam CRUD
  createExam,
  updateExam,
  getExams,
  getExamDetail,
  deleteExam,
  
  // Section Management (MỚI)
  createExamSection,
  updateExamSection,
  deleteExamSection,
  getSections,
  
  // Question Bank
  createQuestion,
  getQuestions,
  getQuestionDetail,
  updateQuestion,
  deleteQuestion,
  
  // Section-Question Management (CẬP NHẬT)
  addQuestionsToSection,
  removeQuestionFromSection,
  
  // Grading
  getExamResults,
  getLearnerSubmission,
  autoGradeExam,
  manualGradeExam
};