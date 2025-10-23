const pool = require("../config/db");

class ClassRepository {
  async create(classData) {
    const { ClassName, ZoomURL, Status, CourseID, InstructorID } = classData;

    const query = `
      INSERT INTO \`class\` (ClassName, ZoomURL, Status, CourseID, InstructorID)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      ClassName,
      ZoomURL || null,
      Status || "active",
      CourseID || null,
      InstructorID,
    ]);

    return { ClassID: result.insertId, ...classData };
  }

  async findById(id) {
    if (!id) {
      throw new Error("ID is required");
    }
    const query = `
      SELECT 
        c.*,
        co.Title as courseTitle,
        co.Description as courseDescription,
        i.FullName as instructorName
      FROM \`class\` c
      LEFT JOIN course co ON c.CourseID = co.CourseID
      LEFT JOIN instructor i ON c.InstructorID = i.InstructorID
      WHERE c.ClassID = ?
    `;

    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  async findAll() {
    const query = `
      SELECT 
        c.*,
        co.Title as courseTitle,
        co.Description as courseDescription,
        i.FullName as instructorName
      FROM \`class\` c
      LEFT JOIN course co ON c.CourseID = co.CourseID
      LEFT JOIN instructor i ON c.InstructorID = i.InstructorID
      ORDER BY c.ClassID DESC
    `;

    const [rows] = await pool.execute(query);
    return rows;
  }

  async findByCourseId(courseId) {
    const query = `
      SELECT 
        c.*,
        i.FullName as instructorName
      FROM \`class\` c
      LEFT JOIN instructor i ON c.InstructorID = i.InstructorID
      WHERE c.CourseID = ?
      ORDER BY c.ClassID DESC
    `;

    const [rows] = await pool.execute(query, [courseId]);
    return rows;
  }

  async findByInstructorId(instructorId) {
    const query = `
      SELECT 
        c.*,
        co.Title as courseTitle,
        co.Description as courseDescription
      FROM \`class\` c
      LEFT JOIN course co ON c.CourseID = co.CourseID
      WHERE c.InstructorID = ?
      ORDER BY c.ClassID DESC
    `;

    const [rows] = await pool.execute(query, [instructorId]);
    return rows;
  }

  async update(id, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const query = `UPDATE \`class\` SET ${setClause} WHERE ClassID = ?`;
    const [result] = await pool.execute(query, [...values, id]);

    if (result.affectedRows === 0) return null;

    return await this.findById(id);
  }

  async delete(id) {
    const query = `DELETE FROM \`class\` WHERE ClassID = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  async exists(id) {
    const query = `SELECT 1 FROM \`class\` WHERE ClassID = ?`;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0;
  }

  async updateStudentCount(classId) {
    const query = `
      UPDATE \`class\` 
      SET CurrentStudents = (
        SELECT COUNT(*) 
        FROM enrollment e 
        WHERE e.CourseID = \`class\`.CourseID 
        AND e.Status = 'active'
      )
      WHERE ClassID = ?
    `;

    const [result] = await pool.execute(query, [classId]);
    return result.affectedRows > 0;
  }
}

module.exports = new ClassRepository();
