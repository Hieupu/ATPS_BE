const pool = require("../config/db");

const SessionTimeslot = {
  // Tạo sessiontimeslot mới
  create: async (sessionTimeslotData) => {
    const { SessionID, TimeslotID } = sessionTimeslotData;

    const query = `
      INSERT INTO sessiontimeslot (SessionID, TimeslotID)
      VALUES (?, ?)
    `;

    const [result] = await pool.execute(query, [SessionID, TimeslotID]);

    return { sessiontimeslotID: result.insertId, ...sessionTimeslotData };
  },

  // Lấy sessiontimeslot theo ID
  findById: async (id) => {
    const query = `
      SELECT 
        st.sessiontimeslotID,
        st.SessionID,
        st.TimeslotID,
        s.Title as sessionTitle,
        s.Description as sessionDescription,
        s.InstructorID,
        t.StartTime,
        t.EndTime,
        t.Date,
        i.FullName as instructorName
      FROM sessiontimeslot st
      LEFT JOIN session s ON st.SessionID = s.SessionID
      LEFT JOIN timeslot t ON st.TimeslotID = t.TimeslotID
      LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
      WHERE st.sessiontimeslotID = ?
    `;

    const [sessionTimeslots] = await pool.execute(query, [id]);
    return sessionTimeslots.length > 0 ? sessionTimeslots[0] : null;
  },

  // Lấy sessiontimeslots theo ClassID
  findByClassId: async (classId) => {
    const query = `
      SELECT 
        st.sessiontimeslotID,
        st.SessionID,
        st.TimeslotID,
        s.Title as sessionTitle,
        s.Description as sessionDescription,
        s.InstructorID,
        t.StartTime,
        t.EndTime,
        t.Date,
        i.FullName as instructorName,
        c.Title as courseTitle,
        cl.ZoomURL
      FROM sessiontimeslot st
      LEFT JOIN session s ON st.SessionID = s.SessionID
      LEFT JOIN timeslot t ON st.TimeslotID = t.TimeslotID
      LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
      LEFT JOIN \`class\` cl ON s.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      WHERE s.ClassID = ?
      ORDER BY t.Date, t.StartTime
    `;

    const [sessionTimeslots] = await pool.execute(query, [classId]);
    return sessionTimeslots;
  },

  // Lấy sessiontimeslot theo SessionID và TimeslotID
  findBySessionAndTimeslot: async (sessionId, timeslotId) => {
    const query = `
      SELECT 
        st.sessiontimeslotID,
        st.SessionID,
        st.TimeslotID
      FROM sessiontimeslot st
      WHERE st.SessionID = ? AND st.TimeslotID = ?
    `;

    const [sessionTimeslots] = await pool.execute(query, [
      sessionId,
      timeslotId,
    ]);
    return sessionTimeslots.length > 0 ? sessionTimeslots[0] : null;
  },

  // Lấy sessiontimeslots theo SessionID
  findBySessionId: async (sessionId) => {
    const query = `
      SELECT 
        st.sessiontimeslotID,
        st.SessionID,
        st.TimeslotID,
        s.Title as sessionTitle,
        s.Description as sessionDescription,
        s.InstructorID,
        t.StartTime,
        t.EndTime,
        t.Date,
        i.FullName as instructorName
      FROM sessiontimeslot st
      LEFT JOIN session s ON st.SessionID = s.SessionID
      LEFT JOIN timeslot t ON st.TimeslotID = t.TimeslotID
      LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
      WHERE st.SessionID = ?
      ORDER BY t.Date, t.StartTime
    `;

    const [sessionTimeslots] = await pool.execute(query, [sessionId]);
    return sessionTimeslots;
  },

  // Lấy lịch học của học viên
  getLearnerSchedule: async (learnerId) => {
    const query = `
      SELECT 
        st.sessiontimeslotID,
        st.SessionID,
        st.TimeslotID,
        s.Title as sessionTitle,
        s.Description as sessionDescription,
        t.StartTime,
        t.EndTime,
        t.Date,
        c.Title as courseTitle,
        cl.ClassID,
        cl.ZoomURL,
        i.FullName as instructorName
      FROM enrollment e
      INNER JOIN \`class\` cl ON e.ClassID = cl.ClassID AND e.Status = 'Paid'
      INNER JOIN session s ON s.ClassID = cl.ClassID
      INNER JOIN sessiontimeslot st ON st.SessionID = s.SessionID
      INNER JOIN timeslot t ON st.TimeslotID = t.TimeslotID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
      WHERE e.LearnerID = ?
      ORDER BY t.Date, t.StartTime
    `;

    const [schedule] = await pool.execute(query, [learnerId]);
    return schedule;
  },

  // Cập nhật sessiontimeslot
  update: async (id, sessionTimeslotData) => {
    const { SessionID, TimeslotID } = sessionTimeslotData;

    const query = `
      UPDATE sessiontimeslot 
      SET SessionID = ?, TimeslotID = ?
      WHERE sessiontimeslotID = ?
    `;

    const [result] = await pool.execute(query, [
      SessionID || null,
      TimeslotID || null,
      id,
    ]);

    if (result.affectedRows === 0) {
      return null;
    }

    return { sessiontimeslotID: id, ...sessionTimeslotData };
  },

  // Xóa sessiontimeslot
  delete: async (id) => {
    const query = `DELETE FROM sessiontimeslot WHERE sessiontimeslotID = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  },

  // Kiểm tra sessiontimeslot có tồn tại không
  exists: async (id) => {
    const [rows] = await pool.execute(
      `SELECT sessiontimeslotID FROM sessiontimeslot WHERE sessiontimeslotID = ?`,
      [id]
    );
    return rows.length > 0;
  },

  // Xóa tất cả sessiontimeslots theo SessionID
  deleteBySessionId: async (sessionId) => {
    const query = `DELETE FROM sessiontimeslot WHERE SessionID = ?`;
    const [result] = await pool.execute(query, [sessionId]);
    return result.affectedRows;
  },
};

module.exports = SessionTimeslot;
