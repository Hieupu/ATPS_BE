const connectDB = require("../config/db");

class AttendanceRepository {
async getLearnerAttendance(learnerId) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT 
          COALESCE(a.AttendanceID, NULL) as AttendanceID,
          COALESCE(a.Status, 'notyet') as Status,
          s.Date as SessionDate,
          s.SessionID,
          s.Title as SessionTitle,
          s.Description as SessionDescription,
          ts.StartTime,
          ts.EndTime,
          ts.Day as DayOfWeek,
          i.InstructorID,
          i.FullName as InstructorName,
          i.ProfilePicture as InstructorAvatar,
          c.CourseID,
          c.Title as CourseTitle,
          c.Image as CourseImage,
          cl.ClassID,
          cl.Name as ClassName,
          cl.ZoomID,
          cl.Zoompass,
          (SELECT COUNT(*) FROM attendance a2 
           INNER JOIN session s2 ON a2.SessionID = s2.SessionID 
           WHERE s2.SessionID = s.SessionID AND a2.Status = 'Present') as TotalPresent,
          (SELECT COUNT(*) FROM attendance a2 
           INNER JOIN session s2 ON a2.SessionID = s2.SessionID 
           WHERE s2.SessionID = s.SessionID) as TotalLearners
         FROM session s
         LEFT JOIN attendance a ON s.SessionID = a.SessionID AND a.LearnerID = ?
         LEFT JOIN timeslot ts ON s.TimeslotID = ts.TimeslotID
         INNER JOIN instructor i ON s.InstructorID = i.InstructorID
         LEFT JOIN class cl ON s.ClassID = cl.ClassID
         LEFT JOIN course c ON cl.CourseID = c.CourseID
         WHERE EXISTS (
           SELECT 1 FROM enrollment e 
           WHERE e.ClassID = s.ClassID AND e.LearnerID = ?
         )
         ORDER BY s.Date DESC, ts.StartTime DESC`,
        [learnerId, learnerId]
      );
      return rows;
    } catch (error) {
      console.error("Database error in getLearnerAttendance:", error);
      throw error;
    }
  }

  async getAttendanceStats(learnerId) {
    try {
      const db = await connectDB();
      let query = `
        SELECT 
          COUNT(*) as TotalSessions,
          SUM(CASE WHEN a.Status = 'Present' THEN 1 ELSE 0 END) as PresentCount,
          SUM(CASE WHEN a.Status = 'Absent' THEN 1 ELSE 0 END) as AbsentCount,
          ROUND((SUM(CASE WHEN a.Status = 'Present' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0)), 2) as AttendanceRate
        FROM attendance a
        INNER JOIN session s ON a.SessionID = s.SessionID
        WHERE a.LearnerID = ?
      `;

      const params = [learnerId];

      const [rows] = await db.query(query, params);
      return rows[0];
    } catch (error) {
      console.error("Database error in getAttendanceStats:", error);
      throw error;
    }
  }

  async getAttendanceByClass(learnerId) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT 
          cl.ClassID,
          cl.Name as ClassName,
          c.CourseID,
          c.Title as CourseTitle,
          c.Image as CourseImage,
          COUNT(DISTINCT s.SessionID) as TotalSessions,
          SUM(CASE WHEN a.Status = 'Present' THEN 1 ELSE 0 END) as PresentCount,
          SUM(CASE WHEN a.Status = 'Absent' THEN 1 ELSE 0 END) as AbsentCount,
          SUM(CASE WHEN a.Status = 'Late' THEN 1 ELSE 0 END) as LateCount,
          ROUND((SUM(CASE WHEN a.Status = 'Present' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(DISTINCT s.SessionID), 0)), 2) as AttendanceRate,
          MIN(s.Date) as FirstSession,
          MAX(s.Date) as LastSession
         FROM enrollment e
         INNER JOIN class cl ON e.ClassID = cl.ClassID
         INNER JOIN course c ON cl.CourseID = c.CourseID
         LEFT JOIN session s ON s.ClassID = cl.ClassID
         LEFT JOIN attendance a ON a.SessionID = s.SessionID AND a.LearnerID = e.LearnerID
         WHERE e.LearnerID = ?
         AND e.Status IN ('active', 'completed', 'enrolled')
         GROUP BY cl.ClassID, cl.Name, c.CourseID, c.Title, c.Image
         HAVING TotalSessions > 0
         ORDER BY MAX(s.Date) DESC`,
        [learnerId]
      );
      
      console.log(`Query returned ${rows.length} classes for learner ${learnerId}`);
      
      return rows;
    } catch (error) {
      console.error("Database error in getAttendanceByClass:", error);
      throw error;
    }
  }

  async getAttendanceCalendar(learnerId, month, year) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT 
          a.AttendanceID,
          a.Status,
          s.Date as SessionDate,
          ts.StartTime,
          ts.EndTime,
          c.Title as CourseTitle,
          cl.Name as ClassName
         FROM attendance a
         INNER JOIN session s ON a.SessionID = s.SessionID
         LEFT JOIN timeslot ts ON s.TimeslotID = ts.TimeslotID
         INNER JOIN class cl ON s.ClassID = cl.ClassID
         INNER JOIN course c ON cl.CourseID = c.CourseID
         WHERE a.LearnerID = ?
         AND MONTH(s.Date) = ?
         AND YEAR(s.Date) = ?
         ORDER BY s.Date ASC, ts.StartTime ASC`,
        [learnerId, month, year]
      );
      return rows;
    } catch (error) {
      console.error("Database error in getAttendanceCalendar:", error);
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

  async recordAttendancenotJoin(sessionId, date, status, note) {
    try {
      const db = await connectDB();
      
      const [rows] = await db.query(
        `SELECT l.LearnerID FROM learner l JOIN enrollment e ON e.LearnerID = l.LearnerID
        JOIN class c ON c.ClassID = e.ClassID JOIN session s ON s.ClassID = c.ClassID
        LEFT JOIN attendance a
              ON a.LearnerID = l.LearnerID
              AND a.SessionID = s.SessionID
        WHERE s.SessionID = ?
          AND a.AttendanceID IS NULL;`,
        [sessionId]
      );

      for (const row of rows) {
        await db.query(
          `INSERT INTO attendance (LearnerID, SessionID, Status, Date, note)
          VALUES (?, ?, ?, ?, ?)`,
          [row.LearnerID, sessionId, status, date, note]
        );
      }

      return { success: true, message: "Attendance for not joined recorded" };
    } catch (error) {
      console.error("Attendance recording error for not joined:", error);
      return { success: false, message: "Failed to record attendance for not joined" };
    }
  }

  async recordAttendance(learnerId, sessionId, status, note) {
    try {
      const db = await connectDB();

      if (!learnerId || !sessionId) {
        return { success: false, message: "LearnerID and SessionID are required" };
      }

      // Check existing attendance
      const [existing] = await db.query(
        `SELECT * FROM attendance 
        WHERE LearnerID = ? AND SessionID = ?`,
        [learnerId, sessionId]
      );

      const now = new Date();

      if (existing.length === 0) {
        // INSERT NEW
        await db.query(
          `INSERT INTO attendance (LearnerID, SessionID, Status, Date, note)
          VALUES (?, ?, ?, ?, ?)`,
          [learnerId, sessionId, status, now, note]
        );

        return { success: true, message: "Attendance created" };
      }

      // UPDATE EXISTING
      await db.query(
        `UPDATE attendance 
        SET Status = ?, Date = ?, note = ?
        WHERE LearnerID = ? AND SessionID = ?`,
        [status, now, note, learnerId, sessionId]
      );

      return { success: true, message: "Attendance updated" };
    } catch (error) {
      console.error("Attendance updating error:", error);
      return { success: false, message: "Failed to update attendance" };
    }
  }

  async deleteBySessionId(sessionId) {
    try {
      const db = await connectDB();
      const [result] = await db.query(
        `DELETE FROM attendance WHERE SessionID = ?`,
        [sessionId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Database error in deleteBySessionId:", error);
      throw error;
    }
  }

  async getAttendanceByInstructor(instructorId) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT 
          a.AttendanceID,
          a.Status,
          a.Date as AttendanceDate,
          a.note,
          l.LearnerID,
          l.FullName as LearnerName,
          l.ProfilePicture as LearnerAvatar,
          s.SessionID,
          s.Title as SessionTitle,
          s.Description as SessionDescription,
          s.Date as SessionDate,
          ts.StartTime,
          ts.EndTime,
          ts.Day as DayOfWeek,
          c.ClassID,
          c.Name as ClassName,
          cr.CourseID,
          cr.Title as CourseTitle,
          i.InstructorID,
          i.FullName as InstructorName
        FROM attendance a
        INNER JOIN session s ON a.SessionID = s.SessionID
        INNER JOIN class c ON s.ClassID = c.ClassID
        INNER JOIN course cr ON c.CourseID = cr.CourseID
        INNER JOIN learner l ON a.LearnerID = l.LearnerID
        INNER JOIN instructor i ON s.InstructorID = i.InstructorID
        LEFT JOIN timeslot ts ON s.TimeslotID = ts.TimeslotID
        WHERE i.InstructorID = ?
        ORDER BY s.Date DESC, ts.StartTime DESC, l.FullName ASC`,
        [instructorId]
      );
      return rows;
    } catch (error) {
      console.error("Database error in getAttendanceByInstructor:", error);
      throw error;
    }
  }

}

module.exports = new AttendanceRepository();