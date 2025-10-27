const connectDB = require("../config/db");
const Timeslot = require("../models/timeslot");

class InstructorTimeslotRepository {
  async getBySession(sessionId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT t.TimeslotID, t.StartTime, t.EndTime, t.Date
       FROM timeslot t
       JOIN session s ON s.TimeslotID = t.TimeslotID
       WHERE s.SessionID = ?`,
      [sessionId]
    );
    return rows.length ? new Timeslot(rows[0]) : null;
  }

  async create(sessionId, data) {
    const db = await connectDB();
    const { Date, StartTime, EndTime } = data;

    const [result] = await db.query(
      `INSERT INTO timeslot (StartTime, EndTime, Date) VALUES (?, ?, ?)`,
      [StartTime, EndTime, Date]
    );

    await db.query(`UPDATE session SET TimeslotID = ? WHERE SessionID = ?`, [
      result.insertId,
      sessionId,
    ]);

    return new Timeslot({
      TimeslotID: result.insertId,
      StartTime,
      EndTime,
      Date,
    });
  }

  async update(timeslotId, data) {
    const db = await connectDB();
    const { Date, StartTime, EndTime } = data;
    await db.query(
      `UPDATE timeslot SET Date = ?, StartTime = ?, EndTime = ? WHERE TimeslotID = ?`,
      [Date, StartTime, EndTime, timeslotId]
    );
  }

  async delete(timeslotId) {
    const db = await connectDB();

    await db.query(
      `UPDATE session SET TimeslotID = NULL WHERE TimeslotID = ?`,
      [timeslotId]
    );

    await db.query(`DELETE FROM timeslot WHERE TimeslotID = ?`, [timeslotId]);
  }
}

module.exports = new InstructorTimeslotRepository();
