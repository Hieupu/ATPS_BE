const instructorExamRepository = require("../repositories/instructorExamRepository");
const XLSX = require("xlsx");
const connectDB = require("../config/db");
// ==================== CONSTANTS ====================
const EXAM_STATUSES = ["Draft", "Published", "Archived"];
const EXAM_TYPES = ["Assignment", "Exam"];
const INSTANCE_STATUSES = [
  "Scheduled",
  "Open",
  "Closed",
  "Archived",
  "Cancelled",
];
const SECTION_TYPES = ["Listening", "Speaking", "Reading", "Writing"];
const QUESTION_TYPES = [
  "multiple_choice",
  "true_false",
  "fill_in_blank",
  "matching",
  "essay",
  "speaking",
];
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
  // Title
  if (!data.title || !data.title.trim()) {
    throw new Error("Tiêu đề bài thi là bắt buộc");
  }

  // Description
  if (!data.description || !data.description.trim()) {
    throw new Error("Mô tả bài thi là bắt buộc");
  }

  // Status
  if (data.status && !EXAM_STATUSES.includes(data.status)) {
    throw new Error(
      `Trạng thái không hợp lệ. Cho phép: ${EXAM_STATUSES.join(", ")}`
    );
  }

  // Type
  if (data.type && !EXAM_TYPES.includes(data.type)) {
    throw new Error(
      `Loại bài thi không hợp lệ. Cho phép: ${EXAM_TYPES.join(", ")}`
    );
  }

  return data;
}

function validateInstanceData(data) {
  // Nếu gán bài EXAM → bắt buộc nhập thời gian
  if (data.instanceType === "Exam") {
    const startTime = assertValidDateStr(data.startTime, "Thời gian bắt đầu");
    const endTime = assertValidDateStr(data.endTime, "Thời gian kết thúc");

    if (endTime <= startTime) {
      throw new Error("Thời gian kết thúc phải sau thời gian bắt đầu");
    }
  }

  // Nếu Assignment → KHÔNG cần thời gian, nhưng nếu có thì validate
  if (data.instanceType === "Assignment") {
    if (data.startTime && data.endTime) {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error("Thời gian không hợp lệ");
      }
      if (end <= start) {
        throw new Error("Thời gian kết thúc phải sau thời gian bắt đầu");
      }
    }
  }

  // Validate Unit / Class
  if (!data.classId && !data.unitId) {
    throw new Error("Phải gán cho Class hoặc Unit");
  }
  if (data.classId && data.unitId) {
    throw new Error("Chỉ có thể gán cho Class HOẶC Unit, không thể cả hai");
  }

  // Validate Attempt
  if (!data.attempt || data.attempt < 1) {
    throw new Error("Số lần làm bài phải ≥ 1");
  }

  return data;
}

function validateInstanceUpdateData(data) {
  if (!data.instanceType) throw new Error("Loại bài là bắt buộc");

  if (data.instanceType === "Exam") {
    if (
      !data.classId ||
      !Array.isArray(data.classId) ||
      data.classId.length === 0
    ) {
      throw new Error("classId phải là mảng không rỗng cho Exam");
    }
    if (!data.startTime || !data.endTime) {
      throw new Error("Exam bắt buộc phải có thời gian");
    }
  }

  if (data.instanceType === "Assignment") {
    if (
      !data.unitId ||
      !Array.isArray(data.unitId) ||
      data.unitId.length === 0
    ) {
      throw new Error("unitId phải là mảng không rỗng cho Assignment");
    }
    if (
      (data.startTime && !data.endTime) ||
      (!data.startTime && data.endTime)
    ) {
      throw new Error("Assignment phải có đủ Start và End time nếu đặt");
    }
  }

  if (data.startTime && data.endTime) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Thời gian không hợp lệ");
    }
    if (end <= start) {
      throw new Error("End time phải sau Start time");
    }
  }

  if (data.attempt != null && (isNaN(data.attempt) || data.attempt < 1)) {
    throw new Error("attempt phải >= 1");
  }
}

function validateSectionData(data) {
  if (!data.type || !SECTION_TYPES.includes(data.type)) {
    throw new Error(
      `Loại section không hợp lệ. Cho phép: ${SECTION_TYPES.join(", ")}`
    );
  }

  if (data.orderIndex === undefined || data.orderIndex < 0) {
    throw new Error("OrderIndex phải >= 0");
  }

  return data;
}

function validateQuestionData(data) {
  if (!data.content?.trim()) {
    throw new Error("Nội dung câu hỏi là bắt buộc");
  }

  if (data.type && !QUESTION_TYPES.includes(data.type)) {
    throw new Error(
      `Loại câu hỏi không hợp lệ. Cho phép: ${QUESTION_TYPES.join(", ")}`
    );
  }

  if (data.level && !QUESTION_LEVELS.includes(data.level)) {
    throw new Error(
      `Độ khó không hợp lệ. Cho phép: ${QUESTION_LEVELS.join(", ")}`
    );
  }

  if (data.point && (data.point < 0 || data.point > 100)) {
    throw new Error("Điểm phải từ 0 đến 100");
  }

  if (data.type === "multiple_choice") {
    if (
      !data.options ||
      !Array.isArray(data.options) ||
      data.options.length < 2
    ) {
      throw new Error("Câu hỏi trắc nghiệm phải có ít nhất 2 lựa chọn");
    }
    const correctCount = data.options.filter((opt) => opt.isCorrect).length;
    if (correctCount === 0) {
      throw new Error("Phải có ít nhất 1 đáp án đúng");
    }
  }

  return data;
}

// ==================== EXAM SERVICES ====================

/**
 * Tạo exam mới (template)
 */
const createExamService = async (instructorAccId, data) => {
  validateExamData(data);

  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const examData = {
    title: data.title.trim(),
    description: data.description.trim(),
    status: data.status || "Draft",
    type: data.type || "Exam",
    instructorId: instructorId,
  };

  const examId = await instructorExamRepository.createExam(examData);

  // Tạo sections với cấu trúc phân cấp nếu có
  if (
    data.sections &&
    Array.isArray(data.sections) &&
    data.sections.length > 0
  ) {
    for (const parentSection of data.sections) {
      validateSectionData(parentSection);

      // Tạo parent section
      const parentSectionId = await instructorExamRepository.createExamSection(
        examId,
        {
          type: parentSection.type,
          title: parentSection.title || null,
          orderIndex: parentSection.orderIndex,
          parentSectionId: null,
          fileURL: parentSection.fileURL || null,
        }
      );

      // Tạo child sections nếu có
      if (
        parentSection.childSections &&
        Array.isArray(parentSection.childSections)
      ) {
        for (const childSection of parentSection.childSections) {
          validateSectionData(childSection);

          const childSectionId =
            await instructorExamRepository.createExamSection(examId, {
              type: childSection.type,
              title: childSection.title || null,
              orderIndex: childSection.orderIndex,
              parentSectionId: parentSectionId,
              fileURL: childSection.fileURL || null,
            });

          // Thêm questions vào child section
          const questionIds =
            childSection.questionIds || childSection.questions || [];
          if (questionIds && questionIds.length > 0) {
            await instructorExamRepository.addQuestionsToSection(
              childSectionId,
              questionIds
            );
          }
        }
      }

      // Thêm questions trực tiếp vào parent section
      const parentQuestionIds =
        parentSection.questionIds || parentSection.questions || [];
      if (parentQuestionIds && parentQuestionIds.length > 0) {
        await instructorExamRepository.addQuestionsToSection(
          parentSectionId,
          parentQuestionIds
        );
      }
    }
  }

  return {
    examId,
    message:
      "Tạo bài thi template thành công. Bạn có thể tạo exam instances để gán cho class/unit.",
  };
};

/**
 * Cập nhật exam template
 */
const updateExamService = async (instructorAccId, examId, data) => {
  validateExamData(data);

  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(
    examId,
    instructorId
  );
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  const examData = {
    title: data.title.trim(),
    description: data.description.trim(),
    status: data.status || "Draft",
    type: data.type || "Exam",
  };

  await instructorExamRepository.updateExam(examId, examData);

  // Cập nhật sections nếu có
  if (Array.isArray(data.sections)) {
    // Xóa tất cả sections cũ và tạo lại
    const oldSections = await instructorExamRepository.getParentSectionsByExam(
      examId
    );
    for (const section of oldSections) {
      await instructorExamRepository.deleteExamSection(section.SectionId);
    }

    // Tạo sections mới
    for (const parentSection of data.sections) {
      validateSectionData(parentSection);

      const parentSectionId = await instructorExamRepository.createExamSection(
        examId,
        {
          type: parentSection.type,
          title: parentSection.title || null,
          orderIndex: parentSection.orderIndex,
          parentSectionId: null,
          fileURL: parentSection.fileURL || null,
        }
      );

      if (
        parentSection.childSections &&
        Array.isArray(parentSection.childSections)
      ) {
        for (const childSection of parentSection.childSections) {
          validateSectionData(childSection);

          const childSectionId =
            await instructorExamRepository.createExamSection(examId, {
              type: childSection.type,
              title: childSection.title || null,
              orderIndex: childSection.orderIndex,
              parentSectionId: parentSectionId,
              fileURL: childSection.fileURL || null,
            });

          const questionIds =
            childSection.questionIds || childSection.questions || [];
          if (questionIds && questionIds.length > 0) {
            await instructorExamRepository.addQuestionsToSection(
              childSectionId,
              questionIds
            );
          }
        }
      }

      const parentQuestionIds =
        parentSection.questionIds || parentSection.questions || [];
      if (parentQuestionIds && parentQuestionIds.length > 0) {
        await instructorExamRepository.addQuestionsToSection(
          parentSectionId,
          parentQuestionIds
        );
      }
    }
  }

  return { message: "Cập nhật bài thi thành công" };
};

/**
 * Lấy danh sách exams
 */
const getExamsService = async (instructorAccId, filters = {}) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const exams = await instructorExamRepository.getExamsByInstructor(
    instructorId,
    filters
  );
  return exams;
};

/**
 * Lấy chi tiết exam với cấu trúc phân cấp sections
 */
const getExamDetailService = async (instructorAccId, examId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(
    examId,
    instructorId
  );
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  const exam = await instructorExamRepository.getExamById(examId);
  if (!exam) throw new Error("Không tìm thấy bài thi");

  // Lấy cấu trúc sections
  const sections = await instructorExamRepository.getSectionsHierarchyByExam(
    examId
  );

  // Lấy danh sách instances
  const instances = await instructorExamRepository.getInstancesByExam(examId);

  return {
    ...exam,
    sections,
    instances,
  };
};

/**
 * Xóa exam (chuyển sang Archived)
 */
const deleteExamService = async (instructorAccId, examId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(
    examId,
    instructorId
  );
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  await instructorExamRepository.deleteExam(examId);
  return { message: "Xóa bài thi thành công" };
};

/**
 * Lưu trữ exam
 */
const archiveExamService = async (instructorAccId, examId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(
    examId,
    instructorId
  );
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  const success = await instructorExamRepository.archiveExam(examId);
  if (!success) throw new Error("Không thể lưu trữ bài thi");

  return { message: "Lưu trữ bài thi thành công" };
};

/**
 * Khôi phục exam từ lưu trữ
 */
const unarchiveExamService = async (instructorAccId, examId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(
    examId,
    instructorId
  );
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  const success = await instructorExamRepository.unarchiveExam(examId);
  if (!success) throw new Error("Không thể khôi phục bài thi");

  return { message: "Khôi phục bài thi thành công" };
};

/**
 * Lấy danh sách exams đã lưu trữ
 */
const getArchivedExamsService = async (instructorAccId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const exams = await instructorExamRepository.getArchivedExams(instructorId);
  return exams;
};

// ==================== EXAM INSTANCE SERVICES ====================

/**
 * Tạo exam instance mới (phiên thi cụ thể)
 */
const createExamInstanceService = async (instructorAccId, examId, data) => {
  validateInstanceData(data);

  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(
    examId,
    instructorId
  );
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  const exam = await instructorExamRepository.getExamById(examId);
  if (!exam) throw new Error("Không tìm thấy bài thi");

  if (exam.Status === "Archived") {
    throw new Error("Không thể tạo instance cho bài thi đã Archived");
  }

  // Chuẩn hóa classId & unitId
  let classIds = [];
  let unitIds = [];

  if (Array.isArray(data.classId)) classIds = data.classId;
  else if (data.classId) classIds = [data.classId];

  if (Array.isArray(data.unitId)) unitIds = data.unitId;
  else if (data.unitId) unitIds = [data.unitId];
  if (classIds.length > 0 && unitIds.length > 0) {
    throw new Error("Chỉ có thể gán cho Class hoặc Unit, không thể cả hai");
  }

  const createdInstances = [];

  if (classIds.length > 0) {
    for (const classId of classIds) {
      const instanceData = {
        examId,
        classId,
        unitId: null,
        startTime: data.startTime,
        endTime: data.endTime,
        isRandomQuestion: data.isRandomQuestion || false,
        isRandomAnswer: data.isRandomAnswer || false,
        status: data.status || "Scheduled",
        attempt: data.attempt || 100,
      };

      const instanceId = await instructorExamRepository.createExamInstance(
        instanceData
      );
      createdInstances.push(instanceId);
    }

    return {
      success: true,
      message: "Tạo instances thành công cho nhiều lớp",
      instances: createdInstances,
    };
  }

  if (unitIds.length > 0) {
    for (const unitId of unitIds) {
      const instanceData = {
        examId,
        classId: null,
        unitId,
        startTime: data.startTime,
        endTime: data.endTime,
        isRandomQuestion: data.isRandomQuestion || false,
        isRandomAnswer: data.isRandomAnswer || false,
        status: data.status || "Scheduled",
        attempt: data.attempt || 100,
      };

      const instanceId = await instructorExamRepository.createExamInstance(
        instanceData
      );
      createdInstances.push(instanceId);
    }

    return {
      success: true,
      message: "Tạo instances thành công cho nhiều unit",
      instances: createdInstances,
    };
  }

  throw new Error("Phải gán cho Class hoặc Unit để tạo instance");
};

/**
 * Cập nhật exam instance
 */
const updateExamInstanceService = async (
  instructorAccId,
  examId,
  instanceId,
  data
) => {
  // 1. VALIDATE INPUT
  validateInstanceUpdateData(data);

  // 2. LẤY INSTRUCTOR ID
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  // 3. KIỂM TRA QUYỀN SỞ HỮU
  const hasAccess = await instructorExamRepository.checkExamOwnership(
    examId,
    instructorId
  );
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  // 4. LẤY INSTANCE HIỆN TẠI (CHỈ ĐỂ LẤY GIÁ TRỊ MẶC ĐỊNH)
  const instance = await instructorExamRepository.getInstanceById(instanceId);
  if (!instance) throw new Error("Không tìm thấy phiên thi");
  if (instance.ExamId != examId)
    throw new Error("Instance không thuộc exam này");

  // 5. CHUẨN HÓA classId / unitId THÀNH MẢNG
  const classIds =
    data.classId != null
      ? Array.isArray(data.classId)
        ? data.classId
        : [data.classId]
      : [];

  const unitIds =
    data.unitId != null
      ? Array.isArray(data.unitId)
        ? data.unitId
        : [data.unitId]
      : [];

  // 6. TRƯỜNG HỢP ĐỔI CLASS/UNIT → XÓA CŨ, TẠO MỚI
  if (classIds.length > 0 || unitIds.length > 0) {
    if (classIds.length > 0 && unitIds.length > 0) {
      throw new Error("Không thể update sang cả Class và Unit cùng lúc");
    }

    // XÓA INSTANCE CŨ
    await instructorExamRepository.deleteExamInstance(instanceId);

    const newInstances = [];
    const targetList = classIds.length > 0 ? classIds : unitIds;

    for (const targetId of targetList) {
      const newData = {
        examId,
        classId: classIds.length > 0 ? targetId : null,
        unitId: unitIds.length > 0 ? targetId : null,
        startTime: data.startTime,
        endTime: data.endTime,
        isRandomQuestion: data.isRandomQuestion ?? instance.IsRandomQuestion,
        isRandomAnswer: data.isRandomAnswer ?? instance.IsRandomAnswer,
        status: data.status ?? instance.Status,
        attempt: data.attempt ?? instance.Attempt,
      };

      const newInstanceId = await instructorExamRepository.createExamInstance(
        newData
      );
      newInstances.push(newInstanceId);
    }

    return {
      success: true,
      message: "Cập nhật instance thành công (đổi class/unit)",
      instances: newInstances,
    };
  }

  // 7. TRƯỜNG HỢP CHỈ CẬP NHẬT THÔNG TIN THƯỜNG
  const instanceData = {
    startTime: data.startTime,
    endTime: data.endTime,
    isRandomQuestion: data.isRandomQuestion ?? instance.IsRandomQuestion,
    isRandomAnswer: data.isRandomAnswer ?? instance.IsRandomAnswer,
    status: data.status ?? instance.Status,
    attempt: data.attempt ?? instance.Attempt,
  };

  await instructorExamRepository.updateExamInstance(instanceId, instanceData);

  return {
    success: true,
    message: "Cập nhật phiên thi thành công",
  };
};

/**
 * Xóa exam instance
 */
const deleteExamInstanceService = async (
  instructorAccId,
  examId,
  instanceId
) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(
    examId,
    instructorId
  );
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  const instance = await instructorExamRepository.getInstanceById(instanceId);
  if (!instance) throw new Error("Không tìm thấy phiên thi");

  if (instance.ExamId != examId) {
    throw new Error("Instance không thuộc exam này");
  }

  await instructorExamRepository.deleteExamInstance(instanceId);

  return { message: "Xóa phiên thi thành công" };
};

/**
 * Lấy danh sách instances của exam
 */
const getExamInstancesService = async (instructorAccId, examId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(
    examId,
    instructorId
  );
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  const instances = await instructorExamRepository.getInstancesByExam(examId);
  return instances;
};

/**
 * Lấy danh sách classes có thể gán
 */
const getAvailableClassesService = async (instructorAccId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const classes =
    await instructorExamRepository.getAvailableClassesByInstructor(
      instructorId
    );
  return classes;
};

/**
 * Lấy danh sách units có thể gán
 */
const getAvailableUnitsService = async (instructorAccId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const units = await instructorExamRepository.getAvailableUnitsByInstructor(
    instructorId
  );
  return units;
};

/**
 * Auto update exam instance status
 */
const checkAndUpdateInstanceStatusService = async () => {
  try {
    const result = await instructorExamRepository.autoUpdateInstanceStatus();
    return {
      success: true,
      message: "Exam instance status checked and updated",
      updates: result,
    };
  } catch (error) {
    console.error(" Service: Check instance status error:", error);
    throw {
      status: 500,
      message: "Failed to check instance status",
      error: error.message,
    };
  }
};

// ==================== SECTION MANAGEMENT SERVICES ====================

/**
 * Tạo section mới
 */
const createExamSectionService = async (
  instructorAccId,
  examId,
  sectionData
) => {
  validateSectionData(sectionData);

  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(
    examId,
    instructorId
  );
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  // Nếu có parentSectionId, kiểm tra parent có tồn tại không
  if (sectionData.parentSectionId) {
    const parentSection = await instructorExamRepository.getSectionById(
      sectionData.parentSectionId
    );
    if (!parentSection) {
      throw new Error("Parent section không tồn tại");
    }

    const belongsToExam =
      await instructorExamRepository.checkSectionBelongsToExam(
        sectionData.parentSectionId,
        examId
      );
    if (!belongsToExam) {
      throw new Error("Parent section không thuộc bài thi này");
    }
  }

  const sectionId = await instructorExamRepository.createExamSection(examId, {
    type: sectionData.type,
    title: sectionData.title || null,
    orderIndex: sectionData.orderIndex,
    parentSectionId: sectionData.parentSectionId || null,
    fileURL: sectionData.fileURL || null,
  });

  return {
    sectionId,
    message: sectionData.parentSectionId
      ? "Tạo child section thành công"
      : "Tạo parent section thành công",
  };
};

/**
 * Cập nhật section
 */
const updateExamSectionService = async (
  instructorAccId,
  examId,
  sectionId,
  sectionData
) => {
  validateSectionData(sectionData);

  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(
    examId,
    instructorId
  );
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  const belongsToExam =
    await instructorExamRepository.checkSectionBelongsToExam(sectionId, examId);
  if (!belongsToExam) {
    throw new Error("Section không thuộc bài thi này");
  }

  if (sectionData.parentSectionId) {
    if (sectionData.parentSectionId == sectionId) {
      throw new Error("Section không thể là parent của chính nó");
    }

    const parentSection = await instructorExamRepository.getSectionById(
      sectionData.parentSectionId
    );
    if (!parentSection) {
      throw new Error("Parent section không tồn tại");
    }

    const parentBelongsToExam =
      await instructorExamRepository.checkSectionBelongsToExam(
        sectionData.parentSectionId,
        examId
      );
    if (!parentBelongsToExam) {
      throw new Error("Parent section không thuộc bài thi này");
    }
  }

  await instructorExamRepository.updateExamSection(sectionId, {
    type: sectionData.type,
    title: sectionData.title || null,
    orderIndex: sectionData.orderIndex,
    parentSectionId: sectionData.parentSectionId || null,
    fileURL: sectionData.fileURL || null,
  });

  return { message: "Cập nhật section thành công" };
};

/**
 * Xóa section
 */
const deleteExamSectionService = async (instructorAccId, examId, sectionId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(
    examId,
    instructorId
  );
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  const belongsToExam =
    await instructorExamRepository.checkSectionBelongsToExam(sectionId, examId);
  if (!belongsToExam) {
    throw new Error("Section không thuộc bài thi này");
  }

  await instructorExamRepository.deleteExamSection(sectionId);

  return {
    message: "Xóa section thành công (bao gồm child sections và questions)",
  };
};

/**
 * Lấy danh sách sections
 */
const getSectionsService = async (
  instructorAccId,
  examId,
  hierarchical = true
) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(
    examId,
    instructorId
  );
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  const sections = await instructorExamRepository.getSectionsHierarchyByExam(
    examId
  );
  return sections;
};

/**
 * Lấy chi tiết section
 */
const getSectionDetailService = async (instructorAccId, examId, sectionId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(
    examId,
    instructorId
  );
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  const belongsToExam =
    await instructorExamRepository.checkSectionBelongsToExam(sectionId, examId);
  if (!belongsToExam) {
    throw new Error("Section không thuộc bài thi này");
  }

  const section = await instructorExamRepository.getSectionById(sectionId);
  if (!section) throw new Error("Không tìm thấy section");

  const childSections = await instructorExamRepository.getChildSectionsByParent(
    sectionId
  );
  const questions = await instructorExamRepository.getQuestionsBySection(
    sectionId
  );

  return {
    ...section,
    childSections,
    questions,
  };
};

// ==================== QUESTION BANK SERVICES ====================

/**
 * Tạo câu hỏi mới
 */
const createQuestionService = async (instructorAccId, questionData) => {
  validateQuestionData(questionData);

  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const data = {
    content: questionData.content.trim(),
    type: questionData.type,
    correctAnswer: questionData.correctAnswer || null,
    instructorId: instructorId,
    status: questionData.status || "Active",
    topic: questionData.topic || null,
    level: questionData.level || null,
    point: questionData.point || 1,
  };

  const questionId = await instructorExamRepository.createQuestion(data);

  if (questionData.type === "multiple_choice" && questionData.options) {
    await instructorExamRepository.createQuestionOptions(
      questionId,
      questionData.options
    );
  }

  return { questionId, message: "Tạo câu hỏi thành công" };
};

/**
 * Lấy danh sách câu hỏi
 */
const getQuestionsService = async (instructorAccId, filters = {}) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const questions = await instructorExamRepository.getQuestionsByInstructor(
    instructorId,
    filters
  );
  return questions;
};

/**
 * Lấy chi tiết câu hỏi
 */
const getQuestionDetailService = async (instructorAccId, questionId) => {
  const question = await instructorExamRepository.getQuestionById(questionId);
  if (!question) throw new Error("Không tìm thấy câu hỏi");

  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (question.InstructorID !== instructorId) {
    throw new Error("Không có quyền truy cập câu hỏi này");
  }

  return question;
};

/**
 * Cập nhật câu hỏi
 */
const updateQuestionService = async (instructorAccId, questionId, data) => {
  validateQuestionData(data);

  const question = await instructorExamRepository.getQuestionById(questionId);
  if (!question) throw new Error("Không tìm thấy câu hỏi");

  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
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
    status: data.status || "Active",
  };

  await instructorExamRepository.updateQuestion(questionId, questionData);

  return { message: "Cập nhật câu hỏi thành công" };
};

/**
 * Xóa câu hỏi
 */
const deleteQuestionService = async (instructorAccId, questionId) => {
  const question = await instructorExamRepository.getQuestionById(questionId);
  if (!question) throw new Error("Không tìm thấy câu hỏi");

  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
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
const addQuestionsToSectionService = async (
  instructorAccId,
  examId,
  sectionId,
  questionIds
) => {
  if (!Array.isArray(questionIds) || questionIds.length === 0) {
    throw new Error("Danh sách câu hỏi không hợp lệ");
  }

  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(
    examId,
    instructorId
  );
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  const belongsToExam =
    await instructorExamRepository.checkSectionBelongsToExam(sectionId, examId);
  if (!belongsToExam) {
    throw new Error("Section không thuộc bài thi này");
  }

  await instructorExamRepository.addQuestionsToSection(sectionId, questionIds);

  return {
    message: `Thêm ${questionIds.length} câu hỏi vào section thành công`,
  };
};

/**
 * Xóa câu hỏi khỏi section
 */
const removeQuestionFromSectionService = async (
  instructorAccId,
  examId,
  sectionId,
  questionId
) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(
    examId,
    instructorId
  );
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  const belongsToExam =
    await instructorExamRepository.checkSectionBelongsToExam(sectionId, examId);
  if (!belongsToExam) {
    throw new Error("Section không thuộc bài thi này");
  }

  await instructorExamRepository.removeQuestionFromSection(
    sectionId,
    questionId
  );

  return { message: "Xóa câu hỏi khỏi section thành công" };
};

/**
 * Cập nhật thứ tự câu hỏi trong section
 */
const updateQuestionOrderService = async (
  instructorAccId,
  examId,
  sectionId,
  questionId,
  newOrderIndex
) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(
    examId,
    instructorId
  );
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  const belongsToExam =
    await instructorExamRepository.checkSectionBelongsToExam(sectionId, examId);
  if (!belongsToExam) {
    throw new Error("Section không thuộc bài thi này");
  }

  if (newOrderIndex < 0) {
    throw new Error("Order index phải >= 0");
  }

  await instructorExamRepository.updateQuestionOrder(
    sectionId,
    questionId,
    newOrderIndex
  );

  return { message: "Cập nhật thứ tự câu hỏi thành công" };
};

// ==================== GRADING SERVICES ====================

/**
 * Lấy kết quả thi theo instance
 */
const getExamResultsService = async (instructorAccId, instanceId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const instance = await instructorExamRepository.getInstanceById(instanceId);
  if (!instance) throw new Error("Không tìm thấy phiên thi");

  const hasAccess = await instructorExamRepository.checkExamOwnership(
    instance.ExamId,
    instructorId
  );
  if (!hasAccess) throw new Error("Không có quyền truy cập phiên thi này");

  const results = await instructorExamRepository.getExamResultsByInstance(
    instanceId
  );

  return results;
};

/**
 * Lấy bài thi của learner để chấm
 */
const getLearnerSubmissionService = async (
  instructorAccId,
  examId,
  learnerId
) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(
    examId,
    instructorId
  );
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  const submission = await instructorExamRepository.getLearnerExamSubmission(
    examId,
    learnerId
  );

  return submission;
};

/**
 * Chấm bài tự động
 */
const autoGradeExamService = async (instructorAccId, examId, learnerId) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(
    examId,
    instructorId
  );
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  const submission = await instructorExamRepository.getLearnerExamSubmission(
    examId,
    learnerId
  );

  let totalScore = 0;
  let maxScore = 0;

  for (const question of submission) {
    maxScore += question.Point;

    if (question.Type === "multiple_choice" || question.Type === "true_false") {
      if (
        question.LearnerAnswer &&
        question.LearnerAnswer === question.CorrectAnswer
      ) {
        totalScore += question.Point;
      }
    }
  }

  const score = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  await instructorExamRepository.saveExamResult({
    learnerId,
    examId,
    score: score.toFixed(2),
    feedback: "Chấm điểm tự động",
  });

  return { score: score.toFixed(2), message: "Chấm bài tự động thành công" };
};

/**
 * Chấm bài thủ công
 */
const manualGradeExamService = async (
  instructorAccId,
  examId,
  learnerId,
  score,
  feedback
) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy thông tin giảng viên");

  const hasAccess = await instructorExamRepository.checkExamOwnership(
    examId,
    instructorId
  );
  if (!hasAccess) throw new Error("Không có quyền truy cập bài thi này");

  if (score < 0 || score > 100) {
    throw new Error("Điểm phải từ 0 đến 100");
  }

  await instructorExamRepository.saveExamResult({
    learnerId,
    examId,
    score,
    feedback: feedback || "",
  });

  return { message: "Chấm bài thành công" };
};

const importQuestionsFromExcel = async (
  instructorAccId,
  examId,
  sectionId,
  fileBuffer
) => {
  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy giảng viên");

  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const created = [];
  const errors = [];
  const newQuestionIdsForSection = [];

  const normalize = (str) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "");

  const optionCandidates = {
    A: ["tuychona", "optiona", "a"],
    B: ["tuychonb", "optionb", "b"],
    C: ["tuychonc", "optionc", "c"],
    D: ["tuychond", "optiond", "d"],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      const type = (row["Loại"] || "").trim();

      const questionData = {
        content: row["Nội dung"],
        type,
        topic: row["Chủ đề"] || null,
        level: row["Mức độ"] || null,
        point: Number(row["Điểm"]) || 1,
        status: "Active",
        correctAnswer: null,
        options: [],
      };

      let options = [];

      if (type === "multiple_choice") {
        const ansKeys = (row["Đáp án"] || "")
          .split(",")
          .map((x) => x.trim().toUpperCase())
          .filter(Boolean);

        const rowKeys = Object.keys(row).map((key) => ({
          raw: key,
          norm: normalize(key),
        }));

        const findColumn = (candidateKeys) =>
          rowKeys.find((k) => candidateKeys.includes(k.norm))?.raw;

        const optionMap = {};

        ["A", "B", "C", "D"].forEach((letter) => {
          const colName = findColumn(optionCandidates[letter]);
          const fallback = `Tùy chọn ${letter}`;
          const finalCol =
            colName || Object.keys(row).find((k) => k === fallback);

          if (
            finalCol &&
            row[finalCol] &&
            row[finalCol].toString().trim() !== ""
          ) {
            const content = row[finalCol].toString().trim();

            options.push({
              content,
              isCorrect: ansKeys.includes(letter),
            });

            optionMap[letter] = content;
          }
        });

        if (options.length < 2) {
          throw new Error("Câu hỏi trắc nghiệm phải có ít nhất 2 lựa chọn");
        }
        const correctContents = ansKeys
          .map((k) => optionMap[k])
          .filter(Boolean);
        questionData.correctAnswer = correctContents.join(",");

        questionData.options = options;
      } else if (type === "true_false") {
        questionData.correctAnswer =
          (row["Đáp án"] || "").toString().toLowerCase() === "true"
            ? "true"
            : "false";
      } else if (type === "fill_in_blank") {
        questionData.correctAnswer = row["Đáp án"] || "";
      } else if (type === "matching") {
        const left = (row["Tùy chọn A"] || "")
          .toString()
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);

        const right = (row["Tùy chọn B"] || "")
          .toString()
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);

        if (left.length !== right.length) {
          throw new Error("Matching: số lượng bên trái và bên phải không khớp");
        }

        const mapping = {};
        left.forEach((l, idx) => (mapping[l] = right[idx]));
        questionData.correctAnswer = JSON.stringify(mapping);
      }

      validateQuestionData(questionData);

      const questionId = await instructorExamRepository.createQuestion({
        content: questionData.content.trim(),
        type: questionData.type,
        correctAnswer: questionData.correctAnswer,
        instructorId,
        status: questionData.status,
        topic: questionData.topic,
        level: questionData.level,
        point: questionData.point,
      });

      if (type === "multiple_choice" && options.length > 0) {
        await instructorExamRepository.createQuestionOptions(
          questionId,
          options
        );
      }

      newQuestionIdsForSection.push(questionId);
      created.push({ row: i + 2, questionId });
    } catch (err) {
      errors.push({ row: i + 2, error: err.message });
    }
  }

  if (sectionId && newQuestionIdsForSection.length > 0) {
    await instructorExamRepository.addQuestionsToSection(
      sectionId,
      newQuestionIdsForSection
    );
  }

  return {
    createdCount: created.length,
    errorCount: errors.length,
    created,
    errors,
  };
};
const createFullExamService = async (instructorAccId, data) => {
  // 1) Validate exam
  validateExamData(data.exam);

  // 2) Validate instance
  validateInstanceData(data.instance);

  const instructorId = await instructorExamRepository.getInstructorIdByAccId(
    instructorAccId
  );
  if (!instructorId) throw new Error("Không tìm thấy giảng viên");

  // --- Tạo exam ---
  const examId = await instructorExamRepository.createExam({
    title: data.exam.title,
    description: data.exam.description,
    status: "Draft",
    type: data.instance.instanceType || "Exam",
    instructorId
  });

  // --- Tạo sections ---
  if (Array.isArray(data.sections)) {
    for (const parent of data.sections) {
      const parentId = await instructorExamRepository.createExamSection(
        examId,
        {
          type: parent.type,
          title: parent.title,
          orderIndex: parent.orderIndex,
          parentSectionId: null,
          fileURL: parent.fileURL || null,
        }
      );

      // Child sections
      if (Array.isArray(parent.childSections)) {
        for (const child of parent.childSections) {
          const childId = await instructorExamRepository.createExamSection(
            examId,
            {
              type: child.type,
              title: child.title,
              orderIndex: child.orderIndex,
              parentSectionId: parentId,
              fileURL: child.fileURL || null,
            }
          );

          // ✅ BƯỚC 1: TẠO CÂU HỎI MỚI (newQuestions)
          const createdQuestionIds = [];

          if (
            Array.isArray(child.newQuestions) &&
            child.newQuestions.length > 0
          ) {
            for (const newQ of child.newQuestions) {
              // Validate câu hỏi mới
              validateQuestionData(newQ);

              // Chuẩn hóa correctAnswer cho matching
              let correctAnswer = newQ.correctAnswer;
              if (newQ.type === "matching") {
                if (typeof correctAnswer !== "string") {
                  correctAnswer = JSON.stringify(correctAnswer || {});
                }
              }

              // Tạo question
              const questionId = await instructorExamRepository.createQuestion({
                content: newQ.content.trim(),
                type: newQ.type,
                correctAnswer: correctAnswer,
                instructorId,
                status: "Active",
                topic: newQ.topic || null,
                level: newQ.level || "Medium",
                point: newQ.point || 1,
              });

              // Tạo options cho multiple_choice
              if (
                newQ.type === "multiple_choice" &&
                Array.isArray(newQ.options)
              ) {
                await instructorExamRepository.createQuestionOptions(
                  questionId,
                  newQ.options
                );
              }

              createdQuestionIds.push(questionId);
            }
          }

          // ✅ BƯỚC 2: GẮN CÂU HỎI (cả có sẵn + mới tạo)
          const allQuestionIds = [
            ...(child.questions || []), // Câu hỏi từ ngân hàng
            ...createdQuestionIds, // Câu hỏi vừa tạo
          ];

          if (allQuestionIds.length > 0) {
            await instructorExamRepository.addQuestionsToSection(
              childId,
              allQuestionIds
            );
          }
        }
      }

      // Questions trực tiếp trong parent (nếu có)
      if (parent.questions?.length > 0) {
        await instructorExamRepository.addQuestionsToSection(
          parentId,
          parent.questions
        );
      }
    }
  }

  // --- Tạo instance ---
  const instancePayload = {
    examId,
    classId: data.instance.classId,
    unitId: data.instance.unitId,
    startTime: data.instance.startTime,
    endTime: data.instance.endTime,
    isRandomQuestion: data.instance.isRandomQuestion,
    isRandomAnswer: data.instance.isRandomAnswer,
    attempt: data.instance.attempt,
    status: "Scheduled",
  };

  const instanceId = await instructorExamRepository.createExamInstance(
    instancePayload
  );

  return {
    examId,
    instanceId,
    message: "Tạo full exam hoàn tất",
  };
};

module.exports = {
  // Exam CRUD
  createExamService,
  updateExamService,
  getExamsService,
  getExamDetailService,
  deleteExamService,
  archiveExamService,
  unarchiveExamService,
  getArchivedExamsService,
  createFullExamService,
  validateExamData,

  // Exam Instances
  createExamInstanceService,
  updateExamInstanceService,
  deleteExamInstanceService,
  getExamInstancesService,
  getAvailableClassesService,
  getAvailableUnitsService,
  checkAndUpdateInstanceStatusService,
  assertValidDateStr,

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
  importQuestionsFromExcel,
  validateQuestionData,

  // Grading
  getExamResultsService,
  getLearnerSubmissionService,
  autoGradeExamService,
  manualGradeExamService,

  // Utils / validation
  validateQuestionData,
  validateExamData,
  assertValidDateStr,
};
