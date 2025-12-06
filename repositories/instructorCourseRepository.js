const connectDB = require("../config/db");
const Course = require("../models/course");

class InstructorCourseRepository {
  async findById(courseId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT 
        c.CourseID,
        c.InstructorID,
        c.Title,
        c.Description,
        c.Image,
        c.Duration,
        c.Objectives,
        c.Requirements,
        c.Level,
        c.Status,
        c.Code,
        i.FullName AS InstructorName
     FROM course c
     LEFT JOIN instructor i 
        ON c.InstructorID = i.InstructorID
     WHERE c.CourseID = ?`,
      [courseId]
    );

    if (!rows.length) return null;
    return new Course(rows[0]);
  }

  async findInstructorIdByAccountId(accId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT InstructorID 
       FROM instructor 
       WHERE AccID = ? 
       LIMIT 1`,
      [accId]
    );

    if (!rows.length) return null;
    return rows[0].InstructorID;
  }

  async getLearnerByAccountId(accId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT 
         LearnerID,
         FullName,
         DateOfBirth,
         ProfilePicture,
         Job,
         Address,
         AccID
       FROM learner 
       WHERE AccID = ? 
       LIMIT 1`,
      [accId]
    );

    if (!rows.length) return null;
    return rows[0];
  }

  async listByInstructor(instructorId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT 
        c.CourseID,
        c.InstructorID,
        c.Title,
        c.Description,
        c.Image,
        c.Duration,
        c.Objectives,
        c.Requirements,
        c.Level,
        c.Status,
        c.Code,
        i.FullName AS InstructorName,
        
        -- 1. Đếm số lượng Chương (Unit)
        (SELECT COUNT(*) 
         FROM unit u 
         WHERE u.CourseID = c.CourseID 
           AND u.Status != 'DELETED') AS UnitCount,

        -- 2. Đếm số lượng Bài học (Lesson)
        -- Phải JOIN với bảng unit để biết lesson đó thuộc course nào
        (SELECT COUNT(*) 
         FROM lesson l 
         INNER JOIN unit u ON l.UnitID = u.UnitID
         WHERE u.CourseID = c.CourseID 
           AND l.Status != 'DELETED' 
           AND u.Status != 'DELETED') AS LessonCount,

        -- 3. Đếm số lượng Tài liệu (Material)
        -- Dựa vào bảng 'material' trong database
        (SELECT COUNT(*) 
         FROM material m 
         WHERE m.CourseID = c.CourseID 
           AND m.Status != 'DELETED') AS MaterialMissingCount

      FROM course c
      LEFT JOIN instructor i 
        ON c.InstructorID = i.InstructorID
      WHERE c.InstructorID = ?
        AND c.Status <> 'DELETED'
      ORDER BY c.CourseID DESC`,
      [instructorId]
    );

    return rows;
  }

  async create(courseData) {
    const db = await connectDB();
    const {
      InstructorID,
      Title,
      Description,
      Image,
      Duration,
      Objectives,
      Requirements,
      Level,
      Status,
      Code,
    } = courseData;

    const _Title = Title ?? "";
    const _Description = Description ?? "";
    const _Image = Image ?? "";
    const _Duration = Duration ?? 0;
    const _Objectives = Objectives ?? "";
    const _Requirements = Requirements ?? "";
    const _Level = Level ?? "BEGINNER";
    const _Status = Status ?? "DRAFT";
    const _Code = Code;

    const [result] = await db.query(
      `INSERT INTO course
        (InstructorID, Title, Description, Image, Duration, Objectives, Requirements, Level, Status, Code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        InstructorID,
        _Title,
        _Description,
        _Image,
        _Duration,
        _Objectives,
        _Requirements,
        _Level,
        _Status,
        _Code,
      ]
    );

    return new Course({
      CourseID: result.insertId,
      InstructorID,
      Title: _Title,
      Description: _Description,
      Image: _Image,
      Duration: _Duration,
      Objectives: _Objectives,
      Requirements: _Requirements,
      Level: _Level,
      Status: _Status,
      Code: _Code,
    });
  }

  async update(courseId, data) {
    const db = await connectDB();

    const allowed = new Set([
      "Title",
      "Description",
      "Image",
      "Duration",
      "Objectives",
      "Requirements",
      "Level",
      "Status",
      "InstructorID",
      "Code",
    ]);

    const fields = [];
    const params = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && allowed.has(key)) {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (!fields.length) return;

    params.push(courseId);
    await db.query(
      `UPDATE course SET ${fields.join(", ")} WHERE CourseID = ?`,
      params
    );
  }

  async updateStatus(courseId, status) {
    const db = await connectDB();
    await db.query(`UPDATE course SET Status = ? WHERE CourseID = ?`, [
      status,
      courseId,
    ]);
  }

  async markAsDeleted(courseId) {
    const db = await connectDB();
    await db.query(`UPDATE course SET Status = 'DELETED' WHERE CourseID = ?`, [
      courseId,
    ]);
  }
}

module.exports = new InstructorCourseRepository();
