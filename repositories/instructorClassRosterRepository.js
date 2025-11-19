const connectDB = require("../config/db");
const Enrollment = require("../models/enrollment");
const Learner = require("../models/learner");

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

       FROM atps.enrollment e
       JOIN atps.learner l 
         ON e.LearnerID = l.LearnerID

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
}

module.exports = new InstructorClassRosterRepository();
