const connectDB = require("../config/db");
const Timeslot = require("../models/timeslot");

class InstructorTimeslotRepository {
  async listByCourse(courseId) {
    const db = await connectDB();
    const [rows] = await db.query("SELECT * FROM timeslot WHERE CourseID=?", [
      courseId,
    ]);
    return rows.map((r) => new Timeslot(r));
  }

  async create(courseId, sessionId, data) {
    const db = await connectDB();
    const { Date, StartTime, EndTime } = data;
    const [result] = await db.query(
      "INSERT INTO timeslot (CourseID, LessonID, Date, StartTime, EndTime) VALUES (?, ?, ?, ?, ?)",
      [courseId, sessionId, Date, StartTime, EndTime]
    );
    return new Timeslot({
      TimeslotID: result.insertId,
      CourseID: courseId,
      LessonID: sessionId,
      Date,
      StartTime,
      EndTime,
    });
  }

  async update(timeslotId, data) {
    const db = await connectDB();
    const { Date, StartTime, EndTime } = data;
    await db.query(
      "UPDATE timeslot SET Date=?, StartTime=?, EndTime=? WHERE TimeslotID=?",
      [Date, StartTime, EndTime, timeslotId]
    );
  }

  async delete(timeslotId) {
    const db = await connectDB();
    await db.query("DELETE FROM timeslot WHERE TimeslotID=?", [timeslotId]);
  }
}

module.exports = new InstructorTimeslotRepository();
