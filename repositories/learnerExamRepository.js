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
      cl.Name        AS ClassName,
      COALESCE(attempt_count.UsedAttempt, 0) AS UsedAttempt,
      (ei.Attempt - COALESCE(attempt_count.UsedAttempt, 0)) AS RemainingAttempt,
      COALESCE(answer_count.HasAnswers, 0) AS HasInProgressAnswers,
      COALESCE(submission_check.IsSubmitted, 0) AS IsSubmitted
    FROM exam_instances ei
    JOIN exam e       ON ei.ExamId = e.ExamID
    JOIN class cl     ON ei.ClassId = cl.ClassID
    JOIN enrollment en ON cl.ClassID = en.ClassID
    LEFT JOIN (
      SELECT ExamID, COUNT(*) AS UsedAttempt
      FROM examresult
      WHERE LearnerID = ?
      GROUP BY ExamID
    ) AS attempt_count ON ei.ExamId = attempt_count.ExamID
    LEFT JOIN (
      SELECT es.ExamId, COUNT(DISTINCT ea.ExamquestionId) AS HasAnswers
      FROM examanswer ea
      JOIN examquestion eq ON ea.ExamquestionId = eq.ExamquestionId
      JOIN examsection es ON eq.SectionId = es.SectionId
      WHERE ea.LearnerID = ?
        AND ea.Answer IS NOT NULL
        AND ea.Answer != ''
        AND NOT EXISTS (
          SELECT 1 FROM submission s 
          WHERE s.ExamID = es.ExamId 
            AND s.LearnerID = ea.LearnerID
        )
      GROUP BY es.ExamId
      HAVING COUNT(DISTINCT ea.ExamquestionId) > 0
    ) AS answer_count ON ei.ExamId = answer_count.ExamId
    LEFT JOIN (
      SELECT ExamID, 1 AS IsSubmitted
      FROM examresult
      WHERE LearnerID = ?
      GROUP BY ExamID
    ) AS submission_check ON ei.ExamId = submission_check.ExamID
    WHERE 
      e.Type = 'Exam'
      AND e.Status = 'Published'
      AND en.LearnerID = ?
      AND en.Status IN ('ACTIVE', 'ONGOING', 'Enrolled')
      AND (
        ei.Status = 'Open'
        OR ei.Status = 'Closed'
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

    const [rows] = await db.query(sql, [learnerId, learnerId, learnerId, learnerId]);
    return rows;
  }

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


  async getDetailedSubmissionForReview(examId, learnerId) {
    const db = await connectDB();
    const sql = `
      SELECT 
        eq.ExamquestionId,
        eq.QuestionId,
        eq.Order_Index,
        eq.SectionId,
        q.Content,
        q.Type,
        q.CorrectAnswer,
        q.Point,
        ea.Answer AS LearnerAnswer,
        es.Title AS SectionTitle,
        es.Type AS SectionType,
        es.OrderIndex AS SectionOrderIndex,
        es.ParentSectionId,
        es.FileURL AS SectionFileURL
      FROM examquestion eq
      JOIN examsection es ON eq.SectionId = es.SectionId
      JOIN question q ON eq.QuestionId = q.QuestionID
      LEFT JOIN examanswer ea ON ea.ExamquestionId = eq.ExamquestionId 
                              AND ea.LearnerID = ?
      WHERE es.ExamId = ?
      ORDER BY 
        es.ParentSectionId IS NULL DESC,
        es.OrderIndex ASC,
        eq.Order_Index ASC
    `;
    const [rows] = await db.query(sql, [learnerId, examId]);
    return rows;
  }

  async getQuestionOptionsWithCorrectAnswer(questionId) {
    const db = await connectDB();
    const sql = `
      SELECT 
        OptionID,
        QuestionID,
        Content,
        IsCorrect
      FROM question_option
      WHERE QuestionID = ?
      ORDER BY OptionID
    `;
    const [rows] = await db.query(sql, [questionId]);
    return rows;
  }

  async createSubmission(data) {
    const db = await connectDB();
    const {
      learnerId,
      examId,
      status = 'submitted',
      score = null,
      feedback = null,
      content = null,
      durationSec = null
    } = data;

    const sql = `
      INSERT INTO submission (
        LearnerID,
        ExamID,
        SubmissionDate,
        Status,
        Score,
        Feedback,
        Content,
        DurationSec
      ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      learnerId,
      examId,
      status,
      score,
      feedback,
      content,
      durationSec
    ]);

    return result.insertId;
  }

  async updateSubmission(submissionId, data) {
    const db = await connectDB();
    const { score, feedback, status } = data;

    const updates = [];
    const values = [];

    if (score !== undefined) {
      updates.push('Score = ?');
      values.push(score);
    }
    if (feedback !== undefined) {
      updates.push('Feedback = ?');
      values.push(feedback);
    }
    if (status !== undefined) {
      updates.push('Status = ?');
      values.push(status);
    }

    if (updates.length === 0) return;

    values.push(submissionId);

    const sql = `
      UPDATE submission 
      SET ${updates.join(', ')}
      WHERE SubmissionID = ?
    `;

    await db.query(sql, values);
  }

  async getSubmissionByExamAndLearner(examId, learnerId) {
    const db = await connectDB();
    const sql = `
      SELECT * FROM submission
      WHERE ExamID = ? AND LearnerID = ?
      ORDER BY SubmissionDate DESC
      LIMIT 1
    `;
    const [rows] = await db.query(sql, [examId, learnerId]);
    return rows[0] || null;
  }

  async saveSubmissionAsset(submissionId, kind, fileURL) {
    const db = await connectDB();
    const sql = `
      INSERT INTO submission_asset (SubmissionID, Kind, FileURL)
      VALUES (?, ?, ?)
    `;
    await db.query(sql, [submissionId, kind, fileURL]);
  }

  async getSubmissionAssets(submissionId) {
    const db = await connectDB();
    const sql = `
      SELECT * FROM submission_asset
      WHERE SubmissionID = ?
    `;
    const [rows] = await db.query(sql, [submissionId]);
    return rows;
  }

  async deleteSubmissionByExamAndLearner(examId, learnerId) {
    const db = await connectDB();
    await db.query(
      `DELETE FROM submission_asset 
       WHERE SubmissionID IN (
         SELECT SubmissionID FROM submission 
         WHERE ExamID = ? AND LearnerID = ?
       )`,
      [examId, learnerId]
    );
    await db.query(
      `DELETE FROM submission WHERE ExamID = ? AND LearnerID = ?`,
      [examId, learnerId]
    );
  }
  async getLearnerAnswersForExam(examId, learnerId) {
    const db = await connectDB();
    const sql = `
    SELECT 
      ea.ExamquestionId,
      ea.Answer AS LearnerAnswer
    FROM examanswer ea
    JOIN examquestion eq ON ea.ExamquestionId = eq.ExamquestionId
    JOIN examsection es ON eq.SectionId = es.SectionId
    WHERE es.ExamId = ? AND ea.LearnerID = ?
      AND ea.Answer IS NOT NULL
      AND ea.Answer != ''
  `;
    const [rows] = await db.query(sql, [examId, learnerId]);
    return rows;
  }
}

module.exports = new LearnerExamRepository();