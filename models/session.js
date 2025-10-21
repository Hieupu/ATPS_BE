const pool = require("../config/db");

const Session = {
  // Tạo session mới
  create: async (sessionData) => {
    const { Title, Description, InstructorID, ClassID } = sessionData;

    const query = `
      INSERT INTO session (Title, Description, InstructorID, ClassID)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      Title,
      Description,
      InstructorID,
      ClassID,
    ]);

    return { SessionID: result.insertId, ...sessionData };
  },

  // Lấy sessions theo ClassID
  findByClassId: async (classId) => {
    const query = `
      SELECT 
        s.SessionID,
        s.Title,
        s.Description,
        s.InstructorID,
        s.ClassID,
        i.FullName as instructorName,
        i.Major as instructorMajor,
        c.Title as courseTitle
      FROM session s
      LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
      LEFT JOIN \`class\` cl ON s.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      WHERE s.ClassID = ?
      ORDER BY s.SessionID ASC
    `;

    const [sessions] = await pool.execute(query, [classId]);
    return sessions;
  },

  // Lấy sessions theo InstructorID
  findByInstructorId: async (instructorId) => {
    const query = `
      SELECT 
        s.SessionID,
        s.Title,
        s.Description,
        s.InstructorID,
        s.ClassID,
        i.FullName as instructorName,
        i.Major as instructorMajor,
        c.Title as courseTitle
      FROM session s
      LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
      LEFT JOIN \`class\` cl ON s.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      WHERE s.InstructorID = ?
      ORDER BY s.SessionID ASC
    `;

    const [sessions] = await pool.execute(query, [instructorId]);
    return sessions;
  },

  // Lấy session theo ID
  findById: async (id) => {
    const query = `
      SELECT 
        s.SessionID,
        s.Title,
        s.Description,
        s.InstructorID,
        s.ClassID,
        i.FullName as instructorName,
        i.Major as instructorMajor,
        c.Title as courseTitle,
        c.CourseID
      FROM session s
      LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
      LEFT JOIN \`class\` cl ON s.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      WHERE s.SessionID = ?
    `;

    const [sessions] = await pool.execute(query, [id]);
    return sessions.length > 0 ? sessions[0] : null;
  },

  // Cập nhật session
  update: async (id, sessionData) => {
    const { Title, Description, InstructorID, ClassID } = sessionData;

    const query = `
      UPDATE session 
      SET Title = ?, Description = ?, InstructorID = ?, ClassID = ?
      WHERE SessionID = ?
    `;

    const [result] = await pool.execute(query, [
      Title,
      Description,
      InstructorID,
      ClassID,
      id,
    ]);

    if (result.affectedRows === 0) {
      return null;
    }

    return { SessionID: id, ...sessionData };
  },

  // Xóa session
  delete: async (id) => {
    const query = `DELETE FROM session WHERE SessionID = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  },

  // Kiểm tra session có tồn tại không
  exists: async (id) => {
    const [rows] = await pool.execute(
      `SELECT SessionID FROM session WHERE SessionID = ?`,
      [id]
    );
    return rows.length > 0;
  },

  // Kiểm tra Session có trùng trong cùng class không
  checkSessionConflict: async (classId, excludeId = null) => {
    let query = `
      SELECT s.SessionID FROM session s
      WHERE s.ClassID = ?
    `;

    const params = [classId];

    if (excludeId) {
      query += ` AND s.SessionID != ?`;
      params.push(excludeId);
    }

    const [conflicts] = await pool.execute(query, params);
    return conflicts.length > 0;
  },

  // Lấy tất cả sessions
  findAll: async () => {
    const query = `
      SELECT 
        s.SessionID,
        s.Title,
        s.Description,
        s.InstructorID,
        s.ClassID,
        i.FullName as instructorName,
        i.Major as instructorMajor,
        c.ClassName,
        co.Title as courseTitle
      FROM session s
      LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
      LEFT JOIN \`class\` c ON s.ClassID = c.ClassID
      LEFT JOIN course co ON c.CourseID = co.CourseID
      ORDER BY s.SessionID DESC
    `;

    const [sessions] = await pool.execute(query);
    return sessions;
  },
};

module.exports = Session;
