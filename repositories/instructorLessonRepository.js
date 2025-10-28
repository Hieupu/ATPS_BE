const connectDB = require("../config/db");
const Lesson = require("../models/lesson");

class InstructorLessonRepository {
  async listByUnit(unitId) {
    const db = await connectDB();
    const [rows] = await db.query("SELECT * FROM lesson WHERE UnitID = ?", [
      unitId,
    ]);
    return rows.map((r) => new Lesson(r));
  }

  async create(unitId, data) {
    const db = await connectDB();
    const { Title, Time, Type, FileURL } = data;
    const [result] = await db.query(
      "INSERT INTO lesson (Title, Time, Type, FileURL, UnitID) VALUES (?, ?, ?, ?, ?)",
      [Title, Time, Type, FileURL, unitId]
    );
    return new Lesson({
      LessonID: result.insertId,
      Title,
      Time,
      Type,
      FileURL,
      UnitID: unitId,
    });
  }

  async update(lessonId, unitId, data) {
    const db = await connectDB();
    const { Title, Time, Type, FileURL } = data;
    await db.query(
      "UPDATE lesson SET Title=?, Time=?, Type=?, FileURL=? WHERE LessonID=? AND UnitID=?",
      [Title, Time, Type, FileURL, lessonId, unitId]
    );
  }

  async delete(lessonId, unitId) {
    const db = await connectDB();
    await db.query("DELETE FROM lesson WHERE LessonID=? AND UnitID=?", [
      lessonId,
      unitId,
    ]);
  }
}

module.exports = new InstructorLessonRepository();
