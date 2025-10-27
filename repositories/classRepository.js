const connectDB = require("../config/db");
const Class = require("../models/class");

class ClassRepository {
  async findById(classId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT ClassID, CourseID, InstructorID, ClassName, StartDate, EndDate
       FROM class
       WHERE ClassID = ?`,
      [classId]
    );
    if (!rows.length) return null;
    return new Class(rows[0]);
  }

  async listByCourse(courseId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT ClassID, CourseID, InstructorID, ClassName, StartDate, EndDate
       FROM class
       WHERE CourseID = ?`,
      [courseId]
    );
    return rows.map((r) => new Class(r));
  }

  async listByInstructor(instructorId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT ClassID, CourseID, InstructorID, ClassName, StartDate, EndDate
       FROM class
       WHERE InstructorID = ?`,
      [instructorId]
    );
    return rows.map((r) => new Class(r));
  }
}

module.exports = new ClassRepository();
