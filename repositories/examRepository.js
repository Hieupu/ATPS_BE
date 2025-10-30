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
}

module.exports = new ExamRepository();
