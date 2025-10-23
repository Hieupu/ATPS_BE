const pool = require("../config/db");

class EnrollmentRepository {
  async create(enrollmentData) {
    const { LearnerID, CourseID, EnrollmentDate, Status, PaymentStatus } =
      enrollmentData;

    const query = `
      INSERT INTO enrollment (LearnerID, CourseID, EnrollmentDate, Status, PaymentStatus)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      LearnerID,
      CourseID,
      EnrollmentDate,
      Status || "active",
      PaymentStatus || "pending",
    ]);

    return { EnrollmentID: result.insertId, ...enrollmentData };
  }

  async findById(id) {
    const query = `
      SELECT 
        e.*,
        l.FullName as learnerName,
        c.Title as courseTitle
      FROM enrollment e
      LEFT JOIN learner l ON e.LearnerID = l.LearnerID
      LEFT JOIN course c ON e.CourseID = c.CourseID
      WHERE e.EnrollmentID = ?
    `;

    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  async findByLearnerId(learnerId) {
    const query = `
      SELECT 
        e.*,
        c.Title as courseTitle,
        c.Description as courseDescription,
        c.Duration,
        c.Price
      FROM enrollment e
      LEFT JOIN course c ON e.CourseID = c.CourseID
      WHERE e.LearnerID = ?
      ORDER BY e.EnrollmentDate DESC
    `;

    const [rows] = await pool.execute(query, [learnerId]);
    return rows;
  }

  async findByClassId(classId) {
    const query = `
      SELECT 
        e.*,
        l.FullName as learnerName,
        a.Email,
        a.Phone,
        cl.ClassName,
        c.Title as courseTitle,
        i.FullName as instructorName,
        p.Amount,
        p.PaymentMethod,
        p.PaymentDate
      FROM enrollment e
      LEFT JOIN learner l ON e.LearnerID = l.LearnerID
      LEFT JOIN account a ON l.AccID = a.AccID
      LEFT JOIN \`class\` cl ON e.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      LEFT JOIN instructor i ON cl.InstructorID = i.InstructorID
      LEFT JOIN payment p ON e.EnrollmentID = p.EnrollmentID
      WHERE e.ClassID = ?
    `;

    const [rows] = await pool.execute(query, [classId]);
    return rows;
  }

  async findByCourseId(courseId) {
    const query = `
      SELECT 
        e.*,
        l.FullName as learnerName,
        l.Email as learnerEmail
      FROM enrollment e
      LEFT JOIN learner l ON e.LearnerID = l.LearnerID
      WHERE e.CourseID = ?
      ORDER BY e.EnrollmentDate DESC
    `;

    const [rows] = await pool.execute(query, [courseId]);
    return rows;
  }

  async deleteByClassId(classId) {
    const query = `DELETE FROM enrollment WHERE ClassID = ?`;
    const [result] = await pool.execute(query, [classId]);
    return result.affectedRows;
  }

  async findAll() {
    const query = `
      SELECT 
        e.*,
        l.FullName as learnerName,
        c.Title as courseTitle
      FROM enrollment e
      LEFT JOIN learner l ON e.LearnerID = l.LearnerID
      LEFT JOIN course c ON e.CourseID = c.CourseID
      ORDER BY e.EnrollmentDate DESC
    `;

    const [rows] = await pool.execute(query);
    return rows;
  }

  async update(id, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const query = `UPDATE enrollment SET ${setClause} WHERE EnrollmentID = ?`;
    const [result] = await pool.execute(query, [...values, id]);

    if (result.affectedRows === 0) return null;

    return await this.findById(id);
  }

  async delete(id) {
    const query = `DELETE FROM enrollment WHERE EnrollmentID = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  async exists(id) {
    const query = `SELECT 1 FROM enrollment WHERE EnrollmentID = ?`;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0;
  }

  async checkEnrollmentExists(learnerId, courseId) {
    const query = `SELECT 1 FROM enrollment WHERE LearnerID = ? AND CourseID = ?`;
    const [rows] = await db.query(query, [learnerId, courseId]);
    return rows.length > 0;
  }
}

module.exports = new EnrollmentRepository();
