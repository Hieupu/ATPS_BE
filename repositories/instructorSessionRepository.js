const connectDB = require("../config/db");
const Session = require("../models/session");

class InstructorSessionRepository {
  async listByInstructor(instructorId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT SessionID, Title, Description, InstructorID, ClassID, TimeslotID, CreatedDate, UpdatedDate
       FROM session
       WHERE InstructorID = ?`,
      [instructorId]
    );
    return rows.map((r) => new Session(r));
  }

  async findById(sessionId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT SessionID, Title, Description, InstructorID, ClassID, TimeslotID, CreatedDate, UpdatedDate
       FROM session
       WHERE SessionID = ?`,
      [sessionId]
    );
    if (!rows.length) return null;
    return new Session(rows[0]);
  }

  async create(data) {
    const db = await connectDB();
    const { Title, Description, InstructorID, ClassID, TimeslotID } = data;
    const [result] = await db.query(
      `INSERT INTO session (Title, Description, InstructorID, ClassID, TimeslotID)
       VALUES (?, ?, ?, ?, ?)`,
      [Title, Description, InstructorID, ClassID, TimeslotID]
    );

    const [rows] = await db.query(
      `SELECT SessionID, Title, Description, InstructorID, ClassID, TimeslotID, CreatedDate, UpdatedDate
       FROM session
       WHERE SessionID = ?`,
      [result.insertId]
    );
    return new Session(rows[0]);
  }

  async update(sessionId, data) {
    const db = await connectDB();

    const fields = [];
    const values = [];

    if (data.Title !== undefined) {
      fields.push("Title=?");
      values.push(data.Title);
    }
    if (data.Description !== undefined) {
      fields.push("Description=?");
      values.push(data.Description);
    }
    if (data.ClassID !== undefined) {
      fields.push("ClassID=?");
      values.push(data.ClassID);
    }
    if (data.TimeslotID !== undefined) {
      fields.push("TimeslotID=?");
      values.push(data.TimeslotID);
    }

    if (!fields.length) return;

    values.push(sessionId);

    await db.query(
      `UPDATE session SET ${fields.join(", ")} WHERE SessionID=?`,
      values
    );
  }

  async delete(sessionId) {
    const db = await connectDB();
    await db.query("DELETE FROM session WHERE SessionID=?", [sessionId]);
  }
}

module.exports = new InstructorSessionRepository();
