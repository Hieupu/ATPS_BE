const {
  createExamService,
  updateExamService,
  getExamsService,
  getExamDetailService,
  deleteExamService,
  archiveExamService,
  unarchiveExamService,
  getArchivedExamsService,
  createFullExamService ,

  createExamInstanceService,
  updateExamInstanceService,
  deleteExamInstanceService,
  getExamInstancesService,
  checkAndUpdateInstanceStatusService,

  createExamSectionService,
  updateExamSectionService,
  deleteExamSectionService,
  getSectionsService,
  getSectionDetailService,

  createQuestionService,
  getQuestionsService,
  getQuestionDetailService,
  updateQuestionService,
  deleteQuestionService,

  addQuestionsToSectionService,
  removeQuestionFromSectionService,
  updateQuestionOrderService,

  getExamResultsService,
  getLearnerSubmissionService,
  autoGradeExamService,
  manualGradeExamService,

  importQuestionsFromExcel,

} = require("../services/instructorExamService");
const instructorExamRepository = require("../repositories/instructorExamRepository");

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


const getClassesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "courseId is required",
      });
    }

    const classes = await instructorExamRepository.getClassesByCourse(courseId);

    return res.status(200).json({
      success: true,
      data: classes
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};



const getUnitByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "courseId is required",
      });
    }

    const units = await instructorExamRepository.getUnitByCourse(courseId);

    return res.json({
      success: true,
      units,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const checkAndUpdateInstanceStatus = async (req, res) => {
  try {
    const result = await checkAndUpdateInstanceStatusService();

    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to check instance status"
    });
  }
};

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

const getInstructorCourses = async (req, res) => {
  try {
    const instructorAccId = req.user.id;

    const instructorId =
      await instructorExamRepository.getInstructorIdByAccId(instructorAccId);

    if (!instructorId) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin giảng viên"
      });
    }

    const courses = await instructorExamRepository.getCoursesByInstructor(instructorId);

    res.status(200).json({
      success: true,
      data: courses
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Không thể lấy danh sách khóa học"
    });
  }
};

const createFullExamController = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const payload = req.body;
    const result = await createFullExamService(instructorAccId, payload);
    return res.status(201).json({
      success: true,
      message: "Tạo bài thi,sections,instance thành công",
      data: result
    });

  } catch (err) {
    return res.status(400).json({ 
      success: false, 
      message: err.message 
    });
  }
};
const openExamInstanceNow = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { examId, instanceId } = req.params;

    const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
    if (!instructorId) {
      return res.status(404).json({ success: false, message: "Không tìm thấy giảng viên" });
    }

    const ownsExam = await instructorExamRepository.checkExamOwnership(examId, instructorId);
    if (!ownsExam) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền với bài thi này" });
    }

    const opened = await instructorExamRepository.openExamInstanceNow(instanceId);
    if (!opened) {
      return res.status(400).json({ 
        success: false, 
        message: "Không thể mở (đã mở rồi hoặc không tồn tại)" 
      });
    }

    await instructorExamRepository.publishExam(examId);

    res.status(200).json({
      success: true,
      message: "Đã mở bài thi ngay lập tức. Học viên có thể bắt đầu làm bài."
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Lỗi server" });
  }
};


const closeExamInstanceNow = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { examId, instanceId } = req.params;

    const instructorId = await instructorExamRepository.getInstructorIdByAccId(instructorAccId);
    if (!instructorId) {
      return res.status(404).json({ success: false, message: "Không tìm thấy giảng viên" });
    }

    const ownsExam = await instructorExamRepository.checkExamOwnership(examId, instructorId);
    if (!ownsExam) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền với bài thi này" });
    }

    const closed = await instructorExamRepository.closeExamInstanceNow(instanceId);
    if (!closed) {
      return res.status(400).json({ 
        success: false, 
        message: "Không thể đóng (đã đóng rồi hoặc không tồn tại)" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Đã đóng bài thi ngay lập tức. Học viên không thể tiếp tục làm bài."
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Lỗi server" });
  }
};

module.exports = {
  createExam,
  updateExam,
  getExams,
  getExamDetail,
  deleteExam,
  archiveExam,
  unarchiveExam,
  getArchivedExams,
  createFullExamController,

  createExamInstance,
  updateExamInstance,
  deleteExamInstance,
  getExamInstances,
  getClassesByCourse,
  getUnitByCourse,
  checkAndUpdateInstanceStatus,
  getInstructorCourses,
  getUnitByCourse,

  createExamSection,
  updateExamSection,
  deleteExamSection,
  getSections,
  getSectionDetail,

  createQuestion,
  getQuestions,
  getQuestionDetail,
  updateQuestion,
  deleteQuestion,

  addQuestionsToSection,
  removeQuestionFromSection,
  updateQuestionOrder,

  getExamResults,
  getLearnerSubmission,
  autoGradeExam,
  manualGradeExam,

  importQuestionsExcelController,
  createQuestionAndAssignToSection,
  openExamInstanceNow,
  closeExamInstanceNow
};