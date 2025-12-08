const connectDB = require("../config/db");

class LearnerExamRepository {
    async getLearnerIdByAccId(accId) {
        const db = await connectDB();
        const [rows] = await db.query(
            "SELECT LearnerID FROM learner WHERE AccID = ?",
            [accId]
        );
        return rows.length > 0 ? rows[0].LearnerID : null;
    }

    /**
     * Lấy các exam instance (type = Exam) đang mở cho learner
     * Chỉ lấy các phiên thi của lớp mà learner đang ENROLLED
     */
    async getAvailableExamInstances(learnerId) {
        const db = await connectDB();

        const sql = `
      SELECT 
        ei.InstanceId,
        ei.ExamId,
        ei.ClassId,
        ei.StartTime,
        ei.EndTime,
        ei.Status,
        ei.isRandomQuestion AS IsRandomQuestion,
        ei.isRandomAnswer  AS IsRandomAnswer,
        ei.Attempt,
        e.Title        AS ExamTitle,
        e.Description  AS ExamDescription,
        e.Type         AS ExamType,
        e.Status       AS ExamStatus,
        cl.Name        AS ClassName
      FROM exam_instances ei
      JOIN exam e       ON ei.ExamId = e.ExamID
      JOIN class cl     ON ei.ClassId = cl.ClassID
      JOIN enrollment en ON cl.ClassID = en.ClassID
      WHERE 
        e.Type = 'Exam'
        AND e.Status = 'Published'
        AND en.LearnerID = ?
        AND en.Status IN ('ACTIVE', 'ONGOING', 'Enrolled')
        AND (
          ei.Status = 'Open'
          OR (
            ei.Status = 'Scheduled'
            AND (ei.StartTime IS NULL OR ei.StartTime <= NOW())
            AND (ei.EndTime   IS NULL OR ei.EndTime   >= NOW())
          )
        )
      ORDER BY 
        ei.StartTime IS NULL,
        ei.StartTime ASC
    `;

        const [rows] = await db.query(sql, [learnerId]);
        return rows;
    }

    /**
     * Lấy thông tin instance + exam cơ bản
     */
    async getInstanceWithExam(instanceId) {
        const db = await connectDB();
        const sql = `
      SELECT 
        ei.InstanceId,
        ei.ExamId,
        ei.ClassId,
        ei.UnitId,
        ei.StartTime,
        ei.EndTime,
        ei.Status,
        ei.isRandomQuestion AS IsRandomQuestion,
        ei.isRandomAnswer  AS IsRandomAnswer,
        ei.Attempt,
        e.Title        AS ExamTitle,
        e.Description  AS ExamDescription,
        e.Type         AS ExamType,
        e.Status       AS ExamStatus
      FROM exam_instances ei
      JOIN exam e ON ei.ExamId = e.ExamID
      WHERE ei.InstanceId = ?
    `;
        const [rows] = await db.query(sql, [instanceId]);
        return rows[0] || null;
    }

    /**
     * Check learner có thuộc lớp của instance này không
     */
    async checkLearnerAccessToInstance(instanceId, learnerId) {
        const db = await connectDB();
        const sql = `
      SELECT COUNT(*) AS cnt
      FROM exam_instances ei
      JOIN class cl      ON ei.ClassId = cl.ClassID
      JOIN enrollment en ON cl.ClassID = en.ClassID
      WHERE 
        ei.InstanceId = ?
        AND en.LearnerID = ?
        AND en.Status IN ('ACTIVE', 'ONGOING', 'Enrolled')
    `;
        const [rows] = await db.query(sql, [instanceId, learnerId]);
        return rows[0].cnt > 0;
    }

    /**
     * Lưu nhiều answer cho learner (upsert theo composite PK LearnerID+ExamquestionId)
     * answers: [{ examQuestionId, answer }]
     */
    async saveAnswers(learnerId, answers = []) {
        if (!Array.isArray(answers) || answers.length === 0) return;

        const db = await connectDB();
        const sql = `
      INSERT INTO examanswer (LearnerID, ExamquestionId, Answer)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        Answer = VALUES(Answer)
    `;

        const promises = answers.map(ans =>
            db.query(sql, [
                learnerId,
                ans.examQuestionId,
                ans.answer ?? null
            ])
        );

        await Promise.all(promises);
    }

    /**
     * Kiểm tra đã có examresult hay chưa (để chặn nộp lại)
     */
    async getExistingResult(examId, learnerId) {
        const db = await connectDB();
        const [rows] = await db.query(
            `SELECT ResultID, Score, SubmissionDate 
       FROM examresult 
       WHERE ExamID = ? AND LearnerID = ?
       ORDER BY SubmissionDate DESC
       LIMIT 1`,
            [examId, learnerId]
        );
        return rows[0] || null;
    }

    /**
     * Lấy kết quả thi 1 exam của learner
     */
    async getResultByExamAndLearner(examId, learnerId) {
        const db = await connectDB();
        const [rows] = await db.query(
            `SELECT * FROM examresult 
       WHERE ExamID = ? AND LearnerID = ?
       ORDER BY SubmissionDate DESC
       LIMIT 1`,
            [examId, learnerId]
        );
        return rows[0] || null;
    }

    /**
     * Lịch sử các kết quả thi của learner
     */
    async getResultsHistoryByLearner(learnerId) {
        const db = await connectDB();
        const sql = `
      SELECT 
        er.ResultID,
        er.Score,
        er.SubmissionDate,
        er.Feedback,
        e.ExamID,
        e.Title      AS ExamTitle,
        e.Type       AS ExamType
      FROM examresult er
      JOIN exam e ON er.ExamID = e.ExamID
      WHERE er.LearnerID = ?
      ORDER BY er.SubmissionDate DESC
    `;
        const [rows] = await db.query(sql, [learnerId]);
        return rows;
    }
  async deleteLearnerAnswersForExam(examId, learnerId) {
    const db = await connectDB();
    const sql = `
        DELETE ea
        FROM examanswer ea
        JOIN examquestion eq ON ea.ExamquestionId = eq.ExamquestionId
        JOIN examsection es ON eq.SectionId = es.SectionId
        WHERE es.ExamId = ? AND ea.LearnerID = ?
    `;
    await db.query(sql, [examId, learnerId]);
}


    async deleteLearnerLastResult(examId, learnerId) {
        const db = await connectDB();
        const sql = `
    DELETE FROM examresult
    WHERE ExamID = ? AND LearnerID = ?
    ORDER BY SubmissionDate DESC
    LIMIT 1;
  `;
        await db.query(sql, [examId, learnerId]);
    }

    async countLearnerAttempts(learnerId, examId) {
    const db = await connectDB();
    const sql = `
        SELECT COUNT(*) AS attempts
        FROM examresult
        WHERE LearnerID = ? AND ExamID = ?
    `;
    const [rows] = await db.query(sql, [learnerId, examId]);
    return rows[0]?.attempts || 0;
}


}

module.exports = new LearnerExamRepository();
