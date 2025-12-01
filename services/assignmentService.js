const assignmentRepository = require("../repositories/assignmentRepository");
const connectDB = require("../config/db");

class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const ALLOWED_TYPES = ["quiz", "audio", "video", "document"];
const ALLOWED_STATUSES = ["draft", "active", "deleted"];
const ALLOWED_SHOW_ANSWERS = ['after_submission', 'after_deadline', 'never'];

function assertValidDateStr(dateStr) {
  if (!dateStr) return;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) throw new ServiceError("Hạn nộp không hợp lệ (YYYY-MM-DD hoặc YYYY-MM-DD HH:mm)", 400);
}

// Lấy InstructorID từ AccID
const getInstructorIdByAccId = async (accId) => {
  const db = await connectDB();
  const [rows] = await db.query("SELECT InstructorID FROM instructor WHERE AccID = ?", [accId]);
  if (!rows.length) throw new ServiceError("Không tìm thấy InstructorID cho tài khoản này", 404);
  return rows[0].InstructorID;
};

// Tạo assignment
const createAssignmentService = async (instructorAccId, data) => {
  const {
    Title,
    Description,
    Deadline,
    Type,
    Status,
    UnitID,
    CourseID,
    FileURL,
    MediaURL,
    MaxDuration,
    ShowAnswersAfter,
    questions = []
  } = data;

  // Validation (dùng UPPERCASE)
  if (!Title?.trim()) throw new ServiceError("Tiêu đề là bắt buộc");
  if (!Description?.trim()) throw new ServiceError("Mô tả là bắt buộc");
  assertValidDateStr(Deadline);
  if (Type && !ALLOWED_TYPES.includes(Type)) throw new ServiceError("Loại bài tập không hợp lệ");
  if (ShowAnswersAfter && !ALLOWED_SHOW_ANSWERS.includes(ShowAnswersAfter)) {
    throw new ServiceError("ShowAnswersAfter không hợp lệ (after_submission, after_deadline, never)");
  }

  // Resolve unitId
  let resolvedUnitId = null;
  if (UnitID != null) {
    const ok = await assignmentRepository.canInstructorAccessUnit(instructorAccId, UnitID);
    if (!ok) throw new ServiceError("Không tìm thấy Unit hoặc bạn không có quyền", 403);
    resolvedUnitId = UnitID;
  }

  // Prepare data cho repository (lowercase keys)
  const validatedData = {
    title: Title.trim(),
    description: Description.trim(),
    deadline: Deadline || null,
    type: Type || "document",
    status: Status || "active",
    unitId: resolvedUnitId,
    fileURL: FileURL || null,
    mediaURL: MediaURL || null,
    maxDuration: MaxDuration || null,
    showAnswersAfter: ShowAnswersAfter || 'after_submission'
  };

  const instructorId = await getInstructorIdByAccId(instructorAccId);
  validatedData.instructorId = instructorId;

  const assignmentId = await assignmentRepository.createAssignment(validatedData);
  const TYPES_WITH_QUESTIONS = ['quiz', 'video', 'document'];
  if (TYPES_WITH_QUESTIONS.includes(Type) && questions.length > 0) {
    for (const qData of questions) {
      const questionId = await assignmentRepository.createQuestion(instructorId, qData);
      await assignmentRepository.addQuestionToAssignment(assignmentId, questionId);
    }
  }

  return assignmentId;
};

// Danh sách
const getAssignmentsService = async (instructorAccId) =>
  assignmentRepository.getAssignmentsByInstructor(instructorAccId);

// Chi tiết
const getAssignmentDetailService = async (instructorAccId, assignmentId) => {
  const canAccess = await assignmentRepository.canInstructorAccessAssignment(instructorAccId, assignmentId);
  if (!canAccess) throw new ServiceError("Bạn không có quyền truy cập bài tập này", 403);
  const detail = await assignmentRepository.getAssignmentById(assignmentId);
  if (!detail) throw new ServiceError("Không tìm thấy bài tập", 404);
  return detail;
};

// Cập nhật
const updateAssignmentService = async (instructorAccId, assignmentId, payload) => {
  const canAccess = await assignmentRepository.canInstructorAccessAssignment(instructorAccId, assignmentId);
  if (!canAccess) throw new ServiceError("Không có quyền cập nhật bài tập này", 403);

  const Title = payload.Title || payload.title;
  const Description = payload.Description || payload.description;
  const Type = payload.Type || payload.type;
  const Status = payload.Status || payload.status;
  const Deadline = payload.Deadline || payload.deadline;
  const UnitID = payload.UnitID || payload.unitId;
  const FileURL = payload.FileURL || payload.fileURL;
  const MediaURL = payload.MediaURL || payload.mediaURL;
  const MaxDuration = payload.MaxDuration || payload.maxDuration;
  const ShowAnswersAfter = payload.ShowAnswersAfter || payload.showAnswersAfter;

  if (Type && !ALLOWED_TYPES.includes(Type)) {
    throw new ServiceError("Loại bài tập không hợp lệ");
  }
  
  assertValidDateStr(Deadline);
  
  // ✅ Validation status
  if (Status && !ALLOWED_STATUSES.includes(Status)) {
    throw new ServiceError(
      `Trạng thái không hợp lệ. Chỉ chấp nhận: ${ALLOWED_STATUSES.join(", ")}`
    );
  }
  
  if (ShowAnswersAfter && !ALLOWED_SHOW_ANSWERS.includes(ShowAnswersAfter)) {
    throw new ServiceError("ShowAnswersAfter không hợp lệ");
  }

  let resolvedUnitId = undefined;
  if (UnitID !== undefined) {
    if (UnitID == null) {
      resolvedUnitId = null;
    } else {
      const ok = await assignmentRepository.canInstructorAccessUnit(instructorAccId, UnitID);
      if (!ok) throw new ServiceError("Không tìm thấy Unit hoặc bạn không có quyền", 403);
      resolvedUnitId = UnitID;
    }
  }

  const updates = {
    title: Title,
    description: Description,
    deadline: Deadline || null,
    type: Type,
    fileURL: FileURL,
    status: Status,
    unitId: resolvedUnitId,
    maxDuration: MaxDuration,
    showAnswersAfter: ShowAnswersAfter,
    mediaURL: MediaURL
  };

  await assignmentRepository.updateAssignment(assignmentId, updates);

  // ✅ Xử lý questions mới - KIỂM TRA KỸ HƠN
  const questions = payload.questions || [];
  const TYPES_WITH_QUESTIONS = ['quiz', 'video', 'document'];
  const currentType = (Type || payload.type || "").toLowerCase();
  
  if (TYPES_WITH_QUESTIONS.includes(currentType) && questions.length > 0) {
    const instructorId = await getInstructorIdByAccId(instructorAccId);
    
    // Lấy danh sách câu hỏi hiện tại của assignment
    const existingQuestions = await assignmentRepository.getAssignmentQuestions(assignmentId);
    const existingQuestionIds = new Set(
      existingQuestions.map(q => Number(q.QuestionID || q.questionId))
    );
    
    for (const qData of questions) {
      const qId = Number(qData.QuestionID || qData.questionId || 0);
      
      // ✅ CHỈ thêm câu hỏi MỚI (không có ID HOẶC ID không tồn tại trong DB)
      if (!qId || !existingQuestionIds.has(qId)) {
        const questionId = await assignmentRepository.createQuestion(instructorId, qData);
        await assignmentRepository.addQuestionToAssignment(assignmentId, questionId);
      }
      // Câu cũ (có ID trong DB) -> BỎ QUA, không làm gì
    }
  }

  return assignmentRepository.getAssignmentById(assignmentId);
};

// Xóa mềm
const deleteAssignmentService = async (instructorAccId, assignmentId) => {
  const canAccess = await assignmentRepository.canInstructorAccessAssignment(instructorAccId, assignmentId);
  if (!canAccess) throw new ServiceError("Bạn không có quyền xóa bài tập này", 403);
  return assignmentRepository.softDeleteAssignment(assignmentId);
};

// Units/Courses
const getUnitsService = async (instructorAccId) => assignmentRepository.getUnitsByInstructor(instructorAccId);
const getUnitsByCourseService = async (instructorAccId, courseId) =>
  !courseId ? assignmentRepository.getUnitsByInstructor(instructorAccId)
    : assignmentRepository.getUnitsByInstructorAndCourse(instructorAccId, courseId);
const getCoursesService = async (instructorAccId) => assignmentRepository.getCoursesByInstructor(instructorAccId);

// ==== Questions ====
const getAssignmentQuestionsService = async (instructorAccId, assignmentId) => {
  const canAccess = await assignmentRepository.canInstructorAccessAssignment(instructorAccId, assignmentId);
  if (!canAccess) throw new ServiceError("Không có quyền", 403);
  return assignmentRepository.getAssignmentQuestions(assignmentId);
};

const createAndAddQuestionService = async (instructorAccId, assignmentId, questionData) => {
  // Kiểm tra quyền truy cập
  const canAccess = await assignmentRepository.canInstructorAccessAssignment(instructorAccId, assignmentId);
  if (!canAccess) throw new ServiceError("Không có quyền", 403);

  // --- VALIDATION CÂU HỎI ---
  if (!questionData.content?.trim()) {
    throw new ServiceError("Nội dung câu hỏi là bắt buộc");
  }

  // Kiểm tra theo loại câu hỏi
  switch (questionData.type) {
    // Trắc nghiệm nhiều lựa chọn
    case "multiple_choice":
      if (!questionData.options || questionData.options.length < 2) {
        throw new ServiceError("Cần ít nhất 2 lựa chọn");
      }

      const hasCorrect = questionData.options.some(
        (opt) => opt.isCorrect === true || opt.IsCorrect === true
      );
      if (!hasCorrect) {
        throw new ServiceError("Đáp án đúng là bắt buộc");
      }

      // multiple_choice không cần correctAnswer trong bảng question
      questionData.correctAnswer = null;
      break;

    // Đúng/Sai
    case "true_false":
      if (!["true", "false"].includes(questionData.correctAnswer?.toLowerCase())) {
        throw new ServiceError("Đáp án đúng phải là 'true' hoặc 'false'");
      }
      questionData.options = [];
      break;

    // Điền vào chỗ trống
    case "fill_in_blank":
      if (!questionData.correctAnswer?.trim()) {
        throw new ServiceError("Đáp án đúng là bắt buộc");
      }
      questionData.options = [];
      break;

    // Ghép nối (matching)
    case "matching":
      if (
        !questionData.correctAnswer ||
        (typeof questionData.correctAnswer === "string" && !questionData.correctAnswer.trim()) ||
        (typeof questionData.correctAnswer === "object" && Object.keys(questionData.correctAnswer).length === 0)
      ) {
        throw new ServiceError("Cặp ghép đúng là bắt buộc");
      }

      // Nếu correctAnswer là object => chuyển sang chuỗi JSON để lưu DB
      if (typeof questionData.correctAnswer === "object") {
        questionData.correctAnswer = JSON.stringify(questionData.correctAnswer);
      }

      questionData.options = [];
      break;


    // Tự luận hoặc nói
    case "essay":
    case "speaking":
      // Không bắt buộc đáp án
      questionData.options = [];
      if (!("correctAnswer" in questionData)) {
        questionData.correctAnswer = "";
      }
      break;

    default:
      throw new ServiceError("Loại câu hỏi không hợp lệ");
  }

  // --- INSERT DB ---
  const instructorId = await getInstructorIdByAccId(instructorAccId);
  const questionId = await assignmentRepository.createQuestion(instructorId, questionData);
  await assignmentRepository.addQuestionToAssignment(assignmentId, questionId);

  return questionId;
};

const removeQuestionService = async (instructorAccId, assignmentId, questionId) => {
  const canAccess = await assignmentRepository.canInstructorAccessAssignment(instructorAccId, assignmentId);
  if (!canAccess) throw new ServiceError("Không có quyền", 403);
  return assignmentRepository.removeQuestionFromAssignment(assignmentId, questionId);
};

// ==== Stats ====
const getAssignmentStatsService = async (instructorAccId, assignmentId) => {
  const stats = await assignmentRepository.getAssignmentStats(assignmentId, instructorAccId);
  if (!stats) throw new ServiceError("Không có quyền hoặc không tồn tại", 403);
  return stats;
};

const getAllAssignmentsStatsService = async (instructorAccId) => {
  return await assignmentRepository.getAllAssignmentsStats(instructorAccId);
};

module.exports = {
  createAssignmentService,
  getAssignmentsService,
  getAssignmentDetailService,
  updateAssignmentService,
  deleteAssignmentService,
  getUnitsService,
  getUnitsByCourseService,
  getCoursesService,
  getAssignmentQuestionsService,
  createAndAddQuestionService,
  removeQuestionService,
  getAssignmentStatsService,
  getAllAssignmentsStatsService,
};