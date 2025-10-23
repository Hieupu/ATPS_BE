const pool = require("../config/db");

class SessionRepository {
  async create(sessionData) {
    const { Title, Description, InstructorID, ClassID } = sessionData;

    // Validate required fields
    if (!Title || !InstructorID || !ClassID) {
      throw new Error("Title, InstructorID, and ClassID are required");
    }

    // Validate instructor exists
    const instructorQuery = `SELECT 1 FROM instructor WHERE InstructorID = ?`;
    const [instructorRows] = await pool.execute(instructorQuery, [
      InstructorID,
    ]);
    if (instructorRows.length === 0) {
      throw new Error(`Instructor with ID ${InstructorID} not found`);
    }

    // Validate class exists
    const classQuery = `SELECT 1 FROM \`class\` WHERE ClassID = ?`;
    const [classRows] = await pool.execute(classQuery, [ClassID]);
    if (classRows.length === 0) {
      throw new Error(`Class with ID ${ClassID} not found`);
    }

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
  }

  async findById(id) {
    const query = `
      SELECT 
        s.SessionID,
        s.Title,
        s.Description,
        s.InstructorID,
        s.ClassID,
        i.FullName as instructorName,
        i.Major as instructorMajor,
        cl.ClassName,
        c.Title as courseTitle
      FROM session s
      LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
      LEFT JOIN \`class\` cl ON s.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      WHERE s.SessionID = ?
    `;

    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  async findAll() {
    const query = `
      SELECT 
        s.SessionID,
        s.Title,
        s.Description,
        s.InstructorID,
        s.ClassID,
        i.FullName as instructorName,
        i.Major as instructorMajor,
        cl.ClassName,
        c.Title as courseTitle
      FROM session s
      LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
      LEFT JOIN \`class\` cl ON s.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      ORDER BY s.SessionID DESC
    `;

    const [rows] = await pool.execute(query);
    return rows;
  }

  async findByClassId(classId) {
    const query = `
      SELECT 
        s.SessionID,
        s.Title,
        s.Description,
        s.InstructorID,
        s.ClassID,
        i.FullName as instructorName,
        i.Major as instructorMajor
      FROM session s
      LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
      WHERE s.ClassID = ?
      ORDER BY s.SessionID ASC
    `;

    const [rows] = await pool.execute(query, [classId]);
    return rows;
  }

  async findByInstructorId(instructorId) {
    const query = `
      SELECT 
        s.SessionID,
        s.Title,
        s.Description,
        s.InstructorID,
        s.ClassID,
        cl.ClassName,
        c.Title as courseTitle
      FROM session s
      LEFT JOIN \`class\` cl ON s.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      WHERE s.InstructorID = ?
      ORDER BY s.SessionID DESC
    `;

    const [rows] = await pool.execute(query, [instructorId]);
    return rows;
  }

  async update(id, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const query = `UPDATE session SET ${setClause} WHERE SessionID = ?`;
    const [result] = await pool.execute(query, [...values, id]);

    if (result.affectedRows === 0) return null;

    return await this.findById(id);
  }

  async delete(id) {
    const query = `DELETE FROM session WHERE SessionID = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  async exists(id) {
    const query = `SELECT 1 FROM session WHERE SessionID = ?`;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0;
  }
}

module.exports = new SessionRepository();
