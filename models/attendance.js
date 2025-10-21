const pool = require("../config/db");

const Attendance = {
  // Tạo attendance mới
  create: async (attendanceData) => {
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
  },

  // Lấy attendance theo ID
  findById: async (id) => {
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

    const [attendances] = await pool.execute(query, [id]);
    return attendances.length > 0 ? attendances[0] : null;
  },

  // Lấy attendance theo LearnerID
  findByLearnerId: async (learnerId) => {
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
        c.Title as courseTitle,
        i.FullName as instructorName
      FROM attendance a
      LEFT JOIN sessiontimeslot st ON a.sessiontimeslotID = st.sessiontimeslotID
      LEFT JOIN session s ON st.SessionID = s.SessionID
      LEFT JOIN timeslot t ON st.TimeslotID = t.TimeslotID
      LEFT JOIN \`class\` cl ON s.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
      WHERE a.LearnerID = ?
      ORDER BY t.Date DESC, t.StartTime DESC
    `;

    const [attendances] = await pool.execute(query, [learnerId]);
    return attendances;
  },

  // Lấy attendance theo sessiontimeslotID
  findBySessionTimeslotId: async (sessionTimeslotId) => {
    const query = `
      SELECT 
        a.AttendanceID,
        a.LearnerID,
        a.sessiontimeslotID,
        a.Status,
        a.Date,
        l.FullName as learnerName,
        l.LearnerID,
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

    const [attendances] = await pool.execute(query, [sessionTimeslotId]);
    return attendances;
  },

  // Lấy attendance theo ClassID
  findByClassId: async (classId) => {
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
      WHERE s.ClassID = ?
      ORDER BY t.Date DESC, t.StartTime DESC
    `;

    const [attendances] = await pool.execute(query, [classId]);
    return attendances;
  },

  // Cập nhật attendance
  update: async (id, attendanceData) => {
    const { Status } = attendanceData;

    const query = `
      UPDATE attendance 
      SET Status = ?
      WHERE AttendanceID = ?
    `;

    const [result] = await pool.execute(query, [Status || null, id]);

    if (result.affectedRows === 0) {
      return null;
    }

    return { AttendanceID: id, ...attendanceData };
  },

  // Xóa attendance
  delete: async (id) => {
    const query = `DELETE FROM attendance WHERE AttendanceID = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  },

  // Kiểm tra attendance có tồn tại không
  exists: async (id) => {
    const [rows] = await pool.execute(
      `SELECT AttendanceID FROM attendance WHERE AttendanceID = ?`,
      [id]
    );
    return rows.length > 0;
  },

  // Lấy thống kê attendance theo ClassID
  getAttendanceStats: async (classId) => {
    const query = `
      SELECT 
        s.SessionID,
        s.Title as sessionTitle,
        t.Date as sessionDate,
        t.StartTime,
        t.EndTime,
        COUNT(a.AttendanceID) as totalAttendance,
        SUM(CASE WHEN a.Status = 'Present' THEN 1 ELSE 0 END) as presentCount,
        SUM(CASE WHEN a.Status = 'Absent' THEN 1 ELSE 0 END) as absentCount,
        SUM(CASE WHEN a.Status = 'Late' THEN 1 ELSE 0 END) as lateCount,
        SUM(CASE WHEN a.Status = 'Excused' THEN 1 ELSE 0 END) as excusedCount
      FROM session s
      LEFT JOIN sessiontimeslot st ON s.SessionID = st.SessionID
      LEFT JOIN timeslot t ON st.TimeslotID = t.TimeslotID
      LEFT JOIN attendance a ON st.sessiontimeslotID = a.sessiontimeslotID
      WHERE s.ClassID = ?
      GROUP BY s.SessionID, t.Date, t.StartTime
      ORDER BY t.Date, t.StartTime
    `;

    const [stats] = await pool.execute(query, [classId]);
    return stats;
  },
};

module.exports = Attendance;
