const instructorExamRepository = require("../repositories/instructorExamRepository");

const ALLOWED_STATUSES = ["Pending", "Ongoing", "Completed", "Cancelled"];
const QUESTION_TYPES = ["multiple_choice", "true_false", "fill_in_blank", "matching", "essay", "speaking"];
const QUESTION_LEVELS = ["Easy", "Medium", "Hard"];

// ==================== VALIDATION HELPERS ====================

function assertValidDateStr(dateStr, fieldName = "Date") {
  if (!dateStr) throw new Error(`${fieldName} là bắt buộc`);
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`${fieldName} không hợp lệ (YYYY-MM-DD HH:mm:ss)`);
  }
  return d;
}

function validateExamData(data) {
  if (!data.CourseID) throw new Error("CourseID là bắt buộc");
  if (!data.Title?.trim()) throw new Error("Tiêu đề bài thi là bắt buộc");
  if (!data.Description?.trim()) throw new Error("Mô tả bài thi là bắt buộc");
  
  const startTime = assertValidDateStr(data.StartTime, "Thời gian bắt đầu");
  const endTime = assertValidDateStr(data.EndTime, "Thời gian kết thúc");
  
  if (endTime <= startTime) {
    throw new Error("Thời gian kết thúc phải sau thời gian bắt đầu");
  }
  
  if (data.Status && !ALLOWED_STATUSES.includes(data.Status)) {
    throw new Error(`Trạng thái không hợp lệ. Cho phép: ${ALLOWED_STATUSES.join(", ")}`);
  }
}

function validateQuestionData(data) {
  if (!data.content?.trim()) throw new Error("Nội dung câu hỏi là bắt buộc");
  if (data.type && !QUESTION_TYPES.includes(data.type)) {
    throw new Error(`Loại câu hỏi không hợp lệ. Cho phép: ${QUESTION_TYPES.join(", ")}`);
  }
  if (data.level && !QUESTION_LEVELS.includes(data.level)) {
    throw new Error(`Độ khó không hợp lệ. Cho phép: ${QUESTION_LEVELS.join(", ")}`);
  }
  if (data.point && (data.point < 0 || data.point > 100)) {
    throw new Error("Điểm phải từ 0 đến 100");
  }
  
  if (data.type === 'multiple_choice') {
    if (!data.options || !Array.isArray(data.options) || data.options.length < 2) {
      throw new Error("Câu hỏi trắc nghiệm phải có ít nhất 2 lựa chọn");
    }
    const correctCount = data.options.filter(opt => opt.isCorrect).length;
    if (correctCount === 0) {
      throw new Error("Phải có ít nhất 1 đáp án đúng");
    }
  }
}

function validateSectionData(data) {
  if (!data.type || !QUESTION_TYPES.includes(data.type)) {
    throw new Error(`Loại section không hợp lệ. Cho phép: ${QUESTION_TYPES.join(", ")}`);
  }
  if (data.orderIndex === undefined || data.orderIndex < 0) {
    throw new Error("OrderIndex phải >= 0");
  }
}

// ==================== EXAM SERVICES ====================

//Tạo exam mới (CẬP NHẬT: hỗ trợ random + sections)
const createExamService = async (instructorAccId, data) => {
  validateExamData(data);
  
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");
  
  const courses = await instructorExamRepository.getCoursesByInstructor(instructorId);
  const course = courses.find(c => c.CourseID === data.CourseID);
  if (!course) {
    throw new Error("Giảng viên không có quyền truy cập khóa học này");
  }
  
  // Tạo exam
  const examData = {
    courseId: data.CourseID,
    title: data.Title.trim(),
    description: data.Description.trim(),
    startTime: data.StartTime,
    endTime: data.EndTime,
    status: data.Status || "Pending",
    isRandomQuestion: data.isRandomQuestion || 0,
    isRandomAnswer: data.isRandomAnswer || 0
  };
  
  const examId = await instructorExamRepository.createExam(examData);
  
  // Tạo sections nếu có
  if (data.sections && Array.isArray(data.sections) && data.sections.length > 0) {
    for (const section of data.sections) {
      validateSectionData(section);
      const sectionId = await instructorExamRepository.createExamSection(examId, {
        type: section.type,
        orderIndex: section.orderIndex
      });
      
      // Thêm questions vào section
      if (section.questionIds && section.questionIds.length > 0) {
        await instructorExamRepository.addQuestionsToSection(sectionId, section.questionIds);
      }
    }
  }
  
  // Gán exam cho classes nếu có
  if (data.classIds && Array.isArray(data.classIds) && data.classIds.length > 0) {
    await instructorExamRepository.assignExamToClasses(
      examId, 
      data.classIds, 
      data.StartTime, 
      data.EndTime
    );
  }
  
  return { examId, message: "Tạo bài thi thành công" };
};

//Cập nhật exam
const updateExamService = async (instructorAccId, examId, data) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");
  
  const hasAccess = await instructorExamRepository.checkExamOwnership(examId, instructorId);
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");
  
  validateExamData(data);
  
  const examData = {
    title: data.Title.trim(),
    description: data.Description.trim(),
    startTime: data.StartTime,
    endTime: data.EndTime,
    status: data.Status,
    isRandomQuestion: data.isRandomQuestion || 0,
    isRandomAnswer: data.isRandomAnswer || 0
  };
  
  await instructorExamRepository.updateExam(examId, examData);
  
  return { message: "Cập nhật bài thi thành công" };
};

//Lấy danh sách exams

const getExamsService = async (instructorAccId, filters = {}) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");
  
  const exams = await instructorExamRepository.getExamsByInstructor(instructorId, filters);
  return exams;
};

//Lấy chi tiết exam (CẬP NHẬT: bao gồm sections + questions)

const getExamDetailService = async (instructorAccId, examId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");
  
  const hasAccess = await instructorExamRepository.checkExamOwnership(examId, instructorId);
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");
  
  const exam = await instructorExamRepository.getExamById(examId);
  if (!exam) throw new Error("Không tìm thấy bài thi");
  
  // Lấy sections + questions
  const examWithSections = await instructorExamRepository.getExamWithSections(
    examId,
    false,
    false
  );
  
  // Lấy danh sách classes
  const classes = await instructorExamRepository.getClassesByExam(examId);
  return {
    ...examWithSections,
    classes
  };
};


 // Xóa exam
const deleteExamService = async (instructorAccId, examId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");
  
  const hasAccess = await instructorExamRepository.checkExamOwnership(examId, instructorId);
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");
  
  await instructorExamRepository.deleteExam(examId);
  return { message: "Xóa bài thi thành công" };
};

// ==================== SECTION SERVICES====================


 //Tạo section cho exam

const createExamSectionService = async (instructorAccId, examId, sectionData) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");
  
  const hasAccess = await instructorExamRepository.checkExamOwnership(examId, instructorId);
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");
  
  validateSectionData(sectionData);
  
  const sectionId = await instructorExamRepository.createExamSection(examId, sectionData);
  
  return { sectionId, message: "Tạo phần thi thành công" };
};

//Cập nhật section
const updateExamSectionService = async (instructorAccId, examId, sectionId, sectionData) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");
  
  const hasAccess = await instructorExamRepository.checkExamOwnership(examId, instructorId);
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");
  
  validateSectionData(sectionData);
  
  await instructorExamRepository.updateExamSection(sectionId, sectionData);
  
  return { message: "Cập nhật phần thi thành công" };
};

//Xóa section
const deleteExamSectionService = async (instructorAccId, examId, sectionId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");
  
  const hasAccess = await instructorExamRepository.checkExamOwnership(examId, instructorId);
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");
  
  await instructorExamRepository.deleteExamSection(sectionId);
  
  return { message: "Xóa phần thi thành công" };
};

//Lấy danh sách sections của exam
const getSectionsService = async (instructorAccId, examId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");
  
  const hasAccess = await instructorExamRepository.checkExamOwnership(examId, instructorId);
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");
  
  const sections = await instructorExamRepository.getSectionsByExam(examId);
  
  return sections;
};

// ==================== QUESTION BANK SERVICES ====================

const createQuestionService = async (instructorAccId, data) => {
  validateQuestionData(data);
  
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");
  
  const questionData = {
    content: data.content.trim(),
    type: data.type || "multiple_choice",
    correctAnswer: data.correctAnswer,
    instructorId,
    status: data.status || "Active",
    topic: data.topic || null,
    level: data.level || "Medium",
    point: data.point || 1
  };
  
  const questionId = await instructorExamRepository.createQuestion(questionData);
  
  if (data.type === 'multiple_choice' && data.options) {
    await instructorExamRepository.createQuestionOptions(questionId, data.options);
  }
  
  return { questionId, message: "Tạo câu hỏi thành công" };
};

const getQuestionsService = async (instructorAccId, filters = {}) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");
  
  const questions = await instructorExamRepository.getQuestionsByInstructor(instructorId, filters);
  return questions;
};

const getQuestionDetailService = async (instructorAccId, questionId) => {
  const question = await instructorExamRepository.getQuestionById(questionId);
  if (!question) throw new Error("Không tìm thấy câu hỏi");
  
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (question.InstructorID !== instructorId) {
    throw new Error("Không có quyền truy cập câu hỏi này");
  }
  
  return question;
};

const updateQuestionService = async (instructorAccId, questionId, data) => {
  validateQuestionData(data);
  
  const question = await instructorExamRepository.getQuestionById(questionId);
  if (!question) throw new Error("Không tìm thấy câu hỏi");
  
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (question.InstructorID !== instructorId) {
    throw new Error("Không có quyền sửa câu hỏi này");
  }
  
  const questionData = {
    content: data.content.trim(),
    type: data.type,
    correctAnswer: data.correctAnswer,
    topic: data.topic,
    level: data.level,
    point: data.point,
    status: data.status || "Active"
  };
  
  await instructorExamRepository.updateQuestion(questionId, questionData);
  
  return { message: "Cập nhật câu hỏi thành công" };
};

const deleteQuestionService = async (instructorAccId, questionId) => {
  const question = await instructorExamRepository.getQuestionById(questionId);
  if (!question) throw new Error("Không tìm thấy câu hỏi");
  
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (question.InstructorID !== instructorId) {
    throw new Error("Không có quyền xóa câu hỏi này");
  }
  
  await instructorExamRepository.deleteQuestion(questionId);
  return { message: "Xóa câu hỏi thành công" };
};

// ==================== SECTION-QUESTION MANAGEMENT (CẬP NHẬT) ====================

//Thêm câu hỏi vào section
const addQuestionsToSectionService = async (instructorAccId, examId, sectionId, questionIds) => {
  if (!Array.isArray(questionIds) || questionIds.length === 0) {
    throw new Error("Danh sách câu hỏi không hợp lệ");
  }
  
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");
  
  const hasAccess = await instructorExamRepository.checkExamOwnership(examId, instructorId);
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");
  
  await instructorExamRepository.addQuestionsToSection(sectionId, questionIds);
  
  return { message: "Thêm câu hỏi vào section thành công" };
};

//Xóa câu hỏi khỏi section
const removeQuestionFromSectionService = async (instructorAccId, examId, sectionId, questionId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");
  
  const hasAccess = await instructorExamRepository.checkExamOwnership(examId, instructorId);
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");
  
  await instructorExamRepository.removeQuestionFromSection(sectionId, questionId);
  
  return { message: "Xóa câu hỏi khỏi section thành công" };
};

// ==================== GRADING SERVICES ====================

const getExamResultsService = async (instructorAccId, examId, classId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");
  
  const hasAccess = await instructorExamRepository.checkExamOwnership(examId, instructorId);
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");
  
  const results = await instructorExamRepository.getExamResultsByClass(examId, classId);
  const statistics = await instructorExamRepository.getExamStatistics(examId, classId);
  
  return { results, statistics };
};

const getLearnerSubmissionService = async (instructorAccId, examId, learnerId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");
  
  const hasAccess = await instructorExamRepository.checkExamOwnership(examId, instructorId);
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");
  
  const submission = await instructorExamRepository.getLearnerExamSubmission(examId, learnerId);
  
  return submission;
};

const autoGradeExamService = async (instructorAccId, examId, learnerId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");
  
  const hasAccess = await instructorExamRepository.checkExamOwnership(examId, instructorId);
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");
  
  const submission = await instructorExamRepository.getLearnerExamSubmission(examId, learnerId);
  
  let totalScore = 0;
  let maxScore = 0;
  
  for (const question of submission) {
    maxScore += question.Point;
    
    if (question.Type === 'multiple_choice' || question.Type === 'true_false') {
      if (question.LearnerAnswer && question.LearnerAnswer === question.CorrectAnswer) {
        totalScore += question.Point;
      }
    }
  }
  
  const score = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  
  await instructorExamRepository.saveExamResult({
    learnerId,
    examId,
    score: score.toFixed(2),
    feedback: "Chấm điểm tự động"
  });
  
  return { score: score.toFixed(2), message: "Chấm bài tự động thành công" };
};

const manualGradeExamService = async (instructorAccId, examId, learnerId, score, feedback) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");
  
  const hasAccess = await instructorExamRepository.checkExamOwnership(examId, instructorId);
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");
  
  if (score < 0 || score > 100) {
    throw new Error("Điểm phải từ 0 đến 100");
  }
  
  await instructorExamRepository.saveExamResult({
    learnerId,
    examId,
    score,
    feedback: feedback || ""
  });
  
  return { message: "Chấm bài thành công" };
};

module.exports = {
  // Exam CRUD
  createExamService,
  updateExamService,
  getExamsService,
  getExamDetailService,
  deleteExamService,
  
  // Section Management (MỚI)
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
};