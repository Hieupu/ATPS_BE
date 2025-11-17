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
        c.Ojectives,
        c.Requirements,
        c.Level,
        c.Status,
        c.Code,
        i.FullName AS InstructorName
     FROM atps.course c
     LEFT JOIN atps.instructor i 
        ON c.InstructorID = i.InstructorID
     WHERE c.CourseID = ?`,
      [courseId]
    );

    if (!rows.length) return null;
    return new Course(rows[0]);
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
        c.Ojectives,
        c.Requirements,
        c.Level,
        c.Status,
        c.Code,
        i.FullName AS InstructorName
     FROM atps.course c
     LEFT JOIN atps.instructor i 
        ON c.InstructorID = i.InstructorID
     WHERE c.InstructorID = ?
       AND c.Status <> 'DELETED'
     ORDER BY c.CourseID DESC`,
      [instructorId]
    );
    return rows.map((r) => new Course(r));
  }

  async create(courseData) {
    const db = await connectDB();
    const {
      InstructorID,
      Title,
      Description,
      Image,
      Duration,
      Ojectives,
      Requirements,
      Level,
      Status,
      Code,
    } = courseData;

    const _Title = Title ?? "";
    const _Description = Description ?? "";
    const _Image = Image ?? "";
    const _Duration = Duration ?? 0;
    const _Ojectives = Ojectives ?? "";
    const _Requirements = Requirements ?? "";
    const _Level = Level ?? "BEGINNER";
    const _Status = Status ?? "DRAFT";
    const _Code = Code; // không tự sinh, để DB báo lỗi nếu thiếu

    const [result] = await db.query(
      `INSERT INTO course
        (InstructorID, Title, Description, Image, Duration, Ojectives, Requirements, Level, Status, Code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        InstructorID,
        _Title,
        _Description,
        _Image,
        _Duration,
        _Ojectives,
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
      Ojectives: _Ojectives,
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
      "Ojectives",
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
