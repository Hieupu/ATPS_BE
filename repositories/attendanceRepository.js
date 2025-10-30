const connectDB = require("../config/db");

class AttendanceRepository {
  async getLearnerAttendance(learnerId) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT 
          a.AttendanceID,
          a.Status,
          a.Date,
          s.Title as SessionTitle,
          s.Description as SessionDescription,
          s.SessionID,
          i.InstructorID,
          i.FullName as InstructorName,
          c.Title as CourseTitle,
          cl.Name as ClassName
         FROM attendance a
         INNER JOIN session s ON a.SessionID = s.SessionID
         INNER JOIN instructor i ON s.InstructorID = i.InstructorID
         LEFT JOIN class cl ON s.ClassID = cl.ClassID
         LEFT JOIN course c ON cl.CourseID = c.CourseID
         WHERE a.LearnerID = ?
         ORDER BY a.Date DESC`,
        [learnerId]
      );
      return rows;
    } catch (error) {
      console.error("Database error in getLearnerAttendance:", error);
      throw error;
    }
  }

  async getAttendanceStats(learnerId, sessionId = null) {
    try {
      const db = await connectDB();
      let query = `
        SELECT 
          COUNT(*) as TotalSessions,
          SUM(CASE WHEN a.Status = 'Present' THEN 1 ELSE 0 END) as PresentCount,
          SUM(CASE WHEN a.Status = 'Absent' THEN 1 ELSE 0 END) as AbsentCount,
          SUM(CASE WHEN a.Status = 'Late' THEN 1 ELSE 0 END) as LateCount,
          ROUND((SUM(CASE WHEN a.Status = 'Present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2) as AttendanceRate
        FROM attendance a
        WHERE a.LearnerID = ?
      `;

      const params = [learnerId];

      if (sessionId) {
        query += ` AND a.SessionID = ?`;
        params.push(sessionId);
      }

      const [rows] = await db.query(query, params);
      return rows[0];
    } catch (error) {
      console.error("Database error in getAttendanceStats:", error);
      throw error;
    }
  }

  async updateAttendance(attendanceId, status) {
    try {
      const db = await connectDB();
      const [result] = await db.query(
        `UPDATE attendance SET Status = ? WHERE AttendanceID = ?`,
        [status, attendanceId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Database error in updateAttendance:", error);
      throw error;
    }
  }

  async getSessionAttendance(sessionId) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT 
          e.EnrollmentID,
          l.LearnerID,
          l.FullName,
          l.ProfilePicture,
          s.SessionID,
          s.Title as SessionTitle,
          a.AttendanceID,
          a.Status,
          a.Date as AttendanceDate
         FROM enrollment e
         INNER JOIN learner l ON e.LearnerID = l.LearnerID
         INNER JOIN class cl ON e.ClassID = cl.ClassID
         INNER JOIN session s ON cl.ClassID = s.ClassID AND s.SessionID = ?
         LEFT JOIN attendance a ON a.LearnerID = l.LearnerID AND a.SessionID = s.SessionID
         WHERE e.Status = 'Enrolled'
         ORDER BY l.FullName`,
        [sessionId]
      );
      return rows;
    } catch (error) {
      console.error("Database error in getSessionAttendance:", error);
      throw error;
    }
  }
}

module.exports = new AttendanceRepository();
