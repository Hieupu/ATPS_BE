const connectDB = require("../config/db");

class AssignmentRepository {
  // Kiểm tra quyền với Unit
  async canInstructorAccessUnit(instructorAccId, unitId) {
    const db = await connectDB();
    const query = `
      SELECT 1
      FROM unit u
      JOIN course co ON u.CourseID = co.CourseID
      JOIN instructor i ON co.InstructorID = i.InstructorID
      WHERE i.AccID = ? AND u.UnitID = ?
      LIMIT 1
    `;
    const [rows] = await db.query(query, [instructorAccId, unitId]);
    return rows.length > 0;
  }

  // Kiểm tra quyền với Assignment
  async canInstructorAccessAssignment(instructorAccId, assignmentId) {
    const db = await connectDB();
    const query = `
      SELECT 1
      FROM assignment a
      JOIN instructor i ON a.InstructorID = i.InstructorID
      WHERE i.AccID = ? AND a.AssignmentID = ?
      LIMIT 1
    `;
    const [rows] = await db.query(query, [instructorAccId, assignmentId]);
    return rows.length > 0;
  }

  // Tìm UnitID theo Title
  async findUnitIdByTitleForInstructor(instructorAccId, unitTitle) {
    const db = await connectDB();
    const query = `
      SELECT u.UnitID
      FROM unit u
      JOIN course co ON u.CourseID = co.CourseID
      JOIN instructor i ON co.InstructorID = i.InstructorID
      WHERE i.AccID = ? AND u.Title = ?
      LIMIT 1
    `;
    const [rows] = await db.query(query, [instructorAccId, unitTitle]);
    return rows[0]?.UnitID ?? null;
  }

  // Tạo assignment
  async createAssignment(data) {
    const db = await connectDB();

    console.log("📦 Repository received data:", data);

    const sql = `
    INSERT INTO assignment
      (Title, Description, Deadline, Type, UnitID, Status, FileURL, InstructorID, 
       MaxDuration, ShowAnswersAfter, MediaURL)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const [result] = await db.query(sql, [
      data.title,              
      data.description,
      data.deadline,
      data.type,
      data.unitId,
      data.status,
      data.fileURL,
      data.instructorId,      
      data.maxDuration,
      data.showAnswersAfter,
      data.mediaURL
    ]);
    return result.insertId;
  }

  // Cập nhật assignment
  async updateAssignment(assignmentId, data) {
    const db = await connectDB();
    const sql = `
      UPDATE assignment
      SET Title=?, Description=?, Deadline=?, Type=?, UnitID=?, Status=?, FileURL=?,
          MaxDuration=?, ShowAnswersAfter=?, MediaURL=?
      WHERE AssignmentID=?
    `;
    await db.query(sql, [
      data.title,
      data.description,
      data.deadline,
      data.type,
      data.unitId,
      data.status,
      data.fileURL,
      data.maxDuration,
      data.showAnswersAfter,
      data.mediaURL,
      assignmentId,
    ]);
  }

  // Xóa mềm
  async softDeleteAssignment(assignmentId) {
    const db = await connectDB();
    await db.query(`UPDATE assignment SET Status = 'deleted' WHERE AssignmentID = ?`, [assignmentId]);
    return this.getAssignmentById(assignmentId);
  }

  // Chi tiết assignment 
  async getAssignmentById(assignmentId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `
      SELECT 
        a.AssignmentID, a.Title, a.Description, a.Deadline, a.Type, a.FileURL, a.Status,
        a.MaxDuration, a.ShowAnswersAfter, a.MediaURL,
        u.UnitID, u.Title AS UnitTitle,
        co.CourseID, co.Title AS CourseTitle,
        i.FullName AS InstructorName
      FROM assignment a
      LEFT JOIN unit u ON a.UnitID = u.UnitID
      LEFT JOIN course co ON u.CourseID = co.CourseID
      LEFT JOIN instructor i ON a.InstructorID = i.InstructorID
      WHERE a.AssignmentID = ?
      `,
      [assignmentId]
    );
    const base = rows[0] || null;
    if (!base) return null;
    return base;
  }

  // Danh sách assignment
  async getAssignmentsByInstructor(instructorAccId) {
    const db = await connectDB();
    const query = `
      SELECT 
        a.AssignmentID, a.Title, a.Description, a.Deadline, a.Type, a.FileURL, a.Status,
        a.MaxDuration, a.ShowAnswersAfter, a.MediaURL,
        u.Title AS UnitTitle,
        co.Title AS CourseTitle
      FROM assignment a
      JOIN instructor i ON a.InstructorID = i.InstructorID
      LEFT JOIN unit u ON a.UnitID = u.UnitID
      LEFT JOIN course co ON u.CourseID = co.CourseID
      WHERE i.AccID = ?
      ORDER BY a.Status DESC, a.Deadline DESC
    `;
    const [rows] = await db.query(query, [instructorAccId]);
    return rows;
  }

  // Units theo instructor
  async getUnitsByInstructor(instructorAccId) {
    const db = await connectDB();
    const sql = `
      SELECT
        u.UnitID,
        u.Title,
        u.Status,
        c.Title AS CourseTitle,
        c.CourseID
      FROM unit u
      JOIN course c ON u.CourseID = c.CourseID
      JOIN instructor i ON c.InstructorID = i.InstructorID
      WHERE i.AccID = ?
        AND (u.Status IS NULL OR LOWER(u.Status) != 'deleted')
        AND (c.Status IS NULL OR LOWER(c.Status) != 'deleted')
      ORDER BY c.Title ASC, u.Title ASC
    `;
    const [rows] = await db.query(sql, [instructorAccId]);
    return rows;
  }

  // Courses theo instructor
  async getCoursesByInstructor(instructorAccId) {
    const db = await connectDB();
    const sql = `
      SELECT c.CourseID, c.Title, c.Status
      FROM course c
      JOIN instructor i ON c.InstructorID = i.InstructorID
      WHERE i.AccID = ?
        AND (c.Status IS NULL OR LOWER(c.Status) <> 'deleted')
      ORDER BY c.Title ASC
    `;
    const [rows] = await db.query(sql, [instructorAccId]);
    return rows;
  }

  // Units theo Course
  async getUnitsByInstructorAndCourse(instructorAccId, courseId) {
    const db = await connectDB();
    const sql = `
      SELECT u.UnitID, u.Title, u.Status
      FROM unit u
      JOIN course c ON u.CourseID = c.CourseID
      JOIN instructor i ON c.InstructorID = i.InstructorID
      WHERE i.AccID = ?
        AND c.CourseID = ?
        AND (u.Status IS NULL OR LOWER(u.Status) <> 'deleted')
      ORDER BY u.Title ASC
    `;
    const [rows] = await db.query(sql, [instructorAccId, courseId]);
    return rows;
  }

  // ==== Questions ====
  async getAssignmentQuestions(assignmentId) {
    const db = await connectDB();
    const [rows] = await db.query(`
      SELECT 
        q.QuestionID, q.Content, q.Type, q.CorrectAnswer, 
        q.Topic, q.Level, q.Point, q.Explanation
      FROM assignment_question aq
      JOIN question q ON aq.QuestionID = q.QuestionID
      WHERE aq.AssignmentID = ?
      ORDER BY q.QuestionID
    `, [assignmentId]);

    // Lấy options cho mỗi question
    for (let i = 0; i < rows.length; i++) {
      const [options] = await db.query(`
        SELECT OptionID, Content, IsCorrect
        FROM question_option
        WHERE QuestionID = ?
        ORDER BY OptionID
      `, [rows[i].QuestionID]);
      rows[i].Options = options;
    }

    return rows;
  }

  async addQuestionToAssignment(assignmentId, questionId) {
    const db = await connectDB();
    await db.query(`
      INSERT INTO assignment_question (AssignmentID, QuestionID)
      VALUES (?, ?)
    `, [assignmentId, questionId]);
  }

  async removeQuestionFromAssignment(assignmentId, questionId) {
    const db = await connectDB();
    await db.query(`
      DELETE FROM assignment_question 
      WHERE AssignmentID = ? AND QuestionID = ?
    `, [assignmentId, questionId]);
  }

  async createQuestion(instructorId, data) {
    const db = await connectDB();

    // Insert question
    const [result] = await db.query(`
      INSERT INTO question 
        (Content, Type, CorrectAnswer, InstructorID, Status, Topic, Level, Point, Explanation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.content,
      data.type || 'multiple_choice',
      data.correctAnswer,
      instructorId,
      data.status || 'active',
      data.topic || null,
      data.level || 'Medium',
      data.point || 1,
      data.explanation || null
    ]);

    const questionId = result.insertId;

    // Insert options
    if (data.options && data.options.length > 0) {
      const optionSql = `
        INSERT INTO question_option (QuestionID, Content, IsCorrect)
        VALUES ${data.options.map(() => '(?, ?, ?)').join(',')}
      `;
      const optionParams = data.options.flatMap(opt => [
        questionId,
        opt.content || opt.Content,
        opt.isCorrect ? 1 : 0
      ]);
      await db.query(optionSql, optionParams);
    }

    return questionId;
  }

  // ==== Stats ====
  async getAssignmentStats(assignmentId, instructorAccId) {
    const db = await connectDB();
    const canAccess = await this.canInstructorAccessAssignment(instructorAccId, assignmentId);
    if (!canAccess) return null;

    const [totalStudents] = await db.query(`
  SELECT COUNT(DISTINCT e.LearnerID) AS total
  FROM assignment a
  JOIN unit u ON a.UnitID = u.UnitID
  JOIN course co ON u.CourseID = co.CourseID
  JOIN class cl ON co.CourseID = cl.CourseID
  JOIN enrollment e ON cl.ClassID = e.ClassID
  WHERE a.AssignmentID = ?
`, [assignmentId]);

    const [submissionStats] = await db.query(`
      SELECT 
        COUNT(s.SubmissionID) as submitted,
        AVG(s.Score) as averageScore,
        MAX(s.Score) as highestScore,
        MIN(s.Score) as lowestScore
      FROM submission s
      WHERE s.AssignmentID = ?
    `, [assignmentId]);

    return {
      totalStudents: totalStudents[0].total || 0,
      ...submissionStats[0],
      submissionRate: submissionStats[0].submitted / (totalStudents[0].total || 1) * 100,
    };
  }

  async getAllAssignmentsStats(instructorAccId) {
    const assignments = await this.getAssignmentsByInstructor(instructorAccId);
    const stats = [];
    for (const assign of assignments) {
      const stat = await this.getAssignmentStats(assign.AssignmentID, instructorAccId);
      stats.push({ ...assign, ...stat });
    }
    return stats;
  }
}

module.exports = new AssignmentRepository();