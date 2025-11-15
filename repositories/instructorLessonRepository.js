const connectDB = require("../config/db");
const Lesson = require("../models/lesson");

class InstructorLessonRepository {
  async listByUnit(unitId) {
    const db = await connectDB();
    const [rows] = await db.query(
      "SELECT LessonID, Title, Duration, Type, FileURL, UnitID, OrderIndex, Status FROM lesson WHERE UnitID = ? AND Status <> 'DELETED' ORDER BY OrderIndex ASC, LessonID ASC",
      [unitId]
    );
    return rows.map((r) => new Lesson(r));
  }

  async create(unitId, data) {
    const db = await connectDB();
    const { Title, Duration, Type, FileURL, OrderIndex, Status } = data;

    const [result] = await db.query(
      `INSERT INTO lesson (Title, Duration, Type, FileURL, UnitID, OrderIndex, Status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        Title,
        Duration,
        Type,
        FileURL,
        unitId,
        OrderIndex ?? 0,
        Status ?? "VISIBLE",
      ]
    );

    return new Lesson({
      LessonID: result.insertId,
      Title,
      Duration,
      Type,
      FileURL,
      UnitID: unitId,
      OrderIndex: OrderIndex ?? 0,
      Status: Status ?? "VISIBLE",
    });
  }

  async update(lessonId, unitId, data) {
    const db = await connectDB();
    const allowed = new Set([
      "Title",
      "Duration",
      "Type",
      "FileURL",
      "OrderIndex",
      "Status",
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
    params.push(lessonId, unitId);

    await db.query(
      `UPDATE lesson SET ${fields.join(
        ", "
      )} WHERE LessonID = ? AND UnitID = ?`,
      params
    );
  }

  async markAsDeleted(lessonId, unitId) {
    const db = await connectDB();
    await db.query(
      `UPDATE lesson SET Status = 'DELETED' WHERE LessonID = ? AND UnitID = ?`,
      [lessonId, unitId]
    );
  }

  async delete(lessonId, unitId) {
    // chỉ xoá hẳn khi cần cứng (ít dùng)
    const db = await connectDB();
    await db.query("DELETE FROM lesson WHERE LessonID=? AND UnitID=?", [
      lessonId,
      unitId,
    ]);
  }
}

module.exports = new InstructorLessonRepository();
