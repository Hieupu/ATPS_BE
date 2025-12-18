const connectDB = require("../config/db");

class InstructorExamRepository {
  async createExam(data) {
    const db = await connectDB();
    const sql = `
      INSERT INTO exam (Title, Description, Status, Type, InstructorID)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      data.title,
      data.description,
      data.status || 'Draft',
      data.type || 'Exam',
      data.instructorId
    ]);
    return result.insertId;
  }

  async updateExam(examId, data) {
    const db = await connectDB();
    const sql = `
      UPDATE exam 
      SET Title = ?, Description = ?, Status = ?, Type = ?
      WHERE ExamID = ?
    `;
    const [result] = await db.query(sql, [
      data.title,
      data.description,
      data.status,
      data.type,
      examId
    ]);
    return result.affectedRows > 0;
  }

  async getExamsByInstructor(instructorId, filters = {}) {
    const db = await connectDB();
    let sql = `
      SELECT 
        e.ExamID, e.Title, e.Description, e.Status, e.Type,
        COUNT(DISTINCT es.SectionId) as TotalSections,
        COUNT(DISTINCT eq.QuestionId) as TotalQuestions,
        COUNT(DISTINCT ei.InstanceId) as TotalInstances
      FROM exam e
      LEFT JOIN examsection es ON e.ExamID = es.ExamId
      LEFT JOIN examquestion eq ON es.SectionId = eq.SectionId
      LEFT JOIN exam_instances ei ON e.ExamID = ei.ExamId
      WHERE e.InstructorID = ?
    `;

    const params = [instructorId];

    if (filters.status) {
      sql += ` AND e.Status = ?`;
      params.push(filters.status);
    }

    if (filters.type) {
      sql += ` AND e.Type = ?`;
      params.push(filters.type);
    }

    sql += ` GROUP BY e.ExamID ORDER BY e.ExamID DESC`;

    const [rows] = await db.query(sql, params);
    return rows;
  }

  async getExamById(examId) {
    const db = await connectDB();
    const sql = `
      SELECT e.*, i.FullName as InstructorName
      FROM exam e
      JOIN instructor i ON e.InstructorID = i.InstructorID
      WHERE e.ExamID = ?
    `;
    const [rows] = await db.query(sql, [examId]);
    return rows[0] || null;
  }


  async deleteExam(examId) {
    const db = await connectDB();
    const sql = `UPDATE exam SET Status = 'Archived' WHERE ExamID = ?`;
    const [result] = await db.query(sql, [examId]);
    return result.affectedRows > 0;
  }

  async archiveExam(examId) {
    const db = await connectDB();
    const sql = `UPDATE exam SET Status = 'Archived' WHERE ExamID = ?`;
    const [result] = await db.query(sql, [examId]);
    return result.affectedRows > 0;
  }

  async unarchiveExam(examId) {
    const db = await connectDB();
    const sql = `UPDATE exam SET Status = 'Draft' WHERE ExamID = ? AND Status = 'Archived'`;
    const [result] = await db.query(sql, [examId]);
    return result.affectedRows > 0;
  }

  async getArchivedExams(instructorId) {
    const db = await connectDB();
    const sql = `
      SELECT 
        e.ExamID, e.Title, e.Description, e.Type,
        COUNT(DISTINCT er.ResultID) as TotalSubmissions,
        ROUND(AVG(er.Score), 2) as AverageScore
      FROM exam e
      LEFT JOIN exam_instances ei ON e.ExamID = ei.ExamId
      LEFT JOIN examresult er ON e.ExamID = er.ExamID
      WHERE e.InstructorID = ? AND e.Status = 'Archived'
      GROUP BY e.ExamID
      ORDER BY e.ExamID DESC
    `;
    const [rows] = await db.query(sql, [instructorId]);
    return rows;
  }

  async createExamInstance(data) {
    const db = await connectDB();

    const {
      examId,
      unitId,
      classId,
      startTime,
      endTime,
      isRandomQuestion,
      isRandomAnswer,
      attempt
    } = data;

    const Status = "Scheduled";
    const resultIds = [];
    let unitIds = [];
    let classIds = [];

    if (Array.isArray(unitId)) {
      unitIds = unitId;
    } else if (unitId != null) {
      unitIds = [unitId];
    }

    if (Array.isArray(classId)) {
      classIds = classId;
    } else if (classId != null) {
      classIds = [classId];
    }

    if (unitIds.length > 0) {
      for (const uid of unitIds) {
        const sql = `
                INSERT INTO exam_instances 
                (ExamId, UnitId, ClassId, StartTime, EndTime, isRandomQuestion, isRandomAnswer, Status, Attempt)
                VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?)
            `;

        const [res] = await db.query(sql, [
          examId,
          uid,
          startTime || null,
          endTime || null,
          isRandomQuestion ? 1 : 0,
          isRandomAnswer ? 1 : 0,
          Status,
          attempt || 1
        ]);

        resultIds.push(res.insertId);
      }
      return resultIds;
    }

    if (classIds.length > 0) {
      for (const cid of classIds) {
        const sql = `
                INSERT INTO exam_instances 
                (ExamId, UnitId, ClassId, StartTime, EndTime, isRandomQuestion, isRandomAnswer, Status, Attempt)
                VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?)
            `;

        const [res] = await db.query(sql, [
          examId,
          cid,
          startTime || null,
          endTime || null,
          isRandomQuestion ? 1 : 0,
          isRandomAnswer ? 1 : 0,
          Status,
          attempt || 1
        ]);

        resultIds.push(res.insertId);
      }
      return resultIds;
    }
    throw new Error("Invalid instance payload: classId hoặc unitId phải là mảng");
  }

  async updateExamInstance(instanceId, data) {
    const db = await connectDB();
    const sql = `
      UPDATE exam_instances 
      SET StartTime = ?, EndTime = ?, isRandomQuestion = ?, 
          isRandomAnswer = ?, Status = ?, Attempt = ?
      WHERE InstanceId = ?
    `;
    const [result] = await db.query(sql, [
      data.startTime,
      data.endTime,
      data.isRandomQuestion ? 1 : 0,
      data.isRandomAnswer ? 1 : 0,
      data.status,
      data.attempt,
      instanceId
    ]);
    return result.affectedRows > 0;
  }

  async deleteExamInstance(instanceId) {
    const db = await connectDB();
    const sql = `DELETE FROM exam_instances WHERE InstanceId = ?`;
    const [result] = await db.query(sql, [instanceId]);
    return result.affectedRows > 0;
  }

  async getInstancesByExam(examId) {
    const db = await connectDB();
    const sql = `
      SELECT 
        ei.*,
        c.Title as CourseName,
        cl.Name as ClassName,
        u.Title as UnitName
      FROM exam_instances ei
      LEFT JOIN unit u ON ei.UnitId = u.UnitID
      LEFT JOIN class cl ON ei.ClassId = cl.ClassID
      LEFT JOIN course c ON u.CourseID = c.CourseID OR cl.CourseID = c.CourseID
      WHERE ei.ExamId = ?
      ORDER BY ei.StartTime DESC
    `;
    const [rows] = await db.query(sql, [examId]);
    return rows;
  }

  async getInstanceById(instanceId) {
    const db = await connectDB();
    const sql = `SELECT * FROM exam_instances WHERE InstanceId = ?`;
    const [rows] = await db.query(sql, [instanceId]);
    return rows[0] || null;
  }


  async getAvailableClassesByInstructor(instructorId) {
    const db = await connectDB();
    const sql = `
      SELECT 
        cl.ClassID, cl.Name, cl.Status,
        c.Title as CourseName, c.CourseID
      FROM class cl
      JOIN course c ON cl.CourseID = c.CourseID
      WHERE c.InstructorID = ? AND cl.Status IN ('ACTIVE', 'ONGOING')
      ORDER BY c.Title, cl.Name
    `;
    const [rows] = await db.query(sql, [instructorId]);
    return rows;
  }

  async getAvailableUnitsByInstructor(instructorId) {
    const db = await connectDB();
    const sql = `
      SELECT 
        u.UnitID, u.Title, u.Status,
        c.Title as CourseName, c.CourseID
      FROM unit u
      JOIN course c ON u.CourseID = c.CourseID
      WHERE c.InstructorID = ? AND u.Status = 'VISIBLE'
      ORDER BY c.Title, u.OrderIndex
    `;
    const [rows] = await db.query(sql, [instructorId]);
    return rows;
  }

  async createExamSection(examId, sectionData) {
    const db = await connectDB();
    const sql = `
      INSERT INTO examsection (ExamId, Type, Title, OrderIndex, ParentSectionId, FileURL)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      examId,
      sectionData.type,
      sectionData.title || null,
      sectionData.orderIndex,
      sectionData.parentSectionId || null,
      sectionData.fileURL || null
    ]);
    return result.insertId;
  }

  async updateExamSection(sectionId, sectionData) {
    const db = await connectDB();
    const sql = `
      UPDATE examsection 
      SET Type = ?, Title = ?, OrderIndex = ?, ParentSectionId = ?, FileURL = ?
      WHERE SectionId = ?
    `;
    const [result] = await db.query(sql, [
      sectionData.type,
      sectionData.title || null,
      sectionData.orderIndex,
      sectionData.parentSectionId || null,
      sectionData.fileURL || null,
      sectionId
    ]);
    return result.affectedRows > 0;
  }

  async deleteExamSection(sectionId) {
    const db = await connectDB();
    await db.query(
      `DELETE eq FROM examquestion eq
       JOIN examsection es ON eq.SectionId = es.SectionId
       WHERE es.ParentSectionId = ?`,
      [sectionId]
    );

    await db.query(`DELETE FROM examquestion WHERE SectionId = ?`, [sectionId]);

    await db.query(`DELETE FROM examsection WHERE ParentSectionId = ?`, [sectionId]);

    const [result] = await db.query(`DELETE FROM examsection WHERE SectionId = ?`, [sectionId]);
    return result.affectedRows > 0;
  }

  async getSectionById(sectionId) {
    const db = await connectDB();
    const sql = `SELECT * FROM examsection WHERE SectionId = ?`;
    const [rows] = await db.query(sql, [sectionId]);
    return rows[0] || null;
  }

  async getParentSectionsByExam(examId) {
    const db = await connectDB();
    const sql = `
      SELECT 
        es.SectionId, es.Type, es.Title, es.OrderIndex, es.FileURL,
        COUNT(DISTINCT child.SectionId) as ChildSectionsCount,
        COUNT(DISTINCT eq.QuestionId) as DirectQuestionsCount
      FROM examsection es
      LEFT JOIN examsection child ON es.SectionId = child.ParentSectionId
      LEFT JOIN examquestion eq ON es.SectionId = eq.SectionId
      WHERE es.ExamId = ? AND es.ParentSectionId IS NULL
      GROUP BY es.SectionId
      ORDER BY es.OrderIndex
    `;
    const [rows] = await db.query(sql, [examId]);
    return rows;
  }

  async getChildSectionsByParent(parentSectionId) {
    const db = await connectDB();
    const sql = `
      SELECT 
        es.SectionId, es.Type, es.Title, es.OrderIndex, es.FileURL,
        COUNT(DISTINCT eq.QuestionId) as TotalQuestions
      FROM examsection es
      LEFT JOIN examquestion eq ON es.SectionId = eq.SectionId
      WHERE es.ParentSectionId = ?
      GROUP BY es.SectionId
      ORDER BY es.OrderIndex
    `;
    const [rows] = await db.query(sql, [parentSectionId]);
    return rows;
  }

  async getSectionsHierarchyByExam(examId) {
    const parentSections = await this.getParentSectionsByExam(examId);

    for (const parent of parentSections) {
      parent.childSections = await this.getChildSectionsByParent(parent.SectionId);

      for (const child of parent.childSections) {
        child.questions = await this.getQuestionsBySection(child.SectionId);
      }

      parent.directQuestions = await this.getQuestionsBySection(parent.SectionId);
    }

    return parentSections;
  }

  async checkSectionBelongsToExam(sectionId, examId) {
    const db = await connectDB();
    const sql = `SELECT SectionId FROM examsection WHERE SectionId = ? AND ExamId = ?`;
    const [rows] = await db.query(sql, [sectionId, examId]);
    return rows.length > 0;
  }

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
          `SELECT OptionID, Content, IsCorrect 
           FROM question_option 
           WHERE QuestionID = ? 
           ORDER BY OptionID`,
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

  async addQuestionToSection(sectionId, questionId, orderIndex) {
    const db = await connectDB();
    const sql = `
      INSERT INTO examquestion (SectionId, QuestionId, Order_Index)
      VALUES (?, ?, ?)
    `;
    const [result] = await db.query(sql, [sectionId, questionId, orderIndex]);
    return result.insertId;
  }

  async addQuestionsToSection(sectionId, questionIds) {
    const db = await connectDB();

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

  async removeQuestionFromSection(sectionId, questionId) {
    const db = await connectDB();
    const sql = `DELETE FROM examquestion WHERE SectionId = ? AND QuestionId = ?`;
    const [result] = await db.query(sql, [sectionId, questionId]);
    return result.affectedRows > 0;
  }

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

  async getQuestionsBySection(sectionId, isRandomQuestion = false) {
    const db = await connectDB();
    let sql = `
      SELECT q.*, eq.ExamquestionId, eq.Order_Index
      FROM examquestion eq
      JOIN question q ON eq.QuestionId = q.QuestionID
      WHERE eq.SectionId = ? AND q.Status = 'Active'
    `;

    if (isRandomQuestion) {
      sql += ` ORDER BY RAND()`;
    } else {
      sql += ` ORDER BY eq.Order_Index`;
    }

    const [rows] = await db.query(sql, [sectionId]);

    for (const question of rows) {
      if (question.Type === 'multiple_choice') {
        let optionsSql = `SELECT * FROM question_option WHERE QuestionID = ?`;
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
  async getCoursesByInstructor(instructorId) {
    const db = await connectDB();
    const sql = `
      SELECT CourseID, Title
      FROM course 
      WHERE InstructorID = ?
      ORDER BY Title
  `;
    const [rows] = await db.query(sql, [instructorId]);
    return rows;
  }
  async getUnitByCourse(courseId) {
    const db = await connectDB(); 
    const sql = `
      SELECT 
        UnitID,
        Title AS UnitName,
        Description,
        Duration,
        CourseID,
        Status
      FROM unit
      WHERE CourseID = ?
        AND Status = 'VISIBLE'
      ORDER BY UnitID ASC
  `;

    const [rows] = await db.query(sql, [courseId]);
    return rows;
  }
  async getClassesByCourse(courseId) {
    const db = await connectDB();

    const sql = `
      SELECT 
        ClassID,
        Name AS ClassName,
        Status,
        CourseID
      FROM class
      WHERE CourseID = ?
        AND Status IN ('ACTIVE', 'ONGOING')
      ORDER BY Name ASC
  `;

    const [rows] = await db.query(sql, [courseId]);
    return rows;
  }

  async getExamResultsByInstance(instanceId) {
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
      FROM exam_instances ei
      JOIN class cl ON ei.ClassId = cl.ClassID
      JOIN enrollment en ON cl.ClassID = en.ClassID
      JOIN learner l ON en.LearnerID = l.LearnerID
      LEFT JOIN examresult er ON l.LearnerID = er.LearnerID AND er.ExamID = ei.ExamId
      WHERE ei.InstanceId = ?
      ORDER BY l.FullName
    `;
    const [rows] = await db.query(sql, [instanceId]);
    return rows;
  }

  async getLearnerExamSubmission(examId, learnerId) {
    const db = await connectDB();
    const sql = `
      SELECT 
        q.QuestionID, q.Content, q.Type, q.Point, q.CorrectAnswer, es.FileURL,
        es.SectionId, es.Type as SectionType, es.OrderIndex,
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

  async checkExamOwnership(examId, instructorId) {
    const db = await connectDB();
    const sql = `SELECT ExamID FROM exam WHERE ExamID = ? AND InstructorID = ?`;
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
  async autoUpdateInstanceStatus() {
    const db = await connectDB();
    const now = new Date();

    const [openResult] = await db.query(`
      UPDATE exam_instances 
      SET Status = 'Open' 
      WHERE Status = 'Scheduled' 
        AND StartTime IS NOT NULL 
        AND StartTime <= ?
    `, [now]);

    const [closeResult] = await db.query(`
      UPDATE exam_instances 
      SET Status = 'Closed' 
      WHERE Status = 'Open' 
        AND EndTime IS NOT NULL 
        AND EndTime <= ?
    `, [now]);

    const [publishResult] = await db.query(`
      UPDATE exam e
      INNER JOIN exam_instances ei ON e.ExamID = ei.ExamId
      SET e.Status = 'Published'
      WHERE e.Status = 'Draft'
        AND ei.Status = 'Open'
    `);

    return {
      openedCount: openResult.affectedRows,
      closedCount: closeResult.affectedRows,
      publishedCount: publishResult.affectedRows
    };
  }
  
  async openExamInstanceNow(instanceId) {
    const db = await connectDB();
    const sql = `
      UPDATE exam_instances 
      SET Status = 'Open' 
      WHERE InstanceId = ? AND Status IN ('Scheduled')
    `;
    const [result] = await db.query(sql, [instanceId]);
    return result.affectedRows > 0;
  }


  async closeExamInstanceNow(instanceId) {
    const db = await connectDB();
    const sql = `
      UPDATE exam_instances 
      SET Status = 'Closed' 
      WHERE InstanceId = ? AND Status = 'Open'
    `;
    const [result] = await db.query(sql, [instanceId]);
    return result.affectedRows > 0;
  }

  async publishExam(examId) {
    const db = await connectDB();
    const sql = `
      UPDATE exam 
      SET Status = 'Published' 
      WHERE ExamID = ? AND Status = 'Draft'
    `;
    const [result] = await db.query(sql, [examId]);
    return result.affectedRows > 0;
  }

}

module.exports = new InstructorExamRepository();