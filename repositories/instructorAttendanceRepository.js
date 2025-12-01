const connectDB = require("../config/db");

class InstructorAttendanceRepository {
  async getAttendanceSheet(sessionId, classId) {
    const db = await connectDB();

    const [rows] = await db.query(
      `SELECT 
          l.LearnerID,
          l.FullName,
          l.ProfilePicture,
          att.Status,
          att.Note
       FROM enrollment e
       JOIN learner l ON e.LearnerID = l.LearnerID
       LEFT JOIN attendance att 
             ON att.LearnerID = l.LearnerID AND att.SessionID = ?
       WHERE e.ClassID = ? 
  
       AND e.Status = 'Enrolled' 
       ORDER BY l.FullName ASC`,
      [sessionId, classId]
    );

    return rows.map((row) => ({
      learnerId: row.LearnerID,
      fullName: row.FullName,
      avatar: row.ProfilePicture,
      status: row.Status || "PRESENT",
      note: row.Note || "",
    }));
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

    const insertData = attendanceData.map((r) => [
      r.LearnerID,
      sessionId,
      r.Status,
      sessionDate,
      r.note || null,
    ]);

    if (insertData.length > 0) {
      await db.query(
        `INSERT INTO attendance (LearnerID, SessionID, Status, Date, note) VALUES ?`,
        [insertData]
      );
    }

    return { success: true };
  }
}

module.exports = new InstructorAttendanceRepository();
