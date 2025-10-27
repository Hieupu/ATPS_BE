const connectDB = require("../config/db");
const Unit = require("../models/unit");

class InstructorUnitRepository {
  async listByCourse(courseId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT UnitID, CourseID, Title, Description, Duration, CreatedDate, UpdatedDate
       FROM unit
       WHERE CourseID = ?`,
      [courseId]
    );
    return rows.map((r) => new Unit(r));
  }

  async findById(unitId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT UnitID, CourseID, Title, Description, Duration, CreatedDate, UpdatedDate
       FROM unit
       WHERE UnitID = ?`,
      [unitId]
    );
    if (!rows.length) return null;
    return new Unit(rows[0]);
  }

  async create(courseId, data) {
    const db = await connectDB();
    const { Title, Description, Duration } = data; // Duration: string theo DB
    const [result] = await db.query(
      `INSERT INTO unit (CourseID, Title, Description, Duration)
       VALUES (?, ?, ?, ?)`,
      [courseId, Title, Description, Duration]
    );

    // Lấy lại row đầy đủ để có CreatedDate/UpdatedDate
    const [rows] = await db.query(
      `SELECT UnitID, CourseID, Title, Description, Duration, CreatedDate, UpdatedDate
       FROM unit
       WHERE UnitID = ?`,
      [result.insertId]
    );
    return new Unit(rows[0]);
  }

  async update(unitId, data) {
    const db = await connectDB();
    const { Title, Description, Duration } = data;
    await db.query(
      `UPDATE unit
       SET Title = ?, Description = ?, Duration = ?
       WHERE UnitID = ?`,
      [Title, Description, Duration, unitId]
    );
  }

  async delete(unitId) {
    const db = await connectDB();
    await db.query(`DELETE FROM unit WHERE UnitID = ?`, [unitId]);
  }
}

module.exports = new InstructorUnitRepository();
