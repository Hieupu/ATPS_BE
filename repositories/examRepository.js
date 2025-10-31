const connectDB = require("../config/db");

class ExamRepository {
  async getExamsByCourse(courseId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT ExamID, CourseID, Title, Description, StartTime, EndTime, Status
       FROM exam WHERE CourseID = ? ORDER BY StartTime ASC`,
      [courseId]
    );
    return rows;
  }

  async getExamQuestions(examId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT q.QuestionID, q.Content, q.Type, q.CorrectAnswer
       FROM examquestion eq JOIN question q ON eq.QuestionID = q.QuestionID
       WHERE eq.ExamID = ? ORDER BY q.QuestionID`,
      [examId]
    );
    return rows;
  }

  async createExamResult({ learnerId, examId, score, feedback }) {
    const db = await connectDB();
    const [result] = await db.query(
      `INSERT INTO examresult (Score, Feedback, SubmissionDate, LearnerID, ExamID)
       VALUES (?, ?, NOW(), ?, ?)`,
      [score, feedback || null, learnerId, examId]
    );
    return {
      ResultID: result.insertId,
      Score: score,
      Feedback: feedback,
      ExamID: examId,
      LearnerID: learnerId,
    };
  }

  async getLatestResultByLearnerExam(learnerId, examId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT ResultID, Score, Feedback, SubmissionDate, LearnerID, ExamID
       FROM examresult
       WHERE LearnerID = ? AND ExamID = ?
       ORDER BY SubmissionDate DESC, ResultID DESC
       LIMIT 1`,
      [learnerId, examId]
    );
    return rows?.[0] || null;
  }

  async upsertExamResult({ learnerId, examId, score, feedback }) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT ResultID FROM examresult WHERE LearnerID = ? AND ExamID = ? LIMIT 1`,
      [learnerId, examId]
    );
    if (rows && rows.length > 0) {
      const resultId = rows[0].ResultID;
      await db.query(
        `UPDATE examresult SET Score = ?, Feedback = ?, SubmissionDate = NOW() WHERE ResultID = ?`,
        [score, feedback || null, resultId]
      );
      const [updated] = await db.query(
        `SELECT ResultID, Score, Feedback, SubmissionDate, LearnerID, ExamID FROM examresult WHERE ResultID = ?`,
        [resultId]
      );
      return updated?.[0] || null;
    }
    return await this.createExamResult({ learnerId, examId, score, feedback });
  }
}

module.exports = new ExamRepository();
