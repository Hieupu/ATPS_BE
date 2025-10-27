const connectDB = require("../config/db");
const Lesson = require("../models/lesson");

class InstructorLessonRepository {
  async findById(lessonId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT LessonID, Title, Description, Type, FileURL, UnitID, CreatedDate, UpdatedDate
     FROM lesson
     WHERE LessonID = ?`,
      [lessonId]
    );
    return rows.length ? new Lesson(rows[0]) : null;
  }
  async listByUnit(unitId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT LessonID, Title, Description, Type, FileURL, UnitID, CreatedDate, UpdatedDate
       FROM lesson
       WHERE UnitID = ?`,
      [unitId]
    );
    return rows.map((r) => new Lesson(r));
  }

  async create(unitId, data) {
    const db = await connectDB();
    const { Title, Description, Type, FileURL } = data;

    const [result] = await db.query(
      `INSERT INTO lesson (Title, Description, Type, FileURL, UnitID)
       VALUES (?, ?, ?, ?, ?)`,
      [Title, Description, Type, FileURL, unitId]
    );

    const [rows] = await db.query(
      `SELECT LessonID, Title, Description, Type, FileURL, UnitID, CreatedDate, UpdatedDate
       FROM lesson
       WHERE LessonID = ?`,
      [result.insertId]
    );

    return new Lesson(rows[0]);
  }

  async update(lessonId, unitId, data) {
    const db = await connectDB();
    const { Title, Description, Type, FileURL } = data;

    await db.query(
      `UPDATE lesson
       SET Title=?, Description=?, Type=?, FileURL=?
       WHERE LessonID=? AND UnitID=?`,
      [Title, Description, Type, FileURL, lessonId, unitId]
    );
  }

  async delete(lessonId, unitId) {
    const db = await connectDB();
    await db.query(
      `DELETE FROM lesson
       WHERE LessonID=? AND UnitID=?`,
      [lessonId, unitId]
    );
  }
}

module.exports = new InstructorLessonRepository();
