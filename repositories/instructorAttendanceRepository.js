const connectDB = require("../config/db");
const AttendanceRecord = require("../models/attendanceRecord");

class InstructorAttendanceRepository {
  async getAttendanceSheet(sessionId, classId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT 
          l.LearnerID,
          l.FullName,
          l.ProfilePicture,
          COALESCE(att.Status, 'ABSENT') AS Status
       FROM enrollment e
       JOIN learner l ON e.LearnerID = l.LearnerID
       LEFT JOIN attendance att 
              ON att.LearnerID = l.LearnerID AND att.SessionID = ?
       WHERE e.ClassID = ? AND e.Status = 'Enrolled'
       ORDER BY l.FullName ASC`,
      [sessionId, classId]
    );

    return rows.map(
      (row) =>
        new AttendanceRecord({
          LearnerID: row.LearnerID,
          FullName: row.FullName,
          ProfilePicture: row.ProfilePicture,
          Status: row.Status,
        })
    );
  }

  async saveAttendance(sessionId, attendanceData) {
    const db = await connectDB();

    const [[session]] = await db.query(
      `SELECT Date FROM session WHERE SessionID = ?`,
      [sessionId]
    );

    if (!session) {
      throw new Error("Buổi học không tồn tại");
    }

    const sessionDate = session.Date;

    await db.query(`DELETE FROM attendance WHERE SessionID = ?`, [sessionId]);

    const presentList = attendanceData
      .filter((r) => r.Status === "PRESENT")
      .map((r) => [r.LearnerID, sessionId, "PRESENT", sessionDate]);

    if (presentList.length > 0) {
      await db.query(
        `INSERT INTO attendance (LearnerID, SessionID, Status, Date) VALUES ?`,
        [presentList]
      );
    }

    return { success: true };
  }
}

module.exports = new InstructorAttendanceRepository();
