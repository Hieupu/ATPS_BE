const pool = require("../config/db");

const Material = {
  // Tạo material mới
  create: async (materialData) => {
    const {
      Title,
      FileURL,
      Status = "Active",
      CourseID,
      SessionID = null,
      MaterialType = "PDF",
    } = materialData;

    const query = `
      INSERT INTO material (Title, FileURL, Status, CourseID)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      Title,
      FileURL,
      Status,
      CourseID,
    ]);

    return { MaterialID: result.insertId, ...materialData };
  },

  // Lấy materials theo CourseID
  findByCourseId: async (courseId) => {
    const query = `
      SELECT 
        m.MaterialID,
        m.Title,
        m.FileURL,
        m.Status,
        m.CourseID,
        c.Title as courseTitle,
        s.Title as sessionTitle
      FROM material m
      LEFT JOIN course c ON m.CourseID = c.CourseID
      LEFT JOIN session s ON s.SessionID IN (
        SELECT DISTINCT SessionID FROM session WHERE InstructorID = c.InstructorID
      )
      WHERE m.CourseID = ?
      ORDER BY m.MaterialID DESC
    `;

    const [materials] = await pool.execute(query, [courseId]);
    return materials;
  },

  // Lấy material theo ID
  findById: async (id) => {
    const query = `
      SELECT 
        m.MaterialID,
        m.Title,
        m.FileURL,
        m.Status,
        m.CourseID,
        c.Title as courseTitle,
        c.Description as courseDescription,
        i.FullName as instructorName
      FROM material m
      LEFT JOIN course c ON m.CourseID = c.CourseID
      LEFT JOIN instructor i ON c.InstructorID = i.InstructorID
      WHERE m.MaterialID = ?
    `;

    const [materials] = await pool.execute(query, [id]);
    return materials.length > 0 ? materials[0] : null;
  },

  // Lấy materials của học viên (đã enroll)
  findByLearnerId: async (learnerId) => {
    const query = `
      SELECT 
        m.MaterialID,
        m.Title,
        m.FileURL,
        m.Status,
        m.CourseID,
        c.Title as courseTitle,
        c.Description as courseDescription,
        i.FullName as instructorName
      FROM material m
      INNER JOIN course c ON m.CourseID = c.CourseID
      INNER JOIN enrollment e ON e.LearnerID = ? AND e.Status = 'Active'
      LEFT JOIN instructor i ON c.InstructorID = i.InstructorID
      WHERE m.Status = 'Active'
      ORDER BY m.MaterialID DESC
    `;

    const [materials] = await pool.execute(query, [learnerId]);
    return materials;
  },

  // Cập nhật material
  update: async (id, materialData) => {
    const { Title, FileURL, Status, CourseID } = materialData;

    const query = `
      UPDATE material 
      SET Title = ?, FileURL = ?, Status = ?, CourseID = ?
      WHERE MaterialID = ?
    `;

    const [result] = await pool.execute(query, [
      Title || null,
      FileURL || null,
      Status || null,
      CourseID || null,
      id,
    ]);

    if (result.affectedRows === 0) {
      return null;
    }

    return { MaterialID: id, ...materialData };
  },

  // Xóa material
  delete: async (id) => {
    const query = `DELETE FROM material WHERE MaterialID = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  },

  // Kiểm tra material có tồn tại không
  exists: async (id) => {
    const [rows] = await pool.execute(
      `SELECT MaterialID FROM material WHERE MaterialID = ?`,
      [id]
    );
    return rows.length > 0;
  },

  // Lấy materials theo SessionID
  findBySessionId: async (sessionId) => {
    const query = `
      SELECT 
        m.MaterialID,
        m.Title,
        m.FileURL,
        m.Status,
        m.CourseID,
        c.Title as courseTitle,
        s.Title as sessionTitle
      FROM material m
      LEFT JOIN course c ON m.CourseID = c.CourseID
      LEFT JOIN session s ON s.SessionID = ?
      WHERE s.SessionID = ?
      ORDER BY m.MaterialID DESC
    `;

    const [materials] = await pool.execute(query, [sessionId, sessionId]);
    return materials;
  },
};

module.exports = Material;
