const connectDB = require("../config/db");

class InstructorExamRepository {
  // ==================== EXAM CRUD ====================
  
  /**
   * Tạo exam mới (CẬP NHẬT: thêm isRandomQuestion, isRandomAnswer)
   */
  async createExam(data) {
    const db = await connectDB();
    const sql = `
      INSERT INTO exam (CourseID, Title, Description, StartTime, EndTime, Status, isRandomQuestion, isRandomAnswer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      data.courseId,
      data.title,
      data.description,
      data.startTime,
      data.endTime,
      data.status || 'Pending',
      data.isRandomQuestion || 0,
      data.isRandomAnswer || 0
    ]);
    return result.insertId;
  }

  /**
   * Cập nhật exam (CẬP NHẬT: thêm random fields)
   */
  async updateExam(examId, data) {
    const db = await connectDB();
    const sql = `
      UPDATE exam 
      SET Title = ?, Description = ?, StartTime = ?, EndTime = ?, Status = ?,
          isRandomQuestion = ?, isRandomAnswer = ?
      WHERE ExamID = ?
    `;
    const [result] = await db.query(sql, [
      data.title,
      data.description,
      data.startTime,
      data.endTime,
      data.status,
      data.isRandomQuestion,
      data.isRandomAnswer,
      examId
    ]);
    return result.affectedRows > 0;
  }

  /**
   * Lấy danh sách exam của instructor
   */
  async getExamsByInstructor(instructorId, filters = {}) {
    const db = await connectDB();
    let sql = `
      SELECT 
        e.ExamID, e.Title, e.Description, e.StartTime, e.EndTime, e.Status,
        e.isRandomQuestion, e.isRandomAnswer,
        c.Title as CourseName, c.CourseID,
        COUNT(DISTINCT es.SectionId) as TotalSections,
        COUNT(DISTINCT eq.QuestionId) as TotalQuestions,
        COUNT(DISTINCT ec.classId) as TotalClasses
      FROM exam e
      JOIN course c ON e.CourseID = c.CourseID
      LEFT JOIN examsection es ON e.ExamID = es.ExamId
      LEFT JOIN examquestion eq ON es.SectionId = eq.SectionId
      LEFT JOIN exam_class ec ON e.ExamID = ec.examId
      WHERE c.InstructorID = ?
    `;
    
    const params = [instructorId];
    
    if (filters.status) {
      sql += ` AND e.Status = ?`;
      params.push(filters.status);
    }
    
    if (filters.courseId) {
      sql += ` AND e.CourseID = ?`;
      params.push(filters.courseId);
    }
    
    sql += ` GROUP BY e.ExamID ORDER BY e.StartTime DESC`;
    
    const [rows] = await db.query(sql, params);
    return rows;
  }

  /**
   * Lấy chi tiết exam
   */
  async getExamById(examId) {
    const db = await connectDB();
    const sql = `
      SELECT 
        e.*,
        c.Title as CourseName, c.InstructorID
      FROM exam e
      JOIN course c ON e.CourseID = c.CourseID
      WHERE e.ExamID = ?
    `;
    const [rows] = await db.query(sql, [examId]);
    return rows[0] || null;
  }

  /**
   * Xóa exam (soft delete)
   */
  async deleteExam(examId) {
    const db = await connectDB();
    const sql = `UPDATE exam SET Status = 'Cancelled' WHERE ExamID = ?`;
    const [result] = await db.query(sql, [examId]);
    return result.affectedRows > 0;
  }

  // ==================== EXAM SECTION MANAGEMENT (MỚI) ====================

  /**
   * Tạo section cho exam
   */
  async createExamSection(examId, sectionData) {
    const db = await connectDB();
    const sql = `
      INSERT INTO examsection (ExamId, Type, OrderIndex)
      VALUES (?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      examId,
      sectionData.type,
      sectionData.orderIndex
    ]);
    return result.insertId;
  }

  /**
   * Cập nhật section
   */
  async updateExamSection(sectionId, sectionData) {
    const db = await connectDB();
    const sql = `
      UPDATE examsection 
      SET Type = ?, OrderIndex = ?
      WHERE SectionId = ?
    `;
    const [result] = await db.query(sql, [
      sectionData.type,
      sectionData.orderIndex,
      sectionId
    ]);
    return result.affectedRows > 0;
  }

  /**
   * Xóa section
   */
  async deleteExamSection(sectionId) {
    const db = await connectDB();
    const sql = `DELETE FROM examsection WHERE SectionId = ?`;
    const [result] = await db.query(sql, [sectionId]);
    return result.affectedRows > 0;
  }

  /**
   * Lấy danh sách sections của exam
   */
  async getSectionsByExam(examId) {
    const db = await connectDB();
    const sql = `
      SELECT 
        es.SectionId, es.Type, es.OrderIndex,
        COUNT(eq.QuestionId) as TotalQuestions
      FROM examsection es
      LEFT JOIN examquestion eq ON es.SectionId = eq.SectionId
      WHERE es.ExamId = ?
      GROUP BY es.SectionId
      ORDER BY es.OrderIndex
    `;
    const [rows] = await db.query(sql, [examId]);
    return rows;
  }

  /**
   * Lấy section by ID
   */
  async getSectionById(sectionId) {
    const db = await connectDB();
    const sql = `SELECT * FROM examsection WHERE SectionId = ?`;
    const [rows] = await db.query(sql, [sectionId]);
    return rows[0] || null;
  }

  // ==================== EXAM-CLASS MANAGEMENT ====================

  async assignExamToClasses(examId, classIds, startTime, endTime) {
    const db = await connectDB();
    const sql = `
      INSERT INTO exam_class (examId, classId, status, start_time, end_time)
      VALUES (?, ?, 'in_progress', ?, ?)
    `;
    
    const promises = classIds.map(classId => 
      db.query(sql, [examId, classId, startTime, endTime])
    );
    
    await Promise.all(promises);
  }

  async updateExamClassTime(examId, classId, startTime, endTime) {
    const db = await connectDB();
    const sql = `
      UPDATE exam_class 
      SET start_time = ?, end_time = ?
      WHERE examId = ? AND classId = ?
    `;
    const [result] = await db.query(sql, [startTime, endTime, examId, classId]);
    return result.affectedRows > 0;
  }

  async getClassesByExam(examId) {
    const db = await connectDB();
    const sql = `
      SELECT 
        ec.*, 
        cl.Name as ClassName,
        cl.Maxstudent,
        COUNT(DISTINCT en.LearnerID) as TotalStudents
      FROM exam_class ec
      JOIN class cl ON ec.classId = cl.ClassID
      LEFT JOIN enrollment en ON cl.ClassID = en.ClassID
      WHERE ec.examId = ?
      GROUP BY ec.classId
    `;
    const [rows] = await db.query(sql, [examId]);
    return rows;
  }

  // ==================== QUESTION MANAGEMENT ====================

  async createQuestion(data) {
    const db = await connectDB();
    const sql = `
      INSERT INTO question (Content, Type, CorrectAnswer, InstructorID, Status, Topic, Level, Point)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      data.content,
      data.type || "multiple_choice",
      data.correctAnswer,
      data.instructorId,
      data.status || "Active",
      data.topic || null,
      data.level || "Medium",
      data.point || 1
    ]);
    return result.insertId;
  }

  async createQuestionOptions(questionId, options) {
    const db = await connectDB();
    const sql = `
      INSERT INTO question_option (QuestionID, Content, IsCorrect)
      VALUES (?, ?, ?)
    `;
    
    const promises = options.map(opt => 
      db.query(sql, [questionId, opt.content, opt.isCorrect ? 1 : 0])
    );
    
    await Promise.all(promises);
  }

  async getQuestionsByInstructor(instructorId, filters = {}) {
    const db = await connectDB();
    let sql = `
      SELECT q.*, 
             COUNT(qo.OptionID) as TotalOptions
      FROM question q
      LEFT JOIN question_option qo ON q.QuestionID = qo.QuestionID
      WHERE q.InstructorID = ?
    `;
    
    const params = [instructorId];
    
    if (filters.topic) {
      sql += ` AND q.Topic = ?`;
      params.push(filters.topic);
    }
    
    if (filters.level) {
      sql += ` AND q.Level = ?`;
      params.push(filters.level);
    }
    
    if (filters.type) {
      sql += ` AND q.Type = ?`;
      params.push(filters.type);
    }
    
    sql += ` GROUP BY q.QuestionID ORDER BY q.QuestionID DESC`;
    
    const [rows] = await db.query(sql, params);
    return rows;
  }

  async getQuestionById(questionId) {
    const db = await connectDB();
    
    const [questions] = await db.query(
      `SELECT * FROM question WHERE QuestionID = ?`,
      [questionId]
    );
    
    if (!questions.length) return null;
    
    const question = questions[0];
    
    if (question.Type === 'multiple_choice') {
      const [options] = await db.query(
        `SELECT * FROM question_option WHERE QuestionID = ? ORDER BY OptionID`,
        [questionId]
      );
      question.options = options;
    }
    
    return question;
  }

  async updateQuestion(questionId, data) {
    const db = await connectDB();
    const sql = `
      UPDATE question 
      SET Content = ?, Type = ?, CorrectAnswer = ?, Topic = ?, 
          Level = ?, Point = ?, Status = ?
      WHERE QuestionID = ?
    `;
    const [result] = await db.query(sql, [
      data.content,
      data.type,
      data.correctAnswer,
      data.topic,
      data.level,
      data.point,
      data.status,
      questionId
    ]);
    return result.affectedRows > 0;
  }

  async deleteQuestion(questionId) {
    const db = await connectDB();
    const sql = `UPDATE question SET Status = 'Inactive' WHERE QuestionID = ?`;
    const [result] = await db.query(sql, [questionId]);
    return result.affectedRows > 0;
  }

  // ==================== SECTION-QUESTION MANAGEMENT (CẬP NHẬT) ====================

  /**
   * Thêm câu hỏi vào section
   */
  async addQuestionToSection(sectionId, questionId) {
    const db = await connectDB();
    const sql = `
      INSERT INTO examquestion (SectionId, QuestionId)
      VALUES (?, ?)
    `;
    const [result] = await db.query(sql, [sectionId, questionId]);
    return result.insertId;
  }

  /**
   * Thêm nhiều câu hỏi vào section
   */
  async addQuestionsToSection(sectionId, questionIds) {
    const db = await connectDB();
    const sql = `
      INSERT INTO examquestion (SectionId, QuestionId)
      VALUES (?, ?)
    `;
    
    const promises = questionIds.map(qId => 
      db.query(sql, [sectionId, qId])
    );
    
    await Promise.all(promises);
  }

  /**
   * Xóa câu hỏi khỏi section
   */
  async removeQuestionFromSection(sectionId, questionId) {
    const db = await connectDB();
    const sql = `
      DELETE FROM examquestion 
      WHERE SectionId = ? AND QuestionId = ?
    `;
    const [result] = await db.query(sql, [sectionId, questionId]);
    return result.affectedRows > 0;
  }

  /**
   * Lấy danh sách câu hỏi trong section (CÓ HỖ TRỢ RANDOM)
   */
  async getQuestionsBySection(sectionId, isRandomQuestion = false) {
    const db = await connectDB();
    let sql = `
      SELECT q.*, eq.ExamquestionId
      FROM examquestion eq
      JOIN question q ON eq.QuestionId = q.QuestionID
      WHERE eq.SectionId = ?
    `;
    
    // Nếu random question, dùng ORDER BY RAND()
    if (isRandomQuestion) {
      sql += ` ORDER BY RAND()`;
    } else {
      sql += ` ORDER BY eq.ExamquestionId`;
    }
    
    const [rows] = await db.query(sql, [sectionId]);
    
    // Lấy options cho các câu hỏi multiple choice
    for (const question of rows) {
      if (question.Type === 'multiple_choice') {
        let optionsSql = `
          SELECT * FROM question_option 
          WHERE QuestionID = ?
        `;
        
        // Nếu random answer, dùng ORDER BY RAND()
        if (isRandomQuestion) {
          optionsSql += ` ORDER BY RAND()`;
        } else {
          optionsSql += ` ORDER BY OptionID`;
        }
        
        const [options] = await db.query(optionsSql, [question.QuestionID]);
        question.options = options;
      }
    }
    
    return rows;
  }

  /**
   * Lấy tất cả sections + questions của exam (CÓ HỖ TRỢ RANDOM)
   */
  async getExamWithSections(examId, isRandomQuestion = false, isRandomAnswer = false) {
    const db = await connectDB();
    
    // Lấy exam info
    const exam = await this.getExamById(examId);
    if (!exam) return null;
    
    // Lấy sections
    const sections = await this.getSectionsByExam(examId);
    
    // Lấy questions cho mỗi section
    for (const section of sections) {
      section.questions = await this.getQuestionsBySection(
        section.SectionId, 
        isRandomQuestion
      );
      
      // Nếu random answer, shuffle options
      if (isRandomAnswer) {
        for (const question of section.questions) {
          if (question.options && question.options.length > 0) {
            question.options = this.shuffleArray(question.options);
          }
        }
      }
    }
    
    exam.sections = sections;
    return exam;
  }

  /**
   * Helper: Shuffle array
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // ==================== EXAM RESULTS & GRADING ====================

  async getExamResultsByClass(examId, classId) {
    const db = await connectDB();
    const sql = `
      SELECT 
        l.LearnerID, l.FullName, l.ProfilePicture,
        er.ResultID, er.Score, er.SubmissionDate, er.Feedback,
        CASE 
          WHEN er.ResultID IS NULL THEN 'not_submitted'
          WHEN er.Score IS NULL THEN 'submitted'
          ELSE 'graded'
        END as Status
      FROM enrollment en
      JOIN learner l ON en.LearnerID = l.LearnerID
      LEFT JOIN examresult er ON l.LearnerID = er.LearnerID AND er.ExamID = ?
      WHERE en.ClassID = ?
      ORDER BY l.FullName
    `;
    const [rows] = await db.query(sql, [examId, classId]);
    return rows;
  }

  async getLearnerExamSubmission(examId, learnerId) {
    const db = await connectDB();
    const sql = `
      SELECT 
        q.QuestionID, q.Content, q.Type, q.Point, q.CorrectAnswer,
        es.SectionId, es.Type as SectionType, es.OrderIndex,
        eq.ExamquestionId,
        ea.Answer as LearnerAnswer
      FROM examsection es
      JOIN examquestion eq ON es.SectionId = eq.SectionId
      JOIN question q ON eq.QuestionId = q.QuestionID
      LEFT JOIN examanswer ea ON eq.ExamquestionId = ea.ExamquestionId 
                              AND ea.LearnerID = ?
      WHERE es.ExamId = ?
      ORDER BY es.OrderIndex, eq.ExamquestionId
    `;
    const [rows] = await db.query(sql, [learnerId, examId]);
    
    // Lấy options cho câu hỏi multiple choice
    for (const question of rows) {
      if (question.Type === 'multiple_choice') {
        const [options] = await db.query(
          `SELECT * FROM question_option WHERE QuestionID = ? ORDER BY OptionID`,
          [question.QuestionID]
        );
        question.options = options;
      }
    }
    
    return rows;
  }

  async saveExamResult(data) {
    const db = await connectDB();
    const sql = `
      INSERT INTO examresult (LearnerID, ExamID, Score, Feedback, SubmissionDate)
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        Score = VALUES(Score),
        Feedback = VALUES(Feedback),
        SubmissionDate = NOW()
    `;
    const [result] = await db.query(sql, [
      data.learnerId,
      data.examId,
      data.score,
      data.feedback || ''
    ]);
    return result.insertId || result.affectedRows;
  }

  async getExamStatistics(examId, classId) {
    const db = await connectDB();
    const sql = `
      SELECT 
        COUNT(DISTINCT en.LearnerID) as TotalStudents,
        COUNT(DISTINCT er.LearnerID) as SubmittedCount,
        ROUND(AVG(er.Score), 2) as AverageScore,
        MAX(er.Score) as HighestScore,
        MIN(er.Score) as LowestScore
      FROM enrollment en
      LEFT JOIN examresult er ON en.LearnerID = er.LearnerID AND er.ExamID = ?
      WHERE en.ClassID = ?
    `;
    const [rows] = await db.query(sql, [examId, classId]);
    return rows[0];
  }

  // ==================== HELPER METHODS ====================

  async getCoursesByInstructor(instructorId) {
    const db = await connectDB();
    const sql = `
      SELECT CourseID, Title, Status
      FROM course
      WHERE InstructorID = ? AND Status IN ('APPROVED', 'PUBLISHED')
      ORDER BY Title
    `;
    const [rows] = await db.query(sql, [instructorId]);
    return rows;
  }

  async getClassesByCourse(courseId) {
    const db = await connectDB();
    const sql = `
      SELECT ClassID, Name, Status, Maxstudent, Fee
      FROM class
      WHERE CourseID = ? AND Status IN ('ACTIVE', 'ON_GOING')
      ORDER BY Name
    `;
    const [rows] = await db.query(sql, [courseId]);
    return rows;
  }

  async checkExamOwnership(examId, instructorId) {
    const db = await connectDB();
    const sql = `
      SELECT e.ExamID
      FROM exam e
      JOIN course c ON e.CourseID = c.CourseID
      WHERE e.ExamID = ? AND c.InstructorID = ?
    `;
    const [rows] = await db.query(sql, [examId, instructorId]);
    return rows.length > 0;
  }

  async getInstructorIdByAccId(accId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT InstructorID FROM instructor WHERE AccID = ?`,
      [accId]
    );
    return rows.length > 0 ? rows[0].InstructorID : null;
  }
}

module.exports = new InstructorExamRepository();