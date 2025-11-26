const connectDB = require("../config/db");
const Enrollment = require("../models/enrollment");
const Learner = require("../models/learner");
const Session = require("../models/session");

class InstructorClassRosterRepository {
  async getStudents(classId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT l.LearnerID, l.FullName, l.ProfilePicture, a.Email, a.Phone
       FROM enrollment e
       JOIN learner l ON e.LearnerID = l.LearnerID
       JOIN account a ON l.AccID = a.AccID
       WHERE e.ClassID = ? AND e.Status = 'Enrolled'
       ORDER BY l.FullName ASC`,
      [classId]
    );
    return rows.map(
      (row) =>
        new Learner({
          LearnerID: row.LearnerID,
          FullName: row.FullName,
          ProfilePicture: row.ProfilePicture,
          Email: row.Email || null,
          Phone: row.Phone || null,
        })
    );
  }

  //Lịch buổi học – chỉ để hiển thị thời khóa biểu
  async getSessions(classId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT
        s.SessionID,
        s.Title,
        s.Date,
        s.ZoomUUID,
        t.StartTime,
        t.EndTime,
        t.Day
     FROM session s
     JOIN timeslot t ON s.TimeslotID = t.TimeslotID
     WHERE s.ClassID = ?
     ORDER BY s.Date ASC, t.StartTime ASC`,
      [classId]
    );

    return rows.map((row) => ({
      SessionID: row.SessionID,
      sessionId: row.SessionID,
      title: row.Title,
      date: row.Date,
      zoomLink: row.ZoomUUID || null,
      startTime: row.StartTime,
      endTime: row.EndTime,
      dayOfWeek: row.Day,
    }));
  }
  //lấy buổi học theo instructor
  async getSessionsByInstructor(instructorId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT
        s.SessionID,
        s.Title,
        s.Date,
        s.ZoomUUID,
        t.StartTime,
        t.EndTime,
        t.Day,
        c.ClassID,
        c.Name,
        c.CourseID
     FROM session s
     JOIN timeslot t ON s.TimeslotID = t.TimeslotID
     JOIN class c ON s.ClassID = c.ClassID
     WHERE s.InstructorID = ?
     ORDER BY s.Date ASC, t.StartTime ASC`,
      [instructorId]
    );

    return rows.map((row) => ({
      sessionId: row.SessionID,
      title: row.Title,
      date: row.Date,
      zoomLink: row.ZoomUUID || null,
      startTime: row.StartTime,
      endTime: row.EndTime,
      dayOfWeek: row.Day,
      classId: row.ClassID,
      className: row.Name,
      courseId: row.CourseID,
    }));
  }
  async getTotalEnrolledStudents(classId) {
    const db = await connectDB();
    const [[row]] = await db.query(
      `SELECT COUNT(*) AS total 
       FROM enrollment 
       WHERE ClassID = ? AND Status = 'Enrolled'`,
      [classId]
    );
    return Number(row.total) || 0;
  }

  async getAttendedCount(sessionId) {
    const db = await connectDB();
    const [[row]] = await db.query(
      `SELECT COUNT(*) AS count 
       FROM attendance 
       WHERE SessionID = ? AND Status = 'PRESENT'`,
      [sessionId]
    );
    return Number(row.count) || 0;
  }
}

module.exports = new InstructorClassRosterRepository();
