const connectDB = require("../config/db");

class ProgressRepository {
  async getLearnerProgress(learnerId, courseId = null) {
    try {
      const db = await connectDB();
      let query = `
        SELECT 
          e.EnrollmentID,
          c.CourseID,
          c.Title as CourseTitle,
          c.Description as CourseDescription,
          c.Duration,
          i.InstructorID,
          i.FullName as InstructorName,
          i.ProfilePicture as InstructorAvatar,
          e.EnrollmentDate,
          e.Status as EnrollmentStatus,
          COUNT(DISTINCT u.UnitID) as TotalUnits,
          COUNT(DISTINCT se.SessionID) as TotalSessions,
          (
            SELECT COUNT(*) 
            FROM session se2
            WHERE se2.ClassID = cl.ClassID
          ) as TotalSessionsWithSlots,
          COUNT(DISTINCT a.AttendanceID) as AttendedSessions
         FROM enrollment e
         INNER JOIN class cl ON e.ClassID = cl.ClassID
         INNER JOIN course c ON cl.CourseID = c.CourseID
         INNER JOIN instructor i ON c.InstructorID = i.InstructorID
         LEFT JOIN unit u ON c.CourseID = u.CourseID
         LEFT JOIN session se ON cl.ClassID = se.ClassID
         LEFT JOIN attendance a ON a.LearnerID = e.LearnerID
         WHERE e.LearnerID = ? AND e.Status = 'Enrolled'
      `;

      const params = [learnerId];

      if (courseId) {
        query += ` AND c.CourseID = ?`;
        params.push(courseId);
      }

      query += ` GROUP BY e.EnrollmentID, e.ClassID, c.CourseID, c.Title, c.Description, c.Duration, i.InstructorID, i.FullName, i.ProfilePicture, e.EnrollmentDate, e.Status
        ORDER BY e.EnrollmentDate DESC`;

      const [rows] = await db.query(query, params);

      const results = rows.map((row) => {
        const progress =
          row.TotalUnits > 0
            ? Math.round(
                (row.TotalSessions / Math.max(row.TotalUnits, 1)) * 100
              )
            : 0;
        return {
          ...row,
          ProgressPercentage: Math.min(progress, 100),
        };
      });

      return results;
    } catch (error) {
      console.error("Database error in getLearnerProgress:", error);
      throw error;
    }
  }

  async getUnitProgress(learnerId, courseId) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT 
          u.UnitID,
          u.Title as UnitTitle,
          u.Description as UnitDescription,
          u.Duration,
          COUNT(DISTINCT se.SessionID) as SessionCount,
          COUNT(DISTINCT a.AttendanceID) as AttendedCount,
          CASE 
            WHEN COUNT(DISTINCT se.SessionID) > 0 
            THEN ROUND((COUNT(DISTINCT a.AttendanceID) * 100.0 / COUNT(DISTINCT se.SessionID)), 2)
            ELSE 0 
          END as CompletionRate
         FROM unit u
         INNER JOIN course c ON u.CourseID = c.CourseID
         INNER JOIN enrollment e ON c.CourseID = (
           SELECT cl.CourseID FROM class cl WHERE cl.ClassID = e.ClassID
         )
         LEFT JOIN session se ON se.ClassID = e.ClassID
         LEFT JOIN attendance a ON a.LearnerID = e.LearnerID AND a.SessionID = se.SessionID
         WHERE e.LearnerID = ? AND u.CourseID = ?
         GROUP BY u.UnitID, u.Title, u.Description, u.Duration
         ORDER BY u.UnitID`,
        [learnerId, courseId]
      );
      return rows;
    } catch (error) {
      console.error("Database error in getUnitProgress:", error);
      throw error;
    }
  }
}

module.exports = new ProgressRepository();
