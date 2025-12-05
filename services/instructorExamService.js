const instructorExamRepository = require("../repositories/instructorExamRepository");

const ALLOWED_STATUSES = ["Pending", "Ongoing", "Completed", "Cancelled"];
const SECTION_TYPES = ["Listening", "Speaking", "Reading", "Writing"];
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

  // ======== Chuẩn hoá khóa học ========
  if (!data.CourseID && !data.courseId) {
    throw new Error("CourseID là bắt buộc");
  }
  data.CourseID = data.CourseID || data.courseId;


  // ======== Chuẩn hoá Title ========
  data.Title = data.Title || data.title;
  if (!data.Title || !data.Title.trim()) {
    throw new Error("Tiêu đề bài thi là bắt buộc");
  }


  // ======== Chuẩn hoá Description ========
  data.Description = data.Description || data.description;
  if (!data.Description || !data.Description.trim()) {
    throw new Error("Mô tả bài thi là bắt buộc");
  }


  // ======== Chuẩn hoá StartTime ========
  data.StartTime = data.StartTime || data.startTime;
  if (!data.StartTime) {
    throw new Error("Thời gian bắt đầu là bắt buộc");
  }


  // ======== Chuẩn hoá EndTime ========
  data.EndTime = data.EndTime || data.endTime;
  if (!data.EndTime) {
    throw new Error("Thời gian kết thúc là bắt buộc");
  }


  // ======== Validate định dạng ngày ========
  const startTime = assertValidDateStr(data.StartTime, "Thời gian bắt đầu");
  const endTime = assertValidDateStr(data.EndTime, "Thời gian kết thúc");

  if (endTime <= startTime) {
    throw new Error("Thời gian kết thúc phải sau thời gian bắt đầu");
  }


  // ======== Chuẩn hoá Status ========
  data.Status = data.Status || data.status || "Pending";

  if (!ALLOWED_STATUSES.includes(data.Status)) {
    throw new Error(`Trạng thái không hợp lệ. Cho phép: ${ALLOWED_STATUSES.join(", ")}`);
  }

  // ======== Chuẩn hoá Random Question/Answer ========
  data.isRandomQuestion = data.isRandomQuestion ? 1 : 0;
  data.isRandomAnswer = data.isRandomAnswer ? 1 : 0;

  return data;
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
  if (!data.type || !SECTION_TYPES.includes(data.type)) {
    throw new Error(`Loại section không hợp lệ. Cho phép: ${SECTION_TYPES.join(", ")}`);
  }
  if (data.orderIndex === undefined || data.orderIndex < 0) {
    throw new Error("OrderIndex phải >= 0");
  }
  // parentSectionId là optional, có thể null cho parent sections
}

// ==================== EXAM SERVICES ====================

/**
 * Tạo exam mới với hỗ trợ cấu trúc phân cấp sections
 */
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

  // Tạo sections với cấu trúc phân cấp nếu có
  if (data.sections && Array.isArray(data.sections) && data.sections.length > 0) {
    for (const parentSection of data.sections) {
      validateSectionData(parentSection);

      // Tạo parent section (ParentSectionId = null)
      const parentSectionId = await instructorExamRepository.createExamSection(examId, {
        type: parentSection.type,
        title: parentSection.title,
        orderIndex: parentSection.orderIndex,
        parentSectionId: null
      });

      // Tạo child sections nếu có
      if (parentSection.childSections && Array.isArray(parentSection.childSections)) {
        for (const childSection of parentSection.childSections) {
          validateSectionData(childSection);

          const childSectionId = await instructorExamRepository.createExamSection(examId, {
            type: childSection.type,
            title: childSection.title,
            orderIndex: childSection.orderIndex,
            parentSectionId: parentSectionId
          });

          // Thêm questions vào child section
          const questionIds = childSection.questionIds || childSection.questions || [];
          if (questionIds && questionIds.length > 0) {
            await instructorExamRepository.addQuestionsToSection(childSectionId, questionIds);
          }
        }
      }

      // Thêm questions trực tiếp vào parent section (nếu có)
      const parentQuestionIds = parentSection.questionIds || parentSection.questions || [];
      if (parentQuestionIds && parentQuestionIds.length > 0) {
        await instructorExamRepository.addQuestionsToSection(parentSectionId, parentQuestionIds);
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

/**
 * Cập nhật exam
 */
const updateExamService = async (instructorAccId, examId, data) => {
  
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(examId, instructorId);
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  validateExamData(data);

  const examData = {
    CourseID: data.CourseID,
    Title: data.Title.trim(),
    Description: data.Description.trim(),
    StartTime: data.StartTime,
    EndTime: data.EndTime,
    Status: data.Status,
    isRandomQuestion: data.isRandomQuestion ? 1 : 0,
    isRandomAnswer: data.isRandomAnswer ? 1 : 0
  };

  await instructorExamRepository.updateExam(examId, examData);
  if (Array.isArray(data.classIds)) {
    await instructorExamRepository.deleteExamClasses(examId);

    if (data.classIds.length > 0) {
      await instructorExamRepository.assignExamToClasses(
        examId,
        data.classIds,
        examData.StartTime,   
        examData.EndTime      
      );
    }
  }

  if (Array.isArray(data.sections)) {
    await instructorExamRepository.deleteQuestionsByExam(examId);
    await instructorExamRepository.deleteExamSections(examId);
    for (const section of data.sections) {
      const parentId = await instructorExamRepository.insertSection({
        ExamID: examId,
        Type: section.type,
        Title: section.title || "",
        OrderIndex: section.orderIndex,
        ParentSectionID: null,
      });
      if (Array.isArray(section.childSections)) {
        for (const child of section.childSections) {
          const childId = await instructorExamRepository.insertSection({
            ExamID: examId,
            Type: child.type,
            Title: child.title,
            OrderIndex: child.orderIndex,
            ParentSectionID: parentId,
          });

          if (Array.isArray(child.questions)) {
            const qValues = child.questions.map((q, index) => [
              childId,
              typeof q === "number" ? q : (q.QuestionId || q.QuestionID || q.questionId || q.id),
              index,
            ]);

            if (qValues.length > 0) {
              await instructorExamRepository.insertSectionQuestions(qValues);
            }
          }
        }
      }
    }
  }


  return { message: "Cập nhật bài thi thành công" };
};



/**
 * Lấy danh sách exams
 */
const getExamsService = async (instructorAccId, filters = {}) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const exams = await instructorExamRepository.getExamsByInstructor(instructorId, filters);
  return exams;
};

/**
 * Lấy chi tiết exam với cấu trúc phân cấp sections
 */
const getExamDetailService = async (instructorAccId, examId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(examId, instructorId);
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  const exam = await instructorExamRepository.getExamById(examId);
  if (!exam) throw new Error("Không tìm thấy bài thi");

  // Lấy cấu trúc phân cấp sections + questions
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

/**
 * Xóa exam
 */
const deleteExamService = async (instructorAccId, examId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(examId, instructorId);
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  await instructorExamRepository.deleteExam(examId);
  return { message: "Xóa bài thi thành công" };
};

/**
 * Lưu trữ exam
 */
const archiveExamService = async (instructorAccId, examId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(examId, instructorId);
  if (!hasAccess) throw new Error("Không có quyền truy cập kỳ thi này");

  const exam = await instructorExamRepository.getExamById(examId);
  if (!exam) throw new Error("Không tìm thấy kỳ thi");

  if (exam.Status !== 'Completed') {
    throw new Error("Chỉ có thể lưu trữ bài thi đã hoàn thành");
  }

  const success = await instructorExamRepository.archiveExam(examId);
  if (!success) throw new Error("Không thể lưu trữ bài thi");

  return { message: "Lưu trữ bài thi thành công" };
};

/**
 * Lấy danh sách exams đã lưu trữ
 */
const getArchivedExamsService = async (instructorAccId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const exams = await instructorExamRepository.getArchivedExams(instructorId);
  return exams;
};

/**
 * Lấy danh sách classes theo course
 */
const getClassesByCourseService = async (instructorAccId, courseId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const courses = await instructorExamRepository.getCoursesByInstructor(instructorId);
  const course = courses.find(c => c.CourseID == courseId);
  if (!course) {
    throw new Error("Giảng viên không có quyền truy cập khóa học này");
  }

  const classes = await instructorExamRepository.getClassesByCourse(courseId);
  return classes;
};

// ==================== SECTION MANAGEMENT SERVICES ====================

/**
 * Tạo section mới (có thể là parent hoặc child)
 */
const createExamSectionService = async (instructorAccId, examId, sectionData) => {
  validateSectionData(sectionData);

  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(examId, instructorId);
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  // Nếu có parentSectionId, kiểm tra parent có tồn tại không
  if (sectionData.parentSectionId) {
    const parentSection = await instructorExamRepository.getSectionById(sectionData.parentSectionId);
    if (!parentSection) {
      throw new Error("Parent section không tồn tại");
    }

    // Kiểm tra parent section có thuộc exam này không
    const belongsToExam = await instructorExamRepository.checkSectionBelongsToExam(
      sectionData.parentSectionId,
      examId
    );
    if (!belongsToExam) {
      throw new Error("Parent section không thuộc bài thi này");
    }
  }

  const sectionId = await instructorExamRepository.createExamSection(examId, {
    type: sectionData.type,
    orderIndex: sectionData.orderIndex,
    parentSectionId: sectionData.parentSectionId || null
  });

  return {
    sectionId,
    message: sectionData.parentSectionId
      ? "Tạo child section thành công"
      : "Tạo parent section thành công"
  };
};

/**
 * Cập nhật section
 */
const updateExamSectionService = async (instructorAccId, examId, sectionId, sectionData) => {
  validateSectionData(sectionData);

  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(examId, instructorId);
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  // Kiểm tra section có thuộc exam này không
  const belongsToExam = await instructorExamRepository.checkSectionBelongsToExam(sectionId, examId);
  if (!belongsToExam) {
    throw new Error("Section không thuộc bài thi này");
  }

  // Nếu có parentSectionId mới, kiểm tra parent có tồn tại không
  if (sectionData.parentSectionId) {
    // Không cho phép section tự reference chính nó
    if (sectionData.parentSectionId == sectionId) {
      throw new Error("Section không thể là parent của chính nó");
    }

    const parentSection = await instructorExamRepository.getSectionById(sectionData.parentSectionId);
    if (!parentSection) {
      throw new Error("Parent section không tồn tại");
    }

    const parentBelongsToExam = await instructorExamRepository.checkSectionBelongsToExam(
      sectionData.parentSectionId,
      examId
    );
    if (!parentBelongsToExam) {
      throw new Error("Parent section không thuộc bài thi này");
    }
  }

  await instructorExamRepository.updateExamSection(sectionId, {
    type: sectionData.type,
    orderIndex: sectionData.orderIndex,
    parentSectionId: sectionData.parentSectionId || null
  });

  return { message: "Cập nhật section thành công" };
};

/**
 * Xóa section (sẽ xóa cả child sections và questions)
 */
const deleteExamSectionService = async (instructorAccId, examId, sectionId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(examId, instructorId);
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  const belongsToExam = await instructorExamRepository.checkSectionBelongsToExam(sectionId, examId);
  if (!belongsToExam) {
    throw new Error("Section không thuộc bài thi này");
  }

  await instructorExamRepository.deleteExamSection(sectionId);

  return { message: "Xóa section thành công (bao gồm child sections và questions)" };
};

/**
 * Lấy danh sách sections của exam với cấu trúc phân cấp
 */
const getSectionsService = async (instructorAccId, examId, hierarchical = true) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(examId, instructorId);
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  if (hierarchical) {
    // Trả về cấu trúc phân cấp
    const sections = await instructorExamRepository.getSectionsHierarchyByExam(examId);
    return sections;
  } else {
    // Trả về flat list
    const sections = await instructorExamRepository.getAllSectionsByExam(examId);
    return sections;
  }
};

/**
 * Lấy chi tiết một section
 */
const getSectionDetailService = async (instructorAccId, examId, sectionId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(examId, instructorId);
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  const belongsToExam = await instructorExamRepository.checkSectionBelongsToExam(sectionId, examId);
  if (!belongsToExam) {
    throw new Error("Section không thuộc bài thi này");
  }

  const section = await instructorExamRepository.getSectionById(sectionId);
  if (!section) throw new Error("Không tìm thấy section");

  // Lấy child sections nếu có
  const childSections = await instructorExamRepository.getChildSectionsByParent(sectionId);

  // Lấy questions
  const questions = await instructorExamRepository.getQuestionsBySection(sectionId);

  return {
    ...section,
    childSections,
    questions
  };
};

// ==================== QUESTION BANK SERVICES ====================

/**
 * Tạo câu hỏi mới
 */
const createQuestionService = async (instructorAccId, questionData) => {
  validateQuestionData(questionData);

  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const data = {
    content: questionData.content.trim(),
    type: questionData.type,
    correctAnswer: questionData.correctAnswer || null,
    instructorId: instructorId,
    status: questionData.status || "Active",
    topic: questionData.topic || null,
    level: questionData.level || null,
    point: questionData.point || 1
  };

  const questionId = await instructorExamRepository.createQuestion(data);

  if (questionData.type === 'multiple_choice' && questionData.options) {
    await instructorExamRepository.createQuestionOptions(questionId, questionData.options);
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

// ==================== SECTION-QUESTION MANAGEMENT ====================

/**
 * Thêm câu hỏi vào section
 */
const addQuestionsToSectionService = async (instructorAccId, examId, sectionId, questionIds) => {
  if (!Array.isArray(questionIds) || questionIds.length === 0) {
    throw new Error("Danh sách câu hỏi không hợp lệ");
  }

  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(examId, instructorId);
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  const belongsToExam = await instructorExamRepository.checkSectionBelongsToExam(sectionId, examId);
  if (!belongsToExam) {
    throw new Error("Section không thuộc bài thi này");
  }

  await instructorExamRepository.addQuestionsToSection(sectionId, questionIds);

  return { message: `Thêm ${questionIds.length} câu hỏi vào section thành công` };
};

/**
 * Xóa câu hỏi khỏi section
 */
const removeQuestionFromSectionService = async (instructorAccId, examId, sectionId, questionId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(examId, instructorId);
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  const belongsToExam = await instructorExamRepository.checkSectionBelongsToExam(sectionId, examId);
  if (!belongsToExam) {
    throw new Error("Section không thuộc bài thi này");
  }

  await instructorExamRepository.removeQuestionFromSection(sectionId, questionId);

  return { message: "Xóa câu hỏi khỏi section thành công" };
};

/**
 * Cập nhật thứ tự câu hỏi trong section
 */
const updateQuestionOrderService = async (instructorAccId, examId, sectionId, questionId, newOrderIndex) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(examId, instructorId);
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  const belongsToExam = await instructorExamRepository.checkSectionBelongsToExam(sectionId, examId);
  if (!belongsToExam) {
    throw new Error("Section không thuộc bài thi này");
  }

  if (newOrderIndex < 0) {
    throw new Error("Order index phải >= 0");
  }

  await instructorExamRepository.updateQuestionOrder(sectionId, questionId, newOrderIndex);

  return { message: "Cập nhật thứ tự câu hỏi thành công" };
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
/**
 * Check and update exam status - Service layer
 */
const checkAndUpdateExamStatusService = async () => {
  try {
    const result = await instructorExamRepository.checkAndUpdateExamStatus();

    return {
      success: true,
      message: "Exam status checked and updated",
      updates: result
    };
  } catch (error) {
    console.error("❌ Service: Check exam status error:", error);
    throw {
      status: 500,
      message: "Failed to check exam status",
      error: error.message
    };
  }
};
/**
 * Khôi phục bài thi từ lưu trữ (quay về trạng thái Completed)
 */
const unarchiveExamService = async (instructorAccId, examId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(examId, instructorId);
  if (!hasAccess) throw new Error("Không có quyền truy cập kỳ thi này");

  const exam = await instructorExamRepository.getExamById(examId);
  if (!exam) throw new Error("Không tìm thấy kỳ thi");

  if (exam.Status !== 'Archived') {
    throw new Error("Chỉ có thể khôi phục bài thi đã lưu trữ");
  }

  const success = await instructorExamRepository.unarchiveExam(examId);
  if (!success) throw new Error("Không thể khôi phục bài thi");

  return { message: "Khôi phục bài thi thành công" };
};


module.exports = {
  // Exam CRUD
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
};