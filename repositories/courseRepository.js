const pool = require("../config/db");

class CourseRepository {
  async create(courseData) {
    const { Title, Description, Duration, Fee, Status, InstructorID } =
      courseData;

    const query = `
      INSERT INTO course (Title, Description, Duration, Fee, Status, InstructorID)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      Title,
      Description,
      Duration,
      Fee,
      Status || "active",
      InstructorID,
    ]);

    return { CourseID: result.insertId, ...courseData };
  }

  async findById(id) {
    if (!id) {
      throw new Error("ID is required");
    }
    const query = `SELECT * FROM course WHERE CourseID = ?`;
    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  async findAll() {
    const query = `SELECT * FROM course ORDER BY CourseID DESC`;
    const [rows] = await pool.execute(query);
    return rows;
  }

  async findByStatus(status) {
    const query = `SELECT * FROM course WHERE Status = ? ORDER BY CourseID DESC`;
    const [rows] = await pool.execute(query, [status]);
    return rows;
  }

  async update(id, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const query = `UPDATE course SET ${setClause} WHERE CourseID = ?`;
    const [result] = await pool.execute(query, [...values, id]);

    if (result.affectedRows === 0) return null;

    return await this.findById(id);
  }

  async delete(id) {
    const query = `DELETE FROM course WHERE CourseID = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  async exists(id) {
    const query = `SELECT 1 FROM course WHERE CourseID = ?`;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0;
  }

  async getCoursesWithEnrollmentCount() {
    const query = `
      SELECT 
        c.*,
        COUNT(e.EnrollmentID) as enrollmentCount
      FROM course c
      LEFT JOIN enrollment e ON c.CourseID = e.CourseID AND e.Status = 'active'
      GROUP BY c.CourseID
      ORDER BY c.CourseID DESC
    `;

    const [rows] = await pool.execute(query);
    return rows;
  }
}

module.exports = new CourseRepository();
