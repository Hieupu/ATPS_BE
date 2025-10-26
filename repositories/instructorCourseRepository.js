const connectDB = require("../config/db");
const Course = require("../models/course");

class InstructorCourseRepository {
  async findById(courseId) {
    const db = await connectDB();
    const [rows] = await db.query("SELECT * FROM course WHERE CourseID = ?", [
      courseId,
    ]);
    if (!rows.length) return null;
    return new Course(rows[0]);
  }

  async findByInstructor(instructorId) {
    const db = await connectDB();
    const [rows] = await db.query(
      "SELECT * FROM course WHERE InstructorID = ? ORDER BY CourseID DESC",
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
      Duration,
      TuitionFee,
      Status = "draft",
    } = courseData;

    const [result] = await db.query(
      "INSERT INTO course (InstructorID, Title, Description, Duration, TuitionFee, Status) VALUES (?, ?, ?, ?, ?, ?)",
      [InstructorID, Title, Description, Duration, TuitionFee, Status]
    );

    return new Course({
      CourseID: result.insertId,
      InstructorID,
      Title,
      Description,
      Duration,
      TuitionFee,
      Status,
    });
  }

  async update(courseId, data) {
    const db = await connectDB();
    const { Title, Description, Duration, TuitionFee } = data;
    await db.query(
      "UPDATE course SET Title=?, Description=?, Duration=?, TuitionFee=? WHERE CourseID=?",
      [Title, Description, Duration, TuitionFee, courseId]
    );
  }

  async updateStatus(courseId, status) {
    const db = await connectDB();
    await db.query("UPDATE course SET Status=? WHERE CourseID=?", [
      status,
      courseId,
    ]);
  }

  async delete(courseId) {
    const db = await connectDB();
    await db.query("DELETE FROM course WHERE CourseID=?", [courseId]);
  }
}

module.exports = new InstructorCourseRepository();
