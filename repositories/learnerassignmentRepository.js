const connectDB = require("../config/db");

class LearnerAssignmentRepository {
  async getAssignmentById(assignmentId, learnerId) {
    try {
      const db = await connectDB();
      
      const [assignments] = await db.query(
        `SELECT 
          a.*,
          u.CourseID,
          s.SubmissionID,
          s.Score,
          s.Status as SubmissionStatus
         FROM assignment a
         INNER JOIN unit u ON a.UnitID = u.UnitID
         LEFT JOIN submission s ON a.AssignmentID = s.AssignmentID AND s.LearnerID = ?
         WHERE a.AssignmentID = ? AND a.Status = 'active'`,
        [learnerId, assignmentId]
      );

      return assignments[0] || null;
    } catch (error) {
      console.error("Database error in getAssignmentById:", error);
      throw error;
    }
  }

async getAssignmentQuestions(assignmentId) {
  try {
    const db = await connectDB();
    
    // Lấy tất cả questions với options trong 1 query
    const [rows] = await db.query(
      `SELECT 
        q.*,
        aq.AssignmentQuestionId,
        qo.OptionID,
        qo.Content as OptionContent,
        qo.IsCorrect
       FROM question q
       INNER JOIN assignment_question aq ON q.QuestionID = aq.QuestionID
       LEFT JOIN question_option qo ON q.QuestionID = qo.QuestionID
       WHERE aq.AssignmentID = ? AND q.Status = 'Active'
       ORDER BY aq.AssignmentQuestionId, qo.OptionID`,
      [assignmentId]
    );

    // Group options by question
    const questionsMap = new Map();
    rows.forEach(row => {
      if (!questionsMap.has(row.QuestionID)) {
        questionsMap.set(row.QuestionID, {
          QuestionID: row.QuestionID,
          AssignmentQuestionId: row.AssignmentQuestionId,
          Content: row.Content,
          Type: row.Type,
          CorrectAnswer: row.CorrectAnswer,
          Topic: row.Topic,
          Level: row.Level,
          Point: row.Point,
          Status: row.Status,
          Options: []
        });
      }
      
      // Chỉ thêm Options cho multiple_choice và true_false
      if (row.OptionID && (row.Type === 'multiple_choice' || row.Type === 'true_false')) {
        questionsMap.get(row.QuestionID).Options.push({
          OptionID: row.OptionID,
          Content: row.OptionContent,
          IsCorrect: row.IsCorrect
        });
      }
    });

    return Array.from(questionsMap.values());
  } catch (error) {
    console.error("Database error in getAssignmentQuestions:", error);
    throw error;
  }
}

async getAssignmentQuestionById(assignmentQuestionId) {
  try {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT * FROM assignment_question WHERE AssignmentQuestionId = ?`,
      [assignmentQuestionId]
    );
    return rows[0] || null;
  } catch (error) {
    console.error("Database error in getAssignmentQuestionById:", error);
    throw error;
  }
}

  async getQuestionOptions(questionId) {
    try {
      const db = await connectDB();
      
      const [options] = await db.query(
        `SELECT * FROM question_option WHERE QuestionID = ?`,
        [questionId]
      );

      return options;
    } catch (error) {
      console.error("Database error in getQuestionOptions:", error);
      throw error;
    }
  }

  async getCorrectOption(questionId) {
    try {
      const db = await connectDB();
      
      const [options] = await db.query(
        `SELECT * FROM question_option WHERE QuestionID = ? AND IsCorrect = 1`,
        [questionId]
      );

      return options[0] || null;
    } catch (error) {
      console.error("Database error in getCorrectOption:", error);
      throw error;
    }
  }

  async getQuestionById(questionId) {
    try {
      const db = await connectDB();
      
      const [questions] = await db.query(
        `SELECT * FROM question WHERE QuestionID = ?`,
        [questionId]
      );

      return questions[0] || null;
    } catch (error) {
      console.error("Database error in getQuestionById:", error);
      throw error;
    }
  }

  async createSubmission(submissionData) {
    try {
      const db = await connectDB();
      
      const [result] = await db.query(
        `INSERT INTO submission 
         (SubmissionDate, FileURL, Score, Feedback, LearnerID, AssignmentID, Content, AudioURL, DurationSec, Status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          submissionData.submissionDate,
          submissionData.fileURL || null,
          submissionData.score || null,
             submissionData.feedback || '',
          submissionData.learnerId,
          submissionData.assignmentId,
          submissionData.content || null,
          submissionData.audioURL || null,
          submissionData.durationSec || null,
          submissionData.status
        ]
      );

      return await this.getSubmissionById(result.insertId, submissionData.learnerId);
    } catch (error) {
      console.error("Database error in createSubmission:", error);
      throw error;
    }
  }

  async createSubmissionAsset(assetData) {
    try {
      const db = await connectDB();
      
      const [result] = await db.query(
        `INSERT INTO submission_asset (SubmissionID, Kind, FileURL) VALUES (?, ?, ?)`,
        [assetData.submissionId, assetData.kind, assetData.fileURL]
      );

      return result.insertId;
    } catch (error) {
      console.error("Database error in createSubmissionAsset:", error);
      throw error;
    }
  }


// repositories/learnerassignmentRepository.js
async saveAssignmentAnswer(answerData) {
  try {
    const db = await connectDB();
    
    console.log("Saving assignment answer:", answerData);
    
    if (!answerData.assignmentQuestionId) {
      console.error("AssignmentQuestionId is null or undefined");
      return;
    }

    // ✅ SỬ DỤNG INSERT ... ON DUPLICATE KEY UPDATE
    const [result] = await db.query(
      `INSERT INTO assignmentanswer (LearnerId, AssignmentQuestionId, Answer) 
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE Answer = VALUES(Answer)`,
      [
        answerData.learnerId,
        answerData.assignmentQuestionId,
        answerData.answer || null
      ]
    );

    console.log("Save answer result:", result);
    
    if (result.affectedRows === 2) {
      console.log("Record was updated (duplicate key)");
      return "updated";
    } else if (result.affectedRows === 1) {
      console.log("Record was inserted");
      return result.insertId;
    }
    
    return result;
  } catch (error) {
    console.error("Database error in saveAssignmentAnswer:", error);
    throw error;
  }
}

  async getSubmissionByAssignmentAndLearner(assignmentId, learnerId) {
    try {
      const db = await connectDB();
      
      const [submissions] = await db.query(
        `SELECT * FROM submission WHERE AssignmentID = ? AND LearnerID = ?`,
        [assignmentId, learnerId]
      );

      return submissions[0] || null;
    } catch (error) {
      console.error("Database error in getSubmissionByAssignmentAndLearner:", error);
      throw error;
    }
  }

  async getSubmissionById(submissionId, learnerId) {
    try {
      const db = await connectDB();
      
      const [submissions] = await db.query(
        `SELECT 
          s.*,
          a.*,
          u.CourseID
         FROM submission s
         INNER JOIN assignment a ON s.AssignmentID = a.AssignmentID
         INNER JOIN unit u ON a.UnitID = u.UnitID
         WHERE s.SubmissionID = ? AND s.LearnerID = ?`,
        [submissionId, learnerId]
      );

      return submissions[0] || null;
    } catch (error) {
      console.error("Database error in getSubmissionById:", error);
      throw error;
    }
  }

  async getSubmissionAssets(submissionId) {
    try {
      const db = await connectDB();
      
      const [assets] = await db.query(
        `SELECT * FROM submission_asset WHERE SubmissionID = ?`,
        [submissionId]
      );

      return assets;
    } catch (error) {
      console.error("Database error in getSubmissionAssets:", error);
      throw error;
    }
  }

  async getSubmissionAnswers(submissionId, learnerId) {
    try {
      const db = await connectDB();
      
      const [answers] = await db.query(
        `SELECT 
          aa.*,
          aq.QuestionID,
          q.Content as QuestionContent,
          q.Type as QuestionType,
          q.CorrectAnswer
         FROM assignmentanswer aa
         INNER JOIN assignment_question aq ON aa.AssignmentQuestionId = aq.AssignmentQuestionId
         INNER JOIN question q ON aq.QuestionID = q.QuestionID
         INNER JOIN submission s ON aq.AssignmentID = s.AssignmentID
         WHERE s.SubmissionID = ? AND aa.LearnerId = ?`,
        [submissionId, learnerId]
      );

      return answers;
    } catch (error) {
      console.error("Database error in getSubmissionAnswers:", error);
      throw error;
    }
  }

  async getAssignmentQuestionsWithCorrectAnswers(assignmentId) {
    try {
      const db = await connectDB();
      
      const [questions] = await db.query(
        `SELECT 
          q.*,
          aq.AssignmentQuestionId,
          qo.OptionID,
          qo.Content as OptionContent,
          qo.IsCorrect
         FROM question q
         INNER JOIN assignment_question aq ON q.QuestionID = aq.QuestionID
         LEFT JOIN question_option qo ON q.QuestionID = qo.QuestionID
         WHERE aq.AssignmentID = ? AND q.Status = 'Active'
         ORDER BY aq.AssignmentQuestionId, qo.OptionID`,
        [assignmentId]
      );

      // Group options by question
      const questionsMap = new Map();
      questions.forEach(row => {
        if (!questionsMap.has(row.QuestionID)) {
          questionsMap.set(row.QuestionID, {
            ...row,
            Options: []
          });
        }
        
        if (row.OptionID) {
          questionsMap.get(row.QuestionID).Options.push({
            OptionID: row.OptionID,
            Content: row.OptionContent,
            IsCorrect: row.IsCorrect
          });
        }
      });

      return Array.from(questionsMap.values());
    } catch (error) {
      console.error("Database error in getAssignmentQuestionsWithCorrectAnswers:", error);
      throw error;
    }
  }
}

module.exports = new LearnerAssignmentRepository();