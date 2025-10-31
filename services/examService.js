const examRepository = require("../repositories/examRepository");
const connectDB = require("../config/db");

class ExamService {
  async listByCourse(courseId) {
    return await examRepository.getExamsByCourse(courseId);
  }

  async getQuestions(examId) {
    return await examRepository.getExamQuestions(examId);
  }

  async submitResult(accId, examId, answers) {
    // Map account to learner
    const db = await connectDB();
    const [rows] = await db.query(
      "SELECT LearnerID FROM learner WHERE AccID = ?",
      [accId]
    );
    const learnerId = rows?.[0]?.LearnerID;
    if (!learnerId) throw new Error("Learner not found for this account");

    const questions = await examRepository.getExamQuestions(examId);
    const idToCorrect = new Map(
      questions.map((q) => [
        q.QuestionID,
        (q.CorrectAnswer || "").trim().toLowerCase(),
      ])
    );
    let correct = 0;
    (answers || []).forEach((a) => {
      const expected = idToCorrect.get(a.questionId);
      if (expected != null) {
        const given = String(a.answer ?? "")
          .trim()
          .toLowerCase();
        if (given === expected) correct++;
      }
    });
    const total = questions.length || 1;
    const score = Number(((correct / total) * 100).toFixed(2));
    const feedback = `Đúng ${correct}/${total} câu.`;
    const created = await examRepository.upsertExamResult({
      learnerId,
      examId,
      score,
      feedback,
    });
    return created;
  }

  async getLatestResult(accId, examId) {
    const db = await connectDB();
    const [rows] = await db.query(
      "SELECT LearnerID FROM learner WHERE AccID = ?",
      [accId]
    );
    const learnerId = rows?.[0]?.LearnerID;
    if (!learnerId) throw new Error("Learner not found for this account");
    return await examRepository.getLatestResultByLearnerExam(learnerId, examId);
  }
}

module.exports = new ExamService();
