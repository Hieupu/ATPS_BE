const learnerExamRepository = require("../repositories/learnerExamRepository");
const instructorExamRepository = require("../repositories/instructorExamRepository");

/**
 * Helper: lấy LearnerID từ accId, nếu không có thì throw
 */
async function getLearnerIdOrThrow(accId) {
  const learnerId = await learnerExamRepository.getLearnerIdByAccId(accId);
  if (!learnerId) {
    const err = new Error("Không tìm thấy thông tin học viên");
    err.status = 404;
    throw err;
  }
  return learnerId;
}

/**
 * Helper: sanitize question (ẩn CorrectAnswer, IsCorrect) để trả về cho learner
 */
function sanitizeQuestionForLearner(question, learnerAnswerMap) {
  const learnerAnswer = learnerAnswerMap
    ? learnerAnswerMap[question.ExamquestionId] ?? null
    : null;

  const safe = {
    questionId: question.QuestionID,
    examQuestionId: question.ExamquestionId,
    content: question.Content,
    type: question.Type,
    point: question.Point,
    orderIndex: question.Order_Index,
    learnerAnswer
  };

  if (Array.isArray(question.options)) {
    safe.options = question.options.map(opt => ({
      optionId: opt.OptionID,
      content: opt.Content
    }));
  } else {
    safe.options = [];
  }

  return safe;
}

/**
 * Build cấu trúc đề thi phân cấp cho learner
 * (dùng các hàm của instructorExamRepository)
 */
async function buildExamStructureForLearner(examId, randomFlag, learnerId) {
  // map ExamquestionId -> LearnerAnswer để load lại những câu đã làm
  const submission = await instructorExamRepository.getLearnerExamSubmission(
    examId,
    learnerId
  );

  const answerMap = {};
  submission.forEach(q => {
    answerMap[q.ExamquestionId] = q.LearnerAnswer;
  });

  const parentSections =
    await instructorExamRepository.getParentSectionsByExam(examId);

  for (const parent of parentSections) {
    // child sections
    parent.childSections =
      await instructorExamRepository.getChildSectionsByParent(parent.SectionId);

    // questions trực tiếp thuộc parent section
    const parentQuestions =
      await instructorExamRepository.getQuestionsBySection(
        parent.SectionId,
        randomFlag
      );
    parent.directQuestions = parentQuestions.map(q =>
      sanitizeQuestionForLearner(q, answerMap)
    );

    // questions trong từng child section
    for (const child of parent.childSections) {
      const childQuestions =
        await instructorExamRepository.getQuestionsBySection(
          child.SectionId,
          randomFlag
        );
      child.questions = childQuestions.map(q =>
        sanitizeQuestionForLearner(q, answerMap)
      );
    }
  }

  return parentSections;
}

/**
 * 1. Lấy danh sách phiên thi (instance) đang mở cho learner
 */
const getAvailableExamsService = async (learnerAccId) => {
  const learnerId = await getLearnerIdOrThrow(learnerAccId);
  const instances = await learnerExamRepository.getAvailableExamInstances(learnerId);

  return instances.map(inst => ({
    instanceId: inst.InstanceId,
    examId: inst.ExamId,
    examTitle: inst.ExamTitle,
    examDescription: inst.ExamDescription,
    classId: inst.ClassId,
    className: inst.ClassName,
    startTime: inst.StartTime,
    endTime: inst.EndTime,
    status: inst.Status,
    attempt: inst.Attempt
  }));
};

/**
 * 2. Lấy đề thi để learner làm (cấu trúc section + câu hỏi)
 */
const getExamToDoService = async (learnerAccId, instanceId) => {
  const learnerId = await getLearnerIdOrThrow(learnerAccId);

  const instance = await learnerExamRepository.getInstanceWithExam(instanceId);
  if (!instance) {
    const err = new Error("Không tìm thấy phiên thi");
    err.status = 404;
    throw err;
  }

  if (instance.ExamType !== "Exam") {
    const err = new Error("Phiên này không phải bài thi (Exam)");
    err.status = 400;
    throw err;
  }

  if (instance.ExamStatus !== "Published") {
    const err = new Error("Bài thi chưa được publish");
    err.status = 400;
    throw err;
  }

  // Check quyền truy cập
  const hasAccess = await learnerExamRepository.checkLearnerAccessToInstance(
    instanceId,
    learnerId
  );
  if (!hasAccess) {
    const err = new Error("Bạn không có quyền làm bài thi này");
    err.status = 403;
    throw err;
  }

  // Check thời gian
  const now = new Date();
  if (instance.StartTime && new Date(instance.StartTime) > now) {
    const err = new Error("Chưa đến giờ làm bài");
    err.status = 400;
    throw err;
  }
  if (instance.EndTime && new Date(instance.EndTime) < now) {
    const err = new Error("Đã quá hạn làm bài");
    err.status = 400;
    throw err;
  }
  if (instance.Status === "Closed") {
    const err = new Error("Phiên thi đã đóng");
    err.status = 400;
    throw err;
  }

  // random question/answer: dùng flag chung cho getQuestionsBySection
  const randomFlag = !!(instance.IsRandomQuestion || instance.IsRandomAnswer);

  const sections = await buildExamStructureForLearner(
    instance.ExamId,
    randomFlag,
    learnerId
  );

  return {
    instance: {
      instanceId: instance.InstanceId,
      examId: instance.ExamId,
      examTitle: instance.ExamTitle,
      examDescription: instance.ExamDescription,
      startTime: instance.StartTime,
      endTime: instance.EndTime,
      status: instance.Status,
      attempt: instance.Attempt
    },
    sections
  };
};

/**
 * 3. Lưu đáp án trong quá trình làm bài (auto-save)
 */
const saveExamAnswersService = async (learnerAccId, instanceId, answers) => {
  const learnerId = await getLearnerIdOrThrow(learnerAccId);

  const instance = await learnerExamRepository.getInstanceWithExam(instanceId);
  if (!instance) {
    const err = new Error("Không tìm thấy phiên thi");
    err.status = 404;
    throw err;
  }

  // Check quyền
  const hasAccess = await learnerExamRepository.checkLearnerAccessToInstance(
    instanceId,
    learnerId
  );
  if (!hasAccess) {
    const err = new Error("Bạn không có quyền làm bài thi này");
    err.status = 403;
    throw err;
  }

  await learnerExamRepository.saveAnswers(learnerId, answers);

  return {
    message: "Lưu đáp án thành công"
  };
};

/**
 * 4. Nộp bài + auto chấm điểm
 * - Nếu body có answers thì vừa lưu vừa chấm
 * - Nếu không có answers thì chỉ chấm dựa trên những gì đã lưu
 */
const submitExamService = async (learnerAccId, instanceId, answers) => {
  const learnerId = await getLearnerIdOrThrow(learnerAccId);

  const instance = await learnerExamRepository.getInstanceWithExam(instanceId);
  if (!instance) {
    const err = new Error("Không tìm thấy phiên thi");
    err.status = 404;
    throw err;
  }

  if (instance.ExamType !== "Exam") {
    const err = new Error("Phiên này không phải bài thi (Exam)");
    err.status = 400;
    throw err;
  }

  // Check quyền
  const hasAccess = await learnerExamRepository.checkLearnerAccessToInstance(
    instanceId,
    learnerId
  );
  if (!hasAccess) {
    const err = new Error("Bạn không có quyền nộp bài thi này");
    err.status = 403;
    throw err;
  }

  // Check thời gian
  const now = new Date();
  if (instance.StartTime && new Date(instance.StartTime) > now) {
    const err = new Error("Chưa đến giờ làm bài");
    err.status = 400;
    throw err;
  }
  if (instance.EndTime && new Date(instance.EndTime) < now) {
    const err = new Error("Đã quá hạn nộp bài");
    err.status = 400;
    throw err;
  }

  // Check đã có kết quả chưa (không cho nộp lại)
  const existingResult = await learnerExamRepository.getExistingResult(
    instance.ExamId,
    learnerId
  );
  if (existingResult) {
    const err = new Error("Bạn đã nộp bài, không thể nộp lại");
    err.status = 400;
    throw err;
  }

  // Nếu request gửi kèm answers thì lưu trước rồi mới chấm
  if (Array.isArray(answers) && answers.length > 0) {
    await learnerExamRepository.saveAnswers(learnerId, answers);
  }

  // Lấy toàn bộ submission (dùng lại hàm cho instructor)
  const submission = await instructorExamRepository.getLearnerExamSubmission(
    instance.ExamId,
    learnerId
  );

  let totalScore = 0;
  let maxScore = 0;

  for (const question of submission) {
    const point = question.Point || 0;
    maxScore += point;

    if (
      question.Type === "multiple_choice" ||
      question.Type === "true_false"
    ) {
      const learnerAnswer = (question.LearnerAnswer || "").toString().trim();
      const correctAnswer = (question.CorrectAnswer || "").toString().trim();

      if (learnerAnswer && learnerAnswer === correctAnswer) {
        totalScore += point;
      }
    }
    // Các dạng khác (fill_in_blank, matching, essay, speaking) để instructor chấm tay
  }

  const scorePercent = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  const finalScore = scorePercent.toFixed(2);

  await instructorExamRepository.saveExamResult({
    learnerId,
    examId: instance.ExamId,
    score: finalScore,
    feedback: "Chấm điểm tự động"
  });

  return {
    score: finalScore,
    maxScore,
    totalScore
  };
};

/**
 * 5. Xem kết quả 1 bài thi (instance) của learner
 */
const getExamResultService = async (learnerAccId, instanceId) => {
  const learnerId = await getLearnerIdOrThrow(learnerAccId);

  const instance = await learnerExamRepository.getInstanceWithExam(instanceId);
  if (!instance) {
    const err = new Error("Không tìm thấy phiên thi");
    err.status = 404;
    throw err;
  }

  const hasAccess = await learnerExamRepository.checkLearnerAccessToInstance(
    instanceId,
    learnerId
  );
  if (!hasAccess) {
    const err = new Error("Bạn không có quyền xem kết quả bài thi này");
    err.status = 403;
    throw err;
  }

  const result = await learnerExamRepository.getResultByExamAndLearner(
    instance.ExamId,
    learnerId
  );

  if (!result) {
    const err = new Error("Bạn chưa nộp bài hoặc chưa được chấm điểm");
    err.status = 404;
    throw err;
  }

  return {
    examId: instance.ExamId,
    examTitle: instance.ExamTitle,
    score: result.Score,
    feedback: result.Feedback,
    submissionDate: result.SubmissionDate
  };
};

/**
 * 6. Lịch sử kết quả các bài thi của learner
 */
const getHistoryService = async (learnerAccId) => {
  const learnerId = await getLearnerIdOrThrow(learnerAccId);
  const history = await learnerExamRepository.getResultsHistoryByLearner(learnerId);
  return history;
};
const retryExamService = async (learnerAccId, instanceId) => {
  const learnerId = await getLearnerIdOrThrow(learnerAccId);

  const instance = await learnerExamRepository.getInstanceWithExam(instanceId);
  if (!instance) throw { status: 404, message: "Không tìm thấy phiên thi" };

  if (instance.ExamType !== "Exam")
    throw { status: 400, message: "Đây không phải bài thi" };

  // Check learner thuộc lớp
  const hasAccess = await learnerExamRepository.checkLearnerAccessToInstance(
    instanceId,
    learnerId
  );
  if (!hasAccess) throw { status: 403, message: "Bạn không thuộc lớp này" };

  // Check thời gian
  const now = new Date();
  if (instance.StartTime && new Date(instance.StartTime) > now)
    throw { status: 400, message: "Chưa đến thời gian làm bài" };

  if (instance.EndTime && new Date(instance.EndTime) < now)
    throw { status: 400, message: "Đã quá thời gian làm bài" };

  const usedAttempt = await learnerExamRepository.countLearnerAttempts(
    instance.ExamId,
    learnerId
  );

  if (usedAttempt >= instance.Attempt)
    throw {
      status: 400,
      message: `Bạn đã dùng hết số lần làm bài (${instance.Attempt})`
    };

  // Reset trạng thái bài làm
  await learnerExamRepository.deleteLearnerAnswersForExam(instance.ExamId, learnerId);
  await learnerExamRepository.deleteLearnerLastResult(instance.ExamId, learnerId);

  return {
    message: `Bạn đã được reset bài thi. Attempt hiện tại: ${usedAttempt + 1}/${instance.Attempt}`
  };
};


module.exports = {
  getAvailableExamsService,
  getExamToDoService,
  saveExamAnswersService,
  submitExamService,
  getExamResultService,
  getHistoryService,
  retryExamService
};
