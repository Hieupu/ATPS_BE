const connectDB = require("../config/db");
const Enrollment = require("../models/enrollment");
const Learner = require("../models/learner");
const Session = require("../models/session");

class InstructorClassRosterRepository {
  async listByClassId(classId) {
    const db = await connectDB();

    const [rows] = await db.query(
      `SELECT
          e.EnrollmentID,
          e.EnrollmentDate,
          e.Status AS EnrollmentStatus,
          e.LearnerID,
          e.ClassID,
          e.OrderCode,

          l.LearnerID AS LearnerID_Learner,
          l.FullName,
          l.DateOfBirth,
          l.ProfilePicture,
          l.Job,
          l.Address,
          l.AccID

       FROM enrollment e
       JOIN learner l ON e.LearnerID = l.LearnerID
       WHERE e.ClassID = ?
       ORDER BY l.FullName ASC`,
      [classId]
    );

    return rows.map((row) => {
      const enrollment = new Enrollment({
        EnrollmentID: row.EnrollmentID,
        EnrollmentDate: row.EnrollmentDate,
        Status: row.EnrollmentStatus,
        LearnerID: row.LearnerID,
        ClassID: row.ClassID,
        OrderCode: row.OrderCode,
      });

      const learner = new Learner({
        LearnerID: row.LearnerID_Learner,
        FullName: row.FullName,
        DateOfBirth: row.DateOfBirth,
        ProfilePicture: row.ProfilePicture,
        Job: row.Job,
        Address: row.Address,
        AccID: row.AccID,
      });

      return { enrollment, learner };
    });
  }

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

  // === MỚI: Lịch buổi học – chỉ để hiển thị thời khóa biểu và vào Zoom ===
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

    return rows.map(
      (row) =>
        new Session({
          SessionID: row.SessionID,
          Title: row.Title,
          Date: row.Date,
          ZoomUUID: row.ZoomUUID,
          StartTime: row.StartTime,
          EndTime: row.EndTime,
          Day: row.Day,
        })
    );
  }
}

module.exports = new InstructorClassRosterRepository();
