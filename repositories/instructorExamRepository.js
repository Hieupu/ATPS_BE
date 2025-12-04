const connectDB = require("../config/db");

class InstructorExamRepository {
  // ==================== EXAM CRUD ====================

  /**
   * Tạo exam mới
   */
  async createExam(data) {
    const db = await connectDB();
    const sql = `
      INSERT INTO exam (CourseID, Title, Description, StartTime, EndTime, Status, isRandomQuestion, isRandomAnswer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      data.courseId || data.CourseID,
      data.title || data.Title,
      data.description || data.Description,
      data.startTime || data.StartTime,
      data.endTime || data.EndTime,
      data.status || data.Status || 'Pending',
      data.isRandomQuestion,
      data.isRandomAnswer
    ]);
    return result.insertId;
  }

  /**
   * Cập nhật exam
   */
  async updateExam(examId, data) {
    const db = await connectDB();

    const sql = `
    UPDATE exam 
    SET 
      CourseID = ?, 
      Title = ?, 
      Description = ?, 
      StartTime = ?, 
      EndTime = ?, 
      Status = ?,
      isRandomQuestion = ?, 
      isRandomAnswer = ?
    WHERE ExamID = ?
  `;

    const [result] = await db.query(sql, [
      data.CourseID || data.courseId,
      data.Title || data.title,
      data.Description || data.description,
      data.StartTime || data.startTime,
      data.EndTime || data.endTime,
      data.Status || data.status,
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
        COUNT(DISTINCT ec.classId) as TotalClasses,
        GROUP_CONCAT(DISTINCT cl.Name SEPARATOR ', ') as ClassName
      FROM exam e
      JOIN course c ON e.CourseID = c.CourseID
      LEFT JOIN examsection es ON e.ExamID = es.ExamId
      LEFT JOIN examquestion eq ON es.SectionId = eq.SectionId
      LEFT JOIN exam_class ec ON e.ExamID = ec.examId
      LEFT JOIN class cl ON ec.classId = cl.ClassID
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

  /**
   * Lưu trữ bài thi đã hoàn thành
   */
  async archiveExam(examId) {
    const db = await connectDB();
    const sql = `
      UPDATE exam 
      SET Status = 'Archived'
      WHERE ExamID = ? AND Status = 'Completed'
    `;
    const [result] = await db.query(sql, [examId]);
    return result.affectedRows > 0;
  }

  /**
   * Lấy danh sách bài thi đã lưu trữ của giảng viên
   */
  async getArchivedExams(instructorId) {
    const db = await connectDB();
    const sql = `
      SELECT 
        e.ExamID, e.Title, e.Description, e.StartTime, e.EndTime,
        c.Title as CourseName,
        COUNT(DISTINCT er.ResultID) as TotalSubmissions,
        ROUND(AVG(er.Score), 2) as AverageScore,
        e.Status,
        GROUP_CONCAT(DISTINCT cl.Name SEPARATOR ', ') as ClassName
      FROM exam e
      JOIN course c ON e.CourseID = c.CourseID
      LEFT JOIN examresult er ON e.ExamID = er.ExamID
      LEFT JOIN exam_class ec ON e.ExamID = ec.examId
      LEFT JOIN class cl ON ec.classId = cl.ClassID
      WHERE c.InstructorID = ? 
        AND e.Status = 'Archived'
      GROUP BY e.ExamID
      ORDER BY e.EndTime DESC
    `;
    const [rows] = await db.query(sql, [instructorId]);
    return rows;
  }

  // ==================== EXAM SECTION MANAGEMENT ====================

  /**
   * Tạo section mới (có thể là parent hoặc child section)
   * @param {Number} examId - ID của exam
   * @param {Object} sectionData - { type, orderIndex, parentSectionId }
   */
  async createExamSection(examId, sectionData) {
    const db = await connectDB();
    const sql = `
      INSERT INTO examsection (ExamId, Type, Title ,OrderIndex, ParentSectionId)
      VALUES (?, ?, ?, ?,?)
    `;
    const [result] = await db.query(sql, [
      examId,
      sectionData.type,
      sectionData.title || null,
      sectionData.orderIndex,
      sectionData.parentSectionId || null
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
      SET Type = ?, OrderIndex = ?, ParentSectionId = ?
      WHERE SectionId = ?
    `;
    const [result] = await db.query(sql, [
      sectionData.type,
      sectionData.orderIndex,
      sectionData.title || null,
      sectionData.parentSectionId || null,
      sectionId
    ]);
    return result.affectedRows > 0;
  }

  /**
   * Xóa section 
   */
  async deleteExamSection(sectionId) {
    const db = await connectDB();

    // Xóa question thuộc child sections
    await db.query(
      `DELETE eq FROM examquestion eq
     JOIN examsection es ON eq.SectionId = es.SectionId
     WHERE es.ParentSectionId = ?`,
      [sectionId]
    );

    // Xóa question thuộc section cha
    await db.query(`DELETE FROM examquestion WHERE SectionId = ?`, [sectionId]);

    // Xóa child sections
    await db.query(`DELETE FROM examsection WHERE ParentSectionId = ?`, [sectionId]);

    // Xóa section chính
    const [result] = await db.query(`DELETE FROM examsection WHERE SectionId = ?`, [sectionId]);
    return result.affectedRows > 0;
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

  /**
   * Lấy danh sách parent sections của exam (ParentSectionId = NULL)
   */
  async getParentSectionsByExam(examId) {
    const db = await connectDB();
    const sql = `
      SELECT 
        es.SectionId, es.Type, es.Title, es.OrderIndex, es.ParentSectionId,
        COUNT(DISTINCT child.SectionId) as ChildSectionsCount,
        COUNT(DISTINCT eq.QuestionId) as DirectQuestionsCount
      FROM examsection es
      LEFT JOIN examsection child ON es.SectionId = child.ParentSectionId
      LEFT JOIN examquestion eq ON es.SectionId = eq.SectionId
      WHERE es.ExamId = ? AND es.ParentSectionId IS NULL
      GROUP BY es.SectionId, es.Type, es.Title, es.OrderIndex, es.ParentSectionId
      ORDER BY es.OrderIndex
    `;
    const [rows] = await db.query(sql, [examId]);
    return rows;
  }

  /**
   * Lấy danh sách child sections của một parent section
   */
  async getChildSectionsByParent(parentSectionId) {
    const db = await connectDB();
    const sql = `
      SELECT 
        es.SectionId, es.Type, es.Title, es.OrderIndex, es.ParentSectionId,
        COUNT(DISTINCT eq.QuestionId) as TotalQuestions
      FROM examsection es
      LEFT JOIN examquestion eq ON es.SectionId = eq.SectionId
      WHERE es.ParentSectionId = ?
     GROUP BY es.SectionId, es.Type, es.Title, es.OrderIndex, es.ParentSectionId
      ORDER BY es.OrderIndex
    `;
    const [rows] = await db.query(sql, [parentSectionId]);
    return rows;
  }

  /**
   * Lấy toàn bộ cấu trúc phân cấp sections của exam
   * Trả về parent sections với child sections lồng bên trong
   */
  async getSectionsHierarchyByExam(examId) {
    const db = await connectDB();

    // Lấy tất cả parent sections
    const parentSections = await this.getParentSectionsByExam(examId);

    // Với mỗi parent, lấy child sections
    for (const parent of parentSections) {
      parent.childSections = await this.getChildSectionsByParent(parent.SectionId);

      // Lấy questions cho mỗi child section
      for (const child of parent.childSections) {
        child.questions = await this.getQuestionsBySection(child.SectionId);
      }

      // Lấy questions trực tiếp của parent 
      parent.directQuestions = await this.getQuestionsBySection(parent.SectionId);
    }

    return parentSections;
  }

  /**
   * Lấy tất cả sections (flat list) của exam
   */
  async getAllSectionsByExam(examId) {
    const db = await connectDB();
    const sql = `
      SELECT 
        es.SectionId, es.Type, es.OrderIndex, es.ParentSectionId,
        COUNT(DISTINCT eq.QuestionId) as TotalQuestions
      FROM examsection es
      LEFT JOIN examquestion eq ON es.SectionId = eq.SectionId
      WHERE es.ExamId = ?
      GROUP BY es.SectionId
      ORDER BY es.ParentSectionId, es.OrderIndex
    `;
    const [rows] = await db.query(sql, [examId]);
    return rows;
  }

  /**
   * Kiểm tra section có thuộc exam không
   */
  async checkSectionBelongsToExam(sectionId, examId) {
    const db = await connectDB();
    const sql = `SELECT SectionId FROM examsection WHERE SectionId = ? AND ExamId = ?`;
    const [rows] = await db.query(sql, [sectionId, examId]);
    return rows.length > 0;
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
      data.type,
      data.correctAnswer || null,
      data.instructorId,
      data.status || 'Active',
      data.topic || null,
      data.level || null,
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

    const promises = options.map(option =>
      db.query(sql, [questionId, option.content, option.isCorrect ? 1 : 0])
    );

    await Promise.all(promises);
  }

  async getQuestionsByInstructor(instructorId, filters = {}) {
    const db = await connectDB();
    let sql = `
    SELECT q.*,
      (SELECT COUNT(*) FROM question_option WHERE QuestionID = q.QuestionID) as OptionsCount
    FROM question q
    WHERE q.InstructorID = ? AND q.Status = 'Active'
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

    sql += ` ORDER BY q.QuestionID DESC`;

    const [rows] = await db.query(sql, params);
    for (let question of rows) {
      if (question.Type === 'multiple_choice') {
        const [options] = await db.query(
          `SELECT OptionId, Content, IsCorrect 
         FROM question_option 
         WHERE QuestionID = ? 
         ORDER BY OptionId`,
          [question.QuestionID]
        );
        question.options = options;
      } else {
        question.options = [];
      }
    }

    return rows;
  }

  async getQuestionById(questionId) {
    const db = await connectDB();
    const sql = `SELECT * FROM question WHERE QuestionID = ?`;
    const [rows] = await db.query(sql, [questionId]);

    if (rows.length > 0) {
      const question = rows[0];

      // Lấy options nếu là multiple choice
      if (question.Type === 'multiple_choice') {
        const [options] = await db.query(
          `SELECT * FROM question_option WHERE QuestionID = ? ORDER BY OptionID`,
          [questionId]
        );
        question.options = options;
      }

      return question;
    }

    return null;
  }

  async updateQuestion(questionId, data) {
    const db = await connectDB();
    const sql = `
      UPDATE question 
      SET Content = ?, Type = ?, CorrectAnswer = ?, Topic = ?, Level = ?, Point = ?, Status = ?
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

  // ==================== SECTION-QUESTION MANAGEMENT ====================

  /**
   * Thêm câu hỏi vào section với Order_Index
   */
  async addQuestionToSection(sectionId, questionId, orderIndex) {
    const db = await connectDB();
    const sql = `
      INSERT INTO examquestion (SectionId, QuestionId, Order_Index)
      VALUES (?, ?, ?)
    `;
    const [result] = await db.query(sql, [sectionId, questionId, orderIndex]);
    return result.insertId;
  }

  /**
   * Thêm nhiều câu hỏi vào section
   */
  async addQuestionsToSection(sectionId, questionIds) {
    const db = await connectDB();

    // Lấy Order_Index cao nhất hiện tại
    const [maxOrder] = await db.query(
      `SELECT COALESCE(MAX(Order_Index), -1) as maxOrder FROM examquestion WHERE SectionId = ?`,
      [sectionId]
    );

    let currentOrder = maxOrder[0].maxOrder + 1;

    const sql = `
      INSERT INTO examquestion (SectionId, QuestionId, Order_Index)
      VALUES (?, ?, ?)
    `;

    const promises = questionIds.map(qId => {
      const promise = db.query(sql, [sectionId, qId, currentOrder]);
      currentOrder++;
      return promise;
    });

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
   * Cập nhật Order_Index của câu hỏi trong section
   */
  async updateQuestionOrder(sectionId, questionId, newOrderIndex) {
    const db = await connectDB();
    const sql = `
      UPDATE examquestion 
      SET Order_Index = ?
      WHERE SectionId = ? AND QuestionId = ?
    `;
    const [result] = await db.query(sql, [newOrderIndex, sectionId, questionId]);
    return result.affectedRows > 0;
  }

  /**
   * Lấy danh sách câu hỏi trong section (có hỗ trợ random)
   */
  async getQuestionsBySection(sectionId, isRandomQuestion = false) {
    const db = await connectDB();
    let sql = `
      SELECT q.*, eq.ExamquestionId, eq.Order_Index
      FROM examquestion eq
      JOIN question q ON eq.QuestionId = q.QuestionID
      WHERE eq.SectionId = ? AND q.Status = 'Active'
    `;

    // Nếu random question, dùng ORDER BY RAND()
    if (isRandomQuestion) {
      sql += ` ORDER BY RAND()`;
    } else {
      sql += ` ORDER BY eq.Order_Index`;
    }

    const [rows] = await db.query(sql, [sectionId]);

    for (const question of rows) {
      if (question.Type === 'multiple_choice') {
        let optionsSql = `
          SELECT * FROM question_option 
          WHERE QuestionID = ?
        `;
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
   * Lấy tất cả sections + questions của exam với cấu trúc phân cấp
   */
  async getExamWithSections(examId, isRandomQuestion = false, isRandomAnswer = false) {
    const db = await connectDB();

    // Lấy exam info
    const exam = await this.getExamById(examId);
    if (!exam) return null;

    // Lấy cấu trúc phân cấp sections
    exam.sections = await this.getSectionsHierarchyByExam(examId);

    // Apply random nếu cần
    if (isRandomQuestion) {
      // Shuffle child sections trong mỗi parent
      for (const parent of exam.sections) {
        if (parent.childSections && parent.childSections.length > 0) {
          parent.childSections = this.shuffleArray(parent.childSections);
        }
      }
    }

    if (isRandomAnswer) {
      // Shuffle options trong questions
      for (const parent of exam.sections) {
        // Shuffle options trong direct questions của parent
        if (parent.directQuestions) {
          for (const q of parent.directQuestions) {
            if (q.options && q.options.length > 0) {
              q.options = this.shuffleArray(q.options);
            }
          }
        }

        // Shuffle options trong questions của child sections
        if (parent.childSections) {
          for (const child of parent.childSections) {
            if (child.questions) {
              for (const q of child.questions) {
                if (q.options && q.options.length > 0) {
                  q.options = this.shuffleArray(q.options);
                }
              }
            }
          }
        }
      }
    }

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
        es.SectionId, es.Type as SectionType, es.OrderIndex, es.ParentSectionId,
        eq.ExamquestionId, eq.Order_Index,
        ea.Answer as LearnerAnswer
      FROM examsection es
      JOIN examquestion eq ON es.SectionId = eq.SectionId
      JOIN question q ON eq.QuestionId = q.QuestionID
      LEFT JOIN examanswer ea ON eq.ExamquestionId = ea.ExamquestionId 
                              AND ea.LearnerID = ?
      WHERE es.ExamId = ?
      ORDER BY es.OrderIndex, eq.Order_Index
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


  /**
  * Auto update exam status - được gọi bởi cron job
  * Cập nhật Pending → Ongoing và Ongoing → Completed
  */
  async autoUpdateExamStatus() {
    const cron = require('node-cron');
    cron.schedule('* * * * *', async () => {
      try {
        const db = await connectDB();
        const now = new Date();
        // Set MySQL session timezone to Vietnam (UTC+7)
        await db.query("SET time_zone = '+07:00'");

        const [pendingResults] = await db.query(`
          UPDATE exam
          SET Status = 'Ongoing'
          WHERE Status = 'Pending'
            AND StartTime <= NOW()
            AND EndTime > NOW()
        `);

        if (pendingResults.affectedRows > 0) {
          console.log(`✅ [${now.toISOString()}] Updated ${pendingResults.affectedRows} exam(s): Pending → Ongoing`);
        }

        const [ongoingResults] = await db.query(`
          UPDATE exam
          SET Status = 'Completed'
          WHERE Status = 'Ongoing'
            AND EndTime <= NOW()
        `);

        if (ongoingResults.affectedRows > 0) {
          console.log(`✅ [${now.toISOString()}] Updated ${ongoingResults.affectedRows} exam(s): Ongoing → Completed`);
        }

        if (pendingResults.affectedRows === 0 && ongoingResults.affectedRows === 0) {
          const minute = now.getMinutes();
          if (minute % 5 === 0) {
            console.log(`ℹ️ [${now.toISOString()}] No exam status updates needed`);
          }
        }

      } catch (error) {
        console.error('Exam status scheduler error:', error);
      }
    });
  }
  /**
   * Manual check and update - dùng cho API endpoint
   */
  async checkAndUpdateExamStatus() {
    const db = await connectDB();

    // Set MySQL session timezone to Vietnam (UTC+7)
    await db.query("SET time_zone = '+07:00'");

    // 1. Update Pending → Ongoing
    const [pendingResults] = await db.query(`
      UPDATE exam
      SET Status = 'Ongoing'
      WHERE Status = 'Pending'
        AND StartTime <= NOW()
        AND EndTime > NOW()
    `);

    // 2. Update Ongoing → Completed
    const [ongoingResults] = await db.query(`
      UPDATE exam
      SET Status = 'Completed'
      WHERE Status = 'Ongoing'
        AND EndTime <= NOW()
    `);

    return {
      pendingToOngoing: pendingResults.affectedRows,
      ongoingToCompleted: ongoingResults.affectedRows
    };
  }
  // =====================
  // CLASS MAPPING HANDLER
  // =====================

  async deleteExamClasses(examId) {
    const db = await connectDB();
    const sql = "DELETE FROM exam_class WHERE examId = ?";
    await db.query(sql, [examId]);
  }

  async insertExamClasses(classMappingValues) {
    const db = await connectDB();
    const sql = "INSERT INTO exam_class (examId, classId) VALUES ?";
    await db.query(sql, [classMappingValues]);
  }

  // =====================
  // SECTION HANDLER
  // =====================

  async deleteExamSections(examId) {
    const db = await connectDB();

    // 1. Xoá toàn bộ examquestion (cả parent lẫn child)
    await db.query(`
    DELETE eq FROM examquestion eq
    JOIN examsection es ON eq.SectionId = es.SectionId
    WHERE es.ExamId = ?
  `, [examId]);

    // 2. Xoá child sections (ParentSectionId IS NOT NULL)
    await db.query(`
    DELETE FROM examsection 
    WHERE ExamId = ? AND ParentSectionId IS NOT NULL
  `, [examId]);

    // 3. Xoá parent sections
    await db.query(`
    DELETE FROM examsection 
    WHERE ExamId = ? AND ParentSectionId IS NULL
  `, [examId]);
  }


  async insertSection({ ExamID, Type, Title, OrderIndex, ParentSectionID }) {
    const db = await connectDB();

    const sql = `
        INSERT INTO examsection (
            ExamID, 
            Type, 
            Title, 
            OrderIndex, 
            ParentSectionID
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      ExamID,
      Type,
      Title,
      OrderIndex,
      ParentSectionID
    ]);

    return result.insertId;
  }


  // =====================
  // SECTION → QUESTION HANDLER
  // =====================

  async deleteSectionQuestions(sectionId) {
    const db = await connectDB();
    const sql = "DELETE FROM examquestion WHERE SectionId = ?";
    await db.query(sql, [sectionId]);
  }

  async insertSectionQuestions(questionValues) {
    const db = await connectDB();
    const sql = "INSERT INTO examquestion (SectionId, QuestionId, Order_Index) VALUES ?";
    await db.query(sql, [questionValues]);
  }
  async deleteQuestionsByExam(examId) {
    const db = await connectDB();
    const sql = `
    DELETE eq
    FROM examquestion eq
    JOIN examsection es ON eq.SectionId = es.SectionId
    WHERE es.ExamId = ?
  `;
    await db.query(sql, [examId]);
  }

  /**
 * Khôi phục bài thi từ lưu trữ 
 */
  async unarchiveExam(examId) {
    const db = await connectDB();
    const sql = `
    UPDATE exam 
    SET Status = 'Completed'
    WHERE ExamID = ? AND Status = 'Archived'
  `;
    const [result] = await db.query(sql, [examId]);
    return result.affectedRows > 0;
  }

}


module.exports = new InstructorExamRepository();