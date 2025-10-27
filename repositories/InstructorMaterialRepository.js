const connectDB = require("../config/db");
const Material = require("../models/material");

class InstructorMaterialRepository {
  async listByCourse(courseId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT MaterialID, CourseID, Title, FileURL, Status, CreatedDate, UpdatedDate
       FROM material
       WHERE CourseID = ?`,
      [courseId]
    );
    return rows.map((r) => new Material(r));
  }

  async findById(materialId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT MaterialID, CourseID, Title, FileURL, Status, CreatedDate, UpdatedDate
       FROM material
       WHERE MaterialID = ?`,
      [materialId]
    );
    return rows.length ? new Material(rows[0]) : null;
  }

  async create(courseId, data) {
    const db = await connectDB();
    const { Title, FileURL, Status = "active" } = data;
    const [result] = await db.query(
      `INSERT INTO material (CourseID, Title, FileURL, Status)
       VALUES (?, ?, ?, ?)`,
      [courseId, Title, FileURL, Status]
    );

    const [rows] = await db.query(
      `SELECT MaterialID, CourseID, Title, FileURL, Status, CreatedDate, UpdatedDate
       FROM material
       WHERE MaterialID = ?`,
      [result.insertId]
    );
    return new Material(rows[0]);
  }

  async update(materialId, data) {
    const db = await connectDB();
    const { Title, FileURL, Status } = data;
    await db.query(
      `UPDATE material
       SET Title = ?, FileURL = ?, Status = ?
       WHERE MaterialID = ?`,
      [Title, FileURL, Status, materialId]
    );
  }

  async delete(materialId) {
    const db = await connectDB();
    await db.query(
      `DELETE FROM material
       WHERE MaterialID = ?`,
      [materialId]
    );
  }
}

module.exports = new InstructorMaterialRepository();
