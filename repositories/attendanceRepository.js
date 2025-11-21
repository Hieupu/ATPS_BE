const pool = require("../config/db");

class AttendanceRepository {
  async create(attendanceData) {
    // dbver3: attendance trực tiếp có SessionID, không cần sessiontimeslotID
    const { LearnerID, SessionID, Status, Date } = attendanceData;

    const query = `
      INSERT INTO attendance (LearnerID, SessionID, Status, Date)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      LearnerID,
      SessionID,
      Status,
      Date,
    ]);

    return { AttendanceID: result.insertId, ...attendanceData };
  }

  async findById(id) {
    // dbver3: attendance trực tiếp có SessionID
    const query = `
      SELECT 
        a.AttendanceID,
        a.LearnerID,
        a.SessionID,
        a.Status,
        a.Date,
        l.FullName as learnerName,
        s.Title as sessionTitle,
        s.Date as sessionDate,
        t.StartTime,
        t.EndTime,
        c.Name as className,
        co.Title as courseTitle,
        i.FullName as instructorName
      FROM attendance a
      LEFT JOIN learner l ON a.LearnerID = l.LearnerID
      LEFT JOIN session s ON a.SessionID = s.SessionID
      LEFT JOIN timeslot t ON s.TimeslotID = t.TimeslotID
      LEFT JOIN \`class\` c ON s.ClassID = c.ClassID
      LEFT JOIN course co ON c.CourseID = co.CourseID
      LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
      WHERE a.AttendanceID = ?
    `;

    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  // dbver3: Thay đổi từ findBySessionTimeslotId sang findBySessionId
  async findBySessionId(sessionId) {
    const query = `
      SELECT 
        a.AttendanceID,
        a.LearnerID,
        a.SessionID,
        a.Status,
        a.Date,
        l.FullName as learnerName,
        s.Title as sessionTitle,
        s.Date as sessionDate,
        t.StartTime,
        t.EndTime,
        c.Name as className
      FROM attendance a
      LEFT JOIN learner l ON a.LearnerID = l.LearnerID
      LEFT JOIN session s ON a.SessionID = s.SessionID
      LEFT JOIN timeslot t ON s.TimeslotID = t.TimeslotID
      LEFT JOIN \`class\` c ON s.ClassID = c.ClassID
      WHERE a.SessionID = ?
      ORDER BY l.FullName
    `;

    const [rows] = await pool.execute(query, [sessionId]);
    return rows;
  }

  // Alias for backward compatibility
  async findBySessionTimeslotId(sessionId) {
    return this.findBySessionId(sessionId);
  }

  async findByLearnerId(learnerId, classId = null) {
    // dbver3: attendance trực tiếp có SessionID
    let query = `
      SELECT 
        a.AttendanceID,
        a.LearnerID,
        a.SessionID,
        a.Status,
        a.Date,
        s.Title as sessionTitle,
        s.Date as sessionDate,
        t.StartTime,
        t.EndTime,
        c.Name as className,
        c.ClassID,
        co.Title as courseTitle,
        i.FullName as instructorName
      FROM attendance a
      LEFT JOIN session s ON a.SessionID = s.SessionID
      LEFT JOIN timeslot t ON s.TimeslotID = t.TimeslotID
      LEFT JOIN \`class\` c ON s.ClassID = c.ClassID
      LEFT JOIN course co ON c.CourseID = co.CourseID
      LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
      WHERE a.LearnerID = ?
    `;

    const params = [learnerId];

    if (classId) {
      query += ` AND c.ClassID = ?`;
      params.push(classId);
    }

    query += ` ORDER BY s.Date DESC, t.StartTime DESC`;

    const [rows] = await pool.execute(query, params);
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
    // dbver3: attendance trực tiếp có SessionID, không cần sessiontimeslot
    const query = `
      DELETE FROM attendance
      WHERE SessionID = ?
    `;
    const [result] = await pool.execute(query, [sessionId]);
    return result.affectedRows;
  }

  async getStatisticsByClass(classId) {
    // dbver3: attendance trực tiếp có SessionID
    const query = `
      SELECT 
        COUNT(*) as totalSessions,
        SUM(CASE WHEN a.Status = 'Present' THEN 1 ELSE 0 END) as presentCount,
        SUM(CASE WHEN a.Status = 'Absent' THEN 1 ELSE 0 END) as absentCount,
        SUM(CASE WHEN a.Status = 'Late' THEN 1 ELSE 0 END) as lateCount,
        ROUND((SUM(CASE WHEN a.Status = 'Present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as attendanceRate
      FROM attendance a
      INNER JOIN session s ON a.SessionID = s.SessionID
      WHERE s.ClassID = ?
    `;

    const [rows] = await pool.execute(query, [classId]);
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
