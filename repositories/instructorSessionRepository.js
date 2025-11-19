const connectDB = require("../config/db");
const Session = require("../models/session");

class InstructorSessionRepository {
  async listByInstructor(instructorId) {
    const db = await connectDB();
    const [rows] = await db.query(
      "SELECT * FROM session WHERE InstructorID = ?",
      [instructorId]
    );
    return rows.map((r) => new Session(r));
  }
  async findById(sessionId) {
    const db = await connectDB();
    const [rows] = await db.query("SELECT * FROM session WHERE SessionID = ?", [
      sessionId,
    ]);
    if (!rows.length) return null;
    return new Session(rows[0]);
  }
  
  async create(data) {
    const db = await connectDB();
    const { Title, Description, InstructorID } = data;
    const [result] = await db.query(
      "INSERT INTO session (Title, Description, InstructorID) VALUES (?, ?, ?)",
      [Title, Description, InstructorID]
    );
    return new Session({
      SessionID: result.insertId,
      Title,
      Description,
      InstructorID,
    });
  }

  async update(sessionId, data) {
    const db = await connectDB();
    const { Title, Description } = data;
    await db.query(
      "UPDATE session SET Title=?, Description=? WHERE SessionID=?",
      [Title, Description, sessionId]
    );
  }

  async delete(sessionId) {
    const db = await connectDB();
    await db.query("DELETE FROM session WHERE SessionID=?", [sessionId]);
  }
}

module.exports = new InstructorSessionRepository();
