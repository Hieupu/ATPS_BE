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
      status: row.Status || "ABSENT",
      note: row.Note || "",
    }));
  }

  async saveAttendance(sessionId, attendanceData) {
    const db = await connectDB();
    const connection = await db.getConnection(); // Lấy connection để dùng transaction
    await connection.beginTransaction(); // BẮT ĐẦU TRANSACTION

    try {
      const [[session]] = await connection.query(
        `SELECT Date FROM session WHERE SessionID = ?`,
        [sessionId]
      );
      if (!session) throw new Error("Buổi học không tồn tại");

      // Xóa cũ -> Thêm mới (An toàn nhờ Transaction)
      await connection.query(`DELETE FROM attendance WHERE SessionID = ?`, [
        sessionId,
      ]);

      const insertData = attendanceData.map((r) => [
        r.LearnerID,
        sessionId,
        r.Status,
        session.Date,
        r.note || null,
      ]);

      if (insertData.length > 0) {
        await connection.query(
          `INSERT INTO attendance (LearnerID, SessionID, Status, Date, Note) VALUES ?`,
          [insertData]
        );
      }

      await connection.commit(); // LƯU THÀNH CÔNG
      return { success: true };
    } catch (error) {
      await connection.rollback(); // HOÀN TÁC NẾU LỖI
      throw error;
    } finally {
      connection.release(); // TRẢ CONNECTION
    }
  }
}

module.exports = new InstructorAttendanceRepository();
