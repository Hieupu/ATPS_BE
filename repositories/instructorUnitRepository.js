const connectDB = require("../config/db");
const Unit = require("../models/unit");
const Assignment = require("../models/assignmentfix");

class InstructorUnitRepository {
  async listByCourse(courseId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT UnitID, CourseID, Title, Description, Duration, Status, OrderIndex
       FROM unit
       WHERE CourseID = ? AND Status <> 'DELETED'
       ORDER BY OrderIndex ASC, UnitID ASC`,
      [courseId]
    );
    return rows.map((r) => new Unit(r));
  }

  async findById(unitId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT UnitID, CourseID, Title, Description, Duration, Status, OrderIndex
       FROM unit
       WHERE UnitID = ?`,
      [unitId]
    );
    if (!rows.length) return null;
    return new Unit(rows[0]);
  }

  async create(courseId, data) {
    const db = await connectDB();
    const { Title, Description, Duration, Status, OrderIndex } = data;

    const [result] = await db.query(
      `INSERT INTO unit (CourseID, Title, Description, Duration, Status, OrderIndex)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        courseId,
        Title ?? "",
        Description ?? "",
        Duration ?? 0,
        Status ?? "VISIBLE",
        OrderIndex ?? 0,
      ]
    );

    return new Unit({
      UnitID: result.insertId,
      CourseID: courseId,
      Title: Title ?? "",
      Description: Description ?? "",
      Duration: Duration ?? 0,
      Status: Status ?? "VISIBLE",
      OrderIndex: OrderIndex ?? 0,
    });
  }

  async update(unitId, data) {
    const db = await connectDB();
    const allowed = new Set([
      "Title",
      "Description",
      "Duration",
      "Status",
      "OrderIndex",
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
    params.push(unitId);

    await db.query(
      `UPDATE unit SET ${fields.join(", ")} WHERE UnitID = ?`,
      params
    );
  }

  async markAsDeleted(unitId) {
    const db = await connectDB();
    await db.query(`UPDATE unit SET Status = 'DELETED' WHERE UnitID = ?`, [
      unitId,
    ]);
  }

  async delete(unitId) {
    const db = await connectDB();
    await db.query("DELETE FROM unit WHERE UnitID = ?", [unitId]);
  }

  async getAssignmentsByUnitId(unitId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `
      SELECT 
        AssignmentID, InstructorID, UnitID, Title, Description, Deadline,
        FileURL, Status, Type, ShowAnswersAfter, MaxDuration, MediaURL
      FROM atps.assignment
      WHERE UnitID = ?
        AND Status != 'deleted'
      ORDER BY AssignmentID ASC
      `,
      [unitId]
    );

    return rows.map((row) => new Assignment(row));
  }
}

module.exports = new InstructorUnitRepository();
