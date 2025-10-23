const pool = require("../config/db");

class AttendanceRepository {
  async create(attendanceData) {
    const { LearnerID, sessiontimeslotID, Status, Date } = attendanceData;

    const query = `
      INSERT INTO attendance (LearnerID, sessiontimeslotID, Status, Date)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      LearnerID,
      sessiontimeslotID,
      Status,
      Date,
    ]);

    return { AttendanceID: result.insertId, ...attendanceData };
  }

  async findById(id) {
    const query = `
      SELECT 
        a.AttendanceID,
        a.LearnerID,
        a.sessiontimeslotID,
        a.Status,
        a.Date,
        l.FullName as learnerName,
        s.Title as sessionTitle,
        t.Date as sessionDate,
        t.StartTime,
        t.EndTime,
        t.Location,
        c.Title as courseTitle,
        i.FullName as instructorName
      FROM attendance a
      LEFT JOIN learner l ON a.LearnerID = l.LearnerID
      LEFT JOIN sessiontimeslot st ON a.sessiontimeslotID = st.sessiontimeslotID
      LEFT JOIN session s ON st.SessionID = s.SessionID
      LEFT JOIN timeslot t ON st.TimeslotID = t.TimeslotID
      LEFT JOIN \`class\` cl ON s.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
      WHERE a.AttendanceID = ?
    `;

    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  async findBySessionTimeslotId(sessionTimeslotId) {
    const query = `
      SELECT 
        a.AttendanceID,
        a.LearnerID,
        a.sessiontimeslotID,
        a.Status,
        a.Date,
        l.FullName as learnerName,
        s.Title as sessionTitle,
        t.Date as sessionDate,
        t.StartTime,
        t.EndTime,
        t.Location
      FROM attendance a
      LEFT JOIN learner l ON a.LearnerID = l.LearnerID
      LEFT JOIN sessiontimeslot st ON a.sessiontimeslotID = st.sessiontimeslotID
      LEFT JOIN session s ON st.SessionID = s.SessionID
      LEFT JOIN timeslot t ON st.TimeslotID = t.TimeslotID
      WHERE a.sessiontimeslotID = ?
      ORDER BY l.FullName
    `;

    const [rows] = await pool.execute(query, [sessionTimeslotId]);
    return rows;
  }

  async findByLearnerId(learnerId) {
    const query = `
      SELECT 
        a.AttendanceID,
        a.LearnerID,
        a.sessiontimeslotID,
        a.Status,
        a.Date,
        s.Title as sessionTitle,
        t.Date as sessionDate,
        t.StartTime,
        t.EndTime,
        t.Location,
        c.Title as courseTitle
      FROM attendance a
      LEFT JOIN sessiontimeslot st ON a.sessiontimeslotID = st.sessiontimeslotID
      LEFT JOIN session s ON st.SessionID = s.SessionID
      LEFT JOIN timeslot t ON st.TimeslotID = t.TimeslotID
      LEFT JOIN \`class\` cl ON s.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      WHERE a.LearnerID = ?
      ORDER BY t.Date DESC, t.StartTime DESC
    `;

    const [rows] = await pool.execute(query, [learnerId]);
    return rows;
  }

  async update(id, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const query = `UPDATE attendance SET ${setClause} WHERE AttendanceID = ?`;
    const [result] = await pool.execute(query, [...values, id]);

    if (result.affectedRows === 0) return null;

    return await this.findById(id);
  }

  async delete(id) {
    const query = `DELETE FROM attendance WHERE AttendanceID = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  async exists(id) {
    const query = `SELECT 1 FROM attendance WHERE AttendanceID = ?`;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0;
  }

  async deleteBySessionId(sessionId) {
    const query = `
      DELETE a FROM attendance a
      INNER JOIN sessiontimeslot st ON a.sessiontimeslotID = st.sessiontimeslotID
      WHERE st.SessionID = ?
    `;
    const [result] = await pool.execute(query, [sessionId]);
    return result.affectedRows;
  }

  async getStatisticsByClass(classId) {
    const query = `
      SELECT 
        COUNT(*) as totalSessions,
        SUM(CASE WHEN a.Status = 'Present' THEN 1 ELSE 0 END) as presentCount,
        SUM(CASE WHEN a.Status = 'Absent' THEN 1 ELSE 0 END) as absentCount,
        SUM(CASE WHEN a.Status = 'Late' THEN 1 ELSE 0 END) as lateCount,
        ROUND((SUM(CASE WHEN a.Status = 'Present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as attendanceRate
      FROM attendance a
      LEFT JOIN sessiontimeslot st ON a.sessiontimeslotID = st.sessiontimeslotID
      LEFT JOIN session s ON st.SessionID = s.SessionID
      WHERE s.ClassID = ?
    `;

    const [rows] = await db.query(query, [classId]);
    return rows[0];
  }

  async getStatisticsByLearner(learnerId) {
    const query = `
      SELECT 
        COUNT(*) as totalSessions,
        SUM(CASE WHEN a.Status = 'Present' THEN 1 ELSE 0 END) as presentCount,
        SUM(CASE WHEN a.Status = 'Absent' THEN 1 ELSE 0 END) as absentCount,
        SUM(CASE WHEN a.Status = 'Late' THEN 1 ELSE 0 END) as lateCount,
        ROUND((SUM(CASE WHEN a.Status = 'Present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as attendanceRate
      FROM attendance a
      WHERE a.LearnerID = ?
    `;

    const [rows] = await pool.execute(query, [learnerId]);
    return rows[0];
  }
}

module.exports = new AttendanceRepository();
