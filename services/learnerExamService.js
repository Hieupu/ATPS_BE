const learnerExamRepository = require("../repositories/learnerExamRepository");
const instructorExamRepository = require("../repositories/instructorExamRepository");

async function getLearnerIdOrThrow(accId) {
  const learnerId = await learnerExamRepository.getLearnerIdByAccId(accId);
  if (!learnerId) {
    const err = new Error("Không tìm thấy thông tin học viên");
    err.status = 404;
    throw err;
  }
  return learnerId;
}

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
    learnerAnswer,
  };

  if (Array.isArray(question.options)) {
    safe.options = question.options.map((opt) => ({
      optionId: opt.OptionID,
      content: opt.Content,
    }));
  } else {
    safe.options = [];
  }

  return safe;
}

function checkFillInBlankAnswer(learnerAnswer, correctAnswer) {
  if (!learnerAnswer || !correctAnswer) return false;
  const normalizedLearner = learnerAnswer.toString().toLowerCase().trim();
  const normalizedCorrect = correctAnswer.toString().toLowerCase().trim();
  return normalizedLearner === normalizedCorrect;
}

function determineSubmissionStatus(endTime) {
  if (!endTime) return "submitted";
  const now = new Date();
  const deadline = new Date(endTime);
  return now > deadline ? "late" : "submitted";
}

async function buildExamStructureForLearner(examId, randomFlag, learnerId) {
  const savedAnswers = await learnerExamRepository.getLearnerAnswersForExam(
    examId,
    learnerId
  );
  const answerMap = {};
  savedAnswers.forEach((q) => {
    answerMap[q.ExamquestionId] = q.LearnerAnswer;
  });
  const parentSections = await instructorExamRepository.getParentSectionsByExam(
    examId
  );

  for (const parent of parentSections) {
    parent.childSections =
      await instructorExamRepository.getChildSectionsByParent(parent.SectionId);

    const parentQuestions =
      await instructorExamRepository.getQuestionsBySection(
        parent.SectionId,
        randomFlag
      );
    parent.directQuestions = parentQuestions.map((q) =>
      sanitizeQuestionForLearner(q, answerMap)
    );

    for (const child of parent.childSections) {
      const childQuestions =
        await instructorExamRepository.getQuestionsBySection(
          child.SectionId,
          randomFlag
        );
      child.questions = childQuestions.map((q) =>
        sanitizeQuestionForLearner(q, answerMap)
      );
    }
  }

  return parentSections;
}

const getAvailableExamsService = async (learnerAccId) => {
  const learnerId = await getLearnerIdOrThrow(learnerAccId);
  const instances = await learnerExamRepository.getAvailableExamInstances(
    learnerId
  );
  return instances.map((inst) => ({
    instanceId: inst.InstanceId,
    examId: inst.ExamId,
    examTitle: inst.ExamTitle,
    examDescription: inst.ExamDescription,
    classId: inst.ClassId,
    className: inst.ClassName,
    startTime: inst.StartTime,
    endTime: inst.EndTime,
    status: inst.Status,
    attempt: inst.Attempt,
    usedAttempt: inst.UsedAttempt || 0,
    remainingAttempt: inst.RemainingAttempt || inst.Attempt,
    hasInProgressAnswers: inst.HasInProgressAnswers || 0,
  }));
};

const getExamToDoService = async (learnerAccId, instanceId) => {
  const learnerId = await getLearnerIdOrThrow(learnerAccId);

  const instance = await learnerExamRepository.getInstanceWithExam(instanceId);
  if (!instance) {
    const err = new Error("Không tìm thấy phiên thi");
    err.status = 404;
    throw err;
  }

  if (instance.ExamStatus !== "Published") {
    const err = new Error("Bài thi chưa được publish");
    err.status = 400;
    throw err;
  }

  const hasAccess = await learnerExamRepository.checkLearnerAccessToInstance(
    instanceId,
    learnerId
  );
  if (!hasAccess) {
    const err = new Error("Bạn không có quyền làm bài thi này");
    err.status = 403;
    throw err;
  }

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

  const usedAttempt = await learnerExamRepository.countLearnerAttempts(
    learnerId,
    instance.ExamId
  );
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
      attempt: instance.Attempt,
      usedAttempt: usedAttempt,
      remainingAttempt: instance.Attempt - usedAttempt,
    },
    sections,
  };
};

const saveExamAnswersService = async (learnerAccId, instanceId, answers) => {
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
    const err = new Error("Bạn không có quyền làm bài thi này");
    err.status = 403;
    throw err;
  }
  await learnerExamRepository.saveAnswers(learnerId, answers);
  return {
    message: "Lưu đáp án thành công",
  };
};

const submitExamService = async (
  learnerAccId,
  instanceId,
  answers,
  metadata = {}
) => {
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
    const err = new Error("Bạn không có quyền nộp bài thi này");
    err.status = 403;
    throw err;
  }

  const now = new Date();
  if (instance.StartTime && new Date(instance.StartTime) > now) {
    const err = new Error("Chưa đến giờ làm bài");
    err.status = 400;
    throw err;
  }

  const isLate = instance.EndTime && new Date(instance.EndTime) < now;
  const submissionStatus = determineSubmissionStatus(instance.EndTime);
  const usedAttempt = await learnerExamRepository.countLearnerAttempts(
    learnerId,
    instance.ExamId
  );
  if (usedAttempt >= instance.Attempt) {
    const err = new Error(
      `Bạn đã hết lượt nộp bài (${usedAttempt}/${instance.Attempt})`
    );
    err.status = 400;
    throw err;
  }
  const validAnswers = Array.isArray(answers)
    ? answers.filter((ans) => ans.examQuestionId && ans.answer !== undefined)
    : [];

  if (validAnswers.length > 0) {
    await learnerExamRepository.saveAnswers(learnerId, validAnswers);
  }

  const submission = await instructorExamRepository.getLearnerExamSubmission(
    instance.ExamId,
    learnerId
  );

  let totalScore = 0;
  let maxScore = 0;
  let autoGradedCount = 0;
  let manualGradeCount = 0;

  for (const question of submission) {
    const point = question.Point || 0;
    maxScore += point;

    if (question.Type === "multiple_choice" || question.Type === "true_false") {
      const learnerAnswer = (question.LearnerAnswer || "")
        .toString()
        .trim()
        .toLowerCase();
      const correctAnswer = (question.CorrectAnswer || "")
        .toString()
        .trim()
        .toLowerCase();

      if (learnerAnswer && learnerAnswer === correctAnswer) {
        totalScore += point;
      }
      autoGradedCount++;
    } else if (question.Type === "fill_in_blank") {
      if (
        checkFillInBlankAnswer(question.LearnerAnswer, question.CorrectAnswer)
      ) {
        totalScore += point;
      }
      autoGradedCount++;
    } else {
      manualGradeCount++;
    }
  }

  const scorePercent = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  const finalScore = scorePercent.toFixed(2);

  let feedback = "Chấm điểm tự động";
  if (isLate) {
    feedback += " [NỘP MUỘN]";
  }
  if (manualGradeCount > 0) {
    feedback += ` (${autoGradedCount} câu tự động, ${manualGradeCount} câu chờ giáo viên chấm)`;
  }

  const durationSec = metadata.durationSec || null;

  let submissionContent = null;
  if (metadata.content) {
    const cleanContent = {
      totalQuestionsAttempted:
        metadata.content.totalQuestionsAttempted || validAnswers.length,
      submittedFrom: metadata.content.submittedFrom || "web",
    };
    submissionContent = JSON.stringify(cleanContent);
  }

  const submissionId = await learnerExamRepository.createSubmission({
    learnerId,
    examId: instance.ExamId,
    status: submissionStatus,
    score: finalScore,
    feedback,
    content: submissionContent,
    durationSec,
  });

  if (metadata.assets && Array.isArray(metadata.assets)) {
    for (const asset of metadata.assets) {
      await learnerExamRepository.saveSubmissionAsset(
        submissionId,
        asset.kind,
        asset.fileURL
      );
    }
  }

  await instructorExamRepository.saveExamResult({
    learnerId,
    examId: instance.ExamId,
    score: finalScore,
    feedback,
  });

  let message = "Nộp bài thành công.";
  if (isLate) {
    message += " Bạn đã nộp muộn.";
  }
  if (manualGradeCount > 0) {
    message += " Điểm chưa hoàn chỉnh, chờ giáo viên chấm phần tự luận.";
  } else {
    message += " Đã chấm điểm hoàn toàn tự động.";
  }
  return {
    submissionId,
    score: finalScore,
    maxScore,
    totalScore,
    autoGradedCount,
    manualGradeCount,
    isLate,
    submissionStatus,
    durationSec,
    message,
  };
};

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

  const submission = await learnerExamRepository.getSubmissionByExamAndLearner(
    instance.ExamId,
    learnerId
  );

  const response = {
    examId: instance.ExamId,
    examTitle: instance.ExamTitle,
    score: result.Score,
    feedback: result.Feedback,
    submissionDate: result.SubmissionDate,
  };

  if (submission) {
    response.submissionStatus = submission.Status;
    response.durationSec = submission.DurationSec;
    response.isLate = submission.Status === "late";

    if (submission.Content) {
      try {
        response.metadata = JSON.parse(submission.Content);
      } catch (e) {
        response.metadata = null;
      }
    }
  }

  return response;
};

const getHistoryService = async (learnerAccId) => {
  const learnerId = await getLearnerIdOrThrow(learnerAccId);
  const history = await learnerExamRepository.getResultsHistoryByLearner(
    learnerId
  );
  return history;
};

const retryExamService = async (learnerAccId, instanceId) => {
  const learnerId = await getLearnerIdOrThrow(learnerAccId);

  const instance = await learnerExamRepository.getInstanceWithExam(instanceId);
  if (!instance) throw { status: 404, message: "Không tìm thấy phiên thi" };

  const hasAccess = await learnerExamRepository.checkLearnerAccessToInstance(
    instanceId,
    learnerId
  );
  if (!hasAccess) throw { status: 403, message: "Bạn không thuộc lớp này" };

  const now = new Date();
  if (instance.StartTime && new Date(instance.StartTime) > now)
    throw { status: 400, message: "Chưa đến thời gian làm bài" };

  if (instance.EndTime && new Date(instance.EndTime) < now)
    throw { status: 400, message: "Đã quá thời gian làm bài" };

  const usedAttempt = await learnerExamRepository.countLearnerAttempts(
    learnerId,
    instance.ExamId
  );

  if (usedAttempt >= instance.Attempt)
    throw {
      status: 400,
      message: `Bạn đã dùng hết số lần làm bài (${instance.Attempt})`,
    };
  await learnerExamRepository.deleteLearnerAnswersForExam(
    instance.ExamId,
    learnerId
  );
  await learnerExamRepository.deleteSubmissionByExamAndLearner(
    instance.ExamId,
    learnerId
  );

  return {
    message: `Bạn đã được reset bài thi. Attempt hiện tại: ${usedAttempt}/${instance.Attempt}`,
  };
};

const reviewExamService = async (learnerAccId, instanceId) => {
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
    const err = new Error("Bạn không có quyền xem review bài thi này");
    err.status = 403;
    throw err;
  }

  const result = await learnerExamRepository.getResultByExamAndLearner(
    instance.ExamId,
    learnerId
  );

  if (!result) {
    const err = new Error("Bạn chưa nộp bài, không thể xem review");
    err.status = 400;
    throw err;
  }

  const submissionData =
    await learnerExamRepository.getDetailedSubmissionForReview(
      instance.ExamId,
      learnerId
    );

  const sectionsMap = {};

  for (const question of submissionData) {
    const sectionId = question.SectionId;

    if (!sectionsMap[sectionId]) {
      sectionsMap[sectionId] = {
        sectionId,
        title: question.SectionTitle,
        type: question.SectionType,
        orderIndex: question.SectionOrderIndex,
        parentSectionId: question.ParentSectionId,
        FileURL: question.SectionFileURL || null,
        questions: [],
      };
    }

    let options = [];
    if (question.Type === "multiple_choice") {
      options = await learnerExamRepository.getQuestionOptionsWithCorrectAnswer(
        question.QuestionId
      );
    }

    let isCorrect = false;
    let earnedPoint = 0;

    if (question.Type === "multiple_choice" || question.Type === "true_false") {
      const learnerAns = (question.LearnerAnswer || "")
        .toString()
        .trim()
        .toLowerCase();
      const correctAns = (question.CorrectAnswer || "")
        .toString()
        .trim()
        .toLowerCase();
      isCorrect = learnerAns === correctAns;
      earnedPoint = isCorrect ? question.Point : 0;
    } else if (question.Type === "fill_in_blank") {
      isCorrect = checkFillInBlankAnswer(
        question.LearnerAnswer,
        question.CorrectAnswer
      );
      earnedPoint = isCorrect ? question.Point : 0;
    } else {
      isCorrect = null;
      earnedPoint = 0;
    }

    sectionsMap[sectionId].questions.push({
      questionId: question.QuestionId,
      examQuestionId: question.ExamquestionId,
      content: question.Content,
      type: question.Type,
      point: question.Point,
      orderIndex: question.Order_Index,
      learnerAnswer: question.LearnerAnswer,
      correctAnswer: question.CorrectAnswer,
      isCorrect,
      earnedPoint,
      options: options.map((opt) => ({
        optionId: opt.OptionID,
        content: opt.Content,
        isCorrect: opt.IsCorrect === 1,
      })),
    });
  }

  const sections = Object.values(sectionsMap).sort((a, b) => {
    if (a.parentSectionId === null && b.parentSectionId !== null) return -1;
    if (a.parentSectionId !== null && b.parentSectionId === null) return 1;
    return a.orderIndex - b.orderIndex;
  });

  const parentSections = sections.filter((s) => s.parentSectionId === null);
  const childSections = sections.filter((s) => s.parentSectionId !== null);

  let hierarchicalSections = [];

  if (parentSections.length > 0) {
    hierarchicalSections = parentSections.map((parent) => ({
      sectionId: parent.sectionId,
      title: parent.title,
      type: parent.type,
      orderIndex: parent.orderIndex,
      childSections: childSections
        .filter((child) => child.parentSectionId === parent.sectionId)
        .map((child) => ({
          childSectionId: child.sectionId,
          title: child.title,
          type: child.type,
          orderIndex: child.orderIndex,
          FileURL: child.FileURL || null,
          questions: child.questions,
        })),
    }));
  } else if (childSections.length > 0) {
    const parentIds = [...new Set(childSections.map((s) => s.parentSectionId))];
    hierarchicalSections = parentIds.map((parentId) => ({
      sectionId: parentId,
      title: `Section ${parentId}`,
      childSections: childSections
        .filter((c) => c.parentSectionId === parentId)
        .map((child) => ({
          childSectionId: child.sectionId,
          title: child.title,
          type: child.type,
          orderIndex: child.orderIndex,
          FileURL: child.FileURL || null,
          questions: child.questions,
        })),
    }));
  } else {
    hierarchicalSections = sections.map((s) => ({
      sectionId: s.sectionId,
      title: s.title,
      type: s.type,
      questions: s.questions,
    }));
  }

  const totalQuestions = submissionData.length;
  const correctAnswers = submissionData.filter((q) => {
    if (q.Type === "multiple_choice" || q.Type === "true_false") {
      return (
        (q.LearnerAnswer || "").toString().trim().toLowerCase() ===
        (q.CorrectAnswer || "").toString().trim().toLowerCase()
      );
    } else if (q.Type === "fill_in_blank") {
      return checkFillInBlankAnswer(q.LearnerAnswer, q.CorrectAnswer);
    }
    return false;
  }).length;

  const totalEarnedPoints = submissionData.reduce((sum, q) => {
    if (q.Type === "multiple_choice" || q.Type === "true_false") {
      const isCorrect =
        (q.LearnerAnswer || "").toString().trim().toLowerCase() ===
        (q.CorrectAnswer || "").toString().trim().toLowerCase();
      return sum + (isCorrect ? q.Point : 0);
    } else if (q.Type === "fill_in_blank") {
      const isCorrect = checkFillInBlankAnswer(
        q.LearnerAnswer,
        q.CorrectAnswer
      );
      return sum + (isCorrect ? q.Point : 0);
    }
    return sum;
  }, 0);

  const totalMaxPoints = submissionData.reduce((sum, q) => sum + q.Point, 0);

  const submission = await learnerExamRepository.getSubmissionByExamAndLearner(
    instance.ExamId,
    learnerId
  );

  return {
    examInfo: {
      examId: instance.ExamId,
      examTitle: instance.ExamTitle,
      examDescription: instance.ExamDescription,
    },
    resultInfo: {
      score: result.Score,
      feedback: result.Feedback,
      submissionDate: result.SubmissionDate,
      submissionStatus: submission?.Status || "submitted",
      durationSec: submission?.DurationSec || null,
      isLate: submission?.Status === "late",
    },
    sections: hierarchicalSections,
    summary: {
      totalQuestions,
      correctAnswers,
      totalEarnedPoints,
      totalMaxPoints,
      accuracy:
        totalQuestions > 0
          ? ((correctAnswers / totalQuestions) * 100).toFixed(2)
          : 0,
    },
  };
};

module.exports = {
  getAvailableExamsService,
  getExamToDoService,
  saveExamAnswersService,
  submitExamService,
  getExamResultService,
  getHistoryService,
  retryExamService,
  reviewExamService,
};
