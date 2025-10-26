const connectDB = require("../config/db");
const Lession = require("../models/lession");

class InstructorLessionRepository {
  async listByUnit(unitId) {
    const db = await connectDB();
    const [rows] = await db.query("SELECT * FROM lession WHERE UnitID = ?", [
      unitId,
    ]);
    return rows.map((r) => new Lession(r));
  }

  async create(unitId, sessionId, data) {
    const db = await connectDB();
    const { Title, Description, Type, FileURL } = data;
    const [result] = await db.query(
      "INSERT INTO lession (Title, Description, Type, FileURL, SessionID, UnitID) VALUES (?, ?, ?, ?, ?, ?)",
      [Title, Description, Type, FileURL, sessionId, unitId]
    );
    return new Lession({
      LessionID: result.insertId,
      Title,
      Description,
      Type,
      FileURL,
      SessionID: sessionId,
      UnitID: unitId,
    });
  }

  async update(lessionId, sessionId, unitId, data) {
    const db = await connectDB();
    const { Title, Description, Type, FileURL } = data;
    await db.query(
      "UPDATE lession SET Title=?, Description=?, Type=?, FileURL=? WHERE LessionID=? AND SessionID=? AND UnitID=?",
      [Title, Description, Type, FileURL, lessionId, sessionId, unitId]
    );
  }

  async delete(lessionId, sessionId, unitId) {
    const db = await connectDB();
    await db.query(
      "DELETE FROM lession WHERE LessionID=? AND SessionID=? AND UnitID=?",
      [lessionId, sessionId, unitId]
    );
  }
}

module.exports = new InstructorLessionRepository();
