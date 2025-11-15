const connectDB = require("../config/db");
const Material = require("../models/material");

class InstructorMaterialRepository {
  async findById(materialId) {
    const db = await connectDB();
    const [rows] = await db.query(
      "SELECT MaterialID, CourseID, Title, FileURL, Status FROM material WHERE MaterialID = ?",
      [materialId]
    );
    if (!rows.length) return null;
    return new Material(rows[0]);
  }

  async listByCourse(courseId) {
    const db = await connectDB();
    const [rows] = await db.query(
      "SELECT MaterialID, CourseID, Title, FileURL, Status FROM material WHERE CourseID = ? AND Status <> 'DELETED' ORDER BY MaterialID DESC",
      [courseId]
    );
    return rows.map((r) => new Material(r));
  }

  async create(courseId, data) {
    const db = await connectDB();
    const { Title, FileURL, Status } = data;
    const [result] = await db.query(
      "INSERT INTO material (CourseID, Title, FileURL, Status) VALUES (?, ?, ?, ?)",
      [courseId, Title ?? "", FileURL ?? "", Status ?? "VISIBLE"]
    );
    return new Material({
      MaterialID: result.insertId,
      CourseID: courseId,
      Title: Title ?? "",
      FileURL: FileURL ?? "",
      Status: Status ?? "VISIBLE",
    });
  }

  async update(materialId, data) {
    const db = await connectDB();
    const allowed = new Set(["Title", "FileURL", "Status"]);
    const fields = [];
    const params = [];

    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined && allowed.has(k)) {
        fields.push(`${k} = ?`);
        params.push(v);
      }
    }
    if (!fields.length) return;

    params.push(materialId);
    await db.query(
      `UPDATE material SET ${fields.join(", ")} WHERE MaterialID = ?`,
      params
    );
  }

  async markAsDeleted(materialId) {
    const db = await connectDB();
    await db.query(
      "UPDATE material SET Status = 'DELETED' WHERE MaterialID = ?",
      [materialId]
    );
  }
  //chưa cần
  async delete(materialId) {
    const db = await connectDB();
    await db.query("DELETE FROM material WHERE MaterialID = ?", [materialId]);
  }
}

module.exports = new InstructorMaterialRepository();
